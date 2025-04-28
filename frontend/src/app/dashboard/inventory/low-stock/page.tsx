'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, ShoppingCart, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useLowStockAlerts, LowStockItem } from '@/utils/hooks/useLowStockAlerts';
import api, { secureApi } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function LowStockPage() {
  const { toast } = useToast();
  const { lowStockItems, loading, error } = useLowStockAlerts();
  const [filteredItems, setFilteredItems] = useState<LowStockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  
  // Stok kontrolü yapılması için API çağrısı
  const runStockCheck = async () => {
    try {
      toast({
        title: "İşlem başlatıldı",
        description: "Stok kontrolleri güncelleniyor...",
      });
      
      await secureApi.post('/stock-alerts/check');
      
      toast({
        title: "Başarılı",
        description: "Stok kontrolleri tamamlandı ve alarmlar güncellendi.",
      });
      
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      console.error('Stok kontrolü sırasında hata oluştu:', error);
      toast({
        title: "Hata",
        description: "Stok kontrolleri sırasında bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  // Ürünler filtrelenir
  useEffect(() => {
    if (!lowStockItems) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...lowStockItems];
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.sku.toLowerCase().includes(query)
      );
    }
    
    // Depo filtresi
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.warehouseName && item.warehouseName.toLowerCase().includes(warehouseFilter.toLowerCase())
      );
    }
    
    // Önem derecesi filtresi
    if (severityFilter !== 'all') {
      filtered = filtered.filter(item => item.severity === severityFilter);
    }
    
    setFilteredItems(filtered);
  }, [lowStockItems, searchQuery, warehouseFilter, severityFilter]);
  
  // Önem derecesi rozeti
  const getSeverityBadge = (severity: LowStockItem['severity']) => {
    switch(severity) {
      case 'critical':
        return <Badge variant="destructive">Stokta Yok</Badge>;
      case 'warning':
        return <Badge variant="warning">Kritik Seviye</Badge>;
      default:
        return <Badge variant="outline">Az Stok</Badge>;
    }
  };
  
  // Warehouse listesi oluşturma
  const getWarehouseOptions = () => {
    const warehouses = new Set<string>();
    
    if (lowStockItems) {
      lowStockItems.forEach(item => {
        if (item.warehouseName) {
          warehouses.add(item.warehouseName);
        }
      });
    }
    
    return Array.from(warehouses);
  };
  
  // İstatistikler
  const stats = {
    total: lowStockItems?.length || 0,
    critical: lowStockItems?.filter(item => item.severity === 'critical').length || 0,
    warning: lowStockItems?.filter(item => item.severity === 'warning').length || 0,
    normal: lowStockItems?.filter(item => item.severity === 'normal').length || 0,
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Düşük Stok Uyarıları</h1>
          <p className="text-muted-foreground">
            Stok seviyesi düşük olan ürünleri görüntüleyin ve gerekli işlemleri yapın.
          </p>
        </div>
        <Button onClick={runStockCheck} className="shrink-0">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Stok Kontrolü Yap
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-7 w-16" /> : stats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stokta Yok</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-7 w-16" /> : stats.critical}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Seviye</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-7 w-16" /> : stats.warning}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Az Stok</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-7 w-16" /> : stats.normal}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Düşük Stok Ürünleri</CardTitle>
          <CardDescription>
            Sistemdeki düşük stoklu tüm ürünlerin listesi. Ürünlerin durumunu görüntüleyebilir ve stok ekleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Kritiklik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="critical">Stokta Yok</SelectItem>
                <SelectItem value="warning">Kritik Seviye</SelectItem>
                <SelectItem value="normal">Az Stok</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Depo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Depolar</SelectItem>
                {getWarehouseOptions().map(warehouse => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/6" />
                  <Skeleton className="h-12 w-1/6" />
                  <Skeleton className="h-12 w-1/6" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium">Hata Oluştu</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-md">
                Stok bilgileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Stok Uyarısı Bulunamadı</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-md">
                {searchQuery || severityFilter !== 'all' || warehouseFilter !== 'all'
                  ? "Filtrelediğiniz kriterlere uygun ürün bulunamadı."
                  : "Şu anda stok seviyesi düşük ürün bulunmuyor."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stok Durumu</TableHead>
                    <TableHead>Depo</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={`${item.id}-${item.productId}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(item.severity)}
                          <span className="text-sm">
                            {item.currentQuantity} / {item.threshold}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{item.warehouseName || "Ana Depo"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/products/${item.productId}/edit`}>
                              Düzenle
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/inventory/stock-add?productId=${item.productId}`}>
                              Stok Ekle
                            </Link>
                          </Button>
                        </div>
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