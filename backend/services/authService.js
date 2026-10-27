import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';
import { ROLES } from '../config/permissions.js';
import userModel from '../models/userModel.js';
import refreshTokenModel from '../models/refreshTokenModel.js';
import AppError from '../utils/AppError.js';
import verifyToken from '../utils/verifyToken.js';

export const REFRESH_TOKEN_MAX_AGE = env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) => {
    const payload = { id: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN });
};

const generateRefreshToken = (user) => {
    const payload = { id: user.id, jti: crypto.randomUUID() };
    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_MAX_AGE / 1000 });
};

const createSession = async (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);

    await refreshTokenModel.create(user.id, hashToken(refreshToken), expiresAt);

    return { accessToken, refreshToken };
};

const toPublicUser = (user) => ({ id: user.id, name: user.full_name, email: user.email, role: user.role });

const login = async (email, password) => {
    const user = await userModel.findOne(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Invalid email or password', 401);
    }

    const tokens = await createSession(user);

    return { ...tokens, user: toPublicUser(user) };
};

const register = async ({ name, email, password }) => {
    const existingUser = await userModel.findOne(email);

    if (existingUser) {
        throw new AppError('Email already exists', 409);
    }

    return userModel.createUser({ name, email, password, role: ROLES.USER });
};

const refresh = async (token) => {
    if (!token) {
        throw new AppError('No refresh token', 401);
    }

    const payload = verifyToken(token, env.REFRESH_TOKEN_SECRET, 'Invalid or expired refresh token');

    const storedToken = await refreshTokenModel.findByHash(hashToken(token));
    if (!storedToken || storedToken.user_id !== payload.id) {
        await refreshTokenModel.deleteAllForUser(payload.id);
        throw new AppError('Refresh token revoked', 401);
    }

    const user = await userModel.findById(payload.id);
    if (!user) {
        throw new AppError('User no longer exists', 401);
    }

    await refreshTokenModel.deleteByHash(hashToken(token));

    const tokens = await createSession(user);

    return { ...tokens, user: toPublicUser(user) };
};

const logout = async (token) => {
    if (token) {
        await refreshTokenModel.deleteByHash(hashToken(token));
    }
};

export default {
    login,
    register,
    refresh,
    logout
};
