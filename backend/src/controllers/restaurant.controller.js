restaurant_controller = '''const { Restaurant, User } = require('../models');
const geolib = require('geolib');

// @desc    Get all restaurants with location-based filtering
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
try {
const {
lat,
lng,
radius = 5000,
cuisine,
search,
sortBy = 'rating',
page = 1,
limit = 20
} = req.query;

let query = {   
  status: 'approved',   
  isOpen: true   
};  

// Location-based filtering  
if (lat && lng) {  
  query.location = {  
    $near: {  
      $geometry: {  
        type: 'Point',  
        coordinates: [parseFloat(lng), parseFloat(lat)]  
      },  
      $maxDistance: parseInt(radius)  
    }  
  };  
}  

// Cuisine filter  
if (cuisine) {  
  query.cuisine = { $in: cuisine.split(',') };  
}  

// Search filter  
if (search) {  
  query.$or = [  
    { name: { $regex: search, $options: 'i' } },  
    { cuisine: { $in: [new RegExp(search, 'i')] } },  
    { 'menu.name': { $regex: search, $options: 'i' } }  
  ];  
}  

// Sorting  
let sortOption = {};  
switch (sortBy) {  
  case 'rating':  
    sortOption = { 'rating.average': -1 };  
    break;  
  case 'deliveryTime':  
    sortOption = { 'deliveryTime.min': 1 };  
    break;  
  case 'price':  
    sortOption = { deliveryFee: 1 };  
    break;  
  default:  
    sortOption = { createdAt: -1 };  
}  

const restaurants = await Restaurant.find(query)  
  .populate('owner', 'name phone')  
  .sort(sortOption)  
  .skip((page - 1) * limit)  
  .limit(parseInt(limit));  

const total = await Restaurant.countDocuments(query);  

// Calculate distance for each restaurant if coordinates provided  
let restaurantsWithDistance = restaurants;  
if (lat && lng) {  
  restaurantsWithDistance = restaurants.map(rest => {  
    const restObj = rest.toObject();  
    if (rest.location && rest.location.coordinates) {  
      restObj.distance = geolib.getDistance(  
        { latitude: parseFloat(lat), longitude: parseFloat(lng) },  
        {   
          latitude: rest.location.coordinates[1],   
          longitude: rest.location.coordinates[0]   
        }  
      );  
    }  
    return restObj;  
  });  
}  

res.status(200).json({  
  success: true,  
  count: restaurants.length,  
  total,  
  page: parseInt(page),  
  pages: Math.ceil(total / limit),  
  data: restaurantsWithDistance  
});

} catch (error) {
console.error('Get Restaurants Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch restaurants',
error: error.message
});
}
};

// @desc    Get single restaurant with menu
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
try {
const { id } = req.params;
const { lat, lng } = req.query;

const restaurant = await Restaurant.findById(id)  
  .populate('owner', 'name phone');  

if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

let restaurantData = restaurant.toObject();  

// Calculate distance  
if (lat && lng && restaurant.location) {  
  restaurantData.distance = geolib.getDistance(  
    { latitude: parseFloat(lat), longitude: parseFloat(lng) },  
    {   
      latitude: restaurant.location.coordinates[1],   
      longitude: restaurant.location.coordinates[0]   
    }  
  );  
}  

// Group menu by category  
const menuByCategory = {};  
restaurant.menu.forEach(item => {  
  if (!menuByCategory[item.category]) {  
    menuByCategory[item.category] = [];  
  }  
  menuByCategory[item.category].push(item);  
});  
restaurantData.menuByCategory = menuByCategory;  

res.status(200).json({  
  success: true,  
  data: restaurantData  
});

} catch (error) {
console.error('Get Restaurant Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch restaurant',
error: error.message
});
}
};

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant Owner)
exports.createRestaurant = async (req, res) => {
try {
const restaurantData = req.body;
restaurantData.owner = req.user.userId;

const restaurant = await Restaurant.create(restaurantData);  

// Update user role  
await User.findByIdAndUpdate(req.user.userId, { role: 'restaurant_owner' });  

res.status(201).json({  
  success: true,  
  message: 'Restaurant created successfully',  
  data: restaurant  
});

} catch (error) {
console.error('Create Restaurant Error:', error);
res.status(500).json({
success: false,
message: 'Failed to create restaurant',
error: error.message
});
}
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Owner only)
exports.updateRestaurant = async (req, res) => {
try {
const { id } = req.params;

let restaurant = await Restaurant.findById(id);  
  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

// Check ownership  
if (restaurant.owner.toString() !== req.user.userId && req.user.role !== 'admin') {  
  return res.status(403).json({  
    success: false,  
    message: 'Not authorized to update this restaurant'  
  });  
}  

restaurant = await Restaurant.findByIdAndUpdate(  
  id,  
  req.body,  
  { new: true, runValidators: true }  
);  

res.status(200).json({  
  success: true,  
  message: 'Restaurant updated successfully',  
  data: restaurant  
});

} catch (error) {
console.error('Update Restaurant Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update restaurant',
error: error.message
});
}
};

// @desc    Add menu item
// @route   POST /api/restaurants/:id/menu
// @access  Private (Owner only)
exports.addMenuItem = async (req, res) => {
try {
const { id } = req.params;
const menuItem = req.body;

const restaurant = await Restaurant.findById(id);  
  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

if (restaurant.owner.toString() !== req.user.userId) {  
  return res.status(403).json({  
    success: false,  
    message: 'Not authorized'  
  });  
}  

restaurant.menu.push(menuItem);  
await restaurant.save();  

res.status(201).json({  
  success: true,  
  message: 'Menu item added',  
  data: restaurant.menu[restaurant.menu.length - 1]  
});

} catch (error) {
console.error('Add Menu Item Error:', error);
res.status(500).json({
success: false,
message: 'Failed to add menu item',
error: error.message
});
}
};

// @desc    Update menu item
// @route   PUT /api/restaurants/:id/menu/:itemId
// @access  Private (Owner only)
exports.updateMenuItem = async (req, res) => {
try {
const { id, itemId } = req.params;

const restaurant = await Restaurant.findById(id);  
  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

const menuItem = restaurant.menu.id(itemId);  
if (!menuItem) {  
  return res.status(404).json({  
    success: false,  
    message: 'Menu item not found'  
  });  
}  

Object.assign(menuItem, req.body);  
await restaurant.save();  

res.status(200).json({  
  success: true,  
  message: 'Menu item updated',  
  data: menuItem  
});

} catch (error) {
console.error('Update Menu Item Error:', error);
res.status(500).json({
success: false,
message: 'Failed to update menu item',
error: error.message
});
}
};

// @desc    Delete menu item
// @route   DELETE /api/restaurants/:id/menu/:itemId
// @access  Private (Owner only)
exports.deleteMenuItem = async (req, res) => {
try {
const { id, itemId } = req.params;

const restaurant = await Restaurant.findById(id);  
  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

restaurant.menu = restaurant.menu.filter(item => item._id.toString() !== itemId);  
await restaurant.save();  

res.status(200).json({  
  success: true,  
  message: 'Menu item deleted'  
});

} catch (error) {
console.error('Delete Menu Item Error:', error);
res.status(500).json({
success: false,
message: 'Failed to delete menu item',
error: error.message
});
}
};

// @desc    Toggle restaurant availability
// @route   PATCH /api/restaurants/:id/toggle-status
// @access  Private (Owner only)
exports.toggleStatus = async (req, res) => {
try {
const { id } = req.params;

const restaurant = await Restaurant.findById(id);  
  
if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'Restaurant not found'  
  });  
}  

restaurant.isOpen = !restaurant.isOpen;  
await restaurant.save();  

res.status(200).json({  
  success: true,  
  message: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`,  
  isOpen: restaurant.isOpen  
});

} catch (error) {
console.error('Toggle Status Error:', error);
res.status(500).json({
success: false,
message: 'Failed to toggle status',
error: error.message
});
}
};

// @desc    Get my restaurant (for owners)
// @route   GET /api/restaurants/my-restaurant
// @access  Private (Restaurant Owner)
exports.getMyRestaurant = async (req, res) => {
try {
const restaurant = await Restaurant.findOne({ owner: req.user.userId })
.populate('owner', 'name phone email');

if (!restaurant) {  
  return res.status(404).json({  
    success: false,  
    message: 'No restaurant found'  
  });  
}  

res.status(200).json({  
  success: true,  
  data: restaurant  
});

} catch (error) {
console.error('Get My Restaurant Error:', error);
res.status(500).json({
success: false,
message: 'Failed to fetch restaurant',
error: error.message
});
}
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/controllers/restaurant.controller.js", "w") as f:
f.write(restaurant_controller)
