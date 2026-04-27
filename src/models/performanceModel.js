const db = require('../config/database');

/**
 * Mengambil data performa CS berdasarkan rentang tanggal
 */
const getCSPerformance = async (startDate, endDate) => {
    try {
        const { data, error } = await db.rpc('get_breakdown_cs', { 
            p_start_date: startDate, 
            p_end_date: endDate 
        });
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching CS performance model:', error.message);
        throw error;
    }
};

const getSingleCSPerformance = async (agentName, startDate, endDate) => {
    try {
        const data = await getCSPerformance(startDate, endDate);
        return data.find(cs => cs['Agent Name'] === agentName);
    } catch (error) {
        throw error;
    }
};

module.exports = { getCSPerformance, getSingleCSPerformance };