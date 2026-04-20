cloudinary_config = '''const cloudinary = require('cloudinary').v2;

cloudinary.config({
cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
api_key: process.env.CLOUDINARY_API_KEY,
api_secret: process.env.CLOUDINARY_API_SECRET,
secure: true
});

module.exports = cloudinary;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/config/cloudinary.js", "w") as f:
f.write(cloudinary_config)
