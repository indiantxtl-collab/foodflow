auth_routes = '''const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validate = (validations) => {
return async (req, res, next) => {
await Promise.all(validations.map(validation => validation.run(req)));

const errors = require('express-validator').validationResult(req);  
if (!errors.isEmpty()) {  
  return res.status(400).json({  
    success: false,  
    errors: errors.array()  
  });  
}  
next();

};
};

// Send OTP
router.post('/send-otp',
validate([
body('phone').notEmpty().withMessage('Phone number is required')
]),
authController.sendOTP
);

// Verify OTP
router.post('/verify-otp',
validate([
body('phone').notEmpty(),
body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP')
]),
authController.verifyOTP
);

// Register
router.post('/register',
validate([
body('phone').notEmpty(),
body('name').notEmpty().withMessage('Name is required')
]),
authController.register
);

// Login
router.post('/login',
validate([body('phone').notEmpty()]),
authController.login
);

// Get current user
router.get('/me', authenticate, authController.getMe);

// Update FCM token
router.put('/fcm-token', authenticate, authController.updateFCMToken);

module.exports = router;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/routes/auth.routes.js", "w") as f:
f.write(auth_routes)
