//Model Product
const db = require('../config/database');

// Fungsi untuk mendapatkan daftar produk unik dari database    
const getAvailableProducts = async () => {
    try {
        const { data, error } = await db
            .from('products')
            .select('"ID Product", "Product Name", "Variant Name", "HPP"')
            .order('Product Name', { ascending: true });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching available products:', error.message);
        throw error;
    }
};

// Ambil daftar item yang belum ter-mapping dari RPC
const getUnmappedItems = async () => {
	try {
		const { data, error } = await db.rpc('get_unmapped_items');
		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error fetching unmapped items:', error.message);
		throw error;
	}
};

const massUpdateProduct = async (extractedItem, productId) => {
    try {
        // Validasi extractedItem tidak kosong
        if (!extractedItem || !String(extractedItem).trim()) {
            throw new Error('Extracted item tidak boleh kosong');
        }

        // Pastikan jika productId kosong, null, atau hanya spasi, dikirim sebagai null
        const trimmedProductId = productId ? String(productId).trim() : '';
        
        // Jika productId kosong setelah trim, throw error
        if (!trimmedProductId) {
            throw new Error('Product ID harus dipilih');
        }

        const { error } = await db.rpc('update_shipment_mapping', {
            target_extracted_item: extractedItem,
            target_product_id: trimmedProductId
        });
        if (error) throw error;
    } catch (error) {
        console.error('Error in mass update mapping:', error.message);
        throw error;
    }
};

const updateProductHPP = async (productId, newHPP) => {
    try {
        if (!productId || !newHPP) {
            throw new Error('Product ID dan HPP harus ada');
        }
        
        const { error } = await db
            .from('products')
            .update({ HPP: newHPP })
            .eq('"ID Product"', productId);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error updating product HPP:', error.message);
        throw error;
    }
};

// Update product field (inline editing)
const updateProductField = async (productId, field, newValue) => {
    try {
        if (!productId || !field || !newValue) {
            throw new Error('Product ID, field, dan newValue harus ada');
        }
        
    // Map field names to database column names
    const fieldMapping = {
        'productName': 'Product Name',
        'variantName': 'Variant Name',
        'hpp': 'HPP'
    };
    
    const dbField = fieldMapping[field];
    if (!dbField) throw new Error('Field tidak valid');
    
    const updateData = { [dbField]: dbField === 'HPP' ? parseInt(newValue) : newValue };
    
    const { error } = await db
        .from('products')
        .update(updateData)
        .eq('"ID Product"', productId);
    
    if (error) throw error;
    } catch (error) {
        console.error('Error updating product field:', error.message);
        throw error;
    }
};
const addProduct = async (productData) => {
    try {
        const { productName, variantName, hpp } = productData;
        console.log('Adding product with data:', productData);
        if (!productName || !variantName || !hpp) {
            throw new Error('Semua field harus diisi');
        }
        
        const { data, error } = await db
            .from('products')
            .insert({
                'Product Name': productName,
                'Variant Name': variantName,
                'HPP': parseInt(hpp)
            })
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding product:', error.message);
        throw error;
    }
};

// Update produk lengkap
const updateProduct = async (productId, productData) => {
    try {
        const { productName, variantName, hpp } = productData;
        
        if (!productId || !productName || !variantName || !hpp) {
            throw new Error('Semua field harus diisi');
        }
        
        const { data, error } = await db
            .from('products')
            .update({
                'Product Name': productName,
                'Variant Name': variantName,
                'HPP': parseInt(hpp)
            })
            .eq('"ID Product"', productId)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating product:', error.message);
        throw error;
    }
};

// Hapus produk
const deleteProduct = async (productId) => {
    try {
        if (!productId) {
            throw new Error('Product ID harus ada');
        }
        
        const { error } = await db
            .from('products')
            .delete()
            .eq('"ID Product"', productId);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error deleting product:', error.message);
        throw error;
    }
};

module.exports = { getAvailableProducts, getUnmappedItems, massUpdateProduct, updateProductHPP, addProduct, updateProduct, deleteProduct, updateProductField };