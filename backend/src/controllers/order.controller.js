order_controller = '''const { Order, Restaurant, User, Coupon, DeliveryAgent } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Generate unique order ID
const generateOrderId = () => {
return 'FF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
try {
const {
restaurantId,
items,
deliveryAddress,
paymentMethod,
couponCode,
notes
} = req.body;

// Get restaurant  
const restaurant = await Restaurant.findById(restaurantId);  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

// Calculate pricing  
let subtotal = 0;  
const orderItems = items.map(item => {  
  const menuItem = restaurant.menu.id(item.menuItemId);  
  if (!menuItem) {  
    throw new Error(`Menu item ${item.menuItemId} not found`);  
  }  
    
  let itemTotal = menuItem.price * item.quantity;  
    
  // Add variants  
  if (item.variants) {  
    item.variants.forEach(variant => {  
      itemTotal += variant.price * item.quantity;  
    });  
  }  
    
  // Add addons  
  if (item.addons) {  
    item.addons.forEach(addon => {  
      itemTotal += addon.price * item.quantity;  
    });  
  }  
    
  subtotal += itemTotal;  

  return {  
    menuItem: menuItem._id,  
    name: menuItem.name,  
    price: menuItem.price,  
    quantity: item.quantity,  
    variants: item.variants || [],  
    addons: item.addons || [],  
    specialInstructions: item.specialInstructions  
  };  
});  

// Calculate fees  
const platformFee = 5;  
const deliveryFee = restaurant.deliveryFee || 0;  
const tax = Math.round(subtotal * 0.05); // 5% tax  
  
let discount = 0;  
  
// Apply coupon  
if (couponCode) {  
  const coupon = await Coupon.findOne({   
    code: couponCode.toUpperCase(),  
    isActive: true,  
    validFrom: { $lte: new Date() },  
    validUntil: { $gte: new Date() }  
  });  
    
  if (coupon && subtotal >= coupon.minOrderAmount) {  
    if (coupon.discountType === 'percentage') {  
      discount = Math.min(  
        (subtotal * coupon.discountValue) / 100,  
        coupon.maxDiscount || Infinity  
      );  
    } else {  
      discount = coupon.discountValue;  
    }  
  }  
}  

const total = subtotal + platformFee + deliveryFee + tax - discount;  

// Create order  
const order = await Order.create({  
  orderId: generateOrderId(),  
  user: req.user.userId,  
  restaurant: restaurantId,  
  items: orderItems,  
  pricing: {  
    subtotal,  
    deliveryFee,  
    platformFee,  
    tax,  
    discount,  
    couponCode: couponCode || null,  
    total  
  },  
  deliveryAddress,  
  payment: {  
    method: paymentMethod,  
    status: paymentMethod === 'cod' ? 'pending' : 'pending'  
  },  
  notes,  
  status: 'pending'  
});  

// Populate order details  
const populatedOrder = await Order.findById(order._id)  
  .populate('user', 'name phone')  
  .populate('restaurant', 'name phone location');  

// Emit to restaurant  
const io = req.app.get('io');  
io.to(`restaurant_${restaurantId}`).emit('new_order', populatedOrder);  

res.status(201).json({  
  success: true,  
  message: 'Order created successfully',  
  data: populatedOrder  
});

} catch (error) {
console.error('Create Order Error:', error);
res.status(500).json({
success: false,
message: 'Failed to create order',
error: error.message
});
}
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
try {
const { status, page = 1, limit = 10 } = req.query;

let query = { user: req.user.userId };  
if (status) query.status = status;  

const orders = await Order.find(query)  
  .populate('restaurant', 'name logo cuisine')  
  .populate('deliveryAgent', 'name phone')  
  .sort({ createdAt: -1 })  
  .skip((page - 1) * limit)  
  .limit(parseInt(limit));  

const total = await Order.countDocuments(query);  

res.status(200).json({  
  success: true,  
  count: orders.length,  
  total,  
  page: parseInt(page),  
  pages: Math.ceil(total / limit),  
  data: orders  
});

} catch (error) {
console.error('Get My Orders Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch orders',
error: error.message
});
}
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
try {
const { id } = req.params;

const order = await Order.findOne({  
  $or: [{ _id: id }, { orderId: id }]  
})  
  .populate('user', 'name phone')  
  .populate('restaurant', 'name phone location cuisine')  
  .populate('deliveryAgent', 'name phone vehicle');  

if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

// Check authorization  
const isAuthorized =   
  order.user._id.toString() === req.user.userId ||  
  order.restaurant.owner?.toString() === req.user.userId ||  
  order.deliveryAgent?._id.toString() === req.user.userId ||  
  req.user.role === 'admin';  

if (!isAuthorized) {  
  return res.status(403).json({  
    success: false,  
    message: 'Not authorized'  
  });  
}  

res.status(200).json({  
  success: true,  
  data: order  
});

} catch (error) {
console.error('Get Order Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch order',
error: error.message
});
}
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant-orders
// @access  Private (Restaurant Owner)
exports.getRestaurantOrders = async (req, res) => {
try {
const { status, page = 1, limit = 20 } = req.query;

// Get restaurant  
const restaurant = await Restaurant.findOne({ owner: req.user.userId });  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

let query = { restaurant: restaurant._id };  
if (status) query.status = status;  

const orders = await Order.find(query)  
  .populate('user', 'name phone')  
  .populate('deliveryAgent', 'name phone')  
  .sort({ createdAt: -1 })  
  .skip((page - 1) * limit)  
  .limit(parseInt(limit));  

const total = await Order.countDocuments(query);  

res.status(200).json({  
  success: true,  
  count: orders.length,  
  total,  
  page: parseInt(page),  
  pages: Math.ceil(total / limit),  
  data: orders  
});

} catch (error) {
console.error('Get Restaurant Orders Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch orders',
error: error.message
});
}
};

// @desc    Update order status (Restaurant)
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant Owner or Admin)
exports.updateStatus = async (req, res) => {
try {
const { id } = req.params;
const { status, preparationTime } = req.body;

const order = await Order.findById(id);  
if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

// Update status  
order.status = status;  
  
if (preparationTime) {  
  order.preparationTime = preparationTime;  
}  

// Add tracking history  
order.delivery.trackingHistory.push({  
  status,  
  timestamp: new Date()  
});  

await order.save();  

// Populate and emit update  
const populatedOrder = await Order.findById(id)  
  .populate('user', 'name phone fcmToken')  
  .populate('restaurant', 'name')  
  .populate('deliveryAgent', 'name phone');  

const io = req.app.get('io');  
  
// Emit to user  
io.to(`user_${order.user}`).emit('order_update', populatedOrder);  
  
// Emit to delivery agent if assigned  
if (order.deliveryAgent) {  
  io.to(`delivery_${order.deliveryAgent}`).emit('order_update', populatedOrder);  
}  

res.status(200).json({  
  success: true,  
  message: 'Order status updated',  
  data: populatedOrder  
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

// @desc    Assign delivery agent
// @route   PUT /api/orders/:id/assign-delivery
// @access  Private (Admin)
exports.assignDelivery = async (req, res) => {
try {
const { id } = req.params;
const { deliveryAgentId } = req.body;

const order = await Order.findById(id);  
if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

const deliveryAgent = await DeliveryAgent.findById(deliveryAgentId);  
if (!deliveryAgent) {  
  return res.status(404).json({  
    success: false,  
    message: 'Delivery agent not found'  
  });  
}  

order.deliveryAgent = deliveryAgentId;  
order.status = 'out_for_delivery';  
order.delivery.assignedAt = new Date();  
  
order.delivery.trackingHistory.push({  
  status: 'out_for_delivery',  
  timestamp: new Date()  
});  

await order.save();  

// Update delivery agent  
deliveryAgent.availability.currentOrder = order._id;  
deliveryAgent.availability.isOnline = true;  
await deliveryAgent.save();  

const populatedOrder = await Order.findById(id)  
  .populate('user', 'name phone')  
  .populate('restaurant', 'name location')  
  .populate('deliveryAgent', 'name phone vehicle');  

const io = req.app.get('io');  
io.to(`user_${order.user}`).emit('order_update', populatedOrder);  
io.to(`delivery_${deliveryAgentId}`).emit('new_assignment', populatedOrder);  

res.status(200).json({  
  success: true,  
  message: 'Delivery agent assigned',  
  data: populatedOrder  
});

} catch (error) {
console.error('Assign Delivery Error:', error);
res.status(500).json({
success: false,
message: 'Failed to assign delivery agent',
error: error.message
});
}
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
try {
const { id } = req.params;
const { reason } = req.body;

const order = await Order.findOne({  
  $or: [{ _id: id }, { orderId: id }],  
  user: req.user.userId  
});  

if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

if (!['pending', 'confirmed'].includes(order.status)) {  
  return res.status(400).json({  
    success: false,  
    message: 'Order cannot be cancelled at this stage'  
  });  
}  

order.status = 'cancelled';  
order.notes = reason || 'Cancelled by user';  
  
if (order.payment.status === 'completed') {  
  order.refund = {  
    amount: order.pricing.total,  
    reason: 'Order cancelled by user',  
    status: 'pending'  
  };  
}  

await order.save();  

const io = req.app.get('io');  
io.to(`restaurant_${order.restaurant}`).emit('order_cancelled', order);  

res.status(200).json({  
  success: true,  
  message: 'Order cancelled successfully',  
  data: order  
});

} catch (error) {
console.error('Cancel Order Error:', error);
res.status(500).json({
success: false,
message: 'Failed to cancel order',
error: error.message
});
}
};

// @desc    Rate order
// @route   POST /api/orders/:id/rate
// @access  Private
exports.rateOrder = async (req, res) => {
try {
const { id } = req.params;
const { food, delivery, overall, comment } = req.body;

const order = await Order.findOne({  
  $or: [{ _id: id }, { orderId: id }],  
  user: req.user.userId,  
  status: 'delivered'  
});  

if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found or not delivered'  
  });  
}  

if (order.rating && order.rating.overall) {  
  return res.status(400).json({  
    success: false,  
    message: 'Order already rated'  
  });  
}  

order.rating = {  
  food,  
  delivery,  
  overall,  
  comment,  
  createdAt: new Date()  
};  

await order.save();  

// Update restaurant rating  
const restaurant = await Restaurant.findById(order.restaurant);  
if (restaurant) {  
  const newCount = restaurant.rating.count + 1;  
  const newAverage = ((restaurant.rating.average * restaurant.rating.count) + overall) / newCount;  
    
  restaurant.rating.average = Math.round(newAverage * 10) / 10;  
  restaurant.rating.count = newCount;  
  await restaurant.save();  
}  

res.status(200).json({  
  success: true,  
  message: 'Rating submitted successfully',  
  data: order.rating  
});

} catch (error) {
console.error('Rate Order Error:', error);
res.status(500).json({
success: false,
message: 'Failed to submit rating',
error: error.message
});
}
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/controllers/order.controller.js", "w") as f:
f.write(order_controller)
