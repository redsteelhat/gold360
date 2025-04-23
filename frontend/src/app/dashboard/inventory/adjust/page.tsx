'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Search, Trash } from 'lucide-react';
import Link from 'next/link';

// Types
interface Warehouse {
  id: number;
  name: string;
  location: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
}

interface InventoryItem {
  productId: number;
  product: Product;
  currentStock: number;
  newStock: number;
  difference: number;
  reason: string;
}

const adjustmentReasons = [
  { value: 'physical_count', label: 'Fiziksel Sayım' },
  { value: 'damaged', label: 'Hasarlı Ürün' },
  { value: 'expired', label: 'Son Kullanma Tarihi Geçmiş' },
  { value: 'system_error', label: 'Sistem Hatası' },
  { value: 'theft', label: 'Kayıp/Çalıntı' },
  { value: 'returned', label: 'İade' },
  { value: 'other', label: 'Diğer' },
];

const StockAdjustmentPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: '',
    reason: '',
    notes: '',
    items: [] as InventoryItem[]
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Depoları yükle
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`);
        if (!response.ok) throw new Error('Depolar yüklenirken hata oluştu');
        
        const data = await response.json();
        setWarehouses(data);
      } catch (error) {
        console.error('Depo yükleme hatası:', error);
        toast({
          title: 'Hata',
          description: 'Depolar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.',
          variant: 'destructive',
        });
      }
    };

    fetchWarehouses();
  }, [toast]);

  // Depo değiştiğinde envanter bilgilerini yükle
  useEffect(() => {
    const fetchInventory = async () => {
      if (!formData.warehouseId) return;
      
      setIsLoadingInventory(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses/${formData.warehouseId}/inventory`);
        if (!response.ok) throw new Error('Envanter bilgileri yüklenirken hata oluştu');
        
        const data = await response.json();
        
        // Ürün bilgilerini de içeren envanter öğeleri oluştur
        const items = data.map((item: any) => ({
          productId: item.productId,
          product: item.product,
          currentStock: item.quantity,
          newStock: item.quantity,
          difference: 0,
          reason: ''
        }));
        
        setInventoryItems(items);
        setProducts(items.map((item: InventoryItem) => item.product));
        setFilteredProducts(items.map((item: InventoryItem) => item.product));
      } catch (error) {
        console.error('Envanter yükleme hatası:', error);
        toast({
          title: 'Hata',
          description: 'Envanter bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [formData.warehouseId, toast]);

  // Ürün araması
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      product => 
        product.name.toLowerCase().includes(query) || 
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    );
    
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Form değişiklikleri
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Ürün ayarlama
  const handleAddItem = (productId: number) => {
    const inventoryItem = inventoryItems.find(item => item.productId === productId);
    if (!inventoryItem) return;
    
    // Ürün zaten ekli mi kontrol et
    if (formData.items.some(item => item.productId === productId)) {
      toast({
        title: 'Uyarı',
        description: 'Bu ürün zaten ayarlama listesine eklenmiş.',
        variant: 'default',
      });
      return;
    }
    
    setFormData({
      ...formData,
      items: [...formData.items, { ...inventoryItem }]
    });
  };

  // Ürün kaldır
  const handleRemoveItem = (productId: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.productId !== productId)
    });
  };

  // Yeni stok miktarı güncelleme
  const handleStockChange = (productId: number, newValue: number) => {
    const updatedItems = formData.items.map(item => {
      if (item.productId === productId) {
        const newStock = newValue;
        const difference = newStock - item.currentStock;
        return { ...item, newStock, difference };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Ürün uyarlama sebebi değiştirme
  const handleItemReasonChange = (productId: number, reason: string) => {
    const updatedItems = formData.items.map(item => {
      if (item.productId === productId) {
        return { ...item, reason };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.warehouseId) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir depo seçin.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.reason) {
      toast({
        title: 'Hata',
        description: 'Lütfen genel bir ayarlama sebebi seçin.',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.items.length === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen en az bir ürün ekleyin.',
        variant: 'destructive',
      });
      return;
    }
    
    // Tüm ürünlerde değişiklik var mı kontrol et
    const hasChanges = formData.items.some(item => item.difference !== 0);
    if (!hasChanges) {
      toast({
        title: 'Uyarı',
        description: 'Hiçbir üründe stok değişikliği yapılmamış.',
        variant: 'default',
      });
      return;
    }
    
    // Tüm ürünlerin sebebi var mı kontrol et
    const missingReasons = formData.items.filter(item => item.difference !== 0 && !item.reason);
    if (missingReasons.length > 0) {
      toast({
        title: 'Hata',
        description: 'Tüm stok değişiklikleri için bir sebep belirtmelisiniz.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // API'ye gönderilecek veriyi hazırla
      const adjustmentData = {
        warehouseId: parseInt(formData.warehouseId),
        reason: formData.reason,
        notes: formData.notes,
        items: formData.items.filter(item => item.difference !== 0).map(item => ({
          productId: item.productId,
          currentStock: item.currentStock,
          newStock: item.newStock,
          reason: item.reason
        }))
      };
      
      // Stock adjustment API isteği
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(adjustmentData)
      });
      
      if (!response.ok) {
        throw new Error('Stok ayarlaması oluşturulurken bir hata oluştu');
      }
      
      toast({
        title: 'Başarılı',
        description: 'Stok ayarlaması başarıyla oluşturuldu.',
      });
      
      // Envanter sayfasına yönlendir
      router.push('/dashboard/inventory');
    } catch (error) {
      console.error('Stok ayarlama hatası:', error);
      toast({
        title: 'Hata',
        description: 'Stok ayarlaması yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/inventory" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Ayarlama</h1>
          <p className="text-muted-foreground">
            Envanter miktarlarını manuel olarak ayarla
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Ayarlama Bilgileri</CardTitle>
              <CardDescription>
                Stok ayarlaması için gerekli temel bilgiler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Depo <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.warehouseId}
                    onValueChange={(value) => handleChange('warehouseId', value)}
                    disabled={isLoadingInventory || isSubmitting}
                  >
                    <SelectTrigger id="warehouse">
                      <SelectValue placeholder="Depo seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem 
                          key={warehouse.id} 
                          value={warehouse.id.toString()}
                        >
                          {warehouse.name} ({warehouse.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Genel Sebep <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.reason}
                    onValueChange={(value) => handleChange('reason', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Ayarlama sebebi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {adjustmentReasons.map(reason => (
                        <SelectItem 
                          key={reason.value} 
                          value={reason.value}
                        >
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Bu ayarlama hakkında ek notlar..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ayarlanacak Ürünler</CardTitle>
              <CardDescription>
                Stok miktarlarını değiştirmek istediğiniz ürünleri seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!formData.warehouseId ? (
                <div className="text-center p-6 text-muted-foreground">
                  Lütfen önce bir depo seçin
                </div>
              ) : isLoadingInventory ? (
                <div className="text-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Envanter yükleniyor...</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Ürün ara..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Ürün bulunamadı
                      </div>
                    ) : (
                      filteredProducts.map(product => {
                        const inventoryItem = inventoryItems.find(item => item.productId === product.id);
                        const isAdded = formData.items.some(item => item.productId === product.id);
                        
                        if (!inventoryItem) return null;
                        
                        return (
                          <div key={product.id} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <span className="mr-2">{product.sku}</span>
                                <span className="font-medium">Mevcut stok: {inventoryItem.currentStock}</span>
                              </div>
                            </div>
                            <Button 
                              type="button"
                              variant={isAdded ? "outline" : "secondary"}
                              size="sm"
                              onClick={() => handleAddItem(product.id)}
                              disabled={isSubmitting || isAdded}
                            >
                              {isAdded ? 'Eklendi' : <><Plus className="h-4 w-4 mr-1" /> Ekle</>}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {formData.items.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">Eklenmiş Ürünler</h3>
                      <div className="border rounded-md divide-y">
                        {formData.items.map(item => (
                          <div key={item.productId} className="p-4">
                            <div className="flex justify-between mb-2">
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                              </div>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveItem(item.productId)}
                                disabled={isSubmitting}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <Label htmlFor={`current-${item.productId}`} className="text-xs">Mevcut:</Label>
                                  <Input
                                    id={`current-${item.productId}`}
                                    value={item.currentStock}
                                    className="col-span-2"
                                    disabled
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <Label htmlFor={`new-${item.productId}`} className="text-xs">Yeni:</Label>
                                  <Input
                                    id={`new-${item.productId}`}
                                    type="number"
                                    value={item.newStock}
                                    onChange={(e) => handleStockChange(item.productId, parseInt(e.target.value) || 0)}
                                    className="col-span-2"
                                    disabled={isSubmitting}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2 items-center">
                                  <Label className="text-xs">Fark:</Label>
                                  <div className={`col-span-2 text-sm font-medium ${
                                    item.difference > 0 ? 'text-green-600' : 
                                    item.difference < 0 ? 'text-red-600' : 'text-gray-500'
                                  }`}>
                                    {item.difference > 0 ? `+${item.difference}` : item.difference}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`reason-${item.productId}`} className="text-xs">
                                  Ayarlama Sebebi {item.difference !== 0 && <span className="text-red-500">*</span>}
                                </Label>
                                <Select 
                                  value={item.reason}
                                  onValueChange={(value) => handleItemReasonChange(item.productId, value)}
                                  disabled={isSubmitting || item.difference === 0}
                                >
                                  <SelectTrigger id={`reason-${item.productId}`}>
                                    <SelectValue placeholder="Sebep seçin" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {adjustmentReasons.map(reason => (
                                      <SelectItem 
                                        key={reason.value} 
                                        value={reason.value}
                                      >
                                        {reason.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2">
          <Link href="/dashboard/inventory">
            <Button variant="outline" disabled={isSubmitting}>İptal</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={
              isSubmitting || 
              !formData.warehouseId || 
              !formData.reason || 
              formData.items.length === 0 ||
              !formData.items.some(item => item.difference !== 0)
            }
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                İşleniyor...
              </>
            ) : (
              'Stok Ayarla'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StockAdjustmentPage; 