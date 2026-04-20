const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, paymentController.createOrder);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.post('/upi-intent', authenticate, paymentController.upiIntent);

module.exports = router;
