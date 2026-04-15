const db = require('../config/database');

// Tarik data produk dari shipment, lalu simpan ke tabel products
const fetchAndStoreProducts = async () => {
	try {
        const { data, error } = await db
            .rpc('get_combined_item_data'); // Panggil fungsi RPC untuk mendapatkan data unik
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching products:', error.message);
        throw error;
    }
};

// Fetch all products
const getProductsModel = async () => {
    try {
        const { data, error } = await db
            .from('products')
            .select('*')
            .order('ID Product', { ascending: true });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching products:', error.message);
        throw error;
    }
};

module.exports = {
    getProductsModel,
    fetchAndStoreProducts
};  