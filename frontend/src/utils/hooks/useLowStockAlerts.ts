import { useState, useEffect } from 'react';
import { secureApi } from '@/utils/api';
import { InventoryItem, getAllInventory } from '@/utils/inventoryService';
import { Product, getAllProducts } from '@/utils/productService';
import { useToast } from '@/components/ui/use-toast';

export interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  currentQuantity: number;
  threshold: number;
  warehouseName?: string;
  warehouseId?: number;
  productId: number;
  inventoryId?: number;
  severity: 'critical' | 'warning' | 'normal';
}

export function useLowStockAlerts(limit?: number) {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get low stock inventory items with their product and warehouse data
        const inventoryItems = await getAllInventory({ lowStock: true });
        
        // If that fails or is empty, check individual products that might have low stock
        if (!inventoryItems || inventoryItems.length === 0) {
          const products = await getAllProducts();
          
          const lowItems = products
            .filter(product => 
              product.stockQuantity <= (product.stockAlert || 5)
            )
            .map(product => ({
              id: product.id,
              name: product.name,
              sku: product.sku,
              currentQuantity: product.stockQuantity,
              threshold: product.stockAlert || 5,
              productId: product.id,
              severity: product.stockQuantity === 0 
                ? 'critical' as const
                : product.stockQuantity <= (product.stockAlert || 5) / 2 
                  ? 'warning' as const 
                  : 'normal' as const
            }));
          
          setLowStockItems(limit ? lowItems.slice(0, limit) : lowItems);
        } else {
          // Map inventory data to the desired format
          const lowItems = inventoryItems.map(item => ({
            id: item.id,
            name: item.product?.name || `Product #${item.productId}`,
            sku: item.product?.sku || `SKU-${item.productId}`,
            currentQuantity: item.quantity,
            threshold: item.alertThreshold,
            warehouseName: item.warehouse?.name,
            warehouseId: item.warehouseId,
            productId: item.productId,
            inventoryId: item.id,
            severity: item.quantity === 0 
              ? 'critical' as const
              : item.quantity <= item.alertThreshold / 2 
                ? 'warning' as const 
                : 'normal' as const
          }));
          
          setLowStockItems(limit ? lowItems.slice(0, limit) : lowItems);
        }
      } catch (err) {
        console.error('Error fetching low stock items:', err);
        setError('Failed to fetch low stock items');
        
        toast({
          title: 'Hata',
          description: 'Düşük stok bilgileri alınırken bir hata oluştu',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [limit, toast]);
  
  return { lowStockItems, loading, error };
} 