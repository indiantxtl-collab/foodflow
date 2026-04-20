utils_index = '''const jwt = require('jsonwebtoken');

exports.generateToken = (userId) => {
return jwt.sign({ userId }, process.env.JWT_SECRET, {
expiresIn: process.env.JWT_EXPIRE || '7d'
});
};

exports.generateOrderId = () => {
const timestamp = Date.now().toString(36).toUpperCase();
const random = Math.random().toString(36).substring(2, 5).toUpperCase();
return FF${timestamp}${random};
};

exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
const R = 6371; // Earth's radius in km
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLon = (lon2 - lon1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
Math.sin(dLon/2) * Math.sin(dLon/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
return R * c;
};

exports.formatPrice = (price) => {
return new Intl.NumberFormat('en-IN', {
style: 'currency',
currency: 'INR',
minimumFractionDigits: 0
}).format(price);
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/utils/index.js", "w") as f:
f.write(utils_index)
