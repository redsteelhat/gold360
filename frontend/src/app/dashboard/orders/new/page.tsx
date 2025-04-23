"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";

import { createOrder } from '@/utils/orderService';
import { getAllCustomers } from '@/utils/customerService';
import { getAllProducts } from '@/utils/productService';

// Form Validation Schema
const orderFormSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçilmelidir"),
  orderDate: z.date(),
  deliveryDate: z.date().optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']),
  notes: z.string().optional(),
  orderItems: z.array(
    z.object({
      productId: z.string().min(1, "Ürün seçilmelidir"),
      quantity: z.number().min(1, "Miktar 1'den az olamaz"),
      unitPrice: z.number().min(0, "Birim fiyat 0'dan az olamaz"),
      discount: z.number().min(0, "İndirim 0'dan az olamaz"),
    })
  ).min(1, "En az bir ürün eklenmelidir"),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderDate: new Date(),
      deliveryDate: undefined,
      status: 'pending',
      paymentStatus: 'pending',
      notes: '',
      orderItems: [
        {
          productId: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
        }
      ],
    }
  });

  // Load customers and products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customersData, productsData] = await Promise.all([
          getAllCustomers(),
          getAllProducts()
        ]);
        setCustomers(customersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Hata',
          description: 'Müşteri ve ürün bilgileri yüklenirken bir hata oluştu.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add new order item
  const addOrderItem = () => {
    const currentItems = form.getValues('orderItems');
    form.setValue('orderItems', [
      ...currentItems,
      {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
      }
    ]);
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    const currentItems = form.getValues('orderItems');
    if (currentItems.length > 1) {
      form.setValue('orderItems', currentItems.filter((_, i) => i !== index));
    }
  };

  // Auto-fill product price when product is selected
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      const currentItems = form.getValues('orderItems');
      currentItems[index].unitPrice = product.price;
      form.setValue('orderItems', currentItems);
    }
  };

  // Calculate total price for an item
  const calculateItemTotal = (item: any) => {
    return (item.quantity * item.unitPrice) - item.discount;
  };

  // Calculate order total amount
  const calculateOrderTotal = () => {
    const items = form.getValues('orderItems');
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  // Form submission
  const onSubmit = async (data: OrderFormValues) => {
    setSubmitting(true);
    try {
      // Calculate total for each item
      const itemsWithTotal = data.orderItems.map(item => ({
        ...item,
        total: calculateItemTotal(item)
      }));

      // Calculate order total
      const totalAmount = calculateOrderTotal();

      // Prepare order data
      const orderData = {
        ...data,
        customerId: parseInt(data.customerId),
        orderItems: itemsWithTotal.map(item => ({
          ...item,
          productId: parseInt(item.productId)
        })),
        totalAmount
      };

      await createOrder(orderData);
      toast({
        title: 'Başarılı',
        description: 'Sipariş başarıyla oluşturuldu.',
      });
      router.push('/dashboard/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Hata',
        description: 'Sipariş oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold">Yeni Sipariş Oluştur</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Bilgileri</CardTitle>
                <CardDescription>
                  Sipariş için gerekli bilgileri doldurun
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müşteri</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Müşteri seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.firstName} {customer.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Sipariş Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={"w-full justify-start text-left font-normal"}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Teslimat Tarihi (Opsiyonel)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={"w-full justify-start text-left font-normal"}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sipariş Durumu</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Beklemede</SelectItem>
                          <SelectItem value="processing">İşleniyor</SelectItem>
                          <SelectItem value="shipped">Kargolandı</SelectItem>
                          <SelectItem value="delivered">Teslim Edildi</SelectItem>
                          <SelectItem value="cancelled">İptal Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ödeme Durumu</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ödeme durumu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Beklemede</SelectItem>
                          <SelectItem value="paid">Ödendi</SelectItem>
                          <SelectItem value="refunded">İade Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Sipariş ile ilgili notlar..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sipariş Ürünleri</CardTitle>
                <CardDescription>
                  Siparişe eklenecek ürünleri girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.getValues('orderItems').map((_, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Ürün #{index + 1}</h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeOrderItem(index)}
                        >
                          Kaldır
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`orderItems.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ürün</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleProductChange(index, value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Ürün seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id.toString()}
                                >
                                  {product.name} - {product.price.toFixed(2)} TL
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`orderItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adet</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`orderItems.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birim Fiyat (TL)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`orderItems.${index}.discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>İndirim (TL)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="text-right font-medium">
                      Toplam: {calculateItemTotal(form.getValues('orderItems')[index]).toFixed(2)} TL
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addOrderItem}
                >
                  Ürün Ekle
                </Button>
              </CardContent>
              <CardFooter>
                <div className="w-full text-right font-bold text-lg">
                  Sipariş Toplamı: {calculateOrderTotal().toFixed(2)} TL
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/orders')}
            >
              İptal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Siparişi Oluştur
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 