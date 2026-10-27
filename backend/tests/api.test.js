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

describe('Auth', () => {
    it('register returns userId', async () => {
        const email = `test.register.${stamp}@test.com`;
        const res = await request(app).post('/api/auth/register').send({ name: 'Reg', email, password });
        assert.equal(res.status, 201);
        assert.equal(typeof res.body.data.userId, 'string');
    });

    it('register rejects invalid body', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: 'abc', password: '1' });
        assert.equal(res.status, 400);
        assert.deepEqual(res.body.errors.map((e) => e.field).sort(), ['email', 'name', 'password']);
    });

    it('register rejects existing email (case insensitive)', async () => {
        const res = await request(app).post('/api/auth/register').send({ name: 'Dup', email: userEmail.toUpperCase(), password });
        assert.equal(res.status, 409);
    });

    it('login rejects wrong password', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: userEmail, password: 'wrong-pass' });
        assert.equal(res.status, 401);
    });

    it('login returns access token and refresh cookie', async () => {
        const res = await login(userEmail);
        assert.equal(res.status, 200);
        assert.ok(res.body.data.accessToken);
        assert.ok(refreshCookie(res));
    });

    it('refresh rotates the token and detects reuse', async () => {
        const oldCookie = refreshCookie(await login(userEmail));

        const first = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
        assert.equal(first.status, 200);
        const newCookie = refreshCookie(first);

        const reused = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
        assert.equal(reused.status, 401);

        const afterReuse = await request(app).post('/api/auth/refresh').set('Cookie', newCookie);
        assert.equal(afterReuse.status, 401);
    });

    it('keeps sessions on two devices', async () => {
        const deviceA = refreshCookie(await login(userEmail));
        const deviceB = refreshCookie(await login(userEmail));

        assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', deviceA)).status, 200);
        assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', deviceB)).status, 200);
    });

    it('logout revokes the refresh token', async () => {
        const cookie = refreshCookie(await login(userEmail));
        assert.equal((await request(app).post('/api/auth/logout').set('Cookie', cookie)).status, 200);
        assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', cookie)).status, 401);
    });
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
