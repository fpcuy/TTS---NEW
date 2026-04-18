const XLSX = require('xlsx');
const db = require('../config/database');
const { getAllCustomerService } = require('./customerServiceModel');

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
		const { data: shipments, count } = await getShipments(page, limit);
		const customerServiceList = await getAllCustomerService();
		const { data: products, error: prodError } = await db.from('products').select('*');
		if (prodError) throw prodError;
		const enriched = enrichShipmentsWithAgentName(shipments, customerServiceList, products);
		return { enriched, count };
	} catch (error) {
		console.error('Error fetching shipments with agent:', error.message);
		throw error;
	}
};

// Cleaning dan formatting data sebelum insert ke database dan  hilangkan "." dari nama field jika ada, karena di database tidak ada titik di nama field
function cleanAndFormatData(rows) {
	return rows.map(row => {
		const cleaned = {};
		for (const key in row) {
			const cleanKey = key.trim().replace(/\./g, '');
			let value = row[key];
			
			if (typeof value === 'string' && value.trim() === '-') {
				value = null;
			}

			// Format time fields or Date objects to ISO string
			if ((cleanKey.toLowerCase().includes('time') || value instanceof Date) && value) {
				let date = value instanceof Date ? value : new Date(value);

				// Jika format standar gagal (biasanya karena format DD-MM-YYYY), coba parse manual
				if (isNaN(date.getTime()) && typeof value === 'string') {
					const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/.exec(value.trim());
					if (ddmmyyyy) {
						const [_, d, m, y, timePart] = ddmmyyyy;
						const isoStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}${timePart ? timePart.replace(' ', 'T') : ''}`;
						date = new Date(isoStr);
					}
				}

				if (!isNaN(date.getTime())) {
					// Format ke YYYY-MM-DD HH:mm:ss sesuai permintaan database
					const YYYY = date.getFullYear();
					const MM = String(date.getMonth() + 1).padStart(2, '0');
					const DD = String(date.getDate()).padStart(2, '0');
					const HH = String(date.getHours()).padStart(2, '0');
					const mm = String(date.getMinutes()).padStart(2, '0');
					const ss = String(date.getSeconds()).padStart(2, '0');
					
					value = `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
				}
			}
			cleaned[cleanKey] = typeof value === 'string' ? value.trim() : value;
		}
		return cleaned;
	});
}

// Helper: Extract ID CS from 'Item in Parcel' field
function extractIdCS(itemInParcel) {
	if (!itemInParcel) return null;
	const itemText = String(itemInParcel);
	const lastParenIndex = itemText.lastIndexOf('(');
	
	if (lastParenIndex !== -1 && itemText.endsWith(')')) {
		const idCS = itemText.substring(lastParenIndex + 1, itemText.length - 1).trim();
		// Validasi bahwa idCS hanya berisi angka
		if (/^\d+$/.test(idCS)) {
			return idCS;
		}
	}
	return null;
}

// Helper: Extract item details (name, id, code) from 'Item in Parcel'
function extractItemDetails(itemInParcel) {
	if (!itemInParcel) return {
		itemName: '',
		idCS: null,
		code: ''
	};
	
	const itemText = String(itemInParcel);
	const lastParenIndex = itemText.lastIndexOf('(');
	
	if (lastParenIndex !== -1 && itemText.endsWith(')')) {
		const itemName = itemText.substring(0, lastParenIndex).trim();
		const code = itemText.substring(lastParenIndex);
		const idCS = code.slice(1, -1); // remove ( and )
		
		// Validasi bahwa idCS hanya berisi angka
		if (/^\d+$/.test(idCS)) {
			return {
				itemName,
				idCS,
				code
			};
		}
	}
	
	return {
		itemName: itemText,
		idCS: null,
		code: ''
	};
}

// Helper: Enrich shipments with agent name by mapping ID CS to customer service
function enrichShipmentsWithAgentName(shipments, customerServiceList, productList) {
	// Create a map for O(1) lookup
	const csMap = (customerServiceList || []).reduce((map, cs) => {
		const id = String(cs['ID Customer Service'] || '').trim();
		// Try different possible field names for agent name
		const agentName = cs['Name Agent'] || cs['Nama Agent'] || cs['Name'] || cs['Agent Name'] || '';
		if (id) {
			map[id] = agentName;
		}
		return map;
	}, {});

	// Map produk berdasarkan Variant Name untuk pencarian cepat
	const productMap = (productList || []).reduce((map, prod) => {
		const variantName = String(prod['Variant Name'] || '').trim();
		if (variantName) {
			map[variantName] = prod;
		}
		return map;
	}, {});

	// Enrich each shipment
	return (shipments || []).map(shipment => {
		const details = extractItemDetails(shipment['Item in Parcel']);
		const isDelivered = shipment['Tracking Status'] === 'Delivered';

		const product = productMap[String(details.itemName || '').trim()];
		const qty = Number(shipment['No of Item'] || 0);
		const codAmount = Number(shipment['COD Amount'] || 0);
		const estShippingFee = Number(shipment['Estimated Shipping Fee'] || 0);

		// Inisialisasi variabel finansial (Default 0 jika status bukan Delivered)
		let hpp = 0, totalHpp = 0, feeCod = 0, ppnSpx = 0, feeCs = 0, uangMasuk = 0;

		if (isDelivered) {
			hpp = Number(product?.['HPP'] || 0);
			totalHpp = qty * hpp;
			feeCod = codAmount * 0.01;           // Fee COD 1%
			ppnSpx = estShippingFee * 0.005;     // PPN SPX 0,5%
			feeCs = 5000;                        // Fee CS flat per resi
			uangMasuk = codAmount - totalHpp - feeCod - ppnSpx - feeCs;
		}

		return {
			...shipment,
			_idCS: details.idCS,
			_agentName: details.idCS && csMap[details.idCS] ? csMap[details.idCS] : '-',
			_variantName: product ? product['Variant Name'] : (details.itemName || '-'), // Variant Name dari tabel produk
			_qty: qty,       // Qty = No of Item
			_hpp: hpp,       // HPP dari tabel Products (hanya jika delivered)
			_totalHpp: totalHpp,
			_feeCod: feeCod,
			_ppnSpx: ppnSpx,
			_feeCs: feeCs,
			_uangMasuk: uangMasuk,
			'COD Amount': isDelivered ? codAmount : 0
		};
	});
}

module.exports = {
	cleanAndFormatData,
	extractIdCS,
	enrichShipmentsWithAgentName,
	getShipments,
	getShipmentsWithAgent,
	insertShipments,
	getGlobalStats,
	getProductlist
};