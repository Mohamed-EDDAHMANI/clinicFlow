import jwt from 'jsonwebtoken';
import AppError from './AppError.js';

const verifyToken = (token, secret, message = 'Invalid or expired token') => {
    try {
        return jwt.verify(token, secret);
    } catch {
        throw new AppError(message, 401);
    }
};

export default verifyToken;
