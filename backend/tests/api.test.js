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
let productId;

const login = (email) => request(app).post('/api/auth/login').send({ email, password });

const refreshCookie = (res) => res.headers['set-cookie'].find((cookie) => cookie.startsWith('refreshToken=')).split(';')[0];

before(async () => {
    await request(app).post('/api/auth/register').send({ name: 'Test User', email: userEmail, password });
    await request(app).post('/api/auth/register').send({ name: 'Test Admin', email: adminEmail, password });
    await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [adminEmail]);

    userToken = (await login(userEmail)).body.accessToken;
    adminToken = (await login(adminEmail)).body.accessToken;
});

after(async () => {
    await db.query('DELETE FROM users WHERE email LIKE $1', [`test.%.${stamp}@test.com`]);
    if (productId) await db.query('DELETE FROM products WHERE id = $1', [productId]);
    await db.end();
});

describe('Auth', () => {
    it('register returns userId', async () => {
        const email = `test.register.${stamp}@test.com`;
        const res = await request(app).post('/api/auth/register').send({ name: 'Reg', email, password });
        assert.equal(res.status, 201);
        assert.equal(typeof res.body.userId, 'number');
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
        assert.ok(res.body.accessToken);
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
        assert.equal(res.body.user.email, userEmail);
        assert.equal(res.body.user.password, undefined);
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
        assert.ok(asAdmin.body.users.every((user) => user.password === undefined));
    });
});

describe('Products', () => {
    it('user cannot create a product', async () => {
        const res = await request(app).post('/api/product/create').set('Authorization', `Bearer ${userToken}`).send({ name: 'Nope', price: 10 });
        assert.equal(res.status, 403);
    });

    it('rejects invalid product', async () => {
        const res = await request(app).post('/api/product/create').set('Authorization', `Bearer ${adminToken}`).send({ name: 'X', price: -5 });
        assert.equal(res.status, 400);
    });

    it('admin creates a product', async () => {
        const res = await request(app).post('/api/product/create').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Test Product', price: 99.5, stock: 3 });
        assert.equal(res.status, 201);
        productId = res.body.product.id;
    });

    it('lists and gets products publicly', async () => {
        const list = await request(app).get('/api/product/getAll');
        assert.equal(list.status, 200);
        assert.ok(list.body.products.some((product) => product.id === productId));

        const one = await request(app).get(`/api/product/${productId}`);
        assert.equal(one.status, 200);
        assert.equal(one.body.product.name, 'Test Product');
    });

    it('admin updates a product', async () => {
        const res = await request(app).patch(`/api/product/update/${productId}`).set('Authorization', `Bearer ${adminToken}`).send({ stock: 10 });
        assert.equal(res.status, 200);
        assert.equal(res.body.product.stock, 10);
    });

    it('rejects update with unknown field', async () => {
        const res = await request(app).patch(`/api/product/update/${productId}`).set('Authorization', `Bearer ${adminToken}`).send({ hacked: true });
        assert.equal(res.status, 400);
    });

    it('returns 400 for invalid id and 404 for missing product', async () => {
        assert.equal((await request(app).get('/api/product/abc')).status, 400);
        assert.equal((await request(app).get('/api/product/999999999')).status, 404);
    });

    it('admin deletes a product', async () => {
        const res = await request(app).delete(`/api/product/delete/${productId}`).set('Authorization', `Bearer ${adminToken}`);
        assert.equal(res.status, 200);
        assert.equal((await request(app).get(`/api/product/${productId}`)).status, 404);
        productId = null;
    });
});

describe('Errors', () => {
    it('unknown route returns JSON 404', async () => {
        const res = await request(app).get('/api/does-not-exist');
        assert.equal(res.status, 404);
        assert.match(res.body.message, /Route not found/);
    });
});
