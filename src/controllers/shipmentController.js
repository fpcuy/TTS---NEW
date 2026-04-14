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

    // Alih-alih langsung insert, kita kirim ke Preview Modal sesuai UI di index.ejs
    const page = 1;
    const limit = parseInt(req.query.limit) || 50;
    const { enriched: shipments, count } = await getShipmentsWithAgent(page, limit);
    const stats = await getGlobalStats();

    res.render('index', { 
      shipments, 
      stats, 
      currentPage: page, 
      currentLimit: limit,
      totalPages: Math.ceil(count / limit), 
      pageTitle: 'Shipment Dashboard',
      importPreview: rows, // Data untuk modal preview
      showPreviewModal: true // Aktifkan modal preview
    });
  } catch (error) {
    // Log error di redirect ke controller getshipments agar user tetap melihat dashboard meskipun import gagal
    console.error('Import error:', error.message);

    const page = 1;
    const limit = parseInt(req.query.limit) || 50;
    const { enriched: shipments, count } = await getShipmentsWithAgent(page, limit);
    const stats = await getGlobalStats();

    
    res.render('index', { 
      shipments, 
      stats, 
      currentPage: page, 
      currentLimit: limit,
      totalPages: Math.ceil(count / limit), 
      pageTitle: 'Shipment Dashboard', 
      error: 'Gagal mengimpor data: ' + error.message,
      importPreview: [],
      showPreviewModal: false
    });
  } finally {
    // Hapus file yang di-upload setelah diproses
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
  }
};

// Handler untuk eksekusi final import setelah user klik "Confirm"
const confirmImport = async (req, res) => {
  try {
    const { shipmentData } = req.body;
    if (!shipmentData) {
      throw new Error('Tidak ada data untuk di-import');
    }

    const rows = JSON.parse(shipmentData);
    
    // Insert ke Database
    await insertShipments(rows);

    res.redirect('/?success=Data berhasil di-import ke database');
  } catch (error) {
    console.error('Confirmation error:', error.message);
    res.redirect('/?error=Gagal menyimpan data');
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

module.exports = { getShipments, importExcel, getDashboard, confirmImport };