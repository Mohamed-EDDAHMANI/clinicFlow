import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, refreshCookie, deleteTestUsers, testEmail, uniqueStamp } from './helpers.js';

const stamp = uniqueStamp();
const staffEmail = testEmail('staff', stamp);
const deletedEmail = testEmail('deleted', stamp);

before(async () => {
    await createTestUser(staffEmail);
    await createTestUser(deletedEmail);
    await db.query('UPDATE users SET deleted_at = NOW() WHERE email = $1', [deletedEmail]);
});

after(async () => {
    await deleteTestUsers(stamp);
    await db.end();
});

describe('POST /api/auth/login', () => {
    it('returns an access token, the user and a refresh cookie', async () => {
        const res = await login(staffEmail);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.data.accessToken);
        assert.deepEqual(Object.keys(res.body.data.user).sort(), ['email', 'full_name', 'id', 'role']);
        assert.equal(res.body.data.user.role, 'staff');
        assert.ok(refreshCookie(res));
    });

    it('accepts the email in uppercase', async () => {
        const res = await login(staffEmail.toUpperCase());
        assert.equal(res.status, 200);
    });

    it('rejects a wrong password', async () => {
        const res = await login(staffEmail, 'wrong-password');
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    it('rejects an unknown email', async () => {
        const res = await login(testEmail('unknown', stamp));
        assert.equal(res.status, 401);
    });

    it('rejects a soft-deleted user', async () => {
        const res = await login(deletedEmail);
        assert.equal(res.status, 401);
    });

    it('rejects an invalid body', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'abc' });
        assert.equal(res.status, 400);
        assert.deepEqual(res.body.errors.map((e) => e.field).sort(), ['email', 'password']);
    });
});

describe('GET /api/auth/me', () => {
    it('returns the connected user without password', async () => {
        const token = (await login(staffEmail)).body.data.accessToken;
        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

        assert.equal(res.status, 200);
        assert.equal(res.body.data.email, staffEmail);
        assert.equal(res.body.data.password, undefined);
    });

    it('requires a token', async () => {
        const res = await request(app).get('/api/auth/me');
        assert.equal(res.status, 401);
    });

    it('rejects an invalid token', async () => {
        const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid.token.value');
        assert.equal(res.status, 401);
    });
});

describe('POST /api/auth/refresh', () => {
    it('requires the refresh cookie', async () => {
        const res = await request(app).post('/api/auth/refresh');
        assert.equal(res.status, 401);
    });

    it('rotates the token and detects reuse', async () => {
        const oldCookie = refreshCookie(await login(staffEmail));

        const first = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
        assert.equal(first.status, 200);
        assert.ok(first.body.data.accessToken);
        assert.equal(first.body.data.user.email, staffEmail);
        const newCookie = refreshCookie(first);

        const reused = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
        assert.equal(reused.status, 401);

        const afterReuse = await request(app).post('/api/auth/refresh').set('Cookie', newCookie);
        assert.equal(afterReuse.status, 401);
    });

    it('keeps sessions on two devices', async () => {
        const deviceA = refreshCookie(await login(staffEmail));
        const deviceB = refreshCookie(await login(staffEmail));

        assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', deviceA)).status, 200);
        assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', deviceB)).status, 200);
    });

    it('rejects a user deleted after login', async () => {
        const email = testEmail('deleted-later', stamp);
        await createTestUser(email);
        const cookie = refreshCookie(await login(email));
        await db.query('UPDATE users SET deleted_at = NOW() WHERE email = $1', [email]);

        const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
        assert.equal(res.status, 401);
    });
});

describe('POST /api/auth/logout', () => {
    it('revokes the refresh token', async () => {
        const cookie = refreshCookie(await login(staffEmail));

        assert.equal((await request(app).post('/api/auth/logout').set('Cookie', cookie)).status, 200);
        assert.equal((await request(app).post('/api/auth/refresh').set('Cookie', cookie)).status, 401);
    });
});
