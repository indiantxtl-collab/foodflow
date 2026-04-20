const { User } = require('../models');

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
try {
const { name, email, avatar } = req.body;

const user = await User.findByIdAndUpdate(  
  req.user.userId,  
  { name, email, avatar },  
  { new: true, runValidators: true }  
).select('-__v');  

res.status(200).json({  
  success: true,  
  message: 'Profile updated',  
  data: user  
});

} catch (error) {
console.error('Update Profile Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update profile',
error: error.message
});
}
};

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res) => {
try {
const address = req.body;

const user = await User.findById(req.user.userId);  
  
// If this is the first address or marked as default, update others  
if (address.isDefault || user.addresses.length === 0) {  
  user.addresses.forEach(addr => addr.isDefault = false);  
  address.isDefault = true;  
}  

user.addresses.push(address);  
await user.save();  

res.status(201).json({  
  success: true,  
  message: 'Address added',  
  data: user.addresses  
});

} catch (error) {
console.error('Add Address Error:', error);
res.status(500).json({
success: false,
message: 'Failed to add address',
error: error.message
});
}
};

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
try {
const { id } = req.params;
const updateData = req.body;

const user = await User.findById(req.user.userId);  
const address = user.addresses.id(id);  

if (!address) {  
  return res.status(404).json({  
    success: false,  
    message: 'Address not found'  
  });  
}  

// Handle default address logic  
if (updateData.isDefault) {  
  user.addresses.forEach(addr => {  
    if (addr._id.toString() !== id) addr.isDefault = false;  
  });  
}  

Object.assign(address, updateData);  
await user.save();  

res.status(200).json({  
  success: true,  
  message: 'Address updated',  
  data: user.addresses  
});

} catch (error) {
console.error('Update Address Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update address',
error: error.message
});
}
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
try {
const { id } = req.params;

const user = await User.findById(req.user.userId);  
user.addresses = user.addresses.filter(addr => addr._id.toString() !== id);  
  
// If no default address exists, make first one default  
if (!user.addresses.some(addr => addr.isDefault) && user.addresses.length > 0) {  
  user.addresses[0].isDefault = true;  
}  

await user.save();  

res.status(200).json({  
  success: true,  
  message: 'Address deleted',  
  data: user.addresses  
});

} catch (error) {
console.error('Delete Address Error:', error);
res.status(500).json({
success: false,
message: 'Failed to delete address',
error: error.message
});
}
};

// @desc    Update location
// @route   PUT /api/users/location
// @access  Private
exports.updateLocation = async (req, res) => {
try {
const { coordinates, address } = req.body;

const user = await User.findByIdAndUpdate(  
  req.user.userId,  
  {  
    location: {  
      type: 'Point',  
      coordinates,  
      address  
    }  
  },  
  { new: true }  
);  

res.status(200).json({  
  success: true,  
  message: 'Location updated',  
  data: user.location  
});

} catch (error) {
console.error('Update Location Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update location',
error: error.message
});
}
};
