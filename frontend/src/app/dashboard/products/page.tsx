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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Plus, Trash, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
}

// Mock data for products
const mockProducts: Product[] = [
  {
    id: 1,
    name: "14K Altın Yüzük",
    sku: "GR-001",
    category: "Yüzükler",
    price: 2500,
    stock: 15,
    status: 'active'
  },
  {
    id: 2,
    name: "925 Gümüş Kolye",
    sku: "SN-002",
    category: "Kolyeler",
    price: 750,
    stock: 8,
    status: 'active'
  },
  {
    id: 3,
    name: "Pırlanta Küpe",
    sku: "DE-003",
    category: "Küpeler",
    price: 5000,
    stock: 3,
    status: 'active'
  },
  {
    id: 4,
    name: "18K Altın Bilezik",
    sku: "GB-004",
    category: "Bilezikler",
    price: 8000,
    stock: 0,
    status: 'out_of_stock'
  },
  {
    id: 5,
    name: "Gümüş Charm Bileklik",
    sku: "SB-005",
    category: "Bileklikler",
    price: 450,
    stock: 25,
    status: 'active'
  }
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<Product['status'] | 'all'>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    filterProducts();
  }, [searchTerm, filter, products]);

  const filterProducts = () => {
    let filtered = products;
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(product => product.status === filter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  };

  const handleViewProduct = (productId: number) => {
    toast({
      title: 'Bilgi',
      description: `Ürün ${productId} görüntüleniyor.`,
    });
    // router.push(`/dashboard/products/${productId}`);
  };

  const handleEditProduct = (productId: number) => {
    toast({
      title: 'Bilgi',
      description: `Ürün ${productId} düzenleniyor.`,
    });
    // router.push(`/dashboard/products/${productId}/edit`);
  };

  const handleCreateProduct = () => {
    toast({
      title: 'Bilgi',
      description: 'Yeni ürün oluşturuluyor.',
    });
    // router.push('/dashboard/products/create');
  };

  const handleDeleteProduct = (productId: number) => {
    // Silme işlemi simülasyonu
    setProducts(products.filter(product => product.id !== productId));
    
    toast({
      title: 'Başarılı',
      description: 'Ürün başarıyla silindi.',
    });
  };

  const getStatusBadge = (status: Product['status']) => {
    const statusConfig = {
      active: { label: 'Aktif', variant: 'success' as const },
      inactive: { label: 'Pasif', variant: 'secondary' as const },
      out_of_stock: { label: 'Stokta Yok', variant: 'destructive' as const },
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
          <CardTitle>Ürünler</CardTitle>
          <CardDescription>
            Tüm ürünleri yönetin ve stok durumlarını takip edin.
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[200px]"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrele: {filter === 'all' ? 'Tümü' : getStatusBadge(filter as Product['status']).props.children}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilter('all')}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('active')}>
                Aktif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('inactive')}>
                Pasif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('out_of_stock')}>
                Stokta Yok
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün No</TableHead>
              <TableHead>Ürün Adı</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {filter === 'all' && !searchTerm 
                    ? 'Henüz ürün bulunmuyor.' 
                    : 'Arama kriterlerinize uygun ürün bulunamadı.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">#{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.price.toFixed(2)} TL</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Açılır menü</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Görüntüle</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Düzenle</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Sil</span>
                        </DropdownMenuItem>
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