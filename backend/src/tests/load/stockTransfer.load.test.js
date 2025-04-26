import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const transferGetTrend = new Trend('transfer_get_duration');
const transferCreateTrend = new Trend('transfer_create_duration');
const transferUpdateTrend = new Trend('transfer_update_duration');
const errorRate = new Rate('error_rate');

// K6 options
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Ramp up to 5 virtual users
    { duration: '1m', target: 10 }, // Increase to 10 users over 1 minute
    { duration: '2m', target: 10 }, // Stay at 10 users for 2 minutes
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    'transfer_get_duration': ['p(95)<1000'], // 95% of requests should be below 1s
    'transfer_create_duration': ['p(95)<2000'], // 95% of creation requests should be below 2s
    'transfer_update_duration': ['p(95)<2000'], // 95% of update requests should be below 2s
    'http_req_duration': ['p(95)<2000'], // 95% of all requests should be below 2s
    'error_rate': ['rate<0.1'], // Error rate should be less than 10%
  },
};

// Test environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || 'YOUR_TEST_API_TOKEN';
const SLEEP_DURATION = __ENV.SLEEP_DURATION || 1;

// Utility to get common headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
});

// Setup function (runs once at the beginning)
export function setup() {
  // You could pre-create some data here if needed
  console.log('Starting load test for StockTransfer endpoints');
  
  // Sample data for tests
  return {
    warehouses: [1, 2, 3], // Sample warehouse IDs
    products: [1, 2, 3, 4, 5], // Sample product IDs
    users: [1, 2, 3], // Sample user IDs
    transferIds: [], // Will be populated during the test
  };
}

// Main function (virtual user logic)
export default function(data) {
  group('Get All Stock Transfers', () => {
    const response = http.get(
      `${BASE_URL}/stock-transfers`,
      { headers: getHeaders() }
    );
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'has transfers array': (r) => Array.isArray(JSON.parse(r.body)),
    });
    
    errorRate.add(!success);
    transferGetTrend.add(response.timings.duration);
    
    if (response.status === 200) {
      const transfers = JSON.parse(response.body);
      if (transfers.length > 0) {
        // Save transfer IDs for later use
        for (let i = 0; i < Math.min(transfers.length, 5); i++) {
          if (!data.transferIds.includes(transfers[i].id)) {
            data.transferIds.push(transfers[i].id);
          }
        }
      }
    }
  });
  
  sleep(SLEEP_DURATION);
  
  // Get transfer by ID (if we have any IDs)
  if (data.transferIds.length > 0) {
    group('Get Stock Transfer by ID', () => {
      const randomId = data.transferIds[randomIntBetween(0, data.transferIds.length - 1)];
      
      const response = http.get(
        `${BASE_URL}/stock-transfers/${randomId}`,
        { headers: getHeaders() }
      );
      
      const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'has transfer data': (r) => {
          const data = JSON.parse(r.body);
          return data.id && data.referenceNumber;
        },
      });
      
      errorRate.add(!success);
      transferGetTrend.add(response.timings.duration);
    });
    
    sleep(SLEEP_DURATION);
  }
  
  // Create a new stock transfer
  group('Create Stock Transfer', () => {
    // Pick random source and destination warehouses (different from each other)
    let sourceWarehouseId = data.warehouses[randomIntBetween(0, data.warehouses.length - 1)];
    let destinationWarehouseId = data.warehouses[randomIntBetween(0, data.warehouses.length - 1)];
    while (sourceWarehouseId === destinationWarehouseId) {
      destinationWarehouseId = data.warehouses[randomIntBetween(0, data.warehouses.length - 1)];
    }
    
    // Generate 1-3 random transfer items
    const itemCount = randomIntBetween(1, 3);
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push({
        productId: data.products[randomIntBetween(0, data.products.length - 1)],
        quantity: randomIntBetween(1, 20),
        unitCost: randomIntBetween(10, 1000) / 10,
        notes: `Test item ${i+1}`
      });
    }
    
    // Create payload for transfer creation
    const payload = JSON.stringify({
      sourceWarehouseId,
      destinationWarehouseId,
      initiatedById: data.users[randomIntBetween(0, data.users.length - 1)],
      shippingMethod: 'Test Shipping',
      trackingNumber: `TRACK-${randomIntBetween(1000, 9999)}`,
      estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Load test transfer',
      items
    });
    
    const response = http.post(
      `${BASE_URL}/stock-transfers`,
      payload,
      { headers: getHeaders() }
    );
    
    const success = check(response, {
      'status is 201': (r) => r.status === 201,
      'has transfer data': (r) => {
        const data = JSON.parse(r.body);
        return data.transfer && data.transfer.id && data.items;
      },
    });
    
    errorRate.add(!success);
    transferCreateTrend.add(response.timings.duration);
    
    // Save the created transfer ID for later use
    if (success && response.status === 201) {
      const responseBody = JSON.parse(response.body);
      data.transferIds.push(responseBody.transfer.id);
    }
  });
  
  sleep(SLEEP_DURATION);
  
  // Update a transfer status (if we have any IDs)
  if (data.transferIds.length > 0) {
    group('Update Transfer Status', () => {
      const randomId = data.transferIds[randomIntBetween(0, data.transferIds.length - 1)];
      const statuses = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
      const randomStatus = statuses[randomIntBetween(0, statuses.length - 1)];
      
      const payload = JSON.stringify({
        status: randomStatus,
        ...(randomStatus === 'COMPLETED' && { 
          completedById: data.users[randomIntBetween(0, data.users.length - 1)] 
        })
      });
      
      const response = http.put(
        `${BASE_URL}/stock-transfers/${randomId}/status`,
        payload,
        { headers: getHeaders() }
      );
      
      const success = check(response, {
        'status is 200': (r) => r.status === 200 || r.status === 404, // 404 is ok if the transfer was deleted
        'has transfer data': (r) => {
          if (r.status !== 200) return true; // Skip if not found
          const data = JSON.parse(r.body);
          return data.transfer && data.message;
        },
      });
      
      errorRate.add(!success);
      transferUpdateTrend.add(response.timings.duration);
    });
    
    sleep(SLEEP_DURATION);
  }
  
  // Delete a transfer (only occasionally to avoid removing all test data)
  if (data.transferIds.length > 0 && Math.random() < 0.1) { // 10% chance
    group('Delete Transfer', () => {
      // Remove and use the last transfer ID to avoid using it again
      const randomIndex = randomIntBetween(0, data.transferIds.length - 1);
      const randomId = data.transferIds[randomIndex];
      data.transferIds.splice(randomIndex, 1);
      
      const response = http.del(
        `${BASE_URL}/stock-transfers/${randomId}`,
        null,
        { headers: getHeaders() }
      );
      
      const success = check(response, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      });
      
      errorRate.add(!success);
    });
  }
  
  sleep(SLEEP_DURATION);
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
  // Additional cleanup could go here if needed
} 