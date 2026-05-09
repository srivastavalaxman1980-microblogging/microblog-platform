const jwt = require('jsonwebtoken');
const { User, ApiKey } = require('../models');
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // Check for JWT in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      
      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      req.user = user;
      req.authMethod = 'jwt';
      return next();
    }
    
    // Check for API key
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      const keyRecord = await ApiKey.findOne({
        where: { key_hash: require('crypto').createHash('sha256').update(apiKey).digest('hex') },
        include: [{ model: User, as: 'user' }]
      });
      
      if (!keyRecord || !keyRecord.is_active) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      // Update last used timestamp
      await keyRecord.update({ last_used_at: new Date() });
      
      req.user = keyRecord.user;
      req.authMethod = 'api_key';
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { authMiddleware, requireRole };