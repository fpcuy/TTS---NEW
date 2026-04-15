const XLSX = require('xlsx');
const fs = require('fs');
const { fetchAndStoreProducts } = require('../models/productModel');

// Tampilan halaman debug untuk import Excel
const getdebugImportPage = (req, res) => {
    // ambil data dari shipmnent hanya Item In Parcel nya saja lalu distinct untuk ditampilkan di dropdown filter di debug-import.ejs
    fetchAndStoreProducts().then((data) => {
        //tampilin di console untuk memastikan data sudah benar sebelum dirender ke halaman debug-import.ejs
        console.log('DEBUG: Product list for filter:', JSON.stringify(data, null, 1));
        res.render('debug-import', { importedData: data, pageTitle: 'Debug Import', error: null });
    }).catch((error) => {
        console.error('Error fetching product list:', error.message);
        res.status(500).send('Internal Server Error');
    });
};

// Debug route handler
const debugImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }
        // Read Excel file
        const workbook = XLSX.readFile(req.file.path, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // skip baris pertama (header) dengan opsi range: 1
        // dan set defval: null untuk memastikan sel kosong tetap muncul sebagai null


        let rows = XLSX.utils.sheet_to_json(sheet, { defval: null, range: 1});
        
        if (rows.length === 0) {
            throw new Error('File Excel kosong atau tidak valid');
        }
        // Tampilkan data yang diimpor untuk debugging
        console.log('DEBUG: Data yang diimpor:', JSON.stringify(rows, null, 2));
        res.render('debug-import', { importedData: rows, pageTitle: 'Debug Import', error: null });
    } catch (error) {
        console.error('Import error:', error.message);
        res.render('debug-import', { importedData: [], pageTitle: 'Debug Import', error: 'Gagal mengimpor data: ' + error.message });
    } finally {
        // Hapus file segera setelah diproses (agar tidak menumpuk di server)
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
};

module.exports = { getdebugImportPage, debugImport };