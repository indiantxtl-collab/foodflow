auth_controller = '''const jwt = require('jsonwebtoken');
const { client, verifyServiceSid } = require('../config/twilio');
const { User } = require('../models');

// Generate JWT Token
const generateToken = (userId) => {
return jwt.sign({ userId }, process.env.JWT_SECRET, {
expiresIn: process.env.JWT_EXPIRE || '7d'
});
};

// @desc    Send OTP using Twilio Verify
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
try {
const { phone, countryCode = '+91' } = req.body;

if (!phone) {  
  return res.status(400).json({  
    success: false,  
    message: 'Phone number is required'  
  });  
}  

const fullPhone = countryCode + phone;  
  
// Send OTP via Twilio Verify  
const verification = await client.verify.v2.services(verifyServiceSid)  
  .verifications  
  .create({  
    to: fullPhone,  
    channel: 'sms'  
  });  

console.log(`OTP sent to ${fullPhone}, Status: ${verification.status}`);  

res.status(200).json({  
  success: true,  
  message: 'OTP sent successfully',  
  status: verification.status,  
  phone: fullPhone  
});

} catch (error) {
console.error('Send OTP Error:', error);
res.status(500).json({
success: false,
message: 'Failed to send OTP',
error: error.message
});
}
};

// @desc    Verify OTP using Twilio Verify
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
try {
const { phone, otp, countryCode = '+91' } = req.body;

if (!phone || !otp) {  
  return res.status(400).json({  
    success: false,  
    message: 'Phone number and OTP are required'  
  });  
}  

const fullPhone = countryCode + phone;  
  
// Verify OTP via Twilio  
const verificationCheck = await client.verify.v2.services(verifyServiceSid)  
  .verificationChecks  
  .create({  
    to: fullPhone,  
    code: otp  
  });  

if (verificationCheck.status === 'approved') {  
  // Check if user exists  
  let user = await User.findOne({ phone: fullPhone });  
    
  res.status(200).json({  
    success: true,  
    message: 'OTP verified successfully',  
    status: 'approved',  
    isNewUser: !user,  
    phone: fullPhone  
  });  
} else {  
  res.status(400).json({  
    success: false,  
    message: 'Invalid OTP',  
    status: verificationCheck.status  
  });  
}

} catch (error) {
console.error('Verify OTP Error:', error);
res.status(500).json({
success: false,
message: 'Failed to verify OTP',
error: error.message
});
}
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
try {
const { phone, name, email, location, role = 'customer' } = req.body;

if (!phone || !name) {  
  return res.status(400).json({  
    success: false,  
    message: 'Phone and name are required'  
  });  
}  

// Check if user already exists  
let user = await User.findOne({ phone });  
  
if (user) {  
  return res.status(400).json({  
    success: false,  
    message: 'User already exists'  
  });  
}  

// Create new user  
user = await User.create({  
  phone,  
  name,  
  email,  
  role,  
  location: location ? {  
    type: 'Point',  
    coordinates: location.coordinates || [0, 0],  
    address: location.address  
  } : undefined,  
  isVerified: true  
});  

const token = generateToken(user._id);  

res.status(201).json({  
  success: true,  
  message: 'User registered successfully',  
  token,  
  user: {  
    id: user._id,  
    phone: user.phone,  
    name: user.name,  
    email: user.email,  
    role: user.role,  
    location: user.location  
  }  
});

} catch (error) {
console.error('Register Error:', error);
res.status(500).json({
success: false,
message: 'Failed to register user',
error: error.message
});
}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
try {
const { phone } = req.body;

const user = await User.findOne({ phone });  
  
if (!user) {  
  return res.status(404).json({  
    success: false,  
    message: 'User not found'  
  });  
}  

if (!user.isActive) {  
  return res.status(403).json({  
    success: false,  
    message: 'Account is deactivated'  
  });  
}  

// Update last login  
user.lastLogin = Date.now();  
await user.save();  

const token = generateToken(user._id);  

res.status(200).json({  
  success: true,  
  message: 'Login successful',  
  token,  
  user: {  
    id: user._id,  
    phone: user.phone,  
    name: user.name,  
    email: user.email,  
    role: user.role,  
    location: user.location,  
    addresses: user.addresses  
  }  
});

} catch (error) {
console.error('Login Error:', error);
res.status(500).json({
success: false,
message: 'Failed to login',
error: error.message
});
}
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
try {
const user = await User.findById(req.user.userId).select('-__v');

if (!user) {  
  return res.status(404).json({  
    success: false,  
    message: 'User not found'  
  });  
}  

res.status(200).json({  
  success: true,  
  user  
});

} catch (error) {
console.error('Get Me Error:', error);
res.status(500).json({
success: false,
message: 'Failed to get user details',
error: error.message
});
}
};

// @desc    Update FCM token
// @route   PUT /api/auth/fcm-token
// @access  Private
exports.updateFCMToken = async (req, res) => {
try {
const { fcmToken } = req.body;

await User.findByIdAndUpdate(req.user.userId, { fcmToken });  
  
res.status(200).json({  
  success: true,  
  message: 'FCM token updated'  
});

} catch (error) {
console.error('FCM Token Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update FCM token',
error: error.message
});
}
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/controllers/auth.controller.js", "w") as f:
f.write(auth_controller)
