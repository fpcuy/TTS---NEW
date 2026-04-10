const db = require('../config/database');
const multer = require('multer');
const xlsx = require('xlsx');
const { convertDate } = require('../utils/dateUtils');

const upload = multer({ storage: multer.memoryStorage() });

const getShipments = async (req, res) => {
  try {
    const { data: shipments, error } = await db.from('shipments').select('*').order('Create Time', { ascending: false });
    if (error) throw error;
    res.render('index', { shipments, pageTitle: 'Shipment Dashboard' });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Tidak ada file yang diunggah.');
    }

    // Membaca file Excel dari buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Mengambil data mulai dari baris kedua (range: 1) karena baris pertama adalah header
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: false, range: 1 });

    // Daftar nama kolom berdasarkan urutan
    const columnNames = [
      'Report Download Time',
      'Tracking No',
      'Tracking No link',
      'Customer Reference No',
      'Customer Reference No link',
      'Create Time',
      'Tracking Status',
      'Account ID',
      'Original pickup option',
      'Actual pickup option',
      'Scheduled Pickup Time',
      'Actual Pickup/Drop Off Time',
      'Delivered Time',
      'Delivery OnHold Times',
      'Delivery OnHold Reason',
      'Returning Start Time',
      'Recipient Name',
      'Recipient Phone Number',
      'Recipient Province',
      'Recipient City',
      'Recipient District',
      'Recipient Detail Address',
      'Recipient Postal Code',
      'Sender Name',
      'Sender Phone Number',
      'Sender Province',
      'Sender City',
      'Sender District',
      'Sender Detail Address',
      'Sender Postal Code',
      'Payment Role',
      'Item in Parcel',
      'No of item in Parcel',
      'COD Collection(Y/N)',
      'COD Amount',
      'Parcel Value',
      'Parcel Weight',
      'Actual Weight',
      'Estimated Shipping Fee',
      'Actual Shipping Fee',
      'Basic Shipping Fee',
      'Insurance Fee',
      'COD Service Fee',
      'Return Shipping Fee',
      'Delivery failed Reason',
      'Create Method'
    ];

    // Mapping data berdasarkan urutan kolom
    const jsonData = rawData.map(row => {
      const obj = {};
      columnNames.forEach((col, index) => {
        obj[col] = row[index] || null;
      });
      return obj;
    });

    // Konversi field tanggal
    const dateFields = ['Report Download Time', 'Create Time', 'Scheduled Pickup Time', 'Actual Pickup/Drop Off Time', 'Delivered Time'];
    jsonData.forEach(row => {
      dateFields.forEach(field => {
        if (row[field]) {
          row[field] = convertDate(row[field]);
        }
      });
    });

    const { error } = await db
      .from('shipments')
      .upsert(jsonData, { onConflict: 'Tracking No' });

    if (error) throw error;

    res.redirect('http://localhost:3000/');
  } catch (error) {
    console.error('Error uploading data:', error);
    res.status(500).send('Error processing file: ' + error.message);
  }
};

module.exports = { getShipments, uploadExcel, upload };