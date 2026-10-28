import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

export const apiLimiter = rateLimit({
    windowMs: 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (req, res, next) => {
        next(new AppError('Too many requests per second, please slow down', 429));
    },
});

export const loginLimiter = rateLimit({
    windowMs: 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (req, res, next) => {
        next(new AppError('Too many login attempts per second, please slow down', 429));
    },
});
