//Controller Product
const db = require('../config/database');
const { getAvailableProducts, getUnmappedItems, massUpdateProduct, updateProductHPP, addProduct, updateProduct, deleteProduct, updateProductField } = require('../models/productModel');
const { getGlobalStats } = require('../models/shipmentModel');

// Menampilkan Halaman Product
const getProduct = async (req, res) => {
    try {
        const products = await getAvailableProducts();
        res.render('products', {
            products,
            pageTitle: 'Products',
            success: req.query.success,
            error: req.query.error
        });
        console.log('Fetched products:', products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// Tampilkan halaman unmapped products
const getUnmappedProductsView = async (req, res) => {
    try {
        const unmappedItems = await getUnmappedItems();
        const products = await getAvailableProducts();
        const stats = await getGlobalStats();
        
        res.render('unmapped-products', {
            unmappedItems,
            products, // Samakan dengan variabel yang diminta di EJS
            stats,
            pageTitle: 'Unmapped Products',
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error fetching unmapped products:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

// mass update product mapping
const updateProductMapping = async (req, res) => {
    console.log('Received mass update request with body:', req.body);
    const { extractedItem, productId } = req.body;
    try {
        await massUpdateProduct(extractedItem, productId);
        console.log('Mass update successful for extractedItem:', extractedItem, 'with productId:', productId);
        res.redirect('/unmapped-products?success=Mapping berhasil diperbarui');
    } catch (error) {
        console.error('Error in mass update:', error.message);
        res.redirect('/unmapped-products?error=Terjadi kesalahan saat memperbarui mapping');
    }
};

// Update HPP product
const updateHPP = async (req, res) => {
    const { productId, newHPP } = req.body;
    try {
        if (!productId || !newHPP) {
            return res.status(400).json({ success: false, message: 'Product ID dan HPP harus ada' });
        }
        
        await updateProductHPP(productId, parseInt(newHPP));
        console.log('HPP updated for product:', productId, 'new HPP:', newHPP);
        res.json({ success: true, message: 'HPP berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating HPP:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update product field (inline editing)
const updateProductFieldController = async (req, res) => {
    const { productId, field, newValue } = req.body;
    console.log('updateProductField called with:', { productId, field, newValue });
    try {
        if (!productId || !field || !newValue) {
            return res.status(400).json({ success: false, message: 'Product ID, field, dan newValue harus ada' });
        }
        
        await updateProductField(productId, field, newValue);
        console.log('Field updated successfully');
        res.json({ success: true, message: 'Field berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating product field:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tambah produk baru
const createProduct = async (req, res) => {
    const { productName, variantName, hpp } = req.body;
    try {
        const newProduct = await addProduct({ productName, variantName, hpp });
        console.log('Product added:', newProduct);
        res.redirect('/products?success=Produk berhasil ditambahkan');
    } catch (error) {
        console.error('Error adding product:', error.message);
        res.redirect('/products?error=' + encodeURIComponent(error.message));
    }
};

// Update produk lengkap
const editProduct = async (req, res) => {
    const { productId, productName, variantName, hpp } = req.body;
    try {
        const updatedProduct = await updateProduct(productId, { productName, variantName, hpp });
        console.log('Product updated:', updatedProduct);
        res.redirect('/products?success=Produk berhasil diperbarui');
    } catch (error) {
        console.error('Error updating product:', error.message);
        res.redirect('/products?error=' + encodeURIComponent(error.message));
    }
};

// Hapus produk
const removeProduct = async (req, res) => {
    const { productId } = req.body;
    try {
        await deleteProduct(productId);
        console.log('Product deleted:', productId);
        res.redirect('/products?success=Produk berhasil dihapus');
    } catch (error) {
        console.error('Error deleting product:', error.message);
        res.redirect('/products?error=' + encodeURIComponent(error.message));
    }
};

module.exports = { getProduct, getUnmappedProductsView, updateProductMapping, updateHPP, updateProductFieldController, createProduct, editProduct, removeProduct };