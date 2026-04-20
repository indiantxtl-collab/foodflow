restaurant_model = '''const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
name: { type: String, required: true },
description: String,
price: { type: Number, required: true },
discountedPrice: Number,
image: String,
category: { type: String, required: true },
isVeg: { type: Boolean, default: true },
isAvailable: { type: Boolean, default: true },
preparationTime: Number, // in minutes
addons: [{
name: String,
price: Number
}],
variants: [{
name: String,
price: Number
}],
ratings: {
average: { type: Number, default: 0 },
count: { type: Number, default: 0 }
}
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
owner: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true
},
name: {
type: String,
required: true,
trim: true
},
description: String,
cuisine: [String],
logo: String,
coverImage: String,
images: [String],
location: {
type: {
type: String,
enum: ['Point'],
default: 'Point'
},
coordinates: {
type: [Number],
required: true
},
address: {
full: String,
city: String,
state: String,
pincode: String,
landmark: String
}
},
contact: {
phone: String,
email: String,
website: String
},
timing: {
open: String,
close: String,
daysOpen: [String]
},
menu: [menuItemSchema],
categories: [String],
rating: {
average: { type: Number, default: 0 },
count: { type: Number, default: 0 }
},
deliveryTime: {
min: Number,
max: Number
},
deliveryFee: {
type: Number,
default: 0
},
minOrderAmount: {
type: Number,
default: 0
},
isOpen: {
type: Boolean,
default: true
},
isVerified: {
type: Boolean,
default: false
},
status: {
type: String,
enum: ['pending', 'approved', 'rejected', 'suspended'],
default: 'pending'
},
commissionRate: {
type: Number,
default: 10
},
earnings: {
total: { type: Number, default: 0 },
pending: { type: Number, default: 0 },
withdrawn: { type: Number, default: 0 }
},
documents: {
fssai: String,
gst: String,
pan: String,
bankDetails: {
accountNumber: String,
ifsc: String,
accountHolder: String
}
}
}, {
timestamps: true
});

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ status: 1 });
restaurantSchema.index({ 'menu.category': 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/models/Restaurant.js", "w") as f:
f.write(restaurant_model)
