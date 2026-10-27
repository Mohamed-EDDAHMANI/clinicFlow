import dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const getStats = async (req, res) => {
    const stats = await dashboardService.getStats();
    sendSuccess(res, stats, 'Dashboard stats fetched successfully');
};

export default {
    getStats
};
