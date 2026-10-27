import auditLogService from '../services/auditLogService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const getAuditLogs = async (req, res) => {
    const { logs, meta } = await auditLogService.getAll(req.query);
    sendSuccess(res, logs, 'Audit logs fetched successfully', 200, meta);
};

export default {
    getAuditLogs
};
