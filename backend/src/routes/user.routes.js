user_routes = '''const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

router.put('/profile', authenticate, userController.updateProfile);
router.post('/addresses', authenticate, userController.addAddress);
router.put('/addresses/:id', authenticate, userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);
router.put('/location', authenticate, userController.updateLocation);

module.exports = router;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/routes/user.routes.js", "w") as f:
f.write(user_routes)
