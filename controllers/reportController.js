// controllers/reportController.js
const supabase = require('../supabase');

/**
 * Get all test requests with related data
 */
async function getAllTestRequests() {
  try {
    const { data, error } = await supabase
      .from('test_request')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching test requests:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Exception in getAllTestRequests:', err);
    return [];
  }
}

/**
 * Get test requests filtered by time range
 * @param {string} timeFilter - 'today', 'week', 'month'
 */
async function getTestRequestsByTimeFilter(timeFilter = 'today') {
  try {
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const { data, error } = await supabase
      .from('test_request')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching test requests by time:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Exception in getTestRequestsByTimeFilter:', err);
    return [];
  }
}

/**
 * Get test request statistics by status
 * Status values: 'done', 'in_progress', 'rejected', 'pending'
 * @param {string} timeFilter - 'today', 'week', 'month'
 */
async function getTestRequestStats(timeFilter = 'today') {
  try {
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    const stats = {
      total: requests.length,
      inProgress: 0,
      done: 0,
      error: 0
    };

    // Count by status field
    requests.forEach(request => {
      const status = request.status?.toLowerCase() || '';
      
      if (status === 'done' || status === 'completed') {
        stats.done++;
      } else if (status === 'rejected' || status === 'error') {
        stats.error++;
      } else if (status === 'in_progress' || status === 'pending') {
        stats.inProgress++;
      }
    });

    return stats;
  } catch (err) {
    console.error('❌ Exception in getTestRequestStats:', err);
    return { total: 0, inProgress: 0, done: 0, error: 0 };
  }
}

/**
 * Get top DNA types (test_target) by frequency
 * @param {number} limit - Number of top results
 * @param {string} timeFilter - 'today', 'week', 'month'
 */
async function getTopDNATypes(limit = 5, timeFilter = 'month') {
  try {
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    // Count occurrences of each test_target
    const dnaCount = {};
    requests.forEach(request => {
      if (request.test_target) {
        dnaCount[request.test_target] = (dnaCount[request.test_target] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const sorted = Object.entries(dnaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return {
      labels: sorted.map(item => item[0]),
      values: sorted.map(item => item[1])
    };
  } catch (err) {
    console.error('❌ Exception in getTopDNATypes:', err);
    return { labels: [], values: [] };
  }
}

/**
 * Get top specimens by frequency (from test_request.Specimen field)
 * @param {number} limit - Number of top results
 * @param {string} timeFilter - 'today', 'week', 'month'
 */
async function getTopSpecimens(limit = 5, timeFilter = 'month') {
  try {
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    // Count occurrences of each specimen type
    const specimenCount = {};
    requests.forEach(request => {
      if (request.Specimen) {
        specimenCount[request.Specimen] = (specimenCount[request.Specimen] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const sorted = Object.entries(specimenCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return {
      labels: sorted.map(item => item[0]),
      values: sorted.map(item => item[1])
    };
  } catch (err) {
    console.error('❌ Exception in getTopSpecimens:', err);
    return { labels: [], values: [] };
  }
}

/**
 * Get rejected specimens statistics
 * @param {string} timeFilter - 'today', 'week', 'month'
 */
async function getRejectedSpecimens(timeFilter = 'month') {
  try {
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    // Filter only rejected requests
    const rejected = requests.filter(r => 
      r.status?.toLowerCase() === 'rejected' || 
      r.status?.toLowerCase() === 'error'
    );

    // Count by specimen type
    const specimenCount = {};
    rejected.forEach(request => {
      if (request.Specimen) {
        specimenCount[request.Specimen] = (specimenCount[request.Specimen] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    const sorted = Object.entries(specimenCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sorted.map(item => item[0]),
      values: sorted.map(item => item[1])
    };
  } catch (err) {
    console.error('❌ Exception in getRejectedSpecimens:', err);
    return { labels: [], values: [] };
  }
}

/**
 * Get error/rejection rate over time
 * @param {string} range - 'week' or 'month'
 */
async function getErrorRateTimeSeries(range = 'week') {
  try {
    const timeFilter = range === 'week' ? 'week' : 'month';
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    if (range === 'week') {
      // Last 7 days
      const labels = [];
      const values = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRequests = requests.filter(r => 
          r.created_at?.startsWith(dateStr)
        );
        
        const rejectedCount = dayRequests.filter(r => 
          r.status?.toLowerCase() === 'rejected' || 
          r.status?.toLowerCase() === 'error'
        ).length;
        
        const rate = dayRequests.length > 0 
          ? ((rejectedCount / dayRequests.length) * 100).toFixed(1)
          : 0;
        
        labels.push(i === 0 ? 'วันนี้' : `วันนี้-${i}`);
        values.push(parseFloat(rate));
      }
      
      return { labels, values };
    } else {
      // Last 4 weeks
      const labels = ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4'];
      const values = [];
      
      for (let week = 0; week < 4; week++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (week + 1) * 7);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - week * 7);
        
        const weekRequests = requests.filter(r => {
          const reqDate = new Date(r.created_at);
          return reqDate >= startDate && reqDate < endDate;
        });
        
        const rejectedCount = weekRequests.filter(r => 
          r.status?.toLowerCase() === 'rejected' || 
          r.status?.toLowerCase() === 'error'
        ).length;
        
        const rate = weekRequests.length > 0 
          ? ((rejectedCount / weekRequests.length) * 100).toFixed(1)
          : 0;
        
        values.push(parseFloat(rate));
      }
      
      return { labels: labels.reverse(), values: values.reverse() };
    }
  } catch (err) {
    console.error('❌ Exception in getErrorRateTimeSeries:', err);
    return { labels: [], values: [] };
  }
}

/**
 * Get test requests grouped by date for chart visualization
 * @param {string} range - 'daily' or 'weekly'
 * @param {string} timeFilter - 'today', 'week', 'month'
 */
async function getTestRequestsTimeSeries(range = 'daily', timeFilter = 'week') {
  try {
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    if (range === 'daily') {
      // Group by 4-hour intervals
      const hours = Array.from({ length: 6 }, (_, i) => `${String(i * 4).padStart(2, '0')}:00`);
      const counts = new Array(6).fill(0);
      
      requests.forEach(request => {
        const hour = new Date(request.created_at).getHours();
        const index = Math.floor(hour / 4);
        if (index < 6) counts[index]++;
      });

      return { labels: hours, values: counts };
    } else {
      // Group by day of week
      const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
      const counts = new Array(7).fill(0);
      
      requests.forEach(request => {
        const day = new Date(request.created_at).getDay();
        const index = day === 0 ? 6 : day - 1; // Convert Sunday (0) to index 6
        counts[index]++;
      });

      return { labels: days, values: counts };
    }
  } catch (err) {
    console.error('❌ Exception in getTestRequestsTimeSeries:', err);
    return { labels: [], values: [] };
  }
}

/**
 * Get TAT (Turn Around Time) statistics
 * Based on SLA comparison from specimen type
 */
async function getTATStats(timeFilter = 'today') {
  try {
    const requests = await getTestRequestsByTimeFilter(timeFilter);
    
    // Get SLA map
    const { getSpecimenSLA } = require('./testRequestController');
    const slaMap = await getSpecimenSLA();
    
    const stats = {
      inSLA: 0,
      inProgress: 0,
      overSLA: 0
    };

    requests.forEach(request => {
      const status = request.status?.toLowerCase() || '';
      const specimen = request.Specimen;
      const sla = slaMap[specimen] || 24; // Default 24 hours
      
      if (status === 'done' || status === 'completed') {
        // Calculate TAT
        const createdAt = new Date(request.created_at);
        const now = new Date();
        const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
        
        if (hoursDiff <= sla) {
          stats.inSLA++;
        } else {
          stats.overSLA++;
        }
      } else if (status === 'in_progress' || status === 'pending') {
        stats.inProgress++;
      }
    });

    return stats;
  } catch (err) {
    console.error('❌ Exception in getTATStats:', err);
    return { inSLA: 0, inProgress: 0, overSLA: 0 };
  }
}

/**
 * Get dashboard summary data
 */
async function getDashboardSummary(timeFilter = 'today') {
  try {
    const stats = await getTestRequestStats(timeFilter);
    const tatStats = await getTATStats(timeFilter);
    const topDNA = await getTopDNATypes(5, timeFilter);
    const topSpecimens = await getTopSpecimens(5, timeFilter);
    const rejectedSpecimens = await getRejectedSpecimens(timeFilter);
    const timeSeries = await getTestRequestsTimeSeries('daily', timeFilter);
    const errorRateSeries = await getErrorRateTimeSeries('week');

    // Calculate rejection rate
    const rejectionRate = stats.total > 0 
      ? ((stats.error / stats.total) * 100).toFixed(1)
      : 0;

    return {
      stats,
      tatStats,
      topDNA,
      topSpecimens,
      rejectedSpecimens,
      timeSeries,
      errorRateSeries,
      rejectionRate: parseFloat(rejectionRate)
    };
  } catch (err) {
    console.error('❌ Exception in getDashboardSummary:', err);
    return null;
  }
}

module.exports = {
  getAllTestRequests,
  getTestRequestsByTimeFilter,
  getTestRequestStats,
  getTopDNATypes,
  getTopSpecimens,
  getRejectedSpecimens,
  getErrorRateTimeSeries,
  getTestRequestsTimeSeries,
  getTATStats,
  getDashboardSummary
};
