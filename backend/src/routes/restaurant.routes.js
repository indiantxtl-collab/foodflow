const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', restaurantController.getRestaurants);
router.get('/:id', restaurantController.getRestaurant);

// Protected routes
router.post('/', authenticate, authorize('restaurant_owner', 'admin'), restaurantController.createRestaurant);
router.get('/my-restaurant', authenticate, authorize('restaurant_owner'), restaurantController.getMyRestaurant);
router.put('/:id', authenticate, restaurantController.updateRestaurant);
router.patch('/:id/toggle-status', authenticate, restaurantController.toggleStatus);

// Menu routes
router.post('/:id/menu', authenticate, restaurantController.addMenuItem);
router.put('/:id/menu/:itemId', authenticate, restaurantController.updateMenuItem);
router.delete('/:id/menu/:itemId', authenticate, restaurantController.deleteMenuItem);

module.exports = router;
