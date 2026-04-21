const jwt = require('jsonwebtoken');
const axios = require('axios');
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

const verification = await axios.get(`https://api.msg91.com/api/v5/otp?authkey=${process.env.MSG91_AUTH_KEY}&mobile=91${phone}&otp_length=6`);

console.log(`OTP sent to ${fullPhone}`);  

res.status(200).json({  
  success: true,  
  message: 'OTP sent successfully',  
  status: 'sent',  
  phone: fullPhone  
});

} catch (error) {
console.error('Send OTP Error:', error.response?.data || error.message);
res.status(500).json({
success: false,
message: 'Failed to send OTP',
error: error.message
});
}
};

// @desc    Verify OTP
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

const verificationCheck = await axios.get(`https://api.msg91.com/api/v5/otp/verify?authkey=${process.env.MSG91_AUTH_KEY}&mobile=91${phone}&otp=${otp}`);

if (verificationCheck.data.type === 'success') {  
  let user = await User.findOne({ phone: fullPhone });  

  if (!user) {  
    user = await User.create({  
      phone: fullPhone,  
      name: "User",  
      isVerified: true  
    });  
  }  

  const token = generateToken(user._id);  

  res.status(200).json({  
    success: true,  
    message: 'OTP verified successfully',  
    status: 'approved',  
    isNewUser: false,  
    token,  
    user: {  
      id: user._id,  
      phone: user.phone  
    }  
  });  

} else {  
  res.status(400).json({  
    success: false,  
    message: 'Invalid OTP',  
    status: 'failed'  
  });  
}

} catch (error) {
console.error('Verify OTP Error:', error.response?.data || error.message);
res.status(500).json({
success: false,
message: 'Failed to verify OTP',
error: error.message
});
}
};

// Register
exports.register = async (req, res) => {
try {
const { phone, name, email, location, role = 'customer' } = req.body;

if (!phone || !name) {  
  return res.status(400).json({  
    success: false,  
    message: 'Phone and name are required'  
  });  
}  

let user = await User.findOne({ phone });  
  
if (user) {  
  return res.status(400).json({  
    success: false,  
    message: 'User already exists'  
  });  
}  

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

// Login
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

// Get Me
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

// Update FCM
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
