'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCustomer } from '@/utils/customerService';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form tanımlaması
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      birthDate: '',
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

  // Form gönderimi
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Tarihi yyyy-MM-dd formatına çevir
      const customerData = {
        ...data,
        birthDate: data.birthDate ? 
          data.birthDate.split('.').reverse().join('-') : undefined,
        // userId service tarafında otomatik oluşturulacak
        status: 'active' as const,
        fullName: `${data.firstName} ${data.lastName}`,
        isActive: true,
        segment: 'new'
      };

      await createCustomer(customerData);
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla oluşturuldu',
      });
      router.push('/dashboard/customers');
    } catch (error: any) {
      console.error('Müşteri oluşturma hatası:', error);
      let errorMessage = 'Müşteri oluşturulurken bir hata oluştu';
      
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Yeni Müşteri Oluştur</CardTitle>
        <CardDescription>
          Sisteme yeni bir müşteri eklemek için formu doldurun.
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
                onClick={() => router.back()}
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
  );
} 