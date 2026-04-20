admin_routes = '''const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('admin'), adminController.getDashboard);
router.get('/users', authenticate, authorize('admin'), adminController.getUsers);
router.get('/restaurants/pending', authenticate, authorize('admin'), adminController.getPendingRestaurants);
router.put('/restaurants/:id/approve', authenticate, authorize('admin'), adminController.approveRestaurant);
router.get('/delivery-agents/pending', authenticate, authorize('admin'), adminController.getPendingAgents);
router.put('/delivery-agents/:id/approve', authenticate, authorize('admin'), adminController.approveAgent);
router.get('/orders', authenticate, authorize('admin'), adminController.getAllOrders);
router.post('/coupons', authenticate, authorize('admin'), adminController.createCoupon);
router.get('/analytics', authenticate, authorize('admin'), adminController.getAnalytics);

module.exports = router;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/routes/admin.routes.js", "w") as f:
f.write(admin_routes)
