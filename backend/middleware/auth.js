const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Middleware to accept EITHER a logged-in user OR a test-specific token
exports.protectOrTestToken = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized - No token found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // CASE 1: Standard User Token (has 'id' field)
        if (decoded.id) {
            req.user = await User.findById(decoded.id);
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
        }
        // CASE 2: Test Token (has 'testId' field but no 'id')
        else if (decoded.testId) {
            req.testToken = decoded; // { email, testId, slug, iat, exp }
        }
        else {
            return res.status(401).json({ success: false, message: 'Invalid token structure' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized - Invalid token' });
    }
};
