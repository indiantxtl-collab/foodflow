delivery_controller = '''const { DeliveryAgent, Order, User } = require('../models');

// @desc    Register as delivery agent
// @route   POST /api/delivery/register
// @access  Private
exports.register = async (req, res) => {
try {
const { vehicle, documents, bankDetails, workingHours } = req.body;

// Check if already registered  
const existing = await DeliveryAgent.findOne({ user: req.user.userId });  
if (existing) {  
  return res.status(400).json({  
    success: false,  
    message: 'Already registered as delivery agent'  
  });  
}  

const deliveryAgent = await DeliveryAgent.create({  
  user: req.user.userId,  
  vehicle,  
  documents,  
  bankDetails,  
  workingHours,  
  status: 'pending'  
});  

// Update user role  
await User.findByIdAndUpdate(req.user.userId, { role: 'delivery_agent' });  

res.status(201).json({  
  success: true,  
  message: 'Registration submitted for approval',  
  data: deliveryAgent  
});

} catch (error) {
console.error('Delivery Register Error:', error);
res.status(500).json({
success: false,
message: 'Failed to register',
error: error.message
});
}
};

// @desc    Get delivery profile
// @route   GET /api/delivery/profile
// @access  Private (Delivery Agent)
exports.getProfile = async (req, res) => {
try {
const profile = await DeliveryAgent.findOne({ user: req.user.userId })
.populate('user', 'name phone email avatar');

if (!profile) {  
  return res.status(404).json({  
    success: false,  
    message: 'Profile not found'  
  });  
}  

res.status(200).json({  
  success: true,  
  data: profile  
});

} catch (error) {
console.error('Get Profile Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch profile',
error: error.message
});
}
};

// @desc    Toggle online status
// @route   PATCH /api/delivery/toggle-status
// @access  Private (Delivery Agent)
exports.toggleStatus = async (req, res) => {
try {
const { isOnline, location } = req.body;

const agent = await DeliveryAgent.findOne({ user: req.user.userId });  
if (!agent) {  
  return res.status(404).json({  
    success: false,  
    message: 'Profile not found'  
  });  
}  

if (agent.status !== 'approved') {  
  return res.status(403).json({  
    success: false,  
    message: 'Account not approved yet'  
  });  
}  

agent.availability.isOnline = isOnline;  
  
if (location) {  
  agent.availability.lastLocation = {  
    coordinates: [location.lng, location.lat],  
    timestamp: new Date()  
  };  
}  

await agent.save();  

res.status(200).json({  
  success: true,  
  message: `You are now ${isOnline ? 'online' : 'offline'}`,  
  isOnline: agent.availability.isOnline  
});

} catch (error) {
console.error('Toggle Status Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update status',
error: error.message
});
}
};

// @desc    Update location
// @route   PUT /api/delivery/location
// @access  Private (Delivery Agent)
exports.updateLocation = async (req, res) => {
try {
const { lat, lng } = req.body;

const agent = await DeliveryAgent.findOne({ user: req.user.userId });  
if (!agent) {  
  return res.status(404).json({  
    success: false,  
    message: 'Profile not found'  
  });  
}  

agent.availability.lastLocation = {  
  coordinates: [lng, lat],  
  timestamp: new Date()  
};  

await agent.save();  

// Update order tracking if on delivery  
if (agent.availability.currentOrder) {  
  const order = await Order.findById(agent.availability.currentOrder);  
  if (order && order.status === 'out_for_delivery') {  
    order.delivery.trackingHistory.push({  
      status: 'location_update',  
      location: {  
        coordinates: [lng, lat]  
      },  
      timestamp: new Date()  
    });  
    await order.save();  

    // Emit to user  
    const io = req.app.get('io');  
    io.to(`user_${order.user}`).emit('delivery_location_update', {  
      orderId: order._id,  
      location: { lat, lng },  
      timestamp: new Date()  
    });  
  }  
}  

res.status(200).json({  
  success: true,  
  message: 'Location updated'  
});

} catch (error) {
console.error('Update Location Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update location',
error: error.message
});
}
};

// @desc    Get assigned orders
// @route   GET /api/delivery/orders
// @access  Private (Delivery Agent)
exports.getOrders = async (req, res) => {
try {
const { status } = req.query;

const agent = await DeliveryAgent.findOne({ user: req.user.userId });  
if (!agent) {  
  return res.status(404).json({  
    success: false,  
    message: 'Profile not found'  
  });  
}  

let query = { deliveryAgent: agent._id };  
if (status) query.status = status;  

const orders = await Order.find(query)  
  .populate('user', 'name phone')  
  .populate('restaurant', 'name location phone')  
  .sort({ createdAt: -1 });  

res.status(200).json({  
  success: true,  
  count: orders.length,  
  data: orders  
});

} catch (error) {
console.error('Get Orders Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch orders',
error: error.message
});
}
};

// @desc    Accept/Reject order
// @route   PUT /api/delivery/orders/:id/respond
// @access  Private (Delivery Agent)
exports.respondToOrder = async (req, res) => {
try {
const { id } = req.params;
const { action } = req.body; // 'accept' or 'reject'

const agent = await DeliveryAgent.findOne({ user: req.user.userId });  
if (!agent) {  
  return res.status(404).json({  
    success: false,  
    message: 'Profile not found'  
  });  
}  

const order = await Order.findById(id);  
if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

if (action === 'accept') {  
  order.status = 'out_for_delivery';  
  order.delivery.assignedAt = new Date();  
  order.deliveryAgent = agent._id;  
  agent.availability.currentOrder = order._id;  
  agent.statistics.totalDeliveries += 1;  
    
  order.delivery.trackingHistory.push({  
    status: 'out_for_delivery',  
    timestamp: new Date()  
  });  
} else {  
  order.deliveryAgent = null;  
}  

await order.save();  
await agent.save();  

const io = req.app.get('io');  
io.to(`user_${order.user}`).emit('order_update', order);  
io.to(`restaurant_${order.restaurant}`).emit('order_update', order);  

res.status(200).json({  
  success: true,  
  message: `Order ${action}ed`,  
  data: order  
});

} catch (error) {
console.error('Respond Error:', error);
res.status(500).json({
success: false,
message: 'Failed to respond',
error: error.message
});
}
};

// @desc    Update order status (pickup, delivered)
// @route   PUT /api/delivery/orders/:id/status
// @access  Private (Delivery Agent)
exports.updateOrderStatus = async (req, res) => {
try {
const { id } = req.params;
const { status } = req.body; // 'picked_up', 'delivered'

const agent = await DeliveryAgent.findOne({ user: req.user.userId });  
const order = await Order.findOne({  
  _id: id,  
  deliveryAgent: agent._id  
});  

if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

order.status = status;  
  
if (status === 'picked_up') {  
  order.delivery.pickedUpAt = new Date();  
} else if (status === 'delivered') {  
  order.delivery.deliveredAt = new Date();  
  order.payment.status = 'completed';  
  agent.availability.currentOrder = null;  
  agent.statistics.completed += 1;  
    
  // Calculate earnings  
  const earnings = order.pricing.deliveryFee * 0.7; // 70% to driver  
  agent.earnings.pending += earnings;  
  agent.earnings.total += earnings;  
}  

order.delivery.trackingHistory.push({  
  status,  
  timestamp: new Date()  
});  

await order.save();  
await agent.save();  

const io = req.app.get('io');  
io.to(`user_${order.user}`).emit('order_update', order);  
io.to(`restaurant_${order.restaurant}`).emit('order_update', order);  

res.status(200).json({  
  success: true,  
  message: `Order marked as ${status}`,  
  data: order  
});

} catch (error) {
console.error('Update Status Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update status',
error: error.message
});
}
};

// @desc    Get earnings
// @route   GET /api/delivery/earnings
// @access  Private (Delivery Agent)
exports.getEarnings = async (req, res) => {
try {
const agent = await DeliveryAgent.findOne({ user: req.user.userId });
if (!agent) {
return res.status(404).json({
success: false,
message: 'Profile not found'
});
}

// Get weekly earnings  
const startOfWeek = new Date();  
startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());  
startOfWeek.setHours(0, 0, 0, 0);  

const weeklyOrders = await Order.find({  
  deliveryAgent: agent._id,  
  status: 'delivered',  
  'delivery.deliveredAt': { $gte: startOfWeek }  
});  

const weeklyEarnings = weeklyOrders.reduce((sum, order) => {  
  return sum + (order.pricing.deliveryFee * 0.7);  
}, 0);  

res.status(200).json({  
  success: true,  
  data: {  
    total: agent.earnings.total,  
    pending: agent.earnings.pending,  
    withdrawn: agent.earnings.withdrawn,  
    weekly: Math.round(weeklyEarnings * 100) / 100,  
    statistics: agent.statistics  
  }  
});

} catch (error) {
console.error('Get Earnings Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch earnings',
error: error.message
});
}
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/controllers/delivery.controller.js", "w") as f:
f.write(delivery_controller)
