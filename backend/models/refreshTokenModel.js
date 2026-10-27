import db from '../config/db.js';

const create = async (userId, tokenHash, expiresAt) => {
    await db.query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [userId, tokenHash, expiresAt]);
};

const findByHash = async (tokenHash) => {
    const { rows } = await db.query('SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > now()', [tokenHash]);
    return rows[0];
};

const deleteByHash = async (tokenHash) => {
    await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
};

const deleteAllForUser = async (userId) => {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};

export default {
    create,
    findByHash,
    deleteByHash,
    deleteAllForUser
};
