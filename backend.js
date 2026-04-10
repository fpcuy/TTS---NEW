const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const xlsx = require('xlsx');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = 3211;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', async (req, res) => {
    const { data: shipments, error } = await db.from('shipments').select('*').order('Create Time', { ascending: false });
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json(shipments);
    }
});

app.post('/upload', upload.single('excel_file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Tidak ada file yang diunggah.');
        }

        // Membaca file Excel dari buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log('Processing sheet:', sheetName);

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

        // Fungsi untuk mengkonversi format tanggal DD-MM-YYYY HH:MM ke ISO string
        function convertDate(dateStr) {
            if (!dateStr || typeof dateStr !== 'string') return dateStr;
            const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
            if (match) {
                const [, day, month, year, hour, minute] = match;
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                return date.toISOString();
            }
            return dateStr;
        }

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

        console.log('Data successfully upserted to Supabase');
        res.redirect('http://localhost:3000/');
    } catch (error) {
        console.error('Error uploading data:', error);
        res.status(500).send('Error processing file: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});