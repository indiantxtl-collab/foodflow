coupon_routes = '''const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, couponController.getCoupons);
router.post('/validate', authenticate, couponController.validateCoupon);

module.exports = router;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/routes/coupon.routes.js", "w") as f:
f.write(coupon_routes)
