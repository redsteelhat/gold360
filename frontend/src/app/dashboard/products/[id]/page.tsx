'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { getProductById } from '@/utils/productService';

interface ProductDetailsProps {
  params: {
    id: string;
  };
}

export default function ProductDetailsPage({ params }: ProductDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = parseInt(params.id);
        if (isNaN(productId)) {
          toast({
            title: 'Hata',
            description: 'Geçersiz ürün ID',
            variant: 'destructive',
          });
          router.push('/dashboard/products');
          return;
        }

        const data = await getProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Hata',
          description: 'Ürün yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
        router.push('/dashboard/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router, toast]);

  const handleEdit = () => {
    router.push(`/dashboard/products/${params.id}/edit`);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge variant="success">Aktif</Badge>;
    }
    return <Badge variant="secondary">Pasif</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Ürün bulunamadı</h2>
        <Button className="mt-4" onClick={() => router.push('/dashboard/products')}>
          Ürünlere Dön
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/products')} className="mr-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ürünlere Dön
        </Button>
        <Button onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Düzenle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <CardDescription>Ürün Kodu: {product.sku}</CardDescription>
            </div>
            <div>{getStatusBadge(product.status)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Ürün Bilgileri</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fiyat</p>
                  <p className="font-medium">₺{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</p>
                </div>
                
                {product.compareAtPrice && (
                  <div>
                    <p className="text-sm text-muted-foreground">İndirimli Fiyat</p>
                    <p className="font-medium">₺{typeof product.compareAtPrice === 'number' ? product.compareAtPrice.toFixed(2) : product.compareAtPrice}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">Maliyet Fiyatı</p>
                  <p className="font-medium">₺{typeof product.costPrice === 'number' ? product.costPrice.toFixed(2) : product.costPrice}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Ağırlık</p>
                  <p className="font-medium">{product.weight} gr</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Altın Ayarı</p>
                  <p className="font-medium">{product.goldKarat}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Stok Durumu</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Stok Miktarı</p>
                  <p className="font-medium">{product.stockQuantity} adet</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Stok Uyarı Seviyesi</p>
                  <p className="font-medium">{product.stockAlert} adet</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Stok Durumu</p>
                  <div className="font-medium">
                    {product.stockQuantity <= 0 ? (
                      <Badge variant="destructive">Stokta Yok</Badge>
                    ) : product.stockQuantity < product.stockAlert ? (
                      <Badge variant="warning">Az Stok</Badge>
                    ) : (
                      <Badge variant="success">Stokta</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Diğer Bilgiler</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Öne Çıkan Ürün</p>
                <p className="font-medium">{product.isFeatured ? 'Evet' : 'Hayır'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Eklenme Tarihi</p>
                <p className="font-medium">{new Date(product.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Son Güncelleme</p>
                <p className="font-medium">{new Date(product.updatedAt).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 