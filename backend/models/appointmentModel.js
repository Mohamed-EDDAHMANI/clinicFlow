import db from '../config/db.js';
import { CLINIC_TIMEZONE } from '../config/clinic.js';

const PUBLIC_COLUMNS = `a.id, a.patient_id, p.full_name AS patient_name, p.cin AS patient_cin, a.created_by,
    a.appointment_date,
    to_char(a.appointment_date AT TIME ZONE '${CLINIC_TIMEZONE}', 'YYYY-MM-DD') AS local_date,
    to_char(a.appointment_date AT TIME ZONE '${CLINIC_TIMEZONE}', 'HH24:MI') AS local_time,
    a.status, a.reason, a.notes, a.created_at, a.updated_at`;

const CLINIC_DATETIME = `CASE WHEN $3::text ~ '(Z|[+-][0-9]{2}(:?[0-9]{2})?)$'
    THEN $3::text::timestamptz
    ELSE $3::text::timestamp AT TIME ZONE '${CLINIC_TIMEZONE}' END`;

const create = async ({ patient_id, created_by, appointment_date, status, reason, notes = null }) => {
    const { rows } = await db.query(
        `WITH a AS (
            INSERT INTO appointments (patient_id, created_by, appointment_date, status, reason, notes)
            VALUES ($1, $2, ${CLINIC_DATETIME}, $4, $5, $6)
            RETURNING *
        )
        SELECT ${PUBLIC_COLUMNS} FROM a JOIN patients p ON p.id = a.patient_id`,
        [patient_id, created_by, appointment_date, status, reason, notes]
    );
    return rows[0];
};

const findAll = async ({ date, status }) => {
    const conditions = ['a.deleted_at IS NULL'];
    const values = [];

    if (date) {
        values.push(date);
        conditions.push(
            `a.appointment_date >= ($${values.length}::date::timestamp AT TIME ZONE '${CLINIC_TIMEZONE}')`,
            `a.appointment_date < (($${values.length}::date + 1)::timestamp AT TIME ZONE '${CLINIC_TIMEZONE}')`
        );
    }

    if (status) {
        values.push(status);
        conditions.push(`a.status = $${values.length}`);
    }

    const { rows } = await db.query(
        `SELECT ${PUBLIC_COLUMNS} FROM appointments a JOIN patients p ON p.id = a.patient_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY a.appointment_date, a.id`,
        values
    );
    return rows;
};

const findById = async (id) => {
    const { rows } = await db.query(
        `SELECT ${PUBLIC_COLUMNS} FROM appointments a JOIN patients p ON p.id = a.patient_id
         WHERE a.id = $1 AND a.deleted_at IS NULL`,
        [id]
    );
    return rows[0];
};

const updateStatus = async (id, status) => {
    const { rows } = await db.query(
        `WITH a AS (
            UPDATE appointments SET status = $2
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        )
        SELECT ${PUBLIC_COLUMNS} FROM a JOIN patients p ON p.id = a.patient_id`,
        [id, status]
    );
    return rows[0];
};

export default {
    create,
    findAll,
    findById,
    updateStatus
};
