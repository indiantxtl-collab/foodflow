order_model = '''const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
menuItem: {
type: mongoose.Schema.Types.ObjectId,
required: true
},
name: String,
price: Number,
quantity: { type: Number, required: true },
variants: [{
name: String,
price: Number
}],
addons: [{
name: String,
price: Number
}],
specialInstructions: String
});

const orderSchema = new mongoose.Schema({
orderId: {
type: String,
unique: true,
required: true
},
user: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true
},
restaurant: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Restaurant',
required: true
},
items: [orderItemSchema],
pricing: {
subtotal: { type: Number, required: true },
deliveryFee: { type: Number, default: 0 },
platformFee: { type: Number, default: 0 },
tax: { type: Number, default: 0 },
discount: { type: Number, default: 0 },
couponCode: String,
total: { type: Number, required: true }
},
deliveryAddress: {
full: String,
city: String,
state: String,
pincode: String,
landmark: String,
coordinates: [Number]
},
status: {
type: String,
enum: [
'pending',
'confirmed',
'preparing',
'ready',
'out_for_delivery',
'delivered',
'cancelled',
'rejected'
],
default: 'pending'
},
payment: {
method: {
type: String,
enum: ['cod', 'upi', 'card', 'wallet'],
required: true
},
status: {
type: String,
enum: ['pending', 'completed', 'failed', 'refunded'],
default: 'pending'
},
transactionId: String,
paidAt: Date
},
deliveryAgent: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
default: null
},
delivery: {
assignedAt: Date,
pickedUpAt: Date,
deliveredAt: Date,
estimatedTime: Date,
actualTime: Date,
trackingHistory: [{
status: String,
location: {
coordinates: [Number],
address: String
},
timestamp: { type: Date, default: Date.now }
}]
},
preparationTime: Number,
notes: String,
rating: {
food: Number,
delivery: Number,
overall: Number,
comment: String,
createdAt: Date
},
refund: {
amount: Number,
reason: String,
status: {
type: String,
enum: ['pending', 'processed', 'rejected'],
default: 'pending'
},
processedAt: Date
}
}, {
timestamps: true
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ deliveryAgent: 1, status: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/models/Order.js", "w") as f:
f.write(order_model)
