const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			return res.status(401).json({ message: 'Invalid token user' });
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
};

const authorizeRoles = (...roles) => (req, res, next) => {
	if (!req.user || !roles.includes(req.user.role)) {
		return res.status(403).json({ message: 'Forbidden: insufficient role' });
	}
	return next();
};

module.exports = { authMiddleware, authorizeRoles };
