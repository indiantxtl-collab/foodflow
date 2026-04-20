module.exports = {
  auth: require('./auth.routes'),
  users: require('./user.routes'),
  restaurants: require('./restaurant.routes'),
  orders: require('./order.routes'),
  delivery: require('./delivery.routes'),
  admin: require('./admin.routes'),
  coupons: require('./coupon.routes'),
  payments: require('./payment.routes')
}; 
