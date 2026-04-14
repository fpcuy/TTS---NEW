const db = require('../config/database');

// Fetch all customer service agents
const getAllCustomerService = async () => {
    try {
        const { data, error } = await db
            .from('customer service')
            .select('*')
            .order('ID Customer Service', { ascending: true });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching customer service:', error.message);
        throw error;
    }
};

// Fetch single customer service by ID
const getCustomerServiceById = async (id) => {
    try {
        const { data, error } = await db
            .from('customer service')
            .select('*')
            .eq('ID Customer Service', id)
            .maybeSingle();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching customer service by ID:', error.message);
        throw error;
    }
};

// Create new customer service agent
const createCustomerService = async (customerService) => {
    try {
        const { data, error } = await db
            .from('customer service')
            .insert([customerService])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error creating customer service:', error.message);
        throw error;
    }
};

// Update customer service agent
const updateCustomerService = async (id, updates) => {
    try {
        const { data, error } = await db
            .from('customer service')
            .update(updates)
            .eq('ID Customer Service', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating customer service:', error.message);
        throw error;
    }
};

// Delete customer service agent
const deleteCustomerService = async (id) => {
    try {
        const { data, error } = await db
            .from('customer service')
            .delete()
            .eq('ID Customer Service', id)
            .select();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting customer service:', error.message);
        throw error;
    }
};

// Fetch performance statistics from view
const getCSPerformance = async () => {
    try {
        const { data, error } = await db
            .from('performa_cs')
            .select('*')
            .order('total_shipments', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching CS performance:', error.message);
        throw error;
    }
};

module.exports = {
    getAllCustomerService,
    getCustomerServiceById,
    createCustomerService,
    updateCustomerService,
    deleteCustomerService,
    getCSPerformance,
};
