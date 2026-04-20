routes_index = '''module.exports = {
auth: require('./auth.routes'),
users: require('./user.routes'),
restaurants: require('./restaurant.routes'),
orders: require('./order.routes'),
delivery: require('./delivery.routes'),
admin: require('./admin.routes'),
coupons: require('./coupon.routes'),
payments: require('./payment.routes')
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/routes/index.js", "w") as f:
f.write(routes_index)
