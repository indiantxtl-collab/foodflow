models_index = '''module.exports = {
User: require('./User'),
Restaurant: require('./Restaurant'),
Order: require('./Order'),
DeliveryAgent: require('./DeliveryAgent'),
Coupon: require('./Coupon'),
Review: require('./Review')
};
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/models/index.js", "w") as f:
f.write(models_index)
