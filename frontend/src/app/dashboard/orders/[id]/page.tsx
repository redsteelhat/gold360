"use client";

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, Package, Truck, Check, XCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { getOrderById, updateOrderStatus, updateDeliveryDate, cancelOrder } from '@/utils/orderService';
import type { Order } from '@/utils/orderService';
import dynamic from 'next/dynamic';

const CreateShipmentForm = dynamic(() => import('@/components/Shipment/CreateShipmentForm'), {
  ssr: false,
});

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await getOrderById(id);
        setOrder(data);
        if (data.deliveryDate) {
          setDate(new Date(data.deliveryDate));
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast({
          title: 'Error',
          description: 'Sipariş bilgileri yüklenemedi',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleUpdateStatus = async (newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderStatus(id, newStatus);
      setOrder(updatedOrder);
      toast({
        title: 'Başarılı',
        description: 'Sipariş durumu güncellendi.',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Hata',
        description: 'Sipariş durumu güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateDeliveryDate = async () => {
    if (!date) return;
    
    try {
      const updatedOrder = await updateDeliveryDate(id, date.toISOString());
      setOrder(updatedOrder);
      toast({
        title: 'Başarılı',
        description: 'Teslimat tarihi güncellendi.',
      });
    } catch (error) {
      console.error('Error updating delivery date:', error);
      toast({
        title: 'Hata',
        description: 'Teslimat tarihi güncellenirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const handleCancelOrder = async () => {
    try {
      const updatedOrder = await cancelOrder(id);
      setOrder(updatedOrder);
      toast({
        title: 'Başarılı',
        description: 'Sipariş iptal edildi.',
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Hata',
        description: 'Sipariş iptal edilirken bir hata oluştu.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: 'Beklemede', variant: 'outline' as const },
      processing: { label: 'İşleniyor', variant: 'secondary' as const },
      shipped: { label: 'Kargolandı', variant: 'default' as const },
      delivered: { label: 'Teslim Edildi', variant: 'success' as const },
      cancelled: { label: 'İptal Edildi', variant: 'destructive' as const },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const statusConfig = {
      pending: { label: 'Beklemede', variant: 'outline' as const },
      paid: { label: 'Ödendi', variant: 'success' as const },
      refunded: { label: 'İade Edildi', variant: 'warning' as const },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const data = await getOrderById(id);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Sipariş bilgileri yüklenemedi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold">Sipariş bulunamadı</h2>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
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
          <h1 className="text-2xl font-bold">Sipariş #{order.id}</h1>
          {getStatusBadge(order.status)}
        </div>
        <div className="flex space-x-2">
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <>
              {order.status === 'pending' && (
                <Button onClick={() => handleUpdateStatus('processing')}>
                  <Package className="h-4 w-4 mr-2" />
                  İşleme Al
                </Button>
              )}
              {order.status === 'processing' && (
                <Button 
                  variant="outline"
                  onClick={() => setShowShipmentForm(!showShipmentForm)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {showShipmentForm ? 'Kargo Formunu Gizle' : 'Kargo Oluştur'}
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button onClick={() => handleUpdateStatus('delivered')}>
                  <Check className="h-4 w-4 mr-2" />
                  Teslim Edildi
                </Button>
              )}
              <Button variant="destructive" onClick={handleCancelOrder}>
                <XCircle className="h-4 w-4 mr-2" />
                İptal Et
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Kargo Oluşturma Formu */}
      {showShipmentForm && (
        <div className="mt-4">
          <CreateShipmentForm 
            orderId={order.id}
            orderShippingAddress={order.shippingAddress || ''}
            orderRecipientName={order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : ''}
            orderRecipientPhone={order.customer?.phone || ''}
            onSuccess={(shipment) => {
              setShowShipmentForm(false);
              // Sipariş durumunu güncelle
              fetchOrderDetails();
              toast({
                title: 'Başarılı',
                description: 'Kargo kaydı oluşturuldu ve sipariş durumu güncellendi',
              });
            }}
            onCancel={() => setShowShipmentForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sipariş Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Sipariş Tarihi:</dt>
                <dd>{format(new Date(order.orderDate), 'dd.MM.yyyy')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Durum:</dt>
                <dd>{getStatusBadge(order.status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Ödeme Durumu:</dt>
                <dd>{getPaymentStatusBadge(order.paymentStatus)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Toplam Tutar:</dt>
                <dd className="font-bold">{order.totalAmount.toFixed(2)} TL</dd>
              </div>
              <div className="flex justify-between items-center mt-4">
                <dt className="font-medium">Teslimat Tarihi:</dt>
                <dd>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={
                          "w-[180px] justify-start text-left font-normal"
                        }
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd.MM.yyyy") : <span>Tarih seç</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                      <div className="p-2 border-t border-border">
                        <Button size="sm" className="w-full" onClick={handleUpdateDeliveryDate}>
                          Tarihi Güncelle
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Müşteri Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            {order.customer ? (
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium">Ad Soyad:</dt>
                  <dd>{order.customer.firstName} {order.customer.lastName}</dd>
                </div>
                <div>
                  <dt className="font-medium">E-posta:</dt>
                  <dd>{order.customer.email}</dd>
                </div>
                {order.customer.phone && (
                  <div>
                    <dt className="font-medium">Telefon:</dt>
                    <dd>{order.customer.phone}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground">Müşteri bilgisi bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notlar</CardTitle>
          </CardHeader>
          <CardContent>
            {order.notes ? (
              <p>{order.notes}</p>
            ) : (
              <p className="text-muted-foreground">Herhangi bir not bulunmuyor.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş Ürünleri</CardTitle>
          <CardDescription>
            Siparişe ait tüm ürünler ve adetleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün ID</TableHead>
                <TableHead>Ürün Adı</TableHead>
                <TableHead>Adet</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>İndirim</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.orderItems && order.orderItems.length > 0 ? (
                order.orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productId}</TableCell>
                    <TableCell>{item.product?.name || `Ürün #${item.productId}`}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unitPrice.toFixed(2)} TL</TableCell>
                    <TableCell>{item.discount.toFixed(2)} TL</TableCell>
                    <TableCell className="text-right">{item.total.toFixed(2)} TL</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Sipariş ürünü bulunamadı.
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-bold">
                  Toplam Tutar:
                </TableCell>
                <TableCell className="text-right font-bold">
                  {order.totalAmount.toFixed(2)} TL
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 