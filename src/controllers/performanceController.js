const { getCSPerformance, getSingleCSPerformance } = require('../models/performanceModel');

/**
 * Menampilkan halaman utama performa CS
 */
const getPerformancePage = async (req, res) => {
    try {
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;

        const performanceData = await getCSPerformance(startDate, endDate);

        res.render('performance-cs', {
            performanceData,
            startDate,
            endDate,
            pageTitle: 'Performa Customer Service'
        });
    } catch (error) {
        console.error('Error in getPerformancePage:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * Menampilkan halaman slip gaji untuk dicetak
 */
const getSalarySlip = async (req, res) => {
    try {
        const { agentName, startDate, endDate } = req.query;
        
        if (!agentName) return res.redirect('/performance-cs');

        const csData = await getSingleCSPerformance(agentName, startDate, endDate);

        if (!csData) {
            return res.status(404).send('Data agen tidak ditemukan untuk periode ini');
        }

        res.render('salary-slip', {
            cs: csData,
            startDate,
            endDate,
            pageTitle: `Slip Gaji - ${agentName}`
        });
    } catch (error) {
        console.error('Error in getSalarySlip:', error.message);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { getPerformancePage, getSalarySlip };