const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
email: {
type: String,
required: true,
unique: true,
index: true,
trim: true,
lowercase: true
},
name: {
type: String,
required: true,
trim: true
},
role: {
type: String,
enum: ['customer', 'restaurant_owner', 'delivery_agent', 'admin'],
default: 'customer'
},
avatar: {
type: String,
default: null
},
location: {
type: {
type: String,
enum: ['Point'],
default: 'Point'
},
coordinates: {
type: [Number],
default: [0, 0]
},
address: {
full: String,
city: String,
state: String,
pincode: String,
landmark: String
}
},
addresses: [{
full: String,
city: String,
state: String,
pincode: String,
landmark: String,
label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
isDefault: { type: Boolean, default: false },
coordinates: [Number]
}],
isVerified: {
type: Boolean,
default: false
},
isActive: {
type: Boolean,
default: true
},
fcmToken: {
type: String,
default: null
},
lastLogin: {
type: Date,
default: Date.now
}
}, {
timestamps: true
});

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function(next) {
if (!this.isModified('password')) return next();
this.password = await bcrypt.hash(this.password, 12);
next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
