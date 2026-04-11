const XLSX = require('xlsx');
const db = require('../config/database');
const { getAllCustomerService } = require('./customerServiceModel');

// tarik data dari database tabel shipments
const getShipments = async () => {
	try {
		const { data, error } = await db
			.from('shipments')
			.select('*')
			.order('Create Time', { ascending: false });
		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error fetching shipments:', error.message);
		throw error;
	}
};

// Get shipments with agent name enrichment (based on ID CS in 'Item in Parcel')
const getShipmentsWithAgent = async () => {
	try {
		const shipments = await getShipments();
		const customerServiceList = await getAllCustomerService();
		return enrichShipmentsWithAgentName(shipments, customerServiceList);
	} catch (error) {
		console.error('Error fetching shipments with agent:', error.message);
		throw error;
	}
};

// Helper: Convert '-' to null and format date to ISO string
function cleanAndFormatData(rows) {
	return rows.map(row => {
		const cleaned = {};
		for (const key in row) {
			let value = row[key];
			if (typeof value === 'string' && value.trim() === '-') {
				value = null;
			}
			// Format time fields to ISO 8601 if possible
			if (key.toLowerCase().includes('time') && value) {
				// Try to parse as date
				const date = new Date(value);
				if (!isNaN(date)) {
					value = date.toISOString();
				}
			}
			cleaned[key] = value;
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
function enrichShipmentsWithAgentName(shipments, customerServiceList) {
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

	// Enrich each shipment
	return (shipments || []).map(shipment => {
		const idCS = extractIdCS(shipment['Item in Parcel']);
		return {
			...shipment,
			_idCS: idCS,
			_agentName: idCS && csMap[idCS] ? csMap[idCS] : '-'
		};
	});
}

module.exports = {
	cleanAndFormatData,
	extractIdCS,
	enrichShipmentsWithAgentName,
	getShipments,
	getShipmentsWithAgent,
};