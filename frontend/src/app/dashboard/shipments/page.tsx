'use client';

import React, { useState, useEffect } from 'react';
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
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Truck, Package, Search, MoreHorizontal, Eye, Edit, AlertTriangle, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllShipments, processNotifications } from '@/utils/shipmentService';
import type { Shipment } from '@/utils/shipmentService';

export default function ShipmentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingNotifications, setProcessingNotifications] = useState(false);

  // Kargo kayıtlarını yükle
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const data = await getAllShipments();
      setShipments(data);
      setFilteredShipments(data);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: 'Hata',
        description: 'Kargo kayıtları yüklenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Arama ve durum filtreleme
  useEffect(() => {
    filterShipments();
  }, [searchQuery, statusFilter, shipments]);

  const filterShipments = () => {
    let filtered = [...shipments];
    
    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter);
    }
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        shipment => 
          shipment.trackingNumber.toLowerCase().includes(query) ||
          shipment.carrierName.toLowerCase().includes(query) ||
          shipment.recipientName.toLowerCase().includes(query) ||
          (shipment.Order?.id.toString().includes(query))
      );
    }
    
    setFilteredShipments(filtered);
  };

  // Bildirimleri işle
  const handleProcessNotifications = async () => {
    try {
      setProcessingNotifications(true);
      const result = await processNotifications();
      
      toast({
        title: 'Bildirimler İşlendi',
        description: `${result.results.sent} bildirim gönderildi, ${result.results.failed} bildirim başarısız oldu.`,
      });
    } catch (error) {
      console.error('Error processing notifications:', error);
      toast({
        title: 'Hata',
        description: 'Bildirimler işlenirken bir hata oluştu.',
        variant: 'destructive'
      });
    } finally {
      setProcessingNotifications(false);
    }
  };

  // Durum gösterimi için renk tanımları
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Beklemede</Badge>;
      case 'processing':
        return <Badge variant="secondary">İşleniyor</Badge>;
      case 'shipped':
        return <Badge variant="secondary">Kargolandı</Badge>;
      case 'in_transit':
        return <Badge variant="default">Yolda</Badge>;
      case 'delivered':
        return <Badge variant="success" className="bg-green-500 hover:bg-green-600 text-white">Teslim Edildi</Badge>;
      case 'failed':
        return <Badge variant="destructive">Başarısız</Badge>;
      case 'returned':
        return <Badge variant="destructive">İade Edildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Kargo detaylarına git
  const handleViewShipment = (id: number) => {
    router.push(`/dashboard/shipments/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kargo Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm kargo kayıtlarını görüntüleyin ve yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleProcessNotifications} disabled={processingNotifications}>
            {processingNotifications ? (
              <>İşleniyor...</>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Bildirimleri İşle
              </>
            )}
          </Button>
          <Button asChild>
            <Link href="/dashboard/orders">
              <Package className="h-4 w-4 mr-2" />
              Siparişlere Git
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kargo Kayıtları</CardTitle>
          <CardDescription>
            Tüm kargo ve gönderi kayıtlarınızı buradan takip edebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Duruma göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kayıtlar</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="processing">İşleniyor</SelectItem>
                  <SelectItem value="shipped">Kargolandı</SelectItem>
                  <SelectItem value="in_transit">Yolda</SelectItem>
                  <SelectItem value="delivered">Teslim Edildi</SelectItem>
                  <SelectItem value="failed">Başarısız</SelectItem>
                  <SelectItem value="returned">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Takip no, kargo firması, alıcı adı..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Button variant="outline" onClick={fetchShipments}>Yenile</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Kargo kaydı bulunamadı</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || statusFilter !== 'all' 
                  ? "Filtreleri değiştirerek tekrar deneyin" 
                  : "Henüz kargo kaydı oluşturulmamış"}
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Takip No</TableHead>
                    <TableHead>Kargo Firması</TableHead>
                    <TableHead>Sipariş No</TableHead>
                    <TableHead>Alıcı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead>Tahmini Teslim</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                      <TableCell>{shipment.carrierName}</TableCell>
                      <TableCell>
                        {shipment.orderId && (
                          <Link 
                            href={`/dashboard/orders/${shipment.orderId}`}
                            className="text-blue-600 hover:underline"
                          >
                            #{shipment.orderId}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>{shipment.recipientName}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                      <TableCell>
                        {shipment.estimatedDeliveryDate 
                          ? formatDate(shipment.estimatedDeliveryDate)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Menüyü Aç</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewShipment(shipment.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Görüntüle</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`${shipment.trackingUrl || `https://www.google.com/search?q=${shipment.carrierName}+${shipment.trackingNumber}`}`, '_blank')}>
                              <Truck className="mr-2 h-4 w-4" />
                              <span>Kargo Takip</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/shipments/${shipment.id}/edit`} className="flex items-center w-full">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Düzenle</span>
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 