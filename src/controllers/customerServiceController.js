const {
    getAllCustomerService,
    getCustomerServiceById,
    createCustomerService,
    updateCustomerService,
    deleteCustomerService,
} = require('../models/customerServiceModel');

// Get all customer service agents
const getCustomerServices = async (req, res) => {
    try {
        const customerServices = await getAllCustomerService();
        console.log('DEBUG: Data Customer Service dari DB:', JSON.stringify(customerServices, null, 2));
        res.render('customer-service', { 
            customerServices, 
            pageTitle: 'Customer Service Management',
            editingId: null,
            editingData: null
        });
    } catch (error) {
        console.error('Error fetching customer services:', error.message);
        res.status(500).render('customer-service', {
            customerServices: [],
            pageTitle: 'Customer Service Management',
            error: error.message,
            editingId: null,
            editingData: null
        });
    }
};

// Create new customer service agent
const createCS = async (req, res) => {
    try {
        const { id, realName, agentName, phoneNumber } = req.body;

        // Validation
        if (!id || !realName || !agentName || !phoneNumber) {
            const customerServices = await getAllCustomerService();
            return res.render('customer-service', {
                customerServices,
                pageTitle: 'Customer Service Management',
                error: 'Semua field harus diisi',
                editingId: null,
                editingData: null
            });
        }

        // Check if ID already exists using "ID Customer Service"
        const existingCS = await getCustomerServiceById(id);
        if (existingCS) {
            const customerServices = await getAllCustomerService();
            return res.render('customer-service', {
                customerServices,
                pageTitle: 'Customer Service Management',
                error: `ID ${id} sudah ada`,
                editingId: null,
                editingData: null
            });
        }

        const newCS = {
            'ID Customer Service': id,
            'Real Name': realName,
            'Agent Name': agentName,
            'Phone Number': phoneNumber
        };

        await createCustomerService(newCS);
        const customerServices = await getAllCustomerService();
        
        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            success: 'Customer Service berhasil ditambahkan',
            editingId: null,
            editingData: null
        });
    } catch (error) {
        console.error('Error creating customer service:', error.message);
        const customerServices = await getAllCustomerService();
        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            error: 'Gagal menambahkan Customer Service: ' + error.message,
            editingId: null,
            editingData: null
        });
    }
};

// Update customer service agent
const updateCS = async (req, res) => {
    try {
        const { id, realName, agentName, phoneNumber } = req.body;

        // Validation
        if (!id || !realName || !agentName || !phoneNumber) {
            const customerServices = await getAllCustomerService();
            return res.render('customer-service', {
                customerServices,
                pageTitle: 'Customer Service Management',
                error: 'Semua field harus diisi',
                editingId: null,
                editingData: null
            });
        }

        const updates = {
            'Real Name': realName,
            'Agent Name': agentName,
            'Phone Number': phoneNumber
        };

        await updateCustomerService(id, updates);
        const customerServices = await getAllCustomerService();

        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            success: 'Customer Service berhasil diperbarui',
            editingId: null,
            editingData: null
        });
    } catch (error) {
        console.error('Error updating customer service:', error.message);
        const customerServices = await getAllCustomerService();
        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            error: 'Gagal memperbarui Customer Service: ' + error.message,
            editingId: null,
            editingData: null
        });
    }
};

// Delete customer service agent
const deleteCS = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            const customerServices = await getAllCustomerService();
            return res.render('customer-service', {
                customerServices,
                pageTitle: 'Customer Service Management',
                error: 'ID tidak valid',
                editingId: null,
                editingData: null
            });
        }

        await deleteCustomerService(id);
        const customerServices = await getAllCustomerService();

        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            success: 'Customer Service berhasil dihapus',
            editingId: null,
            editingData: null
        });
    } catch (error) {
        console.error('Error deleting customer service:', error.message);
        const customerServices = await getAllCustomerService();
        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            error: 'Gagal menghapus Customer Service: ' + error.message,
            editingId: null,
            editingData: null
        });
    }
};

// Get edit form
const getEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const cs = await getCustomerServiceById(id);
        const allCS = await getAllCustomerService();

        if (!cs) {
            return res.render('customer-service', {
                customerServices: allCS,
                pageTitle: 'Customer Service Management',
                error: 'Data tidak ditemukan',
                editingId: null,
                editingData: null
            });
        }

        console.log('DEBUG: Data CS yang akan di-edit:', JSON.stringify(cs, null, 2));
        res.render('customer-service', {
            customerServices: allCS,
            pageTitle: 'Customer Service Management',
            editingId: id,
            editingData: cs
        });
    } catch (error) {
        console.error('Error fetching edit form:', error.message);
        const customerServices = await getAllCustomerService();
        res.render('customer-service', {
            customerServices,
            pageTitle: 'Customer Service Management',
            error: 'Data tidak ditemukan',
            editingId: null,
            editingData: null
        });
    }
};

module.exports = {
    getCustomerServices,
    createCS,
    updateCS,
    deleteCS,
    getEditForm,
};
