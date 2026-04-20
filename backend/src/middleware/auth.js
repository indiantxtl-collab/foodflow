const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticate = async (req, res, next) => {
try {
let token;

if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {  
  token = req.headers.authorization.split(' ')[1];  
}  

if (!token) {  
  return res.status(401).json({  
    success: false,  
    message: 'Not authorized, no token'  
  });  
}  

try {  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);  
  req.user = decoded;  
  next();  
} catch (error) {  
  return res.status(401).json({  
    success: false,  
    message: 'Not authorized, token failed'  
  });  
}

} catch (error) {
console.error('Auth Middleware Error:', error);
res.status(500).json({
success: false,
message: 'Server error'
});
}
};

exports.authorize = (...roles) => {
return async (req, res, next) => {
try {
const user = await User.findById(req.user.userId);

if (!user) {  
    return res.status(404).json({  
      success: false,  
      message: 'User not found'  
    });  
  }  

  if (!roles.includes(user.role)) {  
    return res.status(403).json({  
      success: false,  
      message: 'Not authorized for this action'  
    });  
  }  

  req.user.role = user.role;  
  next();  

} catch (error) {  
  console.error('Authorize Middleware Error:', error);  
  res.status(500).json({  
    success: false,  
    message: 'Server error'  
  });  
}

};
};
