'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, Warehouse } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { secureApi } from '@/utils/api';

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
}

interface InventoryItem {
  id: number;
  productId: number;
  product: Product;
  warehouseId: number;
  quantity: number;
  minQuantity: number;
  alertThreshold: number;
  shelfLocation: string;
  barcode?: string;
  lastStockCheck?: string;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

const InventoryPage = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await secureApi.get('/warehouses');
        const data = response.data;
        setWarehouses(data);
        
        if (data.length > 0) {
          setSelectedWarehouse(data[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load warehouses. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    fetchWarehouses();
  }, [toast]);

  // Fetch inventory for selected warehouse
  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedWarehouse) return;
      
      setIsLoading(true);
      try {
        const response = await secureApi.get(`/warehouses/${selectedWarehouse}/inventory`);
        const data = response.data;
        setInventory(data);
        setFilteredInventory(data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast({
          title: 'Error',
          description: 'Failed to load inventory data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedWarehouse) {
      fetchInventory();
    }
  }, [selectedWarehouse, toast]);

  // Filter inventory based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = inventory.filter(item => 
      item.product.name.toLowerCase().includes(query) || 
      item.product.sku.toLowerCase().includes(query) ||
      item.shelfLocation.toLowerCase().includes(query)
    );
    
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);

  // Determine if stock level is low
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minQuantity) {
      return { label: 'Out of Stock', color: 'destructive' };
    } else if (item.quantity <= item.alertThreshold) {
      return { label: 'Low Stock', color: 'warning' };
    } else {
      return { label: 'In Stock', color: 'success' };
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage and track inventory across all warehouses
          </p>
        </div>
        <Button>
          Stock Adjustment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => item.quantity <= item.alertThreshold).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Out of Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.filter(item => item.quantity <= item.minQuantity).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>View and manage inventory across all warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 space-x-2">
            <div className="flex items-center w-full max-w-sm space-x-2">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline">Export</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No inventory items found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery ? "Try adjusting your search query" : "This warehouse has no inventory items"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px]">Quantity</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[100px]">Last Check</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.sku}</TableCell>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.product.category}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={status.color as any}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{item.shelfLocation}</TableCell>
                        <TableCell>{item.lastStockCheck ? new Date(item.lastStockCheck).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPage; 