const db = require('../config/database');
const XLSX = require('xlsx');
const fs = require('fs');
const { cleanAndFormatData, getShipmentsWithAgent } = require('../models/shipmentModel');
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
    let rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    
    if (rows.length === 0) {
      throw new Error('File Excel kosong atau tidak valid');
    }

    // Clean data
    rows = cleanAndFormatData(rows);

    // Insert to DB
    const { error: insertError } = await db.from('shipments').upsert(rows, { onConflict: 'Tracking No' });
    
    if (insertError) throw insertError;
    
    // Ambil data terbaru untuk ditampilkan setelah import sukses
    const enrichedShipments = await getShipmentsWithAgent();
    
    res.render('index', { shipments: enrichedShipments, pageTitle: 'Shipment Dashboard', importPreview: rows, error: null });
  } catch (error) {
    console.error('Import error:', error.message);
    
    // Fetch shipments with agent enrichment
    const enrichedShipments = await getShipmentsWithAgent();
    
    res.render('index', { 
      shipments: enrichedShipments || [], 
      pageTitle: 'Shipment Dashboard', 
      error: 'Gagal mengimpor data: ' + error.message 
    });
  } finally {
    // Hapus file segera setelah diproses (agar tidak menumpuk di server)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
};

const getShipments = async (req, res) => {
  try {
    const enrichedShipments = await getShipmentsWithAgent();
    res.render('index', { shipments: enrichedShipments, pageTitle: 'Shipment Dashboard' });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const getDashboard = async (req, res) => {
  try {
    const enrichedShipments = await getShipmentsWithAgent();
    res.render('dashboard', { shipments: enrichedShipments, pageTitle: 'Dashboard' });
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { getShipments, importExcel, getDashboard };