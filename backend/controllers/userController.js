import userService from '../services/userService.js';

const getAllUsers = async (req, res) => {
    const users = await userService.getAll();
    res.status(200).json({ users });
};

const getMe = async (req, res) => {
    const user = await userService.getById(req.user.id);
    res.status(200).json({ user });
};

const createUser = async (req, res) => {
    const userId = await userService.create(req.body, req.user);
    res.status(201).json({ message: 'User created successfully', userId });
};

export default {
    getAllUsers,
    getMe,
    createUser
};
