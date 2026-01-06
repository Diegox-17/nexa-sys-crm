const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware to prevent abuse
 * BUG-039 FIX: Increased limits for development environment
 * Original: 100 requests / 15min → New: 1000 requests / 15min
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 for development
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiting for authentication endpoints
 * Prevents brute force attacks
 * BUG-039 FIX: Increased limits for development environment
 * Original: 5 requests / 15min → New: 20 requests / 15min
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Increased from 5 to 20 for development
    message: 'Demasiados intentos de inicio de sesión, por favor intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Rate limiting for API endpoints
 * More generous than auth but still protected
 * BUG-039 FIX: Increased limits for development environment
 * Original: 200 requests / 15min → New: 2000 requests / 15min
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Increased from 200 to 2000 for development
    message: 'Límite de solicitudes API excedido, por favor intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    apiLimiter
};
