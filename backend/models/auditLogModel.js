import db from '../config/db.js';

const create = async ({ user_id, action, entity_type, entity_id, old_values = null, new_values = null }) => {
    await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, action, entity_type, entity_id, old_values, new_values]
    );
};

const findAll = async ({ action, entity_type, entity_id, user_id, limit, offset }) => {
    const conditions = [];
    const values = [];

    for (const [column, value] of Object.entries({ action, entity_type, entity_id, user_id })) {
        if (value) {
            values.push(value);
            conditions.push(`l.${column} = $${values.length}`);
        }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ rows }, { rows: [{ total }] }] = await Promise.all([
        db.query(
            `SELECT l.id, l.user_id, u.full_name AS user_name, u.email AS user_email, l.action, l.entity_type,
                    l.entity_id, l.old_values, l.new_values, l.created_at
             FROM audit_logs l LEFT JOIN users u ON u.id = l.user_id
             ${where}
             ORDER BY l.created_at DESC, l.id
             LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            [...values, limit, offset]
        ),
        db.query(`SELECT COUNT(*)::int AS total FROM audit_logs l ${where}`, values),
    ]);

    return { logs: rows, total };
};

export default {
    create,
    findAll
};
