socket_handler = '''const { User, DeliveryAgent, Order } = require('../models');

module.exports = (io) => {
io.on('connection', (socket) => {
console.log('Client connected:', socket.id);

// Join user room  
socket.on('join_user', (userId) => {  
  socket.join(`user_${userId}`);  
  console.log(`User ${userId} joined their room`);  
});  

// Join restaurant room  
socket.on('join_restaurant', (restaurantId) => {  
  socket.join(`restaurant_${restaurantId}`);  
  console.log(`Restaurant ${restaurantId} joined their room`);  
});  

// Join delivery agent room  
socket.on('join_delivery', (deliveryAgentId) => {  
  socket.join(`delivery_${deliveryAgentId}`);  
  console.log(`Delivery agent ${deliveryAgentId} joined their room`);  
});  

// Update delivery location  
socket.on('update_location', async (data) => {  
  try {  
    const { deliveryAgentId, lat, lng, orderId } = data;  

    // Update in database  
    await DeliveryAgent.findByIdAndUpdate(deliveryAgentId, {  
      'availability.lastLocation': {  
        coordinates: [lng, lat],  
        timestamp: new Date()  
      }  
    });  

    // Update order tracking  
    if (orderId) {  
      await Order.findByIdAndUpdate(orderId, {  
        $push: {  
          'delivery.trackingHistory': {  
            status: 'location_update',  
            location: {  
              coordinates: [lng, lat]  
            },  
            timestamp: new Date()  
          }  
        }  
      });  

      // Get order to find user  
      const order = await Order.findById(orderId);  
      if (order) {  
        // Emit to user  
        io.to(`user_${order.user}`).emit('delivery_location_update', {  
          orderId,  
          location: { lat, lng },  
          timestamp: new Date()  
        });  
      }  
    }  

    socket.emit('location_updated', { success: true });  

  } catch (error) {  
    console.error('Update Location Socket Error:', error);  
    socket.emit('location_error', { error: error.message });  
  }  
});  

// Order status update  
socket.on('order_status_update', async (data) => {  
  try {  
    const { orderId, status, updatedBy } = data;  

    const order = await Order.findByIdAndUpdate(  
      orderId,  
      {  
        status,  
        $push: {  
          'delivery.trackingHistory': {  
            status,  
            timestamp: new Date()  
          }  
        }  
      },  
      { new: true }  
    );  

    if (order) {  
      // Emit to all relevant parties  
      io.to(`user_${order.user}`).emit('order_update', order);  
      io.to(`restaurant_${order.restaurant}`).emit('order_update', order);  
      if (order.deliveryAgent) {  
        io.to(`delivery_${order.deliveryAgent}`).emit('order_update', order);  
      }  
    }  

  } catch (error) {  
    console.error('Order Status Update Socket Error:', error);  
  }  
});  

// Restaurant availability toggle  
socket.on('restaurant_toggle', async (data) => {  
  try {  
    const { restaurantId, isOpen } = data;  
      
    // Broadcast to all connected clients  
    io.emit('restaurant_status_change', {  
      restaurantId,  
      isOpen,  
      timestamp: new Date()  
    });  

  } catch (error) {  
    console.error('Restaurant Toggle Socket Error:', error);  
  }  
});  

// Handle disconnection  
socket.on('disconnect', () => {  
  console.log('Client disconnected:', socket.id);  
});

});
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/socket/socket.handler.js", "w") as f:
f.write(socket_handler)
