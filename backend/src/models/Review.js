const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
order: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Order',
required: true
},
rating: {
food: { type: Number, min: 1, max: 5 },
service: { type: Number, min: 1, max: 5 },
delivery: { type: Number, min: 1, max: 5 },
overall: { type: Number, min: 1, max: 5, required: true }
},
comment: String,
images: [String],
likes: [{
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
}],
reply: {
comment: String,
createdAt: Date
},
isVerified: {
type: Boolean,
default: false
}
}, {
timestamps: true
});

reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

module.exports = mongoose.model('Review', reviewSchema);
