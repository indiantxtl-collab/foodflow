const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, couponController.getCoupons);
router.post('/validate', authenticate, couponController.validateCoupon);

module.exports = router;
