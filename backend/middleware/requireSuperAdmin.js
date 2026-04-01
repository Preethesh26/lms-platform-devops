// ============================================================
// REQUIRE SUPER ADMIN MIDDLEWARE
// Rejects any request whose JWT does not carry role: "superadmin"
// Must be used after the protect middleware.
//
// Usage: router.use(protect, requireSuperAdmin)
// ============================================================

module.exports = (req, res, next) => {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({
            success: false,
            message: 'Super Admin access required'
        });
    }
    next();
};
