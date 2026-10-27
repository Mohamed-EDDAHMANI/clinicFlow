import userService from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const getAllUsers = async (req, res) => {
    const users = await userService.getAll();
    sendSuccess(res, users, 'Users fetched successfully');
};

const getMe = async (req, res) => {
    const user = await userService.getById(req.user.id);
    sendSuccess(res, user, 'User fetched successfully');
};

const createUser = async (req, res) => {
    const userId = await userService.create(req.body, req.user);
    sendSuccess(res, { userId }, 'User created successfully', 201);
};

export default {
    getAllUsers,
    getMe,
    createUser
};
