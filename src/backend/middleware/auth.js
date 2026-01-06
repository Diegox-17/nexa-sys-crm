const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header and validates it
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

/**
 * Middleware to check if user has admin role
 */
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Administrador' });
    }
    next();
};

/**
 * Middleware to check if user has admin or manager role
 */
const isAdminOrManager = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Administrador o Manager' });
    }
    next();
};

/**
 * Helper function to check if user can manage a target user based on RBAC
 * @param {string} currentUserRole - Role of the user performing the action
 * @param {string} targetUserRole - Role of the user being managed
 * @returns {boolean} - Whether the action is allowed
 */
const canManageUser = (currentUserRole, targetUserRole) => {
    // Admin can manage everyone
    if (currentUserRole === 'admin') return true;

    // Manager can only manage regular users
    if (currentUserRole === 'manager' && targetUserRole === 'user') return true;

    // Otherwise, no permission
    return false;
};

module.exports = {
    authenticateToken,
    isAdmin,
    isAdminOrManager,
    canManageUser
};
