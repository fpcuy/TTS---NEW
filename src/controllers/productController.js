const db = require('../config/database');
const { getProductsModel, fetchAndStoreProducts } = require('../models/productModel');

const getProducts = async (req, res) => {
    try {
        // 1. Ambil data produk yang sudah ada di database
        const products = await getProductsModel();

        // 2. Ambil data unik dari riwayat shipment
        const shipmentItems = await fetchAndStoreProducts();

        // 3. Filter: Bandingkan 'combined_data' dari shipment dengan 'Variant Name' di tabel products
        const existingVariants = new Set(products.map(p => String(p['Variant Name'] || '').trim()));
        
        const missingProducts = (shipmentItems || []).filter(item => {
            const nameInShipment = String(item?.combined_data || item?.['Product Name'] || item?.itemName || (typeof item === 'string' ? item : '')).trim();
            return nameInShipment && nameInShipment !== '[object Object]' && !existingVariants.has(nameInShipment);
        }).map(item => ({
            'Variant Name': String(item?.combined_data || item?.['Product Name'] || item?.itemName || (typeof item === 'string' ? item : '')).trim(),
            'Product Name': '', // Dibiarkan kosong sesuai permintaan
            'HPP': 0,           // Dibiarkan kosong/default
        }));

        res.render('products', { 
            products, 
            previewData: missingProducts,
            pageTitle: 'Product List' 
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Menangani penyimpanan produk setelah konfirmasi dari modal
 */
const confirmInitialProducts = async (req, res) => {
    try {
        const { productData } = req.body;
        const rows = JSON.parse(productData);
        
        const { error } = await db.from('products').insert(rows);
        if (error) throw error;

        res.redirect('/products?success=Produk berhasil diinisialisasi');
    } catch (error) {
        console.error('Confirm products error:', error.message);
        res.redirect('/products?error=Gagal menyimpan produk');
    }
};

/**
 * Update HPP secara cepat (Inline Edit)
 */
const updateHPP = async (req, res) => {
    try {
        const { id, hpp } = req.body;
        const { error } = await db.from('products').update({ 'HPP': hpp }).eq('ID Product', id);
        
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update HPP error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getProducts, confirmInitialProducts, updateHPP };