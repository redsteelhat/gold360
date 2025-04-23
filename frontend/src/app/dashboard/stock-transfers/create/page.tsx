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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Minus, Trash } from 'lucide-react';
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

interface TransferItem {
  id?: number;
  productId: number;
  product?: Product;
  quantity: number;
}

const CreateStockTransferPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    items: [] as TransferItem[],
    notes: ''
  });
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Depoları ve ürünleri yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Depoları getir
        const warehousesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/warehouses`);
        if (!warehousesResponse.ok) throw new Error('Depolar yüklenirken hata oluştu');
        const warehousesData = await warehousesResponse.json();
        setWarehouses(warehousesData);

        // Ürünleri getir
        const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        if (!productsResponse.ok) throw new Error('Ürünler yüklenirken hata oluştu');
        const productsData = await productsResponse.json();
        setProducts(productsData);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        toast({
          title: 'Hata',
          description: 'Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast]);

  // Transfer formu değişiklik işleyicisi
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Ürün ekleme
  const handleAddItem = () => {
    if (!selectedProduct || selectedQuantity <= 0) return;

    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product) return;

    const newItem: TransferItem = {
      productId: product.id,
      product: product,
      quantity: selectedQuantity
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });

    // Seçimleri sıfırla
    setSelectedProduct('');
    setSelectedQuantity(1);
  };

  // Ürün kaldırma
  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  // Transfer formu gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sourceWarehouseId === formData.destinationWarehouseId) {
      toast({
        title: 'Hata',
        description: 'Kaynak ve hedef depo aynı olamaz',
        variant: 'destructive',
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: 'Hata',
        description: 'En az bir ürün eklemelisiniz',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // API'ye gönderilecek veriyi hazırla
      const transferData = {
        sourceWarehouseId: parseInt(formData.sourceWarehouseId),
        destinationWarehouseId: parseInt(formData.destinationWarehouseId),
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        notes: formData.notes
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transferData)
      });

      if (!response.ok) {
        throw new Error('Transfer oluşturulurken bir hata oluştu');
      }

      toast({
        title: 'Başarılı',
        description: 'Stok transferi başarıyla oluşturuldu',
      });

      // Transferler sayfasına yönlendir
      router.push('/dashboard/stock-transfers');
    } catch (error) {
      console.error('Transfer oluşturma hatası:', error);
      toast({
        title: 'Hata',
        description: 'Transfer oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/stock-transfers" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Stok Transferi</h1>
          <p className="text-muted-foreground">
            Depolar arası ürün transferi oluştur
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Bilgileri</CardTitle>
              <CardDescription>
                Transfer için kaynak ve hedef depoları seçin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceWarehouse">Kaynak Depo <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.sourceWarehouseId}
                  onValueChange={(value) => handleChange('sourceWarehouseId', value)}
                  required
                >
                  <SelectTrigger id="sourceWarehouse">
                    <SelectValue placeholder="Kaynak depo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem 
                        key={warehouse.id} 
                        value={warehouse.id.toString()}
                        disabled={warehouse.id.toString() === formData.destinationWarehouseId}
                      >
                        {warehouse.name} ({warehouse.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationWarehouse">Hedef Depo <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.destinationWarehouseId}
                  onValueChange={(value) => handleChange('destinationWarehouseId', value)}
                  required
                >
                  <SelectTrigger id="destinationWarehouse">
                    <SelectValue placeholder="Hedef depo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem 
                        key={warehouse.id} 
                        value={warehouse.id.toString()}
                        disabled={warehouse.id.toString() === formData.sourceWarehouseId}
                      >
                        {warehouse.name} ({warehouse.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Input
                  id="notes"
                  placeholder="Transfer hakkında notlar..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transfer Ürünleri</CardTitle>
              <CardDescription>
                Transfer edilecek ürünleri ve miktarlarını ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <Label htmlFor="product">Ürün</Label>
                  <Select 
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Ürün seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem 
                          key={product.id} 
                          value={product.id.toString()}
                        >
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Label htmlFor="quantity">Adet</Label>
                  <div className="flex items-center">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      className="mx-2 text-center"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="col-span-2 flex items-end">
                  <Button 
                    type="button"
                    variant="secondary" 
                    className="w-full"
                    onClick={handleAddItem}
                    disabled={!selectedProduct}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                {formData.items.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Transfer için ürün eklenmedi
                  </div>
                ) : (
                  <div className="divide-y">
                    {formData.items.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">{item.product?.sku}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.quantity} adet</span>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Link href="/dashboard/stock-transfers">
            <Button variant="outline">İptal</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting || formData.items.length === 0}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                İşleniyor...
              </>
            ) : (
              'Transfer Oluştur'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateStockTransferPage; 