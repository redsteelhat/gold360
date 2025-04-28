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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createInventoryItem } from '@/utils/inventoryService';
import { secureApi } from '@/utils/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Form validation schema
const inventoryFormSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  minQuantity: z.number().min(0, 'Minimum quantity must be 0 or greater'),
  maxQuantity: z.number().min(0, 'Maximum quantity must be 0 or greater'),
  alertThreshold: z.number().min(0, 'Alert threshold must be 0 or greater'),
  shelfLocation: z.string().optional(),
  barcode: z.string().optional(),
  rfidTag: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

const AddInventoryPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      productId: '',
      warehouseId: '',
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 100,
      alertThreshold: 10,
      shelfLocation: '',
      barcode: '',
      rfidTag: '',
    },
  });

  // Fetch products and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await secureApi.get('/products');
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);

        // Fetch warehouses
        const warehousesResponse = await secureApi.get('/warehouses');
        setWarehouses(Array.isArray(warehousesResponse.data) ? warehousesResponse.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        
        // If no auth, redirect to login
        if ((error as any).noAuth) {
          router.push('/login');
          return;
        }
        
        toast({
          title: 'Error',
          description: 'Failed to load required data. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast, router]);

  const onSubmit = async (data: InventoryFormValues) => {
    setIsSubmitting(true);
    try {
      // Get user from localStorage
      let userId = 1; // Default fallback
      
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user.id;
          } catch (e) {
            console.error('Error parsing user from localStorage', e);
          }
        }
      }
      
      // Convert string IDs to numbers
      const formattedData = {
        ...data,
        productId: parseInt(data.productId),
        warehouseId: parseInt(data.warehouseId),
        userId: userId,
      };

      await createInventoryItem(formattedData);
      
      toast({
        title: 'Success',
        description: 'Inventory item created successfully',
      });
      
      // Navigate back to inventory list
      router.push('/dashboard/inventory');
    } catch (error: any) {
      console.error('Error creating inventory item:', error);
      
      // Handle specific error for existing inventory item
      if (error.response?.data?.error?.includes('already exists')) {
        toast({
          title: 'Error',
          description: 'This product already exists in the selected warehouse.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create inventory item. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Inventory Item</h1>
          <p className="text-muted-foreground">
            Create a new inventory item in your warehouse
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
          <CardDescription>
            Enter the details for the new inventory item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(products) ? products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a warehouse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(warehouses) ? warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
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
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Current quantity in stock
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum quantity to maintain
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum quantity to store
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alertThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Quantity at which to alert for low stock
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shelfLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. A1-B3" />
                      </FormControl>
                      <FormDescription>
                        Physical location in the warehouse
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Item barcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rfidTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFID Tag</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="RFID tag identifier" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="flex justify-end px-0 pb-0">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Inventory Item
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddInventoryPage; 