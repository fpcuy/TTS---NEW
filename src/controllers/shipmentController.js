const db = require('../config/database');
const XLSX = require('xlsx');
const fs = require('fs');
const { getShipmentsWithAgent, insertShipments, getGlobalStats } = require('../models/shipmentModel');
const { cleanAndFormatData } = require('../utils/formatters');

// Import Excel handler
const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    // Read Excel file
    const workbook = XLSX.readFile(req.file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Skip baris pertama (header laporan) dengan opsi range: 1
    let rows = XLSX.utils.sheet_to_json(sheet, { defval: null, range: 1 });
    
    if (rows.length === 0) {
      throw new Error('File Excel kosong atau tidak valid');
    }
    // Bersihkan dan format data
    rows = cleanAndFormatData(rows);

    const CHUNK_SIZE = 500;
    console.log(`Memulai proses import otomatis total ${rows.length} data...`);
    
    // Langsung eksekusi insert tanpa modal konfirmasi
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await insertShipments(chunk);
      console.log(`Batch ${Math.floor(i / CHUNK_SIZE) + 1} berhasil di-insert (${chunk.length} baris)`);
    }

    res.redirect(`/?success=${rows.length} data berhasil di-import ke database`);
  } catch (error) {
    console.error('Import error:', error.message);
    res.redirect('/?error=' + encodeURIComponent('Gagal mengimpor data: ' + error.message));
  } finally {
    // Hapus file yang di-upload setelah diproses
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
  }
};

const getShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Ambil limit dari query atau default 50

    const { enriched: shipments, count } = await getShipmentsWithAgent(page, limit);
    const stats = await getGlobalStats();

    // Log data yang akan ditampilkan di dashboard
    console.log('Stats:', stats);
    
    res.render('index', { 
      shipments, 
      stats,
      currentPage: page,
      currentLimit: limit,
      totalPages: Math.ceil(count / limit),
      pageTitle: 'Shipment Dashboard',
      importPreview: [],
      showPreviewModal: false
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const getDashboard = async (req, res) => {
  try {
    const { enriched: shipments } = await getShipmentsWithAgent(1, 10);
    const stats = await getGlobalStats();
    res.render('dashboard', { shipments, stats, pageTitle: 'Dashboard' });
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { getShipments, importExcel, getDashboard };