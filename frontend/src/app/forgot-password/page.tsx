'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import api from '@/utils/api';

// Form validasyon şeması
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form oluşturma
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form gönderme
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      // Not: Backend'de şifre sıfırlama endpoint'i yoksa, burada bir mesaj gösteriyoruz
      // Eğer gerçek bir endpoint olsaydı şöyle yapardık:
      // await api.post('/auth/forgot-password', data);
      
      // Başarılı bildirim göster
      toast({
        title: 'Şifre Sıfırlama İsteği Gönderildi',
        description: 'E-posta adresinize şifre sıfırlama talimatları gönderildi.',
      });
      
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Şifre sıfırlama isteği gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Hata',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-bg-light px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary">
            <span className="text-gold-primary">Gold</span>360
          </h1>
          <p className="text-text-secondary mt-2">Jewelry Management System</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Şifremi Unuttum</CardTitle>
            <CardDescription>
              Şifrenizi sıfırlamak için e-posta adresinizi girin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-4">
                <p className="mb-4">
                  E-posta adresinize şifre sıfırlama talimatları gönderildi. Lütfen gelen kutunuzu kontrol edin.
                </p>
                <Button asChild>
                  <Link href="/login">Giriş Sayfasına Dön</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ornek@email.com" 
                            type="email" 
                            autoComplete="email"
                            disabled={isLoading}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama E-postası Gönder'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center text-muted-foreground">
              <Link href="/login" className="text-gold-primary hover:underline">
                Giriş sayfasına dön
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 