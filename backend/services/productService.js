import productModel from '../models/productModel.js';
import AppError from '../utils/AppError.js';

const getAll = () => productModel.getAll();

const getById = async (id) => {
    const product = await productModel.findById(id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    return product;
};

const create = (data) => productModel.create(data);

const update = async (id, data) => {
    const product = await productModel.update(id, data);
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    return product;
};

const remove = async (id) => {
    const deleted = await productModel.remove(id);
    if (!deleted) {
        throw new AppError('Product not found', 404);
    }
};

export default {
    getAll,
    getById,
    create,
    update,
    remove
};
