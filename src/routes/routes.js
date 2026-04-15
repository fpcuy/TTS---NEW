const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Import controllers
const { getShipments, importExcel, getDashboard } = require('../controllers/shipmentController');
const { getProducts, confirmInitialProducts, updateHPP } = require('../controllers/productController');
const {
    getCustomerServices,
    createCS,
    updateCS,
    deleteCS,
    getEditForm,
} = require('../controllers/customerServiceController');
const { getdebugImportPage, debugImport } = require('../controllers/debugController');

// ============================================
// AUTH ROUTES
// ============================================

router.get('/login', (req, res) => {
    console.log('GET /login - rendering login page');
    res.render('login', { error: null });
});

router.post('/login', (req, res) => {
    const { email, password, remember } = req.body;
    console.log('POST /login - email:', email);
    
    if (email === 'admin' && password === 'admin123') {
        req.session = { userId: 'admin', email: email };
        console.log('Login successful');
        res.redirect('/');
    } else {
        console.log('Login failed - wrong credentials');
        res.render('login', { error: 'Email atau password salah' });
    }
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

// ============================================
// SHIPMENT ROUTES
// ============================================

router.get('/', getShipments);
router.get('/dashboard', getDashboard);
router.post('/shipments/import', upload.single('excelFile'), importExcel);

// ============================================
// CUSTOMER SERVICE ROUTES
// ============================================

router.get('/customer-service', getCustomerServices);
router.post('/customer-service/create', createCS);
router.get('/customer-service/edit/:id', getEditForm);
router.post('/customer-service/update', updateCS);
router.post('/customer-service/delete', deleteCS);

// ============================================
// PRODUCT ROUTES
// ============================================ 

router.get('/products', getProducts);
router.post('/products/confirm-init', confirmInitialProducts);
router.post('/products/update-hpp', updateHPP);

// ============================================ 
// DEBUG ROUTES
// ============================================
router.get('/import-debug', getdebugImportPage);
router.post('/import-debug', upload.single('excelFile'), debugImport);

module.exports = router;
