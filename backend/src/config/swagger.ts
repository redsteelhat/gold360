import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gold360 API',
      version: '1.0.0',
      description: 'Gold360 API Documentation',
      contact: {
        name: 'Gold360 Support',
        email: 'support@gold360.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Model schemas will be defined here
        StockTransfer: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the transfer',
            },
            sourceWarehouseId: {
              type: 'integer',
              description: 'ID of the source warehouse',
            },
            destinationWarehouseId: {
              type: 'integer',
              description: 'ID of the destination warehouse',
            },
            referenceNumber: {
              type: 'string',
              description: 'Unique reference number for the transfer',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
              description: 'Current status of the transfer',
            },
            initiatedDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date when the transfer was initiated',
            },
            completedDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Date when the transfer was completed (if completed)',
            },
            shippingMethod: {
              type: 'string',
              nullable: true,
              description: 'Shipping method used for the transfer',
            },
            trackingNumber: {
              type: 'string',
              nullable: true,
              description: 'Tracking number for the shipment',
            },
            estimatedArrival: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Estimated arrival date',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Any notes for the transfer',
            },
            initiatedById: {
              type: 'integer',
              description: 'ID of the user who initiated the transfer',
            },
            completedById: {
              type: 'integer',
              nullable: true,
              description: 'ID of the user who completed the transfer (if completed)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: [
            'sourceWarehouseId', 
            'destinationWarehouseId', 
            'status', 
            'initiatedDate', 
            'initiatedById'
          ]
        },
        TransferItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the transfer item',
            },
            transferId: {
              type: 'integer',
              description: 'ID of the parent transfer',
            },
            productId: {
              type: 'integer',
              description: 'ID of the product being transferred',
            },
            quantity: {
              type: 'integer',
              description: 'Quantity of the product being transferred',
            },
            unitCost: {
              type: 'number',
              format: 'decimal',
              description: 'Unit cost of the product',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Any notes for this specific item',
            },
            receivedQuantity: {
              type: 'integer',
              nullable: true,
              description: 'Quantity received at destination (if any)',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_transit', 'partial', 'completed', 'cancelled'],
              description: 'Current status of the transfer item',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: [
            'transferId', 
            'productId', 
            'quantity', 
            'unitCost', 
            'status'
          ]
        },
        // Request and response schemas
        CreateTransferRequest: {
          type: 'object',
          properties: {
            sourceWarehouseId: {
              type: 'integer',
              description: 'ID of the source warehouse',
            },
            destinationWarehouseId: {
              type: 'integer',
              description: 'ID of the destination warehouse',
            },
            initiatedById: {
              type: 'integer',
              description: 'ID of the user initiating the transfer',
            },
            shippingMethod: {
              type: 'string',
              description: 'Shipping method to be used',
            },
            trackingNumber: {
              type: 'string',
              description: 'Tracking number for the shipment',
            },
            estimatedArrival: {
              type: 'string',
              format: 'date',
              description: 'Estimated arrival date (YYYY-MM-DD)',
            },
            notes: {
              type: 'string',
              description: 'Notes for the transfer',
            },
            items: {
              type: 'array',
              description: 'Items to be transferred',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'integer',
                    description: 'ID of the product to transfer',
                  },
                  quantity: {
                    type: 'integer',
                    description: 'Quantity to transfer',
                    minimum: 1,
                  },
                  unitCost: {
                    type: 'number',
                    description: 'Unit cost of the product',
                    minimum: 0,
                  },
                  notes: {
                    type: 'string',
                    description: 'Notes for this item',
                  },
                },
                required: [
                  'productId',
                  'quantity',
                  'unitCost'
                ]
              },
            },
          },
          required: [
            'sourceWarehouseId',
            'destinationWarehouseId',
            'initiatedById',
            'items'
          ]
        },
        UpdateStatusRequest: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
              description: 'New status for the transfer',
            },
            completedById: {
              type: 'integer',
              description: 'ID of the user completing the transfer (required for COMPLETED status)',
            },
          },
          required: ['status']
        },
        UpdateTransferItemRequest: {
          type: 'object',
          properties: {
            receivedQuantity: {
              type: 'integer',
              description: 'Quantity received at destination',
              minimum: 0,
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_transit', 'partial', 'completed', 'cancelled'],
              description: 'New status for the item',
            },
            notes: {
              type: 'string',
              description: 'Updated notes for this item',
            },
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'object',
              description: 'Error details',
            },
          },
          required: ['message']
        }
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API routes and controllers
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app: Express, port: number) => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`);
};

export default swaggerDocs; 