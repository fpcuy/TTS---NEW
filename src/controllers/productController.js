const db = require('../config/database');
const { getProductsModel, fetchAndStoreProducts } = require('../models/productModel');

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = (req.query.search || '').trim();

        // 1. Ambil semua data produk dari model
        let products = await getProductsModel();

        // 2. Ambil data unik dari riwayat shipment
        const shipmentItems = await fetchAndStoreProducts();

        // 3. Logika Pencarian (Search)
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p => 
                String(p['Product Name'] || '').toLowerCase().includes(searchLower) ||
                String(p['Variant Name'] || '').toLowerCase().includes(searchLower) ||
                String(p['Variant Code'] || '').toLowerCase().includes(searchLower) ||
                String(p['HPP'] || '').toLowerCase().includes(searchLower)
            );
        }

        const totalItems = products.length;
        const totalPages = Math.ceil(totalItems / limit);

        // 4. Preview Data (Produk baru yang ditemukan di shipment)
        const allDbProducts = await getProductsModel(); // Gunakan data asli tanpa filter search untuk notif
        const existingVariants = new Set(allDbProducts.map(p => String(p['Variant Name'] || '').trim()));
        
        const missingProducts = (shipmentItems || []).filter(item => {
            const nameInShipment = String(item?.combined_data || item?.['Product Name'] || item?.itemName || (typeof item === 'string' ? item : '')).trim();
            return nameInShipment && nameInShipment !== '[object Object]' && !existingVariants.has(nameInShipment);
        }).map(item => ({
            'Variant Name': String(item?.combined_data || item?.['Product Name'] || item?.itemName || (typeof item === 'string' ? item : '')).trim(),
            'Product Name': '',
            'Variant Code': '',
            'HPP': 0,
        }));

        // 5. Grouping untuk Ringkasan Variant Code (Bulk Edit) - Berdasarkan hasil filter search
        const variantSummaryMap = products.reduce((acc, p) => {
            const code = p['Variant Code'];
            if (code && code.trim() !== '') {
                if (!acc[code]) {
                    acc[code] = { code, count: 0, currentHPP: p['HPP'] || 0 };
                }
                acc[code].count++;
            }
            return acc;
        }, {});

        const variantSummary = Object.values(variantSummaryMap).sort((a, b) => 
            a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
        );

        // 6. Pagination (Slicing data)
        const startIndex = (page - 1) * limit;
        const paginatedProducts = products.slice(startIndex, startIndex + limit);

        res.render('products', { 
            products: paginatedProducts, 
            variantSummary,
            previewData: missingProducts,
            pageTitle: 'Product List',
            currentPage: page,
            totalPages,
            currentLimit: limit,
            search,
            totalItems
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

/**
 * Update Nama Produk secara cepat (Inline Edit)
 */
const updateProductName = async (req, res) => {
    try {
        const { id, name } = req.body;
        const { error } = await db.from('products').update({ 'Product Name': name }).eq('ID Product', id);
        
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update Product Name error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update Variant Code secara cepat (Inline Edit)
 */
const updateVariantCode = async (req, res) => {
    try {
        const { id, code } = req.body;
        const { error } = await db.from('products').update({ 'Variant Code': code }).eq('ID Product', id);
        
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update Variant Code error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update Variant Name secara cepat (Inline Edit)
 */
const updateVariantName = async (req, res) => {
    try {
        const { id, variantName } = req.body;
        const { error } = await db.from('products').update({ 'Variant Name': variantName }).eq('ID Product', id);
        
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update Variant Name error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update HPP secara massal berdasarkan Variant Code
 */
const bulkUpdateHPP = async (req, res) => {
    try {
        const { variantCode, hpp } = req.body;
        const { error } = await db.from('products').update({ 'HPP': hpp }).eq('Variant Code', variantCode);
        
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Bulk Update HPP error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getProducts, confirmInitialProducts, updateHPP, updateProductName, updateVariantCode, updateVariantName, bulkUpdateHPP };