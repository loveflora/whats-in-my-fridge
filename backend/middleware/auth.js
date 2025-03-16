const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');

    // Add user from payload
    if (decoded.user) {
      // 기존 방식 (user 객체가 있는 경우)
      req.user = decoded.user;
    } else if (decoded.userId) {
      // 새로운 방식 (userId만 있는 경우)
      req.user = { id: decoded.userId };
    } else {
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
