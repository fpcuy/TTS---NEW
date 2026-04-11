const db = require('../config/database');

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
};  