import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, deleteTestUsers, testEmail, uniqueStamp } from './helpers.js';

const stamp = uniqueStamp();
const tag = String(stamp).slice(-8);
const cin = (suffix) => `T${tag}${suffix}`;

let token;

const validPatient = (overrides = {}) => ({
    full_name: `Patient ${tag}`,
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

before(async () => {
    const email = testEmail('patients', stamp);
    await createTestUser(email);
    token = (await login(email)).body.data.accessToken;
});

after(async () => {
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
            await createPatient(validPatient({ cin: cin(suffix), full_name: `Patient ${tag} ${suffix}` }));
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
        const res = await listPatients({ search: `patient ${tag} c` });
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
