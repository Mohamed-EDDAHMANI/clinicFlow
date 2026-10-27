import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';

after(async () => {
    await db.end();
});

describe('Errors', () => {
    it('unknown route returns JSON 404', async () => {
        const res = await request(app).get('/api/does-not-exist');
        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Route not found/);
    });
});
