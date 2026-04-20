const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.put('/:id/cancel', authenticate, orderController.cancelOrder);
router.post('/:id/rate', authenticate, orderController.rateOrder);

// Restaurant routes
router.get('/restaurant-orders', authenticate, authorize('restaurant_owner'), orderController.getRestaurantOrders);
router.put('/:id/status', authenticate, authorize('restaurant_owner', 'admin'), orderController.updateStatus);

// Admin routes
router.put('/:id/assign-delivery', authenticate, authorize('admin'), orderController.assignDelivery);

module.exports = router;
