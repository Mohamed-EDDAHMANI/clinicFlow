import authService, { REFRESH_TOKEN_MAX_AGE } from '../services/authService.js';
import env from '../config/env.js';

const refreshCookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
};

const sendRefreshCookie = (res, token) => {
    res.cookie("refreshToken", token, {
        ...refreshCookieOptions,
        maxAge: REFRESH_TOKEN_MAX_AGE
    });
};

const login = async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.login(req.body.email, req.body.password);
    sendRefreshCookie(res, refreshToken);
    res.status(200).json({ message: 'Login successful', accessToken, user });
};

const register = async (req, res) => {
    const userId = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', userId });
};

const refresh = async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.refresh(req.cookies.refreshToken);
    sendRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, user });
};

const clearRefreshCookieOnError = (err, req, res, next) => {
    res.clearCookie("refreshToken", refreshCookieOptions);
    next(err);
};

const logout = async (req, res) => {
    await authService.logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken", refreshCookieOptions);
    res.status(200).json({ message: 'Logged out' });
};


export default {
    login,
    register,
    refresh,
    clearRefreshCookieOnError,
    logout
};
