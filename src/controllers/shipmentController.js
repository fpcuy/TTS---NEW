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
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let rows = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: null });
    // Clean data
    rows = cleanAndFormatData(rows);
    // Tampilkan data pada terminal (console.log)
    console.log('Imported rows:', JSON.stringify(rows, null, 2));
    // Insert to DB
    // Menggunakan upsert agar jika data sudah ada (berdasarkan Tracking No) akan diupdate, bukan error
    const { error: insertError } = await db.from('shipments').upsert(rows, { onConflict: 'Tracking No' });
    
    // Hapus file segera setelah diproses (agar tidak menumpuk di server)
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    if (insertError) throw insertError;

    // Fetch updated data with agent enrichment
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