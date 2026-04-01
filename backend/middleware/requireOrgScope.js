// ============================================================
// REQUIRE ORG SCOPE MIDDLEWARE
// Extracts organizationId from the JWT (set by protect middleware)
// and attaches it to req.organizationId.
// Rejects requests with no organizationId claim with HTTP 403.
//
// Usage: router.use(protect, requireOrgScope)
// ============================================================

module.exports = (req, res, next) => {
    // req.user is set by the protect middleware
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Super admins bypass org scope — they have cross-org access
    if (req.user.role === 'superadmin') {
        return next();
    }

    // For org admins and users, organizationId must be present in the JWT
    if (!req.user.organizationId) {
        return res.status(403).json({
            success: false,
            message: 'Organization scope required'
        });
    }

    // Attach to request for use in controllers
    req.organizationId = req.user.organizationId;
    next();
};
