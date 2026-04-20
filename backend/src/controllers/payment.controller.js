const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order } = require('../models');

const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
try {
const { orderId } = req.body;

const order = await Order.findById(orderId);  
if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

const options = {  
  amount: order.pricing.total * 100, // Amount in paise  
  currency: 'INR',  
  receipt: order.orderId,  
  notes: {  
    orderId: order._id.toString(),  
    userId: req.user.userId  
  }  
};  

const razorpayOrder = await razorpay.orders.create(options);  

res.status(200).json({  
  success: true,  
  data: {  
    orderId: razorpayOrder.id,  
    amount: razorpayOrder.amount,  
    currency: razorpayOrder.currency,  
    key: process.env.RAZORPAY_KEY_ID  
  }  
});

} catch (error) {
console.error('Create Payment Order Error:', error);
res.status(500).json({
success: false,
message: 'Failed to create payment order',
error: error.message
});
}
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
try {
const {
razorpay_order_id,
razorpay_payment_id,
razorpay_signature,
orderId
} = req.body;

// Verify signature  
const body = razorpay_order_id + '|' + razorpay_payment_id;  
const expectedSignature = crypto  
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)  
  .update(body.toString())  
  .digest('hex');  

const isAuthentic = expectedSignature === razorpay_signature;  

if (!isAuthentic) {  
  return res.status(400).json({  
    success: false,  
    message: 'Invalid payment signature'  
  });  
}  

// Update order  
const order = await Order.findByIdAndUpdate(  
  orderId,  
  {  
    'payment.status': 'completed',  
    'payment.transactionId': razorpay_payment_id,  
    'payment.paidAt': new Date()  
  },  
  { new: true }  
);  

res.status(200).json({  
  success: true,  
  message: 'Payment verified successfully',  
  data: order  
});

} catch (error) {
console.error('Verify Payment Error:', error);
res.status(500).json({
success: false,
message: 'Failed to verify payment',
error: error.message
});
}
};

// @desc    UPI Intent Payment (for mobile apps)
// @route   POST /api/payments/upi-intent
// @access  Private
exports.upiIntent = async (req, res) => {
try {
const { orderId, upiId } = req.body;

const order = await Order.findById(orderId);  
if (!order) {  
  return res.status(404).json({  
    success: false,  
    message: 'Order not found'  
  });  
}  

// Generate UPI intent URL  
const upiUrl = `upi://pay?pa=${upiId}&pn=FoodFlow&am=${order.pricing.total}&cu=INR&tn=Order_${order.orderId}`;  

res.status(200).json({  
  success: true,  
  data: {  
    upiUrl,  
    amount: order.pricing.total,  
    orderId: order.orderId  
  }  
});

} catch (error) {
console.error('UPI Intent Error:', error);
res.status(500).json({
success: false,
message: 'Failed to generate UPI intent',
error: error.message
});
}
};
