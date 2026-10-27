import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, deleteTestUsers, testEmail, uniqueStamp } from './helpers.js';

const stamp = uniqueStamp();
const tag = String(stamp).slice(-8);

let token;
let staffId;

const getStats = (accessToken = token) =>
    request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${accessToken}`);

const insertPatient = async (suffix, deleted = false) => {
    const { rows: [patient] } = await db.query(
        `INSERT INTO patients (full_name, cin, phone, birth_date, deleted_at)
         VALUES ($1, $2, '0612345678', '1990-01-01', $3) RETURNING id`,
        [`Dashboard ${tag}`, `D${tag}${suffix}`, deleted ? new Date() : null]
    );
    return patient.id;
};

const insertAppointment = (patientId, date, status, deleted = false) =>
    db.query(
        `INSERT INTO appointments (patient_id, created_by, appointment_date, status, reason, deleted_at)
         VALUES ($1, $2, ${date}, $3, 'Test', $4)`,
        [patientId, staffId, status, deleted ? new Date() : null]
    );

before(async () => {
    const email = testEmail('dashboard', stamp);
    staffId = await createTestUser(email);
    token = (await login(email)).body.data.accessToken;
});

after(async () => {
    await db.query('DELETE FROM appointments WHERE created_by = $1', [staffId]);
    await db.query('DELETE FROM patients WHERE cin LIKE $1', [`D${tag}%`]);
    await deleteTestUsers(stamp);
    await db.end();
});

describe('GET /api/dashboard/stats', () => {
    it('returns the four counters', async () => {
        const res = await getStats();

        assert.equal(res.status, 200);
        assert.deepEqual(Object.keys(res.body.data).sort(), [
            'confirmed_appointments',
            'pending_appointments',
            'today_appointments',
            'total_patients',
        ]);
        assert.ok(Object.values(res.body.data).every(Number.isInteger));
    });

    it('counts active patients and appointments only', async () => {
        const before = (await getStats()).body.data;

        const patientId = await insertPatient('A');
        await insertPatient('B', true);

        const today = `(NOW() AT TIME ZONE 'Africa/Casablanca')::date::timestamp AT TIME ZONE 'Africa/Casablanca'`;
        await insertAppointment(patientId, `${today} + INTERVAL '9 hours'`, 'pending');
        await insertAppointment(patientId, `${today} + INTERVAL '10 hours'`, 'confirmed');
        await insertAppointment(patientId, `${today} + INTERVAL '11 hours'`, 'cancelled');
        await insertAppointment(patientId, `${today} + INTERVAL '12 hours'`, 'pending', true);
        await insertAppointment(patientId, `${today} + INTERVAL '1 day 9 hours'`, 'confirmed');
        await insertAppointment(patientId, `${today} - INTERVAL '1 minute'`, 'pending');

        const after = (await getStats()).body.data;

        assert.equal(after.total_patients - before.total_patients, 1);
        assert.equal(after.today_appointments - before.today_appointments, 3);
        assert.equal(after.pending_appointments - before.pending_appointments, 2);
        assert.equal(after.confirmed_appointments - before.confirmed_appointments, 2);
    });

    it('requires a token', async () => {
        const res = await request(app).get('/api/dashboard/stats');
        assert.equal(res.status, 401);
    });
});
