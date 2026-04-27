/**
 * Utility untuk membersihkan dan memformat data dari Excel
 * Menghilangkan titik pada header, menangani nilai "-", dan standardisasi format tanggal
 */
function cleanAndFormatData(rows) {
	return rows.map(row => {
		const cleaned = {};
		for (const key in row) {
			const cleanKey = key.trim().replace(/\./g, '');
			let value = row[key];
			
			if (typeof value === 'string' && value.trim() === '-') {
				value = null;
			}

			// Format time fields atau Date objects
			if ((cleanKey.toLowerCase().includes('time') || value instanceof Date) && value) {
				let date = value instanceof Date ? value : new Date(value);

				// Parsing manual untuk format DD-MM-YYYY
				if (isNaN(date.getTime()) && typeof value === 'string') {
					const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/.exec(value.trim());
					if (ddmmyyyy) {
						const [_, d, m, y, timePart] = ddmmyyyy;
						const isoStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}${timePart ? timePart.replace(' ', 'T') : ''}`;
						date = new Date(isoStr);
					}
				}

				if (!isNaN(date.getTime())) {
					// Format ke YYYY-MM-DD HH:mm:ss untuk database
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

/**
 * Helper: Ekstrak detail item (name, id, code) dari field 'Item in Parcel'
 */
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
		const idCS = code.slice(1, -1); // hapus ( dan )
		
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

module.exports = {
	cleanAndFormatData,
	extractItemDetails
};