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

const findById = async (id) => {
    const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM patients WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0];
};

const update = async (id, { full_name, cin, phone, birth_date, address = null }) => {
    const { rows } = await db.query(
        `UPDATE patients SET full_name = $2, cin = $3, phone = $4, birth_date = $5, address = $6
         WHERE id = $1 AND deleted_at IS NULL RETURNING ${PUBLIC_COLUMNS}`,
        [id, full_name, cin, phone, birth_date, address]
    );
    return rows[0];
};

const softDelete = async (id) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const { rowCount } = await client.query(
            'UPDATE patients SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (rowCount > 0) {
            await client.query(
                'UPDATE appointments SET deleted_at = NOW() WHERE patient_id = $1 AND deleted_at IS NULL',
                [id]
            );
        }

        await client.query('COMMIT');
        return rowCount > 0;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export default {
    create,
    findAll,
    findById,
    update,
    softDelete
};
