'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormDescription, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Loader2, 
  ChevronLeft, 
  Search, 
  Barcode, 
  Check, 
  X 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { InventoryItem, adjustInventory, getInventoryById, getInventoryByBarcode } from '@/utils/inventoryService';

// Form schema
const adjustmentSchema = z.object({
  quantity: z.number().min(0, "Quantity must be a positive number"),
  adjustmentType: z.enum(['add', 'subtract', 'set'], {
    required_error: "Please select an adjustment type",
  }),
  reason: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

const InventoryAdjustPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [barcode, setBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const inventoryId = searchParams.get('id');
  
  // Form definition
  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      quantity: 0,
      adjustmentType: 'add',
      reason: '',
    },
  });

  // Load inventory item if ID is provided
  useEffect(() => {
    if (inventoryId) {
      fetchInventoryItem(parseInt(inventoryId));
    }
  }, [inventoryId]);

  // Focus on barcode input when scanning mode is activated
  useEffect(() => {
    if (scanningBarcode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scanningBarcode]);

  const fetchInventoryItem = async (id: number) => {
    try {
      setLoading(true);
      const item = await getInventoryById(id);
      setInventoryItem(item);
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      toast({
        title: 'Error',
        description: 'Could not load inventory item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a barcode to search',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const item = await getInventoryByBarcode(barcode);
      setInventoryItem(item);
      setScanningBarcode(false);
    } catch (error) {
      console.error('Error fetching inventory by barcode:', error);
      toast({
        title: 'Error',
        description: 'No inventory item found with this barcode',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSearch();
    }
  };

  const onSubmit = async (data: AdjustmentFormValues) => {
    if (!inventoryItem) {
      toast({
        title: 'Error',
        description: 'No inventory item selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Hardcoded userId for demo - in real app, get from auth context
      const userId = 1;
      
      await adjustInventory(inventoryItem.id, {
        ...data,
        userId,
      });
      
      toast({
        title: 'Success',
        description: 'Inventory adjusted successfully',
      });
      
      // Redirect back to inventory page
      router.push('/dashboard/inventory');
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to adjust inventory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Adjust Inventory</h1>
          <p className="text-muted-foreground">
            Update stock quantities for inventory items
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Select an item to adjust</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !inventoryItem ? (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setScanningBarcode(true)}
                    className="w-full"
                  >
                    <Barcode className="h-4 w-4 mr-2" /> Scan Barcode
                  </Button>
                </div>

                {scanningBarcode && (
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Enter or scan barcode</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="barcode"
                        ref={barcodeInputRef}
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        className="flex-1"
                        placeholder="Scan or enter barcode..."
                      />
                      <Button onClick={handleBarcodeSearch}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-center text-muted-foreground mt-4">
                  No inventory item selected. Use the barcode scanner or navigate back to inventory to select an item.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <Label>Product</Label>
                    <p className="text-lg font-medium">{inventoryItem.product?.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SKU</Label>
                      <p>{inventoryItem.product?.sku}</p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <p>{inventoryItem.product?.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warehouse</Label>
                      <p>{inventoryItem.warehouse?.name}</p>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <p>{inventoryItem.shelfLocation || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Current Stock</Label>
                      <p className="text-xl font-bold">{inventoryItem.quantity}</p>
                    </div>
                    <div>
                      <Label>Min/Alert Level</Label>
                      <p>{inventoryItem.minQuantity} / {inventoryItem.alertThreshold}</p>
                    </div>
                  </div>
                  {inventoryItem.barcode && (
                    <div>
                      <Label>Barcode</Label>
                      <p>{inventoryItem.barcode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Adjustment Details</CardTitle>
                <CardDescription>Enter stock adjustment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Adjustment Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="add" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Add to stock
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="subtract" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Remove from stock
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="set" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Set exact quantity
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={!inventoryItem}
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch('adjustmentType') === 'add' && 'Quantity to add to current stock'}
                        {form.watch('adjustmentType') === 'subtract' && 'Quantity to remove from current stock'}
                        {form.watch('adjustmentType') === 'set' && 'New total quantity'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a reason for this adjustment..."
                          {...field}
                          disabled={!inventoryItem}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/inventory')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!inventoryItem || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Submit Adjustment'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default InventoryAdjustPage; 