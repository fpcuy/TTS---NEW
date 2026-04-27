const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Import controllers
const { 
    getShipments, 
    importExcel, 
    getDashboard, 
    getCSProductLeaderboard,
} = require('../controllers/shipmentController');
const {
    getCustomerServices,
    createCS,
    updateCS,
    deleteCS,
    getEditForm,
} = require('../controllers/customerServiceController');
const { getProduct, getUnmappedProductsView, updateProductMapping, updateHPP, updateProductFieldController, createProduct, editProduct, removeProduct } = require('../controllers/productController');
const { getdebugImportPage, debugImport } = require('../controllers/debugController');
const { getPerformancePage, getSalarySlip } = require('../controllers/performanceController');

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
router.get('/api/cs-products', getCSProductLeaderboard);

// ============================================
// PERFORMANCE & SALARY ROUTES
// ============================================
router.get('/performance-cs', getPerformancePage);
router.get('/performance-cs/salary-slip', getSalarySlip);

// ============================================
// CUSTOMER SERVICE ROUTES
// ============================================

router.get('/customer-service', getCustomerServices);
router.post('/customer-service/create', createCS);
router.get('/customer-service/edit/:id', getEditForm);
router.post('/customer-service/update', updateCS);
router.post('/customer-service/delete', deleteCS);

// ============================================ 
// DEBUG ROUTES
// ============================================
router.get('/import-debug', getdebugImportPage);
router.post('/import-debug', upload.single('excelFile'), debugImport);

// ============================================
// PRODUCT ROUTES
// ============================================

router.get('/products', getProduct);
router.get('/unmapped-products', getUnmappedProductsView);
// Update mapping produk massal dengan 2 parameter: extractedItem dan productId
router.post('/mass-update-product', updateProductMapping);
// Update HPP product
router.post('/update-hpp', updateHPP);
// Update product field (inline editing)
router.post('/update-product-field', updateProductFieldController);
// CRUD operations untuk produk
router.post('/products/create', createProduct);
router.post('/products/update', editProduct);
router.post('/products/delete', removeProduct);

module.exports = router;
