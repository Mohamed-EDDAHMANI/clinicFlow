import db from '../config/db.js';

const PUBLIC_COLUMNS = 'id, full_name, cin, phone, birth_date::text AS birth_date, address, created_at, updated_at';

const SEARCH_FILTER = 'deleted_at IS NULL AND (full_name ILIKE $1 OR cin ILIKE $1)';

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const create = async ({ full_name, cin, phone, birth_date, address = null }) => {
    const { rows } = await db.query(
        `INSERT INTO patients (full_name, cin, phone, birth_date, address) VALUES ($1, $2, $3, $4, $5) RETURNING ${PUBLIC_COLUMNS}`,
        [full_name, cin, phone, birth_date, address]
    );
    return rows[0];
};

const findAll = async ({ search, limit, offset }) => {
    const pattern = `%${escapeLike(search)}%`;

    const [{ rows }, { rows: [{ total }] }] = await Promise.all([
        db.query(
            `SELECT ${PUBLIC_COLUMNS} FROM patients WHERE ${SEARCH_FILTER} ORDER BY created_at DESC, id LIMIT $2 OFFSET $3`,
            [pattern, limit, offset]
        ),
        db.query(`SELECT COUNT(*)::int AS total FROM patients WHERE ${SEARCH_FILTER}`, [pattern]),
    ]);

    return { patients: rows, total };
};

export default {
    create,
    findAll
};
