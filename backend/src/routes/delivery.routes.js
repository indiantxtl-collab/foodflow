delivery_routes = '''const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/register', authenticate, deliveryController.register);
router.get('/profile', authenticate, authorize('delivery_agent'), deliveryController.getProfile);
router.patch('/toggle-status', authenticate, authorize('delivery_agent'), deliveryController.toggleStatus);
router.put('/location', authenticate, authorize('delivery_agent'), deliveryController.updateLocation);
router.get('/orders', authenticate, authorize('delivery_agent'), deliveryController.getOrders);
router.put('/orders/:id/respond', authenticate, authorize('delivery_agent'), deliveryController.respondToOrder);
router.put('/orders/:id/status', authenticate, authorize('delivery_agent'), deliveryController.updateOrderStatus);
router.get('/earnings', authenticate, authorize('delivery_agent'), deliveryController.getEarnings);

module.exports = router;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/routes/delivery.routes.js", "w") as f:
f.write(delivery_routes)
