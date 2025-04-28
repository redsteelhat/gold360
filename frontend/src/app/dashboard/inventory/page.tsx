'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { AlertCircle, Search, Warehouse, Barcode, FilePlus, ArrowUpDown, FileDown, FileEdit, Edit, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { InventoryItem, getAllInventory, getInventoryByBarcode, deleteInventoryItem } from '@/utils/inventoryService';

const InventoryPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWarehousesLoading, setIsWarehousesLoading] = useState<boolean>(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token) {
        // Geliştirme modunda token oluştur
        if (process.env.NODE_ENV === 'development') {
          console.log('Setting dummy token for development');
          localStorage.setItem('token', 'dummy-dev-token-for-testing');
          localStorage.setItem('user', JSON.stringify({
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin'
          }));
          setIsAuthChecking(false);
          return;
        }
        
        setAuthError(true);
        toast({
          title: 'Oturum Hatası',
          description: 'Oturum açmanız gerekiyor. Yönlendiriliyorsunuz...',
          variant: 'destructive',
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setIsAuthChecking(false);
      }
    };
    
    checkAuth();
  }, [router, toast]);

  // Fetch warehouses
  useEffect(() => {
    if (isAuthChecking || authError) return;
    
    const fetchWarehouses = async () => {
      setIsWarehousesLoading(true);
      try {
        console.log('Fetching warehouses...');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/warehouses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Warehouses data received:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setWarehouses(data);
          setSelectedWarehouse(data[0].id.toString());
        } else {
          console.error('No warehouses found or invalid data format:', data);
          setApiError('No warehouses found');
          toast({
            title: 'Veri Hatası',
            description: 'Depo verileri alınamadı veya boş.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        setApiError('Error loading warehouses');
        toast({
          title: 'Hata',
          description: 'Depo bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          variant: 'destructive',
        });
      } finally {
        setIsWarehousesLoading(false);
      }
    };

    fetchWarehouses();
  }, [toast, isAuthChecking, authError]);

  // Fetch inventory for selected warehouse
  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedWarehouse || isAuthChecking || authError) return;
      
      setIsLoading(true);
      setApiError(null);
      
      try {
        const warehouseId = selectedWarehouse ? parseInt(selectedWarehouse) : undefined;
        console.log('Fetching inventory for warehouse:', warehouseId, 'lowStock:', showLowStockOnly);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const url = new URL(`${apiUrl}/inventory`);
        
        // Query parametreleri ekle
        if (warehouseId) {
          url.searchParams.append('warehouseId', warehouseId.toString());
        }
        if (showLowStockOnly) {
          url.searchParams.append('lowStock', 'true');
        }
        
        console.log('Direct API call to:', url.toString());
        
        // Doğrudan fetch API ile çağrı yap
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Inventory data received:', data);
        
        if (Array.isArray(data)) {
          setInventory(data);
          setFilteredInventory(data);
        } else {
          console.error('Invalid inventory data format:', data);
          setApiError('Invalid inventory data format');
          toast({
            title: 'Veri Hatası',
            description: 'Envanter verileri geçersiz formatta.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error fetching inventory:', error);
        setApiError(`Error loading inventory: ${error.message}`);
        toast({
          title: 'Hata',
          description: `Envanter verileri yüklenemedi: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedWarehouse && !isAuthChecking && !authError) {
      fetchInventory();
    }
  }, [selectedWarehouse, showLowStockOnly, toast, router, isAuthChecking, authError]);

  // Filter inventory based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventory(inventory);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = inventory.filter(item => 
      item.product?.name?.toLowerCase().includes(query) || 
      item.product?.sku?.toLowerCase().includes(query) ||
      item.shelfLocation?.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query)
    );
    
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);

  // Focus on barcode input when dialog opens
  useEffect(() => {
    if (showBarcodeScanner && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [showBarcodeScanner]);

  // Determine if stock level is low
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= item.minQuantity) {
      return { label: 'Stok Yok', color: 'destructive' };
    } else if (item.quantity <= item.alertThreshold) {
      return { label: 'Düşük Stok', color: 'warning' };
    } else {
      return { label: 'Stokta Var', color: 'success' };
    }
  };

  const handleBarcodeScan = async () => {
    if (!barcode.trim()) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir barkod girin',
        variant: 'destructive',
      });
      return;
    }

    setScanStatus('scanning');
    
    try {
      const item = await getInventoryByBarcode(barcode);
      setScanStatus('success');
      
      // Redirect to the adjustment page with this item
      router.push(`/dashboard/inventory/adjust?id=${item.id}`);
    } catch (error) {
      console.error('Error finding item by barcode:', error);
      setScanStatus('error');
      toast({
        title: 'Hata',
        description: 'Bu barkodla ürün bulunamadı',
        variant: 'destructive',
      });
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeScan();
    }
  };

  const exportInventory = () => {
    // Create CSV content
    const headers = ['SKU', 'Ürün', 'Kategori', 'Depo', 'Miktar', 'Min Miktar', 'Uyarı Eşiği', 'Konum', 'Barkod'];
    
    const rows = filteredInventory.map(item => [
      item.product?.sku || '',
      item.product?.name || '',
      item.product?.category || '',
      item.warehouse?.name || '',
      item.quantity.toString(),
      item.minQuantity.toString(),
      item.alertThreshold.toString(),
      item.shelfLocation || '',
      item.barcode || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Indirme bağlantısı oluştur
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `envanter_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await deleteInventoryItem(itemId);
      
      // Remove the item from the local state
      setInventory(prev => prev.filter(item => item.id !== itemId));
      setFilteredInventory(prev => prev.filter(item => item.id !== itemId));
      
      toast({
        title: 'Başarılı',
        description: 'Envanter öğesi başarıyla silindi',
      });
      
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast({
        title: 'Hata',
        description: 'Envanter öğesi silinirken hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Hata durumunu gösteren yardımcı bileşen
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-medium text-destructive mb-2">Veri Yükleme Hatası</h3>
      <p className="text-muted-foreground">{message}</p>
      <Button 
        className="mt-4" 
        onClick={() => window.location.reload()}
        variant="outline"
      >
        Yeniden Dene
      </Button>
    </div>
  );

  // Yükleme durumunu gösteren yardımcı bileşen
  const LoadingDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <>
      {isAuthChecking ? (
        <LoadingDisplay message="Oturum kontrol ediliyor..." />
      ) : authError ? (
        <ErrorDisplay message="Oturum hatası. Lütfen tekrar giriş yapın." />
      ) : (
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Envanter Yönetimi</h1>
              <p className="text-muted-foreground">
                Tüm depolardaki envanteri yönetin ve takip edin
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Barcode className="h-4 w-4 mr-2" /> Tara
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Barkod Tara</DialogTitle>
                    <DialogDescription>
                      Envanter öğesi bulmak için barkod tarayın veya girin
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="barcodeInput">Barkod</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="barcodeInput"
                          ref={barcodeInputRef}
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          onKeyDown={handleBarcodeKeyDown}
                          placeholder="Barkod tarayın veya yazın..."
                          disabled={scanStatus === 'scanning'}
                        />
                      </div>
                    </div>
                    {scanStatus === 'error' && (
                      <div className="text-sm text-destructive flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" /> Bu barkodla ürün bulunamadı
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      onClick={handleBarcodeScan}
                      disabled={scanStatus === 'scanning' || !barcode.trim()}
                    >
                      {scanStatus === 'scanning' ? 'Taranıyor...' : 'Ürün Bul'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => router.push('/dashboard/inventory/adjust')}>
                <ArrowUpDown className="h-4 w-4 mr-2" /> Düzenle
              </Button>
              <Button onClick={() => router.push('/dashboard/inventory/add')}>
                <FilePlus className="h-4 w-4 mr-2" /> Ürün Ekle
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Toplam Ürünler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Düşük Stok Ürünleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.filter(item => item.quantity <= item.alertThreshold && item.quantity > item.minQuantity).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Stok Dışı Ürünler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory.filter(item => item.quantity <= item.minQuantity).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>Envanter Ürünleri</CardTitle>
                <Button variant="outline" onClick={exportInventory}>
                  <FileDown className="h-4 w-4 mr-2" /> Dışa Aktar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="min-w-[200px]">
                    <Label htmlFor="warehouse">Depo</Label>
                    {isWarehousesLoading ? (
                      <div className="flex items-center h-10 px-3 border rounded-md">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                        <span className="text-sm text-muted-foreground">Yükleniyor...</span>
                      </div>
                    ) : (
                      <Select
                        value={selectedWarehouse}
                        onValueChange={(value) => {
                          console.log('Selected warehouse changed to:', value);
                          setSelectedWarehouse(value);
                        }}
                      >
                        <SelectTrigger id="warehouse">
                          <SelectValue placeholder="Depo seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses && warehouses.length > 0 ? (
                            warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                {warehouse.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Depo bulunamadı
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">Ara</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="İsim, SKU veya konuma göre ara..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lowStockOnly"
                      checked={showLowStockOnly}
                      onChange={(e) => setShowLowStockOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="lowStockOnly" className="cursor-pointer">Sadece Düşük Stok Göster</Label>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mr-3"></div>
                    <span className="text-muted-foreground">Envanter yükleniyor...</span>
                  </div>
                ) : apiError ? (
                  <ErrorDisplay message={apiError} />
                ) : filteredInventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border rounded-md">
                    <Warehouse className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Envanter bulunamadı</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Seçilen depoda hiçbir envanter öğesi bulunamadı veya filtreleme kriterleri hiçbir ürünle eşleşmedi.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard/inventory/add')}
                    >
                      <FilePlus className="h-4 w-4 mr-2" /> Yeni Ürün Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Ürün</TableHead>
                          <TableHead>Depo</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead>Min Miktar</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Konum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const status = getStockStatus(item);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono">{item.product?.sku}</TableCell>
                              <TableCell>{item.product?.name}</TableCell>
                              <TableCell>{item.warehouse?.name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell>{item.minQuantity}</TableCell>
                              <TableCell>
                                <Badge variant={status.color as any}>{status.label}</Badge>
                              </TableCell>
                              <TableCell>{item.shelfLocation}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => router.push(`/dashboard/inventory/adjust?id=${item.id}`)}
                                    title="Düzenle"
                                  >
                                    <FileEdit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => router.push(`/dashboard/inventory/edit?id=${item.id}`)}
                                    title="Düzenle"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => confirmDelete(item)}
                                    title="Sil"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Envanter Öğesini Sil</DialogTitle>
                <DialogDescription>
                  Bu envanter öğesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {itemToDelete && (
                  <div className="space-y-2">
                    <p><strong>Ürün:</strong> {itemToDelete.product?.name}</p>
                    <p><strong>SKU:</strong> {itemToDelete.product?.sku}</p>
                    <p><strong>Depo:</strong> {itemToDelete.warehouse?.name}</p>
                    <p><strong>Mevcut Miktar:</strong> {itemToDelete.quantity}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  İptal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => itemToDelete && handleDeleteItem(itemToDelete.id)}
                >
                  Sil
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default InventoryPage; 