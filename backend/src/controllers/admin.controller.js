const { User, Restaurant, Order, DeliveryAgent, Coupon } = require('../models');
const moment = require('moment');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res) => {
try {
const today = moment().startOf('day');
const weekAgo = moment().subtract(7, 'days');
const monthAgo = moment().subtract(30, 'days');

// Count stats  
const [  
  totalUsers,  
  totalRestaurants,  
  totalOrders,  
  totalDeliveryAgents,  
  todayOrders,  
  weekOrders,  
  pendingRestaurants,  
  pendingAgents  
] = await Promise.all([  
  User.countDocuments({ role: 'customer' }),  
  Restaurant.countDocuments(),  
  Order.countDocuments(),  
  DeliveryAgent.countDocuments(),  
  Order.countDocuments({ createdAt: { $gte: today.toDate() } }),  
  Order.countDocuments({ createdAt: { $gte: weekAgo.toDate() } }),  
  Restaurant.countDocuments({ status: 'pending' }),  
  DeliveryAgent.countDocuments({ status: 'pending' })  
]);  

// Revenue stats  
const revenueStats = await Order.aggregate([  
  { $match: { 'payment.status': 'completed' } },  
  {  
    $group: {  
      _id: null,  
      totalRevenue: { $sum: '$pricing.total' },  
      totalCommission: { $sum: { $multiply: ['$pricing.subtotal', 0.1] } }  
    }  
  }  
]);  

// Recent orders  
const recentOrders = await Order.find()  
  .populate('user', 'name')  
  .populate('restaurant', 'name')  
  .sort({ createdAt: -1 })  
  .limit(10);  

res.status(200).json({  
  success: true,  
  data: {  
    stats: {  
      users: totalUsers,  
      restaurants: totalRestaurants,  
      orders: totalOrders,  
      deliveryAgents: totalDeliveryAgents,  
      todayOrders,  
      weekOrders,  
      pendingRestaurants,  
      pendingAgents,  
      revenue: revenueStats[0]?.totalRevenue || 0,  
      commission: revenueStats[0]?.totalCommission || 0  
    },  
    recentOrders  
  }  
});

} catch (error) {
console.error('Dashboard Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch dashboard',
error: error.message
});
}
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
try {
const { role, search, page = 1, limit = 20 } = req.query;

let query = {};  
if (role) query.role = role;  
if (search) {  
  query.$or = [  
    { name: { $regex: search, $options: 'i' } },  
    { phone: { $regex: search, $options: 'i' } },  
    { email: { $regex: search, $options: 'i' } }  
  ];  
}  

const users = await User.find(query)  
  .select('-__v')  
  .sort({ createdAt: -1 })  
  .skip((page - 1) * limit)  
  .limit(parseInt(limit));  

const total = await User.countDocuments(query);  

res.status(200).json({  
  success: true,  
  count: users.length,  
  total,  
  page: parseInt(page),  
  pages: Math.ceil(total / limit),  
  data: users  
});

} catch (error) {
console.error('Get Users Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch users',
error: error.message
});
}
};

// @desc    Get pending restaurants
// @route   GET /api/admin/restaurants/pending
// @access  Private (Admin)
exports.getPendingRestaurants = async (req, res) => {
try {
const restaurants = await Restaurant.find({ status: 'pending' })
.populate('owner', 'name phone email')
.sort({ createdAt: -1 });

res.status(200).json({  
  success: true,  
  count: restaurants.length,  
  data: restaurants  
});

} catch (error) {
console.error('Get Pending Restaurants Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch pending restaurants',
error: error.message
});
}
};

// @desc    Approve/Reject restaurant
// @route   PUT /api/admin/restaurants/:id/approve
// @access  Private (Admin)
exports.approveRestaurant = async (req, res) => {
try {
const { id } = req.params;
const { status, reason } = req.body;

const restaurant = await Restaurant.findByIdAndUpdate(  
  id,  
  { status, rejectionReason: status === 'rejected' ? reason : undefined },  
  { new: true }  
);  

if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

res.status(200).json({  
  success: true,  
  message: `Restaurant ${status}`,  
  data: restaurant  
});

} catch (error) {
console.error('Approve Restaurant Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update restaurant',
error: error.message
});
}
};

// @desc    Get pending delivery agents
// @route   GET /api/admin/delivery-agents/pending
// @access  Private (Admin)
exports.getPendingAgents = async (req, res) => {
try {
const agents = await DeliveryAgent.find({ status: 'pending' })
.populate('user', 'name phone email')
.sort({ createdAt: -1 });

res.status(200).json({  
  success: true,  
  count: agents.length,  
  data: agents  
});

} catch (error) {
console.error('Get Pending Agents Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch pending agents',
error: error.message
});
}
};

// @desc    Approve/Reject delivery agent
// @route   PUT /api/admin/delivery-agents/:id/approve
// @access  Private (Admin)
exports.approveAgent = async (req, res) => {
try {
const { id } = req.params;
const { status } = req.body;

const agent = await DeliveryAgent.findByIdAndUpdate(  
  id,  
  { status },  
  { new: true }  
);  

if (!agent) {  
  return res.status(404).json({  
    success: false,  
    message: 'Agent not found'  
  });  
}  

res.status(200).json({  
  success: true,  
  message: `Agent ${status}`,  
  data: agent  
});

} catch (error) {
console.error('Approve Agent Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update agent',
error: error.message
});
}
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
try {
const { status, page = 1, limit = 20 } = req.query;

let query = {};  
if (status) query.status = status;  

const orders = await Order.find(query)  
  .populate('user', 'name phone')  
  .populate('restaurant', 'name')  
  .populate('deliveryAgent', 'name')  
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
console.error('Get All Orders Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch orders',
error: error.message
});
}
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res) => {
try {
const coupon = await Coupon.create(req.body);

res.status(201).json({  
  success: true,  
  message: 'Coupon created',  
  data: coupon  
});

} catch (error) {
console.error('Create Coupon Error:', error);
res.status(500).json({
success: false,
message: 'Failed to create coupon',
error: error.message
});
}
};

// @desc    Get analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
try {
const { period = 'week' } = req.query;

let dateFilter = {};  
const now = new Date();  
  
if (period === 'week') {  
  dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };  
} else if (period === 'month') {  
  dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };  
} else if (period === 'year') {  
  dateFilter = { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) };  
}  

const ordersByDay = await Order.aggregate([  
  { $match: { createdAt: dateFilter } },  
  {  
    $group: {  
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },  
      count: { $sum: 1 },  
      revenue: { $sum: '$pricing.total' }  
    }  
  },  
  { $sort: { _id: 1 } }  
]);  

const topRestaurants = await Order.aggregate([  
  { $match: { createdAt: dateFilter } },  
  {  
    $group: {  
      _id: '$restaurant',  
      orderCount: { $sum: 1 },  
      revenue: { $sum: '$pricing.total' }  
    }  
  },  
  { $sort: { revenue: -1 } },  
  { $limit: 10 },  
  {  
    $lookup: {  
      from: 'restaurants',  
      localField: '_id',  
      foreignField: '_id',  
      as: 'restaurant'  
    }  
  },  
  { $unwind: '$restaurant' },  
  {  
    $project: {  
      name: '$restaurant.name',  
      orderCount: 1,  
      revenue: 1  
    }  
  }  
]);  

res.status(200).json({  
  success: true,  
  data: {  
    ordersByDay,  
    topRestaurants  
  }  
});

} catch (error) {
console.error('Analytics Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch analytics',
error: error.message
});
}
};
