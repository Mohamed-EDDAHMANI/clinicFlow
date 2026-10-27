import AppError from '../utils/AppError.js';

export const notFound = (req, res, next) => {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
    let error = err;

    if (err.type === 'entity.parse.failed') {
        error = new AppError('Invalid JSON body', 400);
    }

    if (err.code === '23505') {
        const field = err.detail?.match(/Key \((.+?)\)/)?.[1] ?? 'value';
        error = new AppError(`${field} already exists`, 409);
    }

    if (err.code === '22P02') {
        error = new AppError('Invalid input value', 400);
    }

    const statusCode = error instanceof AppError ? error.statusCode : 500;

    if (statusCode === 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        message: statusCode === 500 ? 'Internal server error' : error.message,
        ...(error.details && { errors: error.details }),
    });
};
