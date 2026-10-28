import db from '../config/db.js';
import { CLINIC_TIMEZONE } from '../config/clinic.js';

const TODAY = `(NOW() AT TIME ZONE '${CLINIC_TIMEZONE}')::date`;
const TODAY_START = `(${TODAY}::timestamp AT TIME ZONE '${CLINIC_TIMEZONE}')`;
const TOMORROW_START = `((${TODAY} + 1)::timestamp AT TIME ZONE '${CLINIC_TIMEZONE}')`;

const getStats = async () => {
    const { rows } = await db.query(
        `SELECT
            to_char(${TODAY}, 'YYYY-MM-DD') AS today,
            (SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL)::int AS total_patients,
            COUNT(*) FILTER (WHERE appointment_date >= ${TODAY_START} AND appointment_date < ${TOMORROW_START})::int AS today_appointments,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_appointments,
            COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed_appointments,
            COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_appointments
         FROM appointments
         WHERE deleted_at IS NULL`
    );
    return rows[0];
};

export default {
    getStats
};
