import { z } from 'zod';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../services/auditLogService.js';

export const listAuditLogsQuerySchema = z.object({
    action: z.enum(Object.values(AUDIT_ACTIONS)).optional(),
    entity_type: z.enum(Object.values(AUDIT_ENTITIES)).optional(),
    entity_id: z.uuid('Invalid entity id').optional(),
    user_id: z.uuid('Invalid user id').optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});
