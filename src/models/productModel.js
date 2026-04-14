const db = require('../config/database');

// Tarik data produk dari shipment, lalu simpan ke tabel products
const fetchAndStoreProducts = async () => {
	try {
        const { data, error } = await db
            .from('combine_shipment_product')
            .select('*');

        if (error) throw error;
        return data; // Kembalikan data untuk ditampilkan di debug-import.ejs
    } catch (error) {
        console.error('Error fetching and storing products:', error.message);
        throw error;
    }
};


const getUniqueItemsModel = async () => {
    try {
        // Menggunakan raw string di dalam select
        const { data, error } = await db
            .from('shipments')
            .select(`
                combined_data:regexp_replace(
                    TRIM(
                        SUBSTRING(
                            "Item in Parcel"
                            FROM POSITION(' ' IN "Item in Parcel") + ... -- logika panjang Anda
                        )
                    ),
                    ' .$',
                    ''
                )
            `)
            // Catatan: Supabase client mungkin akan kesulitan memparsing DISTINCT di sini
            // Anda mungkin harus melakukan filter unik di sisi JavaScript (data.map...)
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error:', error.message);
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