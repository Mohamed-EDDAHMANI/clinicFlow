import productService from '../services/productService.js';

const getAllProducts = async (req, res) => {
    const products = await productService.getAll();
    res.status(200).json({ products });
};

const getProductById = async (req, res) => {
    const product = await productService.getById(req.params.id);
    res.status(200).json({ product });
};

const createProduct = async (req, res) => {
    const product = await productService.create(req.body);
    res.status(201).json({ message: 'Product created successfully', product });
};

const updateProduct = async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    res.status(200).json({ message: 'Product updated successfully', product });
};

const deleteProduct = async (req, res) => {
    await productService.remove(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
};

export default {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
