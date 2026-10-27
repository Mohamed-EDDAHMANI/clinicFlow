import db from '../config/db.js';
import bcrypt from 'bcrypt';

const PUBLIC_COLUMNS = 'id, full_name, email, role, created_at';

const getAllUsers = async () => {
    const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users`);
    return rows;
};

const findOne = async (email) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    return rows[0];
}

const findById = async (id) => {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    return rows[0];
};

const findPublicById = async (id) => {
    const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0];
};

const createUser = async (userData) => {
    const { name, email, password, role = 'staff' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await db.query('INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id', [name, email, hashedPassword, role]);
    return rows[0].id;
};

export default {
    getAllUsers,
    createUser,
    findOne,
    findById,
    findPublicById
};
