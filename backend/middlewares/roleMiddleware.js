import { PERMISSIONS } from '../config/permissions.js';
import AppError from '../utils/AppError.js';

export const authorize = (permission) => {
    return (req, res, next) => {
        if (!req.user?.role) {
            return next(new AppError('Not authenticated', 401));
        }

        const allowedRoles = PERMISSIONS[permission];

        if (!allowedRoles) {
            return next(new AppError('Permission not defined', 403));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError('Access denied', 403));
        }

        next();
    };
};
