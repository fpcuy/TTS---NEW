const XLSX = require('xlsx');
const fs = require('fs');
const { getGlobalStatsData } = require('../models/globalModel');

// Tampilan halaman debug untuk import Excel
const getdebugImportPage = (req, res) => {
    // data global stats untuk ditampilkan di halaman debug (jika diperlukan)
    console.log('DEBUG: Fetching global stats for debug-import page');
    getGlobalStatsData()        .then(stats => {
            console.log('DEBUG: Global stats fetched successfully:', stats);
        })
        .catch(error => {
            console.error('DEBUG: Error fetching global stats:', error.message);
        });
    res.render('debug-import', { importedData: null, pageTitle: 'Debug Import', error: null });
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