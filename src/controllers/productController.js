const XLSX = require('xlsx');
const db = require('../config/database');
const { getProductsModel } = require('../models/productModel');

const getProducts = async (req, res) => {
    try {
        const products = await getProductsModel();
        res.render('products', { products, pageTitle: 'Product List' });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { getProducts 
    }