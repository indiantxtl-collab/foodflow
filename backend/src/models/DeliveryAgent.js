const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
user: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
unique: true
},
vehicle: {
type: { type: String, enum: ['bike', 'bicycle', 'scooter', 'car'] },
number: String,
model: String,
color: String
},
documents: {
license: String,
rcBook: String,
insurance: String,
aadhar: String,
pan: String
},
bankDetails: {
accountNumber: String,
ifsc: String,
accountHolder: String
},
earnings: {
total: { type: Number, default: 0 },
pending: { type: Number, default: 0 },
withdrawn: { type: Number, default: 0 },
incentives: { type: Number, default: 0 }
},
statistics: {
totalDeliveries: { type: Number, default: 0 },
completed: { type: Number, default: 0 },
cancelled: { type: Number, default: 0 },
rating: { type: Number, default: 5 },
responseTime: Number // average in minutes
},
availability: {
isOnline: { type: Boolean, default: false },
lastLocation: {
coordinates: [Number],
timestamp: Date
},
currentOrder: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Order',
default: null
}
},
workingHours: [{
day: String,
start: String,
end: String,
isWorking: Boolean
}],
status: {
type: String,
enum: ['pending', 'approved', 'rejected', 'suspended'],
default: 'pending'
},
joinedAt: {
type: Date,
default: Date.now
}
}, {
timestamps: true
});

deliveryAgentSchema.index({ 'availability.lastLocation': '2dsphere' });

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
