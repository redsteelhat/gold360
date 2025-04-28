'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateProduct, getProductById } from '@/utils/productService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Ürün adı en az 2 karakter olmalıdır',
  }),
  sku: z.string().min(3, {
    message: 'SKU en az 3 karakter olmalıdır',
  }),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, {
    message: 'Fiyat 0 veya daha büyük olmalıdır',
  }),
  compareAtPrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0, {
    message: 'Maliyet fiyatı 0 veya daha büyük olmalıdır',
  }),
  weight: z.coerce.number().min(0, {
    message: 'Ağırlık 0 veya daha büyük olmalıdır',
  }),
  goldKarat: z.string(),
  stockQuantity: z.coerce.number().min(0),
  stockAlert: z.coerce.number().min(0),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

type FormValues = z.infer<typeof productFormSchema>;

interface ProductEditProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: ProductEditProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form tanımlaması
  const form = useForm<FormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      price: 0,
      compareAtPrice: undefined,
      costPrice: 0,
      weight: 0,
      goldKarat: '',
      stockQuantity: 0,
      stockAlert: 5,
      isActive: true,
      isFeatured: false,
    },
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = parseInt(params.id);
        if (isNaN(productId)) {
          toast({
            title: 'Hata',
            description: 'Geçersiz ürün ID',
            variant: 'destructive',
          });
          router.push('/dashboard/products');
          return;
        }

        const data = await getProductById(productId);
        
        // Form değerlerini mevcut ürün bilgileriyle doldur
        form.reset({
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || '',
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          costPrice: data.costPrice,
          weight: data.weight,
          goldKarat: data.goldKarat,
          stockQuantity: data.stockQuantity,
          stockAlert: data.stockAlert,
          isActive: data.status === 'active',
          isFeatured: data.isFeatured,
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Hata',
          description: 'Ürün yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
        router.push('/dashboard/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router, toast, form]);

  // Form gönderimi
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const productId = parseInt(params.id);

      const productData = {
        ...data,
        status: data.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
      };

      await updateProduct(productId, productData);
      toast({
        title: 'Başarılı',
        description: 'Ürün başarıyla güncellendi',
      });
      router.push('/dashboard/products');
    } catch (error: any) {
      console.error('Ürün güncelleme hatası:', error);
      let errorMessage = 'Ürün güncellenirken bir hata oluştu';
      
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast({
        title: 'Hata',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="mr-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Ürün Düzenle</CardTitle>
          <CardDescription>
            Ürün bilgilerini güncellemek için formu doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün Adı*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ürün adı" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Stok Kodu)*</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barkod</FormLabel>
                      <FormControl>
                        <Input placeholder="Barkod" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satış Fiyatı*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İndirimli Fiyat</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        İndirimli satış için karşılaştırma fiyatı
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maliyet Fiyatı*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Miktarı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Uyarı Seviyesi</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Stok bu seviyenin altına düştüğünde uyarı verilir
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ağırlık (gram)*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="goldKarat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altın Ayarı*</FormLabel>
                      <FormControl>
                        <Input placeholder="14K, 18K, 22K, 24K" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktif</FormLabel>
                        <FormDescription>
                          Ürün mağazada görünür olsun mu?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Öne Çıkan</FormLabel>
                        <FormDescription>
                          Ürün ana sayfada öne çıkarılsın mı?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/products')}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
} 