const jwt = require('jsonwebtoken');
const axios = require('axios');
const { transporter } = require('../config/twilio');
const { User } = require('../models');

const generateToken = (userId) => {
return jwt.sign({ userId }, process.env.JWT_SECRET, {
expiresIn: process.env.JWT_EXPIRE || '7d'
});
};

const otpStore = {};

exports.sendOTP = async (req, res) => {
try {
const { email } = req.body;

if (!email) {  
  return res.status(400).json({  
    success: false,  
    message: 'Email is required'  
  });  
}  

const otp = Math.floor(100000 + Math.random() * 900000);

otpStore[email] = otp;

await transporter.sendMail({
  from: process.env.EMAIL,
  to: email,
  subject: 'Your OTP Code',
  text: `Your OTP is ${otp}. Do not share it.`
});

console.log(`OTP sent to ${email}`);  

res.status(200).json({  
  success: true,  
  message: 'OTP sent successfully',  
  status: 'sent',  
  email  
});

} catch (error) {
console.error('Send OTP Error:', error.message);
res.status(500).json({
success: false,
message: 'Failed to send OTP',
error: error.message
});
}
};

exports.verifyOTP = async (req, res) => {
try {
const { email, otp } = req.body;

if (!email || !otp) {  
  return res.status(400).json({  
    success: false,  
    message: 'Email and OTP are required'  
  });  
}  

if (otpStore[email] && otpStore[email] == otp) {  
  let user = await User.findOne({ email });  

  if (!user) {  
    user = await User.create({  
      email,  
      name: "User",  
      isVerified: true  
    });  
  }  

  delete otpStore[email];

  const token = generateToken(user._id);  

  res.status(200).json({  
    success: true,  
    message: 'OTP verified successfully',  
    status: 'approved',  
    isNewUser: false,  
    token,  
    user: {  
      id: user._id,  
      email: user.email  
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
console.error('Verify OTP Error:', error.message);
res.status(500).json({
success: false,
message: 'Failed to verify OTP',
error: error.message
});
}
};

exports.register = async (req, res) => {
try {
const { email, name, location, role = 'customer' } = req.body;

if (!email || !name) {  
  return res.status(400).json({  
    success: false,  
    message: 'Email and name are required'  
  });  
}  

let user = await User.findOne({ email });  
  
if (user) {  
  return res.status(400).json({  
    success: false,  
    message: 'User already exists'  
  });  
}  

user = await User.create({  
  email,  
  name,  
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
    email: user.email,  
    name: user.name,  
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

exports.login = async (req, res) => {
try {
const { email } = req.body;

const user = await User.findOne({ email });  
  
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
      email: user.email,  
      name: user.name,  
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
