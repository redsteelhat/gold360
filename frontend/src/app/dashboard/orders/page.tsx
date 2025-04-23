"use client";

import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Package, XCircle, Plus, Filter } from 'lucide-react';
import { getAllOrders, Order, updateOrderStatus, cancelOrder } from '@/utils/orderService';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders();
        setOrders(data);
        setFilteredOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Hata',
          description: 'Siparişler yüklenirken bir hata oluştu.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === filter));
    }
  }, [filter, orders]);

  const handleViewOrder = (orderId: number) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const handleCreateOrder = () => {
    router.push('/dashboard/orders/create');
  };

  const handleUpdateStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
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

  const handleCancelOrder = async (orderId: number) => {
    try {
      await cancelOrder(orderId);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Siparişler</CardTitle>
          <CardDescription>
            Tüm siparişleri yönetin ve durumlarını güncelleyin.
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrele: {filter === 'all' ? 'Tümü' : getStatusBadge(filter as Order['status']).props.children}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilter('all')}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('pending')}>
                Beklemede
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('processing')}>
                İşleniyor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('shipped')}>
                Kargolandı
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('delivered')}>
                Teslim Edildi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('cancelled')}>
                İptal Edildi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreateOrder}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sipariş
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Ödeme</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {filter === 'all' ? 'Henüz sipariş bulunmuyor.' : `"${filter}" durumunda sipariş bulunmuyor.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    {format(new Date(order.orderDate), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    {order.customer?.firstName} {order.customer?.lastName}
                  </TableCell>
                  <TableCell>{order.totalAmount.toFixed(2)} TL</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Açılır menü</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Görüntüle</span>
                        </DropdownMenuItem>
                        
                        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'processing')}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>İşleme Al</span>
                          </DropdownMenuItem>
                        )}
                        
                        {order.status === 'processing' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>Kargoya Ver</span>
                          </DropdownMenuItem>
                        )}
                        
                        {order.status === 'shipped' && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>Teslim Edildi</span>
                          </DropdownMenuItem>
                        )}
                        
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleCancelOrder(order.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>İptal Et</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 