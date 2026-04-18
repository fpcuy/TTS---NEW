const express = require('express');
const router = express.Router();
const db = require('../src/config/database');
const { getProductsModel, fetchAndStoreProducts } = require('../src/models/productModel');

// Route untuk menampilkan halaman daftar produk
router.get('/', async (req, res) => {
    try {
        const sortBy = req.query.sortBy || 'Variant Name';
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

        const products = await getProductsModel();
        const shipmentItems = await fetchAndStoreProducts();

        // Filter: Bandingkan 'combined_data' dari shipment dengan 'Variant Name' di tabel products
        const existingVariants = new Set(products.map(p => String(p['Variant Name'] || '').trim()));
        
        const missingProducts = (shipmentItems || []).filter(item => {
            const nameInShipment = String(item?.combined_data || item?.['Product Name'] || item?.itemName || (typeof item === 'string' ? item : '')).trim();
            return nameInShipment && nameInShipment !== '[object Object]' && !existingVariants.has(nameInShipment);
        }).map(item => ({
            'Variant Name': String(item?.combined_data || item?.['Product Name'] || item?.itemName || (typeof item === 'string' ? item : '')).trim(),
            'Product Name': '', // Dibiarkan kosong sesuai permintaan
            'Variant Code': '',
            'HPP': 0,
            'Stock': 0
        }));

        // Logika Sorting
        products.sort((a, b) => {
            let valA = a[sortBy] ?? '';
            let valB = b[sortBy] ?? '';

            if (sortBy === 'HPP') {
                return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
            }

            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        res.render('products', { 
            products, 
            previewData: missingProducts,
            pageTitle: 'Product List',
            sortBy,
            sortOrder
        });
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Route untuk menangani konfirmasi inisialisasi produk baru
router.post('/confirm-init', async (req, res) => {
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
});

module.exports = router;