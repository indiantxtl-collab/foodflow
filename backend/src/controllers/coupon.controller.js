const { Coupon, Order } = require('../models');

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
try {
const { code, orderAmount, restaurantId } = req.body;
const userId = req.user.userId;

const coupon = await Coupon.findOne({  
  code: code.toUpperCase(),  
  isActive: true,  
  validFrom: { $lte: new Date() },  
  validUntil: { $gte: new Date() }  
});  

if (!coupon) {  
  return res.status(404).json({  
    success: false,  
    message: 'Invalid or expired coupon'  
  });  
}  

if (orderAmount < coupon.minOrderAmount) {  
  return res.status(400).json({  
    success: false,  
    message: `Minimum order amount of ₹${coupon.minOrderAmount} required`  
  });  
}  

if (coupon.usageLimit.total && coupon.usedCount >= coupon.usageLimit.total) {  
  return res.status(400).json({  
    success: false,  
    message: 'Coupon usage limit exceeded'  
  });  
}  

const userUsage = await Order.countDocuments({  
  user: userId,  
  'pricing.couponCode': code.toUpperCase()  
});  

if (userUsage >= coupon.usageLimit.perUser) {  
  return res.status(400).json({  
    success: false,  
    message: 'You have already used this coupon'  
  });  
}  

if (coupon.applicableOn === 'specific_restaurants') {  
  if (!coupon.applicableRestaurants.includes(restaurantId)) {  
    return res.status(400).json({  
      success: false,  
      message: 'Coupon not applicable for this restaurant'  
    });  
  }  
}  

let discount = 0;  
if (coupon.discountType === 'percentage') {  
  discount = (orderAmount * coupon.discountValue) / 100;  
  if (coupon.maxDiscount) {  
    discount = Math.min(discount, coupon.maxDiscount);  
  }  
} else {  
  discount = coupon.discountValue;  
}  

res.status(200).json({  
  success: true,  
  message: 'Coupon applied successfully',  
  data: {  
    code: coupon.code,  
    discountType: coupon.discountType,  
    discountValue: coupon.discountValue,  
    discountAmount: Math.round(discount),  
    maxDiscount: coupon.maxDiscount,  
    minOrderAmount: coupon.minOrderAmount  
  }  
});

} catch (error) {
console.error('Validate Coupon Error:', error);
res.status(500).json({
success: false,
message: 'Failed to validate coupon',
error: error.message
});
}
};

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Private
exports.getCoupons = async (req, res) => {
try {
const coupons = await Coupon.find({
isActive: true,
validFrom: { $lte: new Date() },
validUntil: { $gte: new Date() }
}).select('-__v');

res.status(200).json({  
  success: true,  
  count: coupons.length,  
  data: coupons  
});

} catch (error) {
console.error('Get Coupons Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch coupons',
error: error.message
});
}
};
