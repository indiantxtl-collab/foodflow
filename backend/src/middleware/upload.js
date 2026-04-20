upload_middleware = '''const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, 'uploads/');
},
filename: function (req, file, cb) {
cb(null, ${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)});
}
});

// File filter
const fileFilter = (req, file, cb) => {
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

if (allowedTypes.includes(file.mimetype)) {
cb(null, true);
} else {
cb(new Error('Invalid file type. Only JPEG, PNG and WebP allowed.'), false);
}
};

const upload = multer({
storage: storage,
limits: {
fileSize: 5 * 1024 * 1024 // 5MB limit
},
fileFilter: fileFilter
});

module.exports = upload;
'''

with open("/mnt/kimi/output/foodflow-ecosystem/backend/src/middleware/upload.js", "w") as f:
f.write(upload_middleware)
