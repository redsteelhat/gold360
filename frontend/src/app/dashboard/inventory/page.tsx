'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { AlertCircle, Search, Warehouse, Barcode, FilePlus, ArrowUpDown, FileDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { InventoryItem, getAllInventory, getInventoryByBarcode } from '@/utils/inventoryService';

const InventoryPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/warehouses');
        const data = await response.json();
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
        const warehouseId = selectedWarehouse ? parseInt(selectedWarehouse) : undefined;
        const data = await getAllInventory({ warehouseId });
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
      item.product?.name?.toLowerCase().includes(query) || 
      item.product?.sku?.toLowerCase().includes(query) ||
      item.shelfLocation?.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    );
    
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);

  // Focus on barcode input when dialog opens
  useEffect(() => {
    if (showBarcodeScanner && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [showBarcodeScanner]);

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

  const handleBarcodeScan = async () => {
    if (!barcode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a barcode',
        variant: 'destructive',
      });
      return;
    }

    setScanStatus('scanning');
    
    try {
      const item = await getInventoryByBarcode(barcode);
      setScanStatus('success');
      
      // Redirect to the adjustment page with this item
      router.push(`/dashboard/inventory/adjust?id=${item.id}`);
    } catch (error) {
      console.error('Error finding item by barcode:', error);
      setScanStatus('error');
      toast({
        title: 'Error',
        description: 'No item found with this barcode',
        variant: 'destructive',
      });
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan();
    }
  };

  const exportInventory = () => {
    // Create CSV content
    const headers = ['SKU', 'Product', 'Category', 'Warehouse', 'Quantity', 'Min Quantity', 'Alert Threshold', 'Location', 'Barcode'];
    
    const rows = filteredInventory.map(item => [
      item.product?.sku || '',
      item.product?.name || '',
      item.product?.category || '',
      item.warehouse?.name || '',
      item.quantity.toString(),
      item.minQuantity.toString(),
      item.alertThreshold.toString(),
      item.shelfLocation || '',
      item.barcode || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
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
        <div className="flex gap-2">
          <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Barcode className="h-4 w-4 mr-2" /> Scan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Scan Barcode</DialogTitle>
                <DialogDescription>
                  Scan or enter a barcode to find an inventory item
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="barcodeInput">Barcode</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="barcodeInput"
                      ref={barcodeInputRef}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder="Scan or type barcode..."
                      disabled={scanStatus === 'scanning'}
                    />
                  </div>
                </div>
                {scanStatus === 'error' && (
                  <div className="text-sm text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> No item found with this barcode
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  onClick={handleBarcodeScan}
                  disabled={scanStatus === 'scanning' || !barcode.trim()}
                >
                  {scanStatus === 'scanning' ? 'Scanning...' : 'Find Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => router.push('/dashboard/inventory/adjust')}>
            <ArrowUpDown className="h-4 w-4 mr-2" /> Adjust
          </Button>
          <Button onClick={() => router.push('/dashboard/stock-transfers/new')}>
            <FilePlus className="h-4 w-4 mr-2" /> Transfer
          </Button>
        </div>
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
              {inventory.filter(item => item.quantity <= item.alertThreshold && item.quantity > item.minQuantity).length}
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
            <Button variant="outline" onClick={exportInventory}>
              <FileDown className="h-4 w-4 mr-2" /> Export
            </Button>
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
                        <TableCell className="font-medium">{item.product?.sku}</TableCell>
                        <TableCell>{item.product?.name}</TableCell>
                        <TableCell>{item.product?.category}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge variant={status.color as any}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{item.shelfLocation || '-'}</TableCell>
                        <TableCell>{item.lastStockCheck ? new Date(item.lastStockCheck).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/dashboard/inventory/adjust?id=${item.id}`)}
                          >
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