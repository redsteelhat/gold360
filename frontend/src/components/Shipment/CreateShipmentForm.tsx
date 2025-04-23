// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { CalendarIcon, Truck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { createShipment } from '@/utils/shipmentService';

// Form şeması tanımı
const formSchema = z.object({
  carrierName: z.string({ required_error: 'Kargo firması zorunludur' }),
  trackingNumber: z.string({ required_error: 'Takip numarası zorunludur' }),
  trackingUrl: z.string().optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'returned'], {
    required_error: 'Durum seçiniz',
  }),
  estimatedDeliveryDate: z.date().optional(),
  shippingCost: z.number().min(0, 'Geçerli bir fiyat giriniz'),
  recipientName: z.string({ required_error: 'Alıcı adı zorunludur' }),
  recipientPhone: z.string().optional(),
  shippingAddress: z.string({ required_error: 'Teslimat adresi zorunludur' }),
  notes: z.string().optional(),
  sendNotification: z.boolean().default(true),
});

// FormValues tipini şemadan türetme
type FormValues = z.infer<typeof formSchema>;

interface CreateShipmentFormProps {
  orderId: number;
  orderShippingAddress?: string;
  orderRecipientName?: string;
  orderRecipientPhone?: string;
  onSuccess?: (shipment: any) => void;
  onCancel?: () => void;
}

export default function CreateShipmentForm({
  orderId,
  orderShippingAddress = '',
  orderRecipientName = '',
  orderRecipientPhone = '',
  onSuccess,
  onCancel
}: CreateShipmentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form tanımla
  const form = useForm<FormValues>({
    // @ts-ignore - Resolving type mismatch with zodResolver
    resolver: zodResolver(formSchema),
    defaultValues: {
      carrierName: '',
      trackingNumber: '',
      trackingUrl: '',
      status: 'processing',
      shippingCost: 0,
      recipientName: orderRecipientName,
      recipientPhone: orderRecipientPhone,
      shippingAddress: orderShippingAddress,
      notes: '',
      sendNotification: true,
    },
  });

  // Form gönderildiğinde
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const shipmentData = {
        ...values,
        orderId,
        estimatedDeliveryDate: values.estimatedDeliveryDate ? values.estimatedDeliveryDate.toISOString() : undefined,
      };

      const result = await createShipment(shipmentData);
      
      toast({
        title: 'Başarılı',
        description: 'Kargo kaydı oluşturuldu',
      });
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Kargo oluşturma hatası:', error);
      toast({
        title: 'Hata',
        description: 'Kargo kaydı oluşturulamadı',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Truck className="mr-2 h-5 w-5" />
          Yeni Kargo Kaydı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kargo Firması */}
              <FormField
                control={form.control}
                name="carrierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kargo Firması*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kargo firması seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aras Kargo">Aras Kargo</SelectItem>
                        <SelectItem value="Yurtiçi Kargo">Yurtiçi Kargo</SelectItem>
                        <SelectItem value="MNG Kargo">MNG Kargo</SelectItem>
                        <SelectItem value="PTT Kargo">PTT Kargo</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="FedEx">FedEx</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Takip Numarası */}
              <FormField
                control={form.control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Takip Numarası*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Kargo takip numarası" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Durum */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum*</FormLabel>
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
                      <SelectItem value="in_transit">Yolda</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tahmini Teslimat Tarihi */}
              <FormField
                control={form.control}
                name="estimatedDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tahmini Teslimat Tarihi</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: tr })
                            ) : (
                              <span>Tarih seçin</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kargo Ücreti */}
              <FormField
                control={form.control}
                name="shippingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kargo Ücreti (₺)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Takip URL */}
            <FormField
              control={form.control}
              name="trackingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Takip URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alıcı Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alıcı Adı*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Alıcının tam adı" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alıcı Telefonu</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+90..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Teslimat Adresi */}
            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teslimat Adresi*</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Teslimat adresi" 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notlar */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notlar</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Özel notlar" 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bildirim Gönder */}
            <FormField
              control={form.control}
              name="sendNotification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Müşteriye bildirim gönder</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  İptal
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Kaydediliyor...' : 'Kargo Kaydı Oluştur'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 