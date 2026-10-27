import db from '../config/db.js';

const getAll = async () => {
    const { rows } = await db.query('SELECT * FROM products ORDER BY id');
    return rows;
};

const findById = async (id) => {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0];
};

const create = async ({ name, description = null, price, stock = 0, image_url = null }) => {
    const { rows } = await db.query(
        'INSERT INTO products (name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, description, price, stock, image_url]
    );
    return rows[0];
};

const update = async (id, fields) => {
    const columns = Object.keys(fields);
    const setClause = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');
    const { rows } = await db.query(
        `UPDATE products SET ${setClause}, updated_at = now() WHERE id = $${columns.length + 1} RETURNING *`,
        [...Object.values(fields), id]
    );
    return rows[0];
};

const remove = async (id) => {
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
};

export default {
    getAll,
    findById,
    create,
    update,
    remove
};
