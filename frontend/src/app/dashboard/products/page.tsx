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
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Plus, Trash, Filter, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Product, getAllProducts, deleteProduct } from '@/utils/productService';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [statusFilter, setStatusFilter] = useState<'Tümü' | 'Aktif' | 'Pasif'>('Tümü');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await getAllProducts();
        if (Array.isArray(data)) {
          const processedData = data.map(product => ({
            ...product,
            status: product.status || 'active'
          }));
          setProducts(processedData);
          setFilteredProducts(processedData);
        } else {
          console.error("Ürünler için dizi bekleniyordu fakat şu alındı:", data);
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (error) {
        console.error("Ürünleri getirirken hata:", error);
        toast({
          title: "Hata",
          description: "Ürünler yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  useEffect(() => {
    const filtered = products.filter(product => {
      // Durum filtresi
      if (filter !== 'all' && product.status !== filter) {
        return false;
      }
      
      // Arama filtresi
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !product.sku.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    setFilteredProducts(filtered);
  }, [filter, searchTerm, products]);

  const handleViewProduct = (productId: number) => {
    router.push(`/dashboard/products/${productId}`);
  };

  const handleEditProduct = (productId: number) => {
    router.push(`/dashboard/products/${productId}/edit`);
  };

  const handleCreateProduct = () => {
    router.push('/dashboard/products/create');
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await deleteProduct(productId);
      
      // Update local state - ürünün pasif (inactive) olarak işaretlendiği durumları da ele alalım
      if (filter === 'all') {
        // Tüm ürünleri gösterirken, pasif olanları da saklayalım (Silinen ürün listeden tamamen kaldırılmaz, filtrelendiğinde görünmez)
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { ...product, status: 'inactive' as 'inactive' } 
              : product
          )
        );
      } else {
        // Sadece aktif/pasif gösterirken, uygun olanlardan çıkaralım
        setProducts(prevProducts => 
          prevProducts.filter(product => product.id !== productId)
        );
      }
      
      toast({
        title: 'Başarılı',
        description: 'Ürün başarıyla kaldırıldı.',
      });
    } catch (error) {
      console.error("Ürün silme hatası:", error);
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleStatusFilter = (status: 'Tümü' | 'Aktif' | 'Pasif') => {
    setStatusFilter(status);
    if (status === 'Tümü') {
      setFilter('all');
    } else if (status === 'Aktif') {
      setFilter('active');
    } else if (status === 'Pasif') {
      setFilter('inactive');
    }
  };

  const getStatusBadge = (status: Product['status']) => {
    const statusConfig = {
      active: { label: 'Aktif', variant: 'success' },
      inactive: { label: 'Pasif', variant: 'secondary' },
    };

    const config = statusConfig[status] || { label: 'Bilinmiyor', variant: 'secondary' };
    
    if (config.variant === 'success') {
      return <span className="badge-success">{config.label}</span>;
    } else {
      return <span className="badge-secondary">{config.label}</span>;
    }
  };

  const renderStockStatusBadge = (status: number) => {
    if (status <= 0) {
      return (
        <span className="badge-danger">
          Stokta Yok
        </span>
      );
    } else if (status < 10) {
      return (
        <span className="badge-secondary">
          Az Stok ({status})
        </span>
      );
    } else {
      return (
        <span className="badge-success">
          Stokta ({status})
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-1 font-bold tracking-tight">Ürünler</h2>
        <Button 
          onClick={handleCreateProduct}
          className="btn-success"
        >
          <Plus className="mr-2 h-4 w-4" /> Yeni Ürün
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary"></div>
        </div>
      ) : (
        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between gap-y-2 pb-2">
            <CardTitle className="text-heading-2 font-semibold">Ürün Yönetimi</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ara..."
                className="input-field w-[150px] lg:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrele
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-dropdown">
                  <DropdownMenuLabel>Durum</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "Tümü"}
                    onCheckedChange={() => handleStatusFilter("Tümü")}
                  >
                    Tümü
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "Aktif"}
                    onCheckedChange={() => handleStatusFilter("Aktif")}
                  >
                    Aktif
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "Pasif"}
                    onCheckedChange={() => handleStatusFilter("Pasif")}
                  >
                    Pasif
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-bg-light">
                  <TableRow>
                    <TableHead className="w-[150px] text-text-primary font-medium">Ürün Adı</TableHead>
                    <TableHead className="text-text-primary font-medium">SKU</TableHead>
                    <TableHead className="text-text-primary font-medium">Fiyat</TableHead>
                    <TableHead className="text-text-primary font-medium">Stok Durumu</TableHead>
                    <TableHead className="text-text-primary font-medium">Durum</TableHead>
                    <TableHead className="text-right text-text-primary font-medium">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-text-secondary">
                        Hiç ürün bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-bg-light">
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{new Intl.NumberFormat('tr-TR', { 
                          style: 'currency', 
                          currency: 'TRY',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(product.price)}</TableCell>
                        <TableCell>{renderStockStatusBadge(product.stockQuantity)}</TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-gray-300"
                              onClick={() => handleViewProduct(product.id)}
                              title="Görüntüle"
                            >
                              <Eye className="h-4 w-4 text-text-secondary" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-gray-300"
                              onClick={() => handleEditProduct(product.id)}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4 text-text-secondary" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-danger border-gray-300 hover:bg-danger/5 hover:border-danger"
                                  title="Sil"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white rounded-lg shadow-dropdown">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-heading-2">
                                    Bu ürünü silmek istediğinize emin misiniz?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-text-secondary">
                                    Bu işlem geri alınamaz. Bu ürün sisteminizden kalıcı olarak silinecektir.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-label">İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="btn-danger text-label"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 