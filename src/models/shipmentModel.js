const db = require('../config/database');

// Insert data ke database melalui Model
const insertShipments = async (rows) => {
	try {
		const { error } = await db.from('shipments').upsert(rows, { onConflict: 'Tracking No' });
		if (error) throw error;
	} catch (error) {
		console.error('Error inserting shipments:', error.message);
		throw error;
	}
};

// tarik data dari database tabel shipments
const getShipments = async (page = 1, limit = 50) => {
	try {
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const { data, error, count } = await db
			.from('shipments')
			.select('*', { count: 'exact' })
			.order('Create Time', { ascending: false })
			.range(from, to);

		if (error) throw error;
		return { data, count };
	} catch (error) {
		console.error('Error fetching shipments:', error.message);
		throw error;
	}
};

// tarik data shipmnets dan distinct Item in Parcel untuk filter di debug-import.ejs
const getProductlist = async () => {
	try {
		let allItems = [];
		let page = 0;
		const chunkSize = 1000;
		let hasMore = true;

		// Supabase limit 1000, tarik data per 1000 untuk mendapatkan semua Item in Parcel
		while (hasMore) {
			const { data, error } = await db
				.from('shipments')
				.select('"Item in Parcel"')
				.range(page * chunkSize, (page + 1) * chunkSize - 1);
			
			if (error) throw error;
			if (!data || data.length === 0) {
				hasMore = false;
			} else {
				allItems = allItems.concat(data.map(item => item['Item in Parcel']));
				if (data.length < chunkSize) hasMore = false;
				page++;
			}
		}

		// Filter nilai unik menggunakan Set dan kembalikan dalam struktur objek semula
		const uniqueItems = [...new Set(allItems.filter(Boolean))];
		return uniqueItems.map(val => ({ 'Item in Parcel': val }));
	} catch (error) {
		console.error('Error fetching product list:', error.message);
		throw error;
	}
};

// tarik data statistik global untuk dashboard
const getGlobalStats = async () => {
	try {
		let allRows = [];
		let page = 0;
		const chunkSize = 1000;
		let hasMore = true;

		// Supabase limit 1000, tarik data per 1000 untuk statistik akurat
		while (hasMore) {
			const { data, error } = await db
				.from('shipments')
				.select('"COD Amount", "Tracking Status"')
				.range(page * chunkSize, (page + 1) * chunkSize - 1);
			
			if (error) throw error;
			if (!data || data.length === 0) {
				hasMore = false;
			} else {
				allRows = allRows.concat(data);
				if (data.length < chunkSize) hasMore = false;
				page++;
			}
		}

		return allRows.reduce((acc, curr) => {
			acc.totalShipments++;
			const status = curr['Tracking Status'];
			if (status === 'Delivered') {
				acc.delivered++;
				acc.totalCOD += Number(curr['COD Amount'] || 0);
			} else if (status === 'Returned' || status === 'Returning') {
				acc.retur++;
			} else {
				acc.onProcess++;
			}
			return acc;
		}, { totalShipments: 0, totalCOD: 0, delivered: 0, retur: 0, onProcess: 0 });
	} catch (error) {
		console.error('Error fetching global stats:', error.message);
		throw error;
	}
};

// Get shipments with agent name enrichment (based on ID CS in 'Item in Parcel')
const getShipmentsWithAgent = async (page = 1, limit = 50) => {
	try {
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		const { data, error, count } = await db.rpc('get_shipment_reports', {}, { count: 'exact' })
			.range(from, to)
			.order('Create Time', { ascending: false });

		if (error) throw error;
		
		// Tambahkan flag _isDelivered untuk kemudahan logika di template
		const enriched = (data || []).map(item => ({
			...item,
			_isDelivered: item['Tracking Status'] === 'Delivered'
		}));

		return { enriched, count };
	} catch (error) {
		console.error('Error fetching shipment reports:', error.message);
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

// Lakukan update massal ID Product di shipments
const updateShipmentProductMapping = async (extractedItem, productId) => {
	try {
		// Samakan logika penanganan UUID null agar tidak error invalid syntax
		const cleanProductId = (productId && String(productId).trim()) ? productId : null;

		const { error } = await db.rpc('mass_update_shipment_product', {
			p_extracted_item: extractedItem,
			p_product_id: cleanProductId
		});
		if (error) throw error;
	} catch (error) {
		console.error('Error in mass update mapping:', error.message);
		throw error;
	}
};

module.exports = {
	getShipments,
	getShipmentsWithAgent,
	insertShipments,
	getGlobalStats,
	getProductlist,
	getUnmappedItems,
	updateShipmentProductMapping
};