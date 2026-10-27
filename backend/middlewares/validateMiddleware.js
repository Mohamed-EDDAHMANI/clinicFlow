import AppError from '../utils/AppError.js';

export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source] ?? {});

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));
            return next(new AppError('Validation failed', 400, errors));
        }

        Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
        next();
    };
};
