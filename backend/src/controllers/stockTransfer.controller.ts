import { Request, Response } from 'express';
import { StockTransfer, TransferItem, Product, Warehouse, User } from '../models';
import { Op } from 'sequelize';

/**
 * @swagger
 * tags:
 *   name: StockTransfers
 *   description: Stock transfer management operations
 */

/**
 * @swagger
 * /stock-transfers:
 *   get:
 *     summary: Get all stock transfers
 *     tags: [StockTransfers]
 *     description: Retrieve a list of all stock transfers with source and destination warehouse details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of stock transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StockTransfer'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllTransfers = async (req: Request, res: Response) => {
  try {
    const transfers = await StockTransfer.findAll({
      include: [
        { model: Warehouse, as: 'sourceWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        { model: User, as: 'initiatedBy' },
        { model: User, as: 'completedBy' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /stock-transfers/{id}:
 *   get:
 *     summary: Get a stock transfer by ID
 *     tags: [StockTransfers]
 *     description: Retrieve detailed information about a stock transfer including all items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The stock transfer ID
 *     responses:
 *       200:
 *         description: Detailed stock transfer information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockTransfer'
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getTransferById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const transfer = await StockTransfer.findByPk(id, {
      include: [
        { model: Warehouse, as: 'sourceWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        { model: User, as: 'initiatedBy' },
        { model: User, as: 'completedBy' },
        { 
          model: TransferItem, 
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    
    return res.status(200).json(transfer);
  } catch (error) {
    console.error('Error fetching transfer details:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /stock-transfers:
 *   post:
 *     summary: Create a new stock transfer
 *     tags: [StockTransfers]
 *     description: Create a new stock transfer with items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransferRequest'
 *     responses:
 *       201:
 *         description: Stock transfer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transfer created successfully
 *                 transfer:
 *                   $ref: '#/components/schemas/StockTransfer'
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TransferItem'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createTransfer = async (req: Request, res: Response) => {
  try {
    const {
      sourceWarehouseId,
      destinationWarehouseId,
      initiatedById,
      shippingMethod,
      trackingNumber,
      estimatedArrival,
      notes,
      items
    } = req.body;
    
    // Temel validasyonlar
    if (sourceWarehouseId === destinationWarehouseId) {
      return res.status(400).json({ message: 'Source and destination warehouses cannot be the same' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Transfer must have at least one item' });
    }
    
    // Referans numarası oluştur
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Aynı ay içinde kaç transfer olduğunu kontrol et
    const count = await StockTransfer.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(date.getFullYear(), date.getMonth(), 1),
          [Op.lt]: new Date(date.getFullYear(), date.getMonth() + 1, 1)
        }
      }
    });
    
    const referenceNumber = `TRF-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
    
    // Transfer oluştur
    const newTransfer = await StockTransfer.create({
      sourceWarehouseId,
      destinationWarehouseId,
      initiatedById,
      shippingMethod,
      trackingNumber,
      estimatedArrival,
      notes,
      status: 'PENDING',
      initiatedDate: new Date(),
      referenceNumber
    });
    
    // Transfer kalemleri oluştur
    const transferItems = await Promise.all(
      items.map((item: any) => 
        TransferItem.create({
          transferId: newTransfer.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          notes: item.notes,
          status: 'pending'
        })
      )
    );
    
    return res.status(201).json({
      message: 'Transfer created successfully',
      transfer: newTransfer,
      items: transferItems
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /stock-transfers/{id}/status:
 *   put:
 *     summary: Update a stock transfer status
 *     tags: [StockTransfers]
 *     description: Update the status of a stock transfer and optionally mark it as completed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The stock transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *     responses:
 *       200:
 *         description: Stock transfer status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transfer status updated to COMPLETED
 *                 transfer:
 *                   $ref: '#/components/schemas/StockTransfer'
 *       400:
 *         description: Invalid input or status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateTransferStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, completedById } = req.body;
    
    const transfer = await StockTransfer.findByPk(id);
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    
    // Status validasyonu
    const validStatuses = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Status güncelleme
    await transfer.update({
      status,
      ...(status === 'COMPLETED' && { completedDate: new Date(), completedById }),
    });
    
    // Eğer durum COMPLETED ise, her kalem için receivedQuantity eğer yoksa otomatik olarak quantity'e eşitle
    if (status === 'COMPLETED') {
      // Tamamlanmış ise, her kalem için receivedQuantity eğer yoksa otomatik olarak quantity'e eşitle
      const transferItems = await TransferItem.findAll({ where: { transferId: id } });
      
      for (const item of transferItems) {
        if (item.receivedQuantity === null || item.receivedQuantity === undefined) {
          await item.update({
            status: 'completed',
            receivedQuantity: item.quantity
          });
        }
      }
    } else if (status === 'CANCELLED') {
      // İptal edilmişse, statüsü iptal yap
      await TransferItem.update(
        { status: 'cancelled' },
        { where: { transferId: id } }
      );
    } else if (status === 'IN_TRANSIT') {
      // Yolda ise, ilgili duruma getir
      await TransferItem.update(
        { status: 'in_transit' },
        { where: { transferId: id } }
      );
    }
    
    return res.status(200).json({
      message: `Transfer status updated to ${status}`,
      transfer
    });
  } catch (error) {
    console.error('Error updating transfer status:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /stock-transfers/{transferId}/items/{itemId}:
 *   put:
 *     summary: Update a transfer item
 *     tags: [StockTransfers]
 *     description: Update received quantity, status, or notes of a transfer item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The parent stock transfer ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The transfer item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransferItemRequest'
 *     responses:
 *       200:
 *         description: Transfer item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transfer item updated successfully
 *                 transferItem:
 *                   $ref: '#/components/schemas/TransferItem'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transfer item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateTransferItem = async (req: Request, res: Response) => {
  try {
    const { transferId, itemId } = req.params;
    const { receivedQuantity, status, notes } = req.body;
    
    const transferItem = await TransferItem.findOne({
      where: { id: itemId, transferId }
    });
    
    if (!transferItem) {
      return res.status(404).json({ message: 'Transfer item not found' });
    }
    
    // Validasyon
    if (receivedQuantity !== undefined && (receivedQuantity < 0 || receivedQuantity > transferItem.quantity)) {
      return res.status(400).json({ 
        message: 'Received quantity must be between 0 and the original quantity',
        originalQuantity: transferItem.quantity 
      });
    }
    
    // Status validasyonu
    const validItemStatuses = ['pending', 'in_transit', 'partial', 'completed', 'cancelled'];
    if (status && !validItemStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Hesapla: eğer alınan miktar orijinal miktardan az ise "partial" durumu
    let calculatedStatus = status;
    if (receivedQuantity !== undefined && !status) {
      if (receivedQuantity === 0) {
        calculatedStatus = 'pending';
      } else if (receivedQuantity < transferItem.quantity) {
        calculatedStatus = 'partial';
      } else if (receivedQuantity === transferItem.quantity) {
        calculatedStatus = 'completed';
      }
    }
    
    // Transfer kalemi güncelleme
    await transferItem.update({
      ...(receivedQuantity !== undefined && { receivedQuantity }),
      ...(calculatedStatus && { status: calculatedStatus }),
      ...(notes && { notes })
    });
    
    return res.status(200).json({
      message: 'Transfer item updated successfully',
      transferItem
    });
  } catch (error) {
    console.error('Error updating transfer item:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

/**
 * @swagger
 * /stock-transfers/{id}:
 *   delete:
 *     summary: Delete a stock transfer
 *     tags: [StockTransfers]
 *     description: Delete a stock transfer and all its items (only if in PENDING status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The stock transfer ID
 *     responses:
 *       200:
 *         description: Stock transfer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transfer deleted successfully
 *       400:
 *         description: Cannot delete transfer with non-PENDING status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const transfer = await StockTransfer.findByPk(id);
    
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    
    // Yalnızca PENDING durumundaki transferler silinebilir
    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ 
        message: 'Only transfers with PENDING status can be deleted',
        currentStatus: transfer.status
      });
    }
    
    // Önce transfer kalemlerini sil
    await TransferItem.destroy({ where: { transferId: id } });
    
    // Sonra transfer kaydını sil
    await transfer.destroy();
    
    return res.status(200).json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
}; 