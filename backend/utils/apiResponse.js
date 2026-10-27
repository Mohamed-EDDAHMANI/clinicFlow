export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, meta) => {
    res.status(statusCode).json({ success: true, message, data, ...(meta && { meta }) });
};
