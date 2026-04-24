const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

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

router.post('/send-otp',
  validate([
    body('email').notEmpty().withMessage('Email is required')
  ]),
  authController.sendOTP
);

router.post('/verify-otp',
  validate([
    body('email').notEmpty(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP')
  ]),
  authController.verifyOTP
);

router.post('/register',
  validate([
    body('email').notEmpty(),
    body('name').notEmpty().withMessage('Name is required')
  ]),
  authController.register
);

router.post('/login',
  validate([body('email').notEmpty()]),
  authController.login
);

router.get('/me', authenticate, authController.getMe);

router.put('/fcm-token', authenticate, authController.updateFCMToken);

module.exports = router;
