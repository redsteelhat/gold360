'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Customer, getCustomerById, updateCustomer } from '@/utils/customerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

// Form validation schema
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'Ad en az 2 karakter olmalıdır',
  }),
  lastName: z.string().min(2, {
    message: 'Soyad en az 2 karakter olmalıdır',
  }),
  email: z.string().email({
    message: 'Geçerli bir e-posta adresi giriniz',
  }),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.string().optional()
    .refine(val => !val || /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d$/.test(val), {
      message: 'Geçerli bir tarih formatı giriniz (GG.AA.YYYY)'
    }),
  notes: z.string().optional(),
  segment: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form tanımlaması
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      segment: '',
      isActive: true,
    },
  });

  // Tarih için otomatik nokta ekleme işlevi
  const formatDateInput = (value: string) => {
    // Sadece sayılara izin ver
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Formata göre nokta ekle
    let formattedValue = '';
    
    if (numericValue.length > 0) {
      // İlk 2 karakter (gün)
      formattedValue = numericValue.substring(0, Math.min(2, numericValue.length));
      
      // 2 karakterden fazlaysa nokta ve sonraki 2 karakter (ay)
      if (numericValue.length > 2) {
        formattedValue += '.' + numericValue.substring(2, Math.min(4, numericValue.length));
        
        // 4 karakterden fazlaysa nokta ve sonraki karakterler (yıl)
        if (numericValue.length > 4) {
          formattedValue += '.' + numericValue.substring(4, Math.min(8, numericValue.length));
        }
      }
    }
    
    return formattedValue;
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const customer = await getCustomerById(customerId);
        
        // Tarih formatını GG.AA.YYYY formatına çevir
        let formattedBirthDate = '';
        if (customer.birthDate) {
          // YYYY-MM-DD formatından DD.MM.YYYY formatına çevir
          const [year, month, day] = customer.birthDate.split('-');
          formattedBirthDate = `${day}.${month}.${year}`;
        }
        
        form.reset({
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone || '',
          gender: customer.gender,
          birthDate: formattedBirthDate,
          notes: customer.notes || '',
          segment: customer.segment,
          isActive: customer.isActive,
        });
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: 'Hata',
          description: 'Müşteri bilgileri yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
        router.push('/dashboard/customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, form, router, toast]);

  // Form gönderimi
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Formdaki tarihi string'e çevir
      const customerData = {
        ...data,
        birthDate: data.birthDate ? 
          data.birthDate.split('.').reverse().join('-') : undefined,
      };

      await updateCustomer(customerId, customerData);
      toast({
        title: 'Başarılı',
        description: 'Müşteri bilgileri başarıyla güncellendi',
      });
      router.push(`/dashboard/customers/${customerId}`);
    } catch (error: any) {
      console.error('Müşteri güncelleme hatası:', error);
      let errorMessage = 'Müşteri bilgileri güncellenirken bir hata oluştu';
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push(`/dashboard/customers/${customerId}`)} className="mr-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Müşteri Detaylarına Dön
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Müşteri Bilgilerini Düzenle</CardTitle>
          <CardDescription>
            Müşteri bilgilerini güncellemek için formu düzenleyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soyad</FormLabel>
                      <FormControl>
                        <Input placeholder="Soyad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ornek@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="5551234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cinsiyet</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Cinsiyet seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Erkek</SelectItem>
                          <SelectItem value="female">Kadın</SelectItem>
                          <SelectItem value="other">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doğum Tarihi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="GG.AA.YYYY"
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatDateInput(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={10}
                        />
                      </FormControl>
                      <FormDescription>
                        Örnek: 01.05.1990
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="segment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Segment seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="regular">Düzenli</SelectItem>
                          <SelectItem value="new">Yeni</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aktif</FormLabel>
                        <FormDescription>
                          Müşteri aktif durumda mı?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Müşteri hakkında notlar..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/customers/${customerId}`)}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}