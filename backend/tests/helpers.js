import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';
import userModel from '../models/userModel.js';

export const PASSWORD = 'secret123';

export const testEmail = (label, stamp) => `test.${label}.${stamp}@test.com`;

export const createTestUser = async (email, role = 'staff') => {
    const id = await userModel.createUser({ name: 'Test User', email, password: PASSWORD, role });
    return id;
};

export const login = (email, password = PASSWORD) =>
    request(app).post('/api/auth/login').send({ email, password });

export const refreshCookie = (res) =>
    res.headers['set-cookie'].find((cookie) => cookie.startsWith('refreshToken=')).split(';')[0];

export const deleteTestUsers = (stamp) =>
    db.query('DELETE FROM users WHERE email LIKE $1', [`test.%.${stamp}@test.com`]);
