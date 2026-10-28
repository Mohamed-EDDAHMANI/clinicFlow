import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, deleteTestUsers, testEmail, uniqueStamp } from './helpers.js';

const stamp = uniqueStamp();
const tag = String(stamp).slice(-8);
const nameTag = tag.replace(/\d/g, (digit) => 'abcdefghij'[digit]);
const cin = (suffix) => `T${tag}${suffix}`;

let token;
let adminToken;
let staffId;

const validPatient = (overrides = {}) => ({
    full_name: `Patient ${nameTag}`,
    cin: cin('A'),
    phone: '0612345678',
    birth_date: '1990-05-20',
    address: '12 Rue Ibn Sina, Rabat',
    ...overrides,
});

const createPatient = (body) =>
    request(app).post('/api/patients').set('Authorization', `Bearer ${token}`).send(body);

const listPatients = (query) =>
    request(app).get('/api/patients').query(query).set('Authorization', `Bearer ${token}`);

const getPatient = (id) =>
    request(app).get(`/api/patients/${id}`).set('Authorization', `Bearer ${token}`);

const updatePatient = (id, body) =>
    request(app).put(`/api/patients/${id}`).set('Authorization', `Bearer ${token}`).send(body);

const deletePatient = (id, accessToken = adminToken) =>
    request(app).delete(`/api/patients/${id}`).set('Authorization', `Bearer ${accessToken}`);

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

before(async () => {
    const email = testEmail('patients', stamp);
    const adminEmail = testEmail('patients-admin', stamp);
    staffId = await createTestUser(email);
    await createTestUser(adminEmail, 'admin');
    token = (await login(email)).body.data.accessToken;
    adminToken = (await login(adminEmail)).body.data.accessToken;
});

after(async () => {
    await db.query('DELETE FROM appointments WHERE created_by = $1', [staffId]);
    await db.query('DELETE FROM patients WHERE cin LIKE $1', [`T${tag}%`]);
    await deleteTestUsers(stamp);
    await db.end();
});

describe('POST /api/patients', () => {
    it('creates a patient', async () => {
        const res = await createPatient(validPatient({ cin: ` ${cin('a').toLowerCase()} `, address: undefined }));

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.ok(res.body.data.id);
        assert.equal(res.body.data.cin, cin('A'));
        assert.equal(res.body.data.birth_date, '1990-05-20');
        assert.equal(res.body.data.address, null);
    });

    it('rejects a duplicate cin', async () => {
        const res = await createPatient(validPatient());
        assert.equal(res.status, 409);
        assert.equal(res.body.success, false);
    });

    it('rejects a full name with digits', async () => {
        const res = await createPatient(validPatient({ full_name: 'Karim Tazi22', cin: cin('Z') }));
        assert.equal(res.status, 400);
        assert.deepEqual(res.body.errors.map((e) => e.field), ['full_name']);
    });

    it('accepts accents, hyphens and apostrophes in the full name', async () => {
        const res = await createPatient(validPatient({ full_name: "Aïcha El-Fassi O'Neil", cin: cin('Y') }));
        assert.equal(res.status, 201);
        await db.query('DELETE FROM patients WHERE id = $1', [res.body.data.id]);
    });

    it('rejects missing required fields', async () => {
        const res = await createPatient({ full_name: 'X' });
        assert.equal(res.status, 400);
        assert.deepEqual(res.body.errors.map((e) => e.field).sort(), ['birth_date', 'cin', 'full_name', 'phone']);
    });

    it('rejects a birth date in the future', async () => {
        const res = await createPatient(validPatient({ cin: cin('F'), birth_date: '2999-01-01' }));
        assert.equal(res.status, 400);
        assert.equal(res.body.errors[0].field, 'birth_date');
    });

    it('requires a token', async () => {
        const res = await request(app).post('/api/patients').send(validPatient({ cin: cin('N') }));
        assert.equal(res.status, 401);
    });
});

describe('GET /api/patients', () => {
    before(async () => {
        for (const suffix of ['B', 'C', 'D', 'E']) {
            await createPatient(validPatient({ cin: cin(suffix), full_name: `Patient ${nameTag} ${suffix}` }));
        }
    });

    it('returns a page with pagination meta', async () => {
        const res = await listPatients({ search: tag, page: 1, limit: 2 });

        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 2);
        assert.deepEqual(res.body.meta, { page: 1, limit: 2, total: 5, totalPages: 3 });
    });

    it('returns different patients on each page', async () => {
        const pages = await Promise.all([1, 2, 3].map((page) => listPatients({ search: tag, page, limit: 2 })));
        const ids = pages.flatMap((res) => res.body.data.map((patient) => patient.id));

        assert.equal(ids.length, 5);
        assert.equal(new Set(ids).size, 5);
    });

    it('searches by full name', async () => {
        const res = await listPatients({ search: `patient ${nameTag} c` });
        assert.equal(res.body.meta.total, 1);
        assert.equal(res.body.data[0].cin, cin('C'));
    });

    it('searches by cin', async () => {
        const res = await listPatients({ search: cin('D').toLowerCase() });
        assert.equal(res.body.meta.total, 1);
        assert.equal(res.body.data[0].cin, cin('D'));
    });

    it('treats % in the search as a normal character', async () => {
        const res = await listPatients({ search: `${tag}%` });
        assert.equal(res.body.meta.total, 0);
    });

    it('hides soft-deleted patients', async () => {
        await db.query('UPDATE patients SET deleted_at = NOW() WHERE cin = $1', [cin('E')]);
        const res = await listPatients({ search: tag });
        assert.equal(res.body.meta.total, 4);
    });

    it('uses default page and limit', async () => {
        const res = await listPatients({});
        assert.equal(res.body.meta.page, 1);
        assert.equal(res.body.meta.limit, 10);
    });

    it('rejects an invalid page or limit', async () => {
        assert.equal((await listPatients({ page: 0 })).status, 400);
        assert.equal((await listPatients({ limit: 500 })).status, 400);
    });

    it('requires a token', async () => {
        const res = await request(app).get('/api/patients');
        assert.equal(res.status, 401);
    });
});

describe('GET /api/patients/:id', () => {
    let patientId;

    before(async () => {
        patientId = (await createPatient(validPatient({ cin: cin('G') }))).body.data.id;
    });

    it('returns the patient', async () => {
        const res = await getPatient(patientId);
        assert.equal(res.status, 200);
        assert.equal(res.body.data.id, patientId);
        assert.equal(res.body.data.cin, cin('G'));
    });

    it('returns 404 for an unknown id', async () => {
        const res = await getPatient(UNKNOWN_ID);
        assert.equal(res.status, 404);
    });

    it('returns 400 for an invalid id', async () => {
        const res = await getPatient('abc');
        assert.equal(res.status, 400);
        assert.equal(res.body.errors[0].field, 'id');
    });
});

describe('PUT /api/patients/:id', () => {
    let patientId;

    before(async () => {
        patientId = (await createPatient(validPatient({ cin: cin('U') }))).body.data.id;
    });

    it('updates the patient', async () => {
        const res = await updatePatient(patientId, validPatient({
            full_name: `Updated ${nameTag}`,
            cin: cin('v').toLowerCase(),
            phone: '0700000000',
            birth_date: '1991-01-01',
            address: null,
        }));

        assert.equal(res.status, 200);
        assert.equal(res.body.data.full_name, `Updated ${nameTag}`);
        assert.equal(res.body.data.cin, cin('V'));
        assert.equal(res.body.data.birth_date, '1991-01-01');
        assert.equal(res.body.data.address, null);
        assert.notEqual(res.body.data.updated_at, res.body.data.created_at);
    });

    it('rejects a cin used by another patient', async () => {
        await createPatient(validPatient({ cin: cin('W') }));
        const res = await updatePatient(patientId, validPatient({ cin: cin('W') }));
        assert.equal(res.status, 409);
    });

    it('rejects an invalid body', async () => {
        const res = await updatePatient(patientId, { full_name: 'Only name' });
        assert.equal(res.status, 400);
    });

    it('returns 404 for an unknown id', async () => {
        const res = await updatePatient(UNKNOWN_ID, validPatient({ cin: cin('X') }));
        assert.equal(res.status, 404);
    });
});

describe('DELETE /api/patients/:id', () => {
    let patientId;

    before(async () => {
        patientId = (await createPatient(validPatient({ cin: cin('R') }))).body.data.id;
        await db.query(
            `INSERT INTO appointments (patient_id, created_by, appointment_date, status, reason)
             VALUES ($1, $2, NOW() + INTERVAL '1 day', 'confirmed', 'Test'), ($1, $2, NOW() + INTERVAL '2 days', 'pending', 'Test')`,
            [patientId, staffId]
        );
    });

    it('is admin only', async () => {
        const res = await deletePatient(patientId, token);
        assert.equal(res.status, 403);
    });

    it('soft deletes the patient and his appointments', async () => {
        const res = await deletePatient(patientId);
        assert.equal(res.status, 200);

        const { rows: [patient] } = await db.query('SELECT deleted_at FROM patients WHERE id = $1', [patientId]);
        assert.ok(patient.deleted_at);

        const { rows } = await db.query('SELECT deleted_at FROM appointments WHERE patient_id = $1', [patientId]);
        assert.equal(rows.length, 2);
        assert.ok(rows.every((appointment) => appointment.deleted_at));
    });

    it('hides the deleted patient', async () => {
        assert.equal((await getPatient(patientId)).status, 404);
        assert.equal((await updatePatient(patientId, validPatient({ cin: cin('R') }))).status, 404);
        assert.equal((await deletePatient(patientId)).status, 404);
    });

    it('allows reusing the cin of a deleted patient', async () => {
        const res = await createPatient(validPatient({ cin: cin('R') }));
        assert.equal(res.status, 201);
    });
});
