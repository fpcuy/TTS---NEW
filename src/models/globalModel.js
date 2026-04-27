//Model Product
const db = require('../config/database');

// Fungsi Global untuk mendapatkan statistik global
const getGlobalStatsData = async () => {
    try {
        const { data, error } = await db.rpc('get_global_stat_data');
        if (error) throw error;
        return data ? data[0] : null; // Asumsikan hanya ada satu baris hasil
    } catch (error) {
        console.error('Error fetching global stats:', error.message);
        throw error;
    }
};

const getBreakdownCS = async () => {
    try {
        const { data, error } = await db.rpc('get_breakdown_cs');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching CS breakdown:', error.message);
        throw error;
    }
};

const getBreakdownProduct = async () => {
    try {
        const { data, error } = await db.rpc('get_breakdown_product');
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching product breakdown:', error.message);
        throw error;
    }
};

const getBreakdownProductByCS = async (agentName) => {
    try {
        const { data, error } = await db.rpc('get_breakdown_product_by_cs', { p_agent_name: agentName });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching product breakdown by CS:', error.message);
        throw error;
    }
};

module.exports = { getGlobalStatsData, getBreakdownCS, getBreakdownProduct, getBreakdownProductByCS };