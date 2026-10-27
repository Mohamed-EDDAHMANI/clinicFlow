import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, deleteTestUsers, testEmail, uniqueStamp } from './helpers.js';

const stamp = uniqueStamp();
const tag = String(stamp).slice(-8);

let staffId;
let adminId;
let staffToken;
let adminToken;

const as = (token) => ({ Authorization: `Bearer ${token}` });

const getLogs = (query, token = adminToken) =>
    request(app).get('/api/audit-logs').query(query).set(as(token));

before(async () => {
    const staffEmail = testEmail('logs-staff', stamp);
    const adminEmail = testEmail('logs-admin', stamp);
    staffId = await createTestUser(staffEmail);
    adminId = await createTestUser(adminEmail, 'admin');
    staffToken = (await login(staffEmail)).body.data.accessToken;
    adminToken = (await login(adminEmail)).body.data.accessToken;
});

after(async () => {
    await db.query('DELETE FROM appointments WHERE created_by = $1', [staffId]);
    await db.query('DELETE FROM patients WHERE cin LIKE $1', [`L${tag}%`]);
    await db.query('DELETE FROM users WHERE email LIKE $1', [`created.%.${stamp}@test.com`]);
    await deleteTestUsers(stamp);
    await db.end();
});

describe('Audit logs', () => {
    let patientId;
    let appointmentId;

    it('logs the creation of a user without the password', async () => {
        const created = await request(app).post('/api/user/create').set(as(adminToken))
            .send({ name: 'New Staff', email: `created.staff.${stamp}@test.com`, password: 'secret123' });

        const res = await getLogs({ entity_type: 'users', entity_id: created.body.data.userId });
        const [log] = res.body.data;

        assert.equal(log.action, 'CREATE');
        assert.equal(log.user_id, adminId);
        assert.equal(log.new_values.email, `created.staff.${stamp}@test.com`);
        assert.equal(log.new_values.password, undefined);
    });

    it('logs the creation, update and deletion of a patient', async () => {
        const body = { full_name: 'Log Patient', cin: `L${tag}A`, phone: '0612345678', birth_date: '1990-01-01' };
        patientId = (await request(app).post('/api/patients').set(as(staffToken)).send(body)).body.data.id;
        await request(app).put(`/api/patients/${patientId}`).set(as(staffToken)).send({ ...body, phone: '0700000000' });

        const res = await getLogs({ entity_type: 'patients', entity_id: patientId });
        const [update, create] = res.body.data;

        assert.equal(create.action, 'CREATE');
        assert.equal(create.user_id, staffId);
        assert.equal(create.new_values.cin, `L${tag}A`);
        assert.equal(update.action, 'UPDATE');
        assert.equal(update.old_values.phone, '0612345678');
        assert.equal(update.new_values.phone, '0700000000');
    });

    it('logs the creation and status change of an appointment', async () => {
        appointmentId = (await request(app).post('/api/appointments').set(as(staffToken)).send({
            patient_id: patientId,
            appointment_date: '2030-12-01T10:00:00+01:00',
            reason: 'Consultation',
        })).body.data.id;
        await request(app).patch(`/api/appointments/${appointmentId}/status`).set(as(staffToken)).send({ status: 'confirmed' });

        const res = await getLogs({ entity_type: 'appointments', entity_id: appointmentId });
        const [update, create] = res.body.data;

        assert.equal(create.action, 'CREATE');
        assert.equal(create.new_values.status, 'pending');
        assert.deepEqual(update.old_values, { status: 'pending' });
        assert.deepEqual(update.new_values, { status: 'confirmed' });
    });

    it('logs the deletion of a patient', async () => {
        await request(app).delete(`/api/patients/${patientId}`).set(as(adminToken));

        const res = await getLogs({ entity_type: 'patients', entity_id: patientId, action: 'DELETE' });
        const [log] = res.body.data;

        assert.equal(log.user_id, adminId);
        assert.equal(log.old_values.cin, `L${tag}A`);
        assert.equal(log.new_values, null);
    });

    it('does not log failed actions', async () => {
        await request(app).put(`/api/patients/${patientId}`).set(as(staffToken))
            .send({ full_name: 'X Y', cin: `L${tag}B`, phone: '0612345678', birth_date: '1990-01-01' });

        const res = await getLogs({ entity_type: 'patients', entity_id: patientId });
        assert.equal(res.body.meta.total, 3);
    });

    it('returns the author name and pagination meta', async () => {
        const res = await getLogs({ user_id: staffId, limit: 2 });

        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 2);
        assert.equal(res.body.data[0].user_name, 'Test User');
        assert.deepEqual(res.body.meta, { page: 1, limit: 2, total: 4, totalPages: 2 });
    });

    it('is admin only', async () => {
        const res = await getLogs({}, staffToken);
        assert.equal(res.status, 403);
    });

    it('rejects invalid filters', async () => {
        assert.equal((await getLogs({ entity_type: 'products' })).status, 400);
        assert.equal((await getLogs({ action: 'READ' })).status, 400);
        assert.equal((await getLogs({ entity_id: 'abc' })).status, 400);
    });
});
