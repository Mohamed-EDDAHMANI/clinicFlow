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

    if (err.code === '23P01') {
        error = new AppError('Patient already has a confirmed appointment within 30 minutes', 409);
    }

    if (err.code === '23503') {
        error = err.detail?.includes('is still referenced')
            ? new AppError('Resource is still referenced', 409)
            : new AppError('Related resource not found', 400);
    }

    if (err.code === '23502') {
        error = new AppError(`${err.column ?? 'field'} is required`, 400);
    }

    if (err.code === '22007' || err.code === '22008') {
        error = new AppError('Invalid date', 400);
    }

    const statusCode = error instanceof AppError ? error.statusCode : 500;

    if (statusCode === 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal server error' : error.message,
        ...(error.details && { errors: error.details }),
    });
};
