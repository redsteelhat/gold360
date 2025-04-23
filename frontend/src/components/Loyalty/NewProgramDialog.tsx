"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { LoyaltyProgram, createLoyaltyProgram } from '@/utils/loyaltyService';

// Form schema definition
const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Program adı en az 2 karakter olmalıdır',
  }),
  description: z.string().optional(),
  pointsPerCurrency: z.coerce.number().min(0.1, {
    message: 'Puan oranı en az 0.1 olmalıdır',
  }),
  minimumPointsForRedemption: z.coerce.number().min(1, {
    message: 'Minimum kullanım puanı en az 1 olmalıdır',
  }),
  pointValueInCurrency: z.coerce.number().min(0.01, {
    message: 'Puan değeri en az 0.01 olmalıdır',
  }),
  expiryMonths: z.coerce.number().min(1, {
    message: 'Geçerlilik süresi en az 1 ay olmalıdır',
  }),
  isActive: z.boolean(),
});

type FormSchema = z.infer<typeof formSchema>;

interface NewProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProgramCreated: (program: LoyaltyProgram) => void;
}

export default function NewProgramDialog({
  open,
  onOpenChange,
  onProgramCreated,
}: NewProgramDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      pointsPerCurrency: 1,
      minimumPointsForRedemption: 100,
      pointValueInCurrency: 0.01,
      expiryMonths: 12,
      isActive: true,
    },
  });

  async function onSubmit(values: FormSchema) {
    setIsLoading(true);
    try {
      const response = await createLoyaltyProgram(values);
      toast({
        title: 'Başarılı',
        description: 'Sadakat programı başarıyla oluşturuldu',
      });
      onProgramCreated(response);
    } catch (error) {
      console.error('Error creating loyalty program:', error);
      toast({
        title: 'Hata',
        description: 'Sadakat programı oluşturulurken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Sadakat Programı</DialogTitle>
          <DialogDescription>
            Müşterileriniz için yeni bir sadakat programı oluşturun.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Gold Sadakat Programı" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Program hakkında açıklama"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Müşterilere gösterilecek açıklama metni
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pointsPerCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puan Oranı (₺)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Her 1₺ harcama için kazanılan puan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumPointsForRedemption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Kullanım</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="100"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Kullanılabilir minimum puan miktarı
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointValueInCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puan Değeri (₺)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.01"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Her puanın ₺ karşılığı
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geçerlilik Süresi (Ay)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="12"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Puanların geçerli olduğu süre
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Aktif</FormLabel>
                    <FormDescription>
                      Programı hemen aktif hale getir
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Kaydediliyor...' : 'Programı Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 