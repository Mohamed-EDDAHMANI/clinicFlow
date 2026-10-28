import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, deleteTestUsers, testEmail, uniqueStamp } from './helpers.js';

const stamp = uniqueStamp();
const tag = String(stamp).slice(-8);
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

let token;
let staffId;
let patientId;
let otherPatientId;
let deletedPatientId;

const insertPatient = async (suffix) => {
    const { rows: [patient] } = await db.query(
        `INSERT INTO patients (full_name, cin, phone, birth_date) VALUES ($1, $2, '0612345678', '1990-01-01') RETURNING id`,
        [`Patient ${tag} ${suffix}`, `A${tag}${suffix}`]
    );
    return patient.id;
};

const validAppointment = (overrides = {}) => ({
    patient_id: patientId,
    appointment_date: '2030-11-12T10:00:00+01:00',
    reason: 'Consultation générale',
    ...overrides,
});

const createAppointment = (body) =>
    request(app).post('/api/appointments').set('Authorization', `Bearer ${token}`).send(body);

const listAppointments = (query) =>
    request(app).get('/api/appointments').query(query).set('Authorization', `Bearer ${token}`);

const updateStatus = (id, status) =>
    request(app).patch(`/api/appointments/${id}/status`).set('Authorization', `Bearer ${token}`).send({ status });

before(async () => {
    const email = testEmail('appointments', stamp);
    staffId = await createTestUser(email);
    token = (await login(email)).body.data.accessToken;

    patientId = await insertPatient('A');
    otherPatientId = await insertPatient('B');
    deletedPatientId = await insertPatient('C');
    await db.query('UPDATE patients SET deleted_at = NOW() WHERE id = $1', [deletedPatientId]);
});

after(async () => {
    await db.query('DELETE FROM appointments WHERE created_by = $1', [staffId]);
    await db.query('DELETE FROM patients WHERE cin LIKE $1', [`A${tag}%`]);
    await deleteTestUsers(stamp);
    await db.end();
});

describe('POST /api/appointments', () => {
    it('creates a pending appointment for the connected user', async () => {
        const res = await createAppointment(validAppointment({ notes: 'Apporter les analyses' }));

        assert.equal(res.status, 201);
        assert.equal(res.body.data.status, 'pending');
        assert.equal(res.body.data.created_by, staffId);
        assert.equal(res.body.data.patient_id, patientId);
        assert.equal(res.body.data.patient_name, `Patient ${tag} A`);
        assert.equal(new Date(res.body.data.appointment_date).toISOString(), '2030-11-12T09:00:00.000Z');
        const { rows: [expected] } = await db.query(
            `SELECT to_char($1::timestamptz AT TIME ZONE 'Africa/Casablanca', 'HH24:MI') AS time`,
            ['2030-11-12T09:00:00Z']
        );
        assert.equal(res.body.data.local_date, '2030-11-12');
        assert.equal(res.body.data.local_time, expected.time);
    });

    it('ignores created_by sent in the body', async () => {
        const res = await createAppointment(validAppointment({ appointment_date: '2030-11-12T15:00:00+01:00', created_by: UNKNOWN_ID }));
        assert.equal(res.status, 201);
        assert.equal(res.body.data.created_by, staffId);
    });

    it('rejects an unknown or deleted patient', async () => {
        assert.equal((await createAppointment(validAppointment({ patient_id: UNKNOWN_ID }))).status, 404);
        assert.equal((await createAppointment(validAppointment({ patient_id: deletedPatientId }))).status, 404);
    });

    it('rejects an invalid body', async () => {
        const res = await createAppointment({ patient_id: 'abc', appointment_date: '2030-11-12', status: 'done' });
        assert.equal(res.status, 400);
        assert.deepEqual(res.body.errors.map((e) => e.field).sort(), ['appointment_date', 'patient_id', 'reason', 'status']);
    });

    it('reads a date without timezone in the clinic timezone', async () => {
        const res = await createAppointment(validAppointment({ appointment_date: '2030-11-14T09:45' }));
        assert.equal(res.status, 201);
        assert.equal(res.body.data.local_date, '2030-11-14');
        assert.equal(res.body.data.local_time, '09:45');
    });

    it('rejects a date without time', async () => {
        const res = await createAppointment(validAppointment({ appointment_date: '2030-11-14' }));
        assert.equal(res.status, 400);
    });

    it('rejects two confirmed appointments within 30 minutes', async () => {
        const first = await createAppointment(validAppointment({ appointment_date: '2030-11-13T10:00:00+01:00', status: 'confirmed' }));
        const second = await createAppointment(validAppointment({ appointment_date: '2030-11-13T10:20:00+01:00', status: 'confirmed' }));

        assert.equal(first.status, 201);
        assert.equal(second.status, 409);
        assert.equal(second.body.message, 'Patient already has a confirmed appointment within 30 minutes');
    });

    it('allows a confirmed appointment 30 minutes later', async () => {
        const res = await createAppointment(validAppointment({ appointment_date: '2030-11-13T10:30:00+01:00', status: 'confirmed' }));
        assert.equal(res.status, 201);
    });

    it('allows a pending appointment in the same window', async () => {
        const res = await createAppointment(validAppointment({ appointment_date: '2030-11-13T10:10:00+01:00' }));
        assert.equal(res.status, 201);
    });

    it('allows another patient at the same time', async () => {
        const res = await createAppointment(validAppointment({ patient_id: otherPatientId, appointment_date: '2030-11-13T10:00:00+01:00', status: 'confirmed' }));
        assert.equal(res.status, 201);
    });

    it('requires a token', async () => {
        const res = await request(app).post('/api/appointments').send(validAppointment());
        assert.equal(res.status, 401);
    });
});

describe('GET /api/appointments', () => {
    let dayStart;
    const at = (minutes) => new Date(dayStart.getTime() + minutes * 60 * 1000).toISOString();

    before(async () => {
        const { rows: [row] } = await db.query(`SELECT ('2030-11-20'::date::timestamp AT TIME ZONE 'Africa/Casablanca') AS start`);
        dayStart = row.start;

        await createAppointment(validAppointment({ appointment_date: at(-10) }));
        await createAppointment(validAppointment({ appointment_date: at(30), status: 'confirmed' }));
        await createAppointment(validAppointment({ appointment_date: at(12 * 60), status: 'cancelled' }));
        await createAppointment(validAppointment({ appointment_date: at(23 * 60 + 50) }));
        await createAppointment(validAppointment({ appointment_date: at(24 * 60) }));
    });

    it('filters by day in the clinic timezone', async () => {
        const res = await listAppointments({ date: '2030-11-20' });

        assert.equal(res.status, 200);
        assert.deepEqual(
            res.body.data.map((a) => new Date(a.appointment_date).toISOString()),
            [at(30), at(12 * 60), at(23 * 60 + 50)]
        );
    });

    it('filters by date and status', async () => {
        const res = await listAppointments({ date: '2030-11-20', status: 'cancelled' });
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].status, 'cancelled');
    });

    it('includes the patient name and cin', async () => {
        const res = await listAppointments({ date: '2030-11-20' });
        assert.equal(res.body.data[0].patient_name, `Patient ${tag} A`);
        assert.equal(res.body.data[0].patient_cin, `A${tag}A`);
    });

    it('hides soft-deleted appointments', async () => {
        await db.query('UPDATE appointments SET deleted_at = NOW() WHERE created_by = $1 AND appointment_date = $2', [staffId, at(12 * 60)]);
        const res = await listAppointments({ date: '2030-11-20' });
        assert.equal(res.body.data.length, 2);
    });

    it('rejects an invalid date or status', async () => {
        assert.equal((await listAppointments({ date: '20-11-2030' })).status, 400);
        assert.equal((await listAppointments({ status: 'done' })).status, 400);
    });

    it('requires a token', async () => {
        const res = await request(app).get('/api/appointments');
        assert.equal(res.status, 401);
    });
});

describe('PATCH /api/appointments/:id/status', () => {
    let pendingId;

    before(async () => {
        await createAppointment(validAppointment({ appointment_date: '2030-11-25T09:00:00+01:00', status: 'confirmed' }));
        pendingId = (await createAppointment(validAppointment({ appointment_date: '2030-11-25T09:15:00+01:00' }))).body.data.id;
    });

    it('rejects confirming inside the 30 minutes window', async () => {
        const res = await updateStatus(pendingId, 'confirmed');
        assert.equal(res.status, 409);
    });

    it('updates the status', async () => {
        const res = await updateStatus(pendingId, 'cancelled');
        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, 'cancelled');
        assert.equal(res.body.data.patient_name, `Patient ${tag} A`);
    });

    it('rejects an invalid status', async () => {
        const res = await updateStatus(pendingId, 'done');
        assert.equal(res.status, 400);
    });

    it('returns 404 for an unknown id', async () => {
        const res = await updateStatus(UNKNOWN_ID, 'confirmed');
        assert.equal(res.status, 404);
    });

    it('returns 400 for an invalid id', async () => {
        const res = await updateStatus('abc', 'confirmed');
        assert.equal(res.status, 400);
    });
});
