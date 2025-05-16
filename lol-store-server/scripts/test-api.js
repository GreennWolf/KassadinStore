/**
 * Test API connectivity
 * This script tests basic API functionality
 */

const axios = require('axios');
const logger = require('../utils/logger');

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

async function testAPI() {
  logger.info('Testing API connectivity...');
  
  try {
    // Test if server is running
    logger.info('Testing server health...');
    const healthResponse = await axios.get(`${API_URL}/users/health`);
    logger.info('Server health response:', healthResponse.data);
    
    // Try listing champions
    logger.info('Testing champions endpoint...');
    const championsResponse = await axios.get(`${API_URL}/champions`);
    logger.info(`Champions endpoint returned ${championsResponse.data.length} champions`);
    
    // Try listing currencies
    logger.info('Testing currencies endpoint...');
    const currenciesResponse = await axios.get(`${API_URL}/currencies`);
    logger.info(`Currencies endpoint returned ${currenciesResponse.data.length} currencies`);
    
    logger.info('All tests completed successfully');
  } catch (error) {
    if (error.response) {
      logger.error('API error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      logger.error('No response from server. Make sure the server is running.');
    } else {
      logger.error('Error setting up request:', error.message);
    }
  }
}

testAPI().finally(() => {
  process.exit(0);
});