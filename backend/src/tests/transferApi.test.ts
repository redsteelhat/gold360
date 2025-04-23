/**
 * StockTransfer API'nin test edilmesi için komut örneklerini içeren dosya
 * Bu dosya tarayıcı konsolunda veya terminal aracılığıyla çalıştırılabilecek fetch komutlarını içerir.
 */

/*
 * Kurulum:
 * 1. Önce seed verileri oluşturmak için:
 *    ts-node src/seeders/transferSeed.ts
 * 
 * 2. Sunucuyu başlatın:
 *    npm run dev
 */

// ---------------------------
// GET ALL TRANSFERS
// ---------------------------
// curl http://localhost:3001/api/stock-transfers
/*
fetch('http://localhost:3001/api/stock-transfers')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
*/

// ---------------------------
// GET TRANSFER BY ID
// ---------------------------
// curl http://localhost:3001/api/stock-transfers/1
/*
fetch('http://localhost:3001/api/stock-transfers/1')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
*/

// ---------------------------
// CREATE NEW TRANSFER
// ---------------------------
/*
curl -X POST http://localhost:3001/api/stock-transfers \
  -H "Content-Type: application/json" \
  -d '{
    "sourceWarehouseId": 1,
    "destinationWarehouseId": 2,
    "initiatedById": 1,
    "shippingMethod": "Kargo",
    "trackingNumber": "TRK789012",
    "estimatedArrival": "2023-10-15",
    "notes": "Test transfer from API",
    "items": [
      {
        "productId": 1,
        "quantity": 5,
        "unitCost": 100,
        "notes": "Test item 1"
      },
      {
        "productId": 2,
        "quantity": 10,
        "unitCost": 50,
        "notes": "Test item 2"
      }
    ]
  }'
*/

/*
fetch('http://localhost:3001/api/stock-transfers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sourceWarehouseId: 1,
    destinationWarehouseId: 2,
    initiatedById: 1,
    shippingMethod: "Kargo",
    trackingNumber: "TRK789012",
    estimatedArrival: "2023-10-15",
    notes: "Test transfer from API",
    items: [
      {
        productId: 1,
        quantity: 5,
        unitCost: 100,
        notes: "Test item 1"
      },
      {
        productId: 2,
        quantity: 10,
        unitCost: 50,
        notes: "Test item 2"
      }
    ]
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
*/

// ---------------------------
// UPDATE TRANSFER STATUS
// ---------------------------
/*
curl -X PUT http://localhost:3001/api/stock-transfers/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_TRANSIT"
  }'
*/

/*
fetch('http://localhost:3001/api/stock-transfers/1/status', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: "IN_TRANSIT"
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
*/

// ---------------------------
// UPDATE TRANSFER ITEM
// ---------------------------
/*
curl -X PUT http://localhost:3001/api/stock-transfers/1/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "receivedQuantity": 8,
    "notes": "Partially received"
  }'
*/

/*
fetch('http://localhost:3001/api/stock-transfers/1/items/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    receivedQuantity: 8,
    notes: "Partially received"
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
*/

// ---------------------------
// DELETE TRANSFER
// ---------------------------
// Not: Sadece PENDING durumundaki transferler silinebilir
/*
curl -X DELETE http://localhost:3001/api/stock-transfers/1
*/

/*
fetch('http://localhost:3001/api/stock-transfers/1', {
  method: 'DELETE'
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
*/ 