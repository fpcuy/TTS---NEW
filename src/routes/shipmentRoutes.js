const express = require('express');
const router = express.Router();
const { getShipments, uploadExcel, upload } = require('../controllers/shipmentController');

router.get('/', getShipments);
router.post('/upload', upload.single('excel_file'), uploadExcel);

module.exports = router;