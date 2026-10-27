import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';

const stamp = Date.now();
const userEmail = `test.user.${stamp}@test.com`;
const adminEmail = `test.admin.${stamp}@test.com`;
const password = 'secret123';

let userToken;
let adminToken;

const login = (email) => request(app).post('/api/auth/login').send({ email, password });

const refreshCookie = (res) => res.headers['set-cookie'].find((cookie) => cookie.startsWith('refreshToken=')).split(';')[0];

before(async () => {
    await request(app).post('/api/auth/register').send({ name: 'Test User', email: userEmail, password });
    await request(app).post('/api/auth/register').send({ name: 'Test Admin', email: adminEmail, password });
    await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [adminEmail]);

    userToken = (await login(userEmail)).body.data.accessToken;
    adminToken = (await login(adminEmail)).body.data.accessToken;
});

after(async () => {
    await db.query('DELETE FROM users WHERE email LIKE $1', [`test.%.${stamp}@test.com`]);
    await db.end();
});

describe('Users', () => {
    it('GET /me returns the connected user without password', async () => {
        const res = await request(app).get('/api/user/me').set('Authorization', `Bearer ${userToken}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.data.email, userEmail);
        assert.equal(res.body.data.password, undefined);
    });

    it('GET /me requires a token', async () => {
        const res = await request(app).get('/api/user/me');
        assert.equal(res.status, 401);
    });

    it('getAll is admin only', async () => {
        const asUser = await request(app).get('/api/user/getAll').set('Authorization', `Bearer ${userToken}`);
        const asAdmin = await request(app).get('/api/user/getAll').set('Authorization', `Bearer ${adminToken}`);
        assert.equal(asUser.status, 403);
        assert.equal(asAdmin.status, 200);
        assert.ok(asAdmin.body.data.every((user) => user.password === undefined));
    });
});

describe('Errors', () => {
    it('unknown route returns JSON 404', async () => {
        const res = await request(app).get('/api/does-not-exist');
        assert.equal(res.status, 404);
        assert.match(res.body.message, /Route not found/);
    });
});
