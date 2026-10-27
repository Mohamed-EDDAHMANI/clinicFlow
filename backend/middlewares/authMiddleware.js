import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import verifyToken from '../utils/verifyToken.js';

const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw new AppError('No access token', 401);
    }

    req.user = verifyToken(header.split(' ')[1], env.ACCESS_TOKEN_SECRET, 'Invalid or expired access token');
    next();
};

export default authenticate;
