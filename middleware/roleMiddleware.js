// Allow both admin and superadmin roles
exports.adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({
            message: 'Only admin can perform this action'
        });
    }
    next();
};

// Only superadmin
exports.superAdminOnly = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({
            message: 'Only superadmin can perform this action'
        });
    }
    next();
};