'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Plus, Search, Trash, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAllInventory, InventoryItem as ServiceInventoryItem } from '@/utils/inventoryService';

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
}

// Use the interface from inventoryService rather than redefining it
type InventoryItem = ServiceInventoryItem;

interface TransferItem {
  productId: number;
  product: Product | undefined;
  quantity: number;
  availableQuantity: number;
  notes?: string;
}

const NewStockTransferPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sourceInventory, setSourceInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    reason: '',
    notes: '',
    items: [] as TransferItem[]
  });

  // Load warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/warehouses');
        const data = await response.json();
        setWarehouses(data);
      } catch (error) {
        console.error('Error loading warehouses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load warehouses. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchWarehouses();
  }, [toast]);

  // Load source inventory when source warehouse changes
  useEffect(() => {
    const fetchSourceInventory = async () => {
      if (!formData.sourceWarehouseId) return;
      
      // Reset destination warehouse if it's the same as source
      if (formData.destinationWarehouseId === formData.sourceWarehouseId) {
        setFormData(prev => ({ ...prev, destinationWarehouseId: '' }));
      }
      
      setIsLoadingInventory(true);
      try {
        const warehouseId = parseInt(formData.sourceWarehouseId);
        const data = await getAllInventory({ warehouseId });
        
        // Filter out items with zero quantity
        const availableItems = data.filter(item => item.quantity > 0);
        setSourceInventory(availableItems);
        setFilteredInventory(availableItems);
      } catch (error) {
        console.error('Error loading inventory:', error);
        toast({
          title: 'Error',
          description: 'Failed to load inventory data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingInventory(false);
      }
    };
    
    fetchSourceInventory();
  }, [formData.sourceWarehouseId, formData.destinationWarehouseId, toast]);

  // Filter inventory based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventory(sourceInventory);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sourceInventory.filter(item => 
      item.product?.name?.toLowerCase().includes(query) || 
      item.product?.sku?.toLowerCase().includes(query)
    );
    
    setFilteredInventory(filtered);
  }, [searchQuery, sourceInventory]);

  // Form change handlers
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add item to transfer
  const handleAddItem = (item: InventoryItem) => {
    // Check if the item is already in the list
    const exists = formData.items.some(
      (transferItem) => transferItem.productId === item.productId
    );

    if (exists) {
      toast({
        title: "Already Added",
        description: "This item is already in the transfer list.",
        variant: "destructive"
      });
      return;
    }

    // Only add if product exists
    if (item.product) {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: item.productId,
            product: item.product,
            quantity: 1,
            availableQuantity: item.quantity,
            notes: ""
          }
        ]
      }));
    } else {
      toast({
        title: "Error",
        description: "Cannot add item with missing product information",
        variant: "destructive"
      });
    }
  };

  // Remove item from transfer
  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update item quantity
  const handleQuantityChange = (index: number, quantity: number) => {
    const item = formData.items[index];
    
    if (!item) return;
    
    // Don't allow quantity to exceed available or go below 1
    const validQuantity = Math.min(
      Math.max(1, quantity), 
      item.availableQuantity
    );
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { ...item, quantity: validQuantity } 
          : item
      )
    }));
  };

  // Update item notes
  const handleItemNotesChange = (index: number, notes: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index 
          ? { ...item, notes } 
          : item
      )
    }));
  };

  // Submit transfer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sourceWarehouseId) {
      toast({
        title: 'Error',
        description: 'Please select a source warehouse.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.destinationWarehouseId) {
      toast({
        title: 'Error',
        description: 'Please select a destination warehouse.',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      toast({
        title: 'Error',
        description: 'Source and destination warehouses must be different.',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to transfer.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const transferData = {
        sourceWarehouseId: parseInt(formData.sourceWarehouseId),
        destinationWarehouseId: parseInt(formData.destinationWarehouseId),
        reason: formData.reason || 'Stock rebalancing',
        notes: formData.notes,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes
        }))
      };
      
      // Call API to create transfer
      const response = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create stock transfer');
      }
      
      toast({
        title: 'Success',
        description: 'Stock transfer created successfully.',
      });
      
      // Redirect to transfers list
      router.push('/dashboard/stock-transfers');
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create stock transfer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/dashboard/inventory')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Stock Transfer</h1>
          <p className="text-muted-foreground">
            Move products between warehouses
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Details</CardTitle>
              <CardDescription>Select source and destination warehouses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceWarehouse">Source Warehouse</Label>
                  <Select 
                    value={formData.sourceWarehouseId}
                    onValueChange={(value) => handleChange('sourceWarehouseId', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="sourceWarehouse">
                      <SelectValue placeholder="Select source warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem 
                          key={warehouse.id} 
                          value={warehouse.id.toString()}
                          disabled={warehouse.id.toString() === formData.destinationWarehouseId}
                        >
                          {warehouse.name} ({warehouse.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="destinationWarehouse">Destination Warehouse</Label>
                  <Select 
                    value={formData.destinationWarehouseId}
                    onValueChange={(value) => handleChange('destinationWarehouseId', value)}
                    disabled={isSubmitting || !formData.sourceWarehouseId}
                  >
                    <SelectTrigger id="destinationWarehouse">
                      <SelectValue placeholder="Select destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem 
                          key={warehouse.id} 
                          value={warehouse.id.toString()}
                          disabled={warehouse.id.toString() === formData.sourceWarehouseId}
                        >
                          {warehouse.name} ({warehouse.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select 
                  value={formData.reason}
                  onValueChange={(value) => handleChange('reason', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select transfer reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_rebalancing">Stock Rebalancing</SelectItem>
                    <SelectItem value="store_request">Store Request</SelectItem>
                    <SelectItem value="damaged_items">Damaged Items</SelectItem>
                    <SelectItem value="seasonal_adjustment">Seasonal Adjustment</SelectItem>
                    <SelectItem value="new_location">New Location</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional details about this transfer..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Items to Transfer</CardTitle>
              <CardDescription>Select products from the source warehouse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.sourceWarehouseId ? (
                <div className="text-center p-6 text-muted-foreground">
                  Please select a source warehouse first
                </div>
              ) : isLoadingInventory ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="rounded-md border">
                    <div className="max-h-60 overflow-auto">
                      {filteredInventory.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No products available in this warehouse
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Available</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredInventory.map(item => {
                              const isAdded = formData.items.some(transferItem => 
                                transferItem.productId === item.productId
                              );
                              
                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.product?.sku}</TableCell>
                                  <TableCell>{item.product?.name}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.shelfLocation || '-'}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAddItem(item)}
                                      disabled={isAdded || isSubmitting}
                                    >
                                      <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                  
                  {formData.items.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="font-medium text-lg">Selected Items</h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead className="w-[150px]">Quantity</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="w-[80px] text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                                    <p className="text-sm text-muted-foreground">{item.product?.sku || 'N/A'}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={item.availableQuantity}
                                      value={item.quantity}
                                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      / {item.availableQuantity}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    placeholder="Optional item notes..."
                                    value={item.notes || ''}
                                    onChange={(e) => handleItemNotesChange(index, e.target.value)}
                                    disabled={isSubmitting}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRemoveItem(index)}
                                    disabled={isSubmitting}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.sourceWarehouseId ||
                  !formData.destinationWarehouseId ||
                  formData.items.length === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Transfer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default NewStockTransferPage; 