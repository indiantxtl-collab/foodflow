coupon_model = '''const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
code: {
type: String,
required: true,
unique: true,
uppercase: true
},
description: String,
discountType: {
type: String,
enum: ['percentage', 'fixed'],
required: true
},
discountValue: {
type: Number,
required: true
},
maxDiscount: Number,
minOrderAmount: {
type: Number,
default: 0
},
validFrom: {
type: Date,
required: true
},
validUntil: {
type: Date,
required: true
},
usageLimit: {
total: Number,
perUser: { type: Number, default: 1 }
},
usedCount: {
type: Number,
default: 0
},
applicableOn: {
type: String,
enum: ['all', 'specific_restaurants', 'specific_users', 'first_order'],
default: 'all'
},
applicableRestaurants: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'Restaurant'
}],
applicableUsers: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
}],
isActive: {
type: Boolean,
default: true
}
}, {
timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/models/Coupon.js", "w") as f:
f.write(coupon_model)
