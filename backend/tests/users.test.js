import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import { createTestUser, login, deleteTestUsers, testEmail } from './helpers.js';

const stamp = Date.now();
const staffEmail = testEmail('staff', stamp);
const adminEmail = testEmail('admin', stamp);

let staffToken;
let adminToken;

before(async () => {
    await createTestUser(staffEmail);
    await createTestUser(adminEmail, 'admin');

    staffToken = (await login(staffEmail)).body.data.accessToken;
    adminToken = (await login(adminEmail)).body.data.accessToken;
});

after(async () => {
    await deleteTestUsers(stamp);
    await db.end();
});

describe('Users', () => {
    it('getAll is admin only', async () => {
        const asStaff = await request(app).get('/api/user/getAll').set('Authorization', `Bearer ${staffToken}`);
        const asAdmin = await request(app).get('/api/user/getAll').set('Authorization', `Bearer ${adminToken}`);
        assert.equal(asStaff.status, 403);
        assert.equal(asAdmin.status, 200);
        assert.ok(asAdmin.body.data.every((user) => user.password === undefined));
    });
});
