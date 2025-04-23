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
import { MoreHorizontal, Eye, Edit, Plus, Trash, Filter, ListFilter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  loyaltyPoints: number;
  lastOrderDate: string;
}

// Mock data for customers
const mockCustomers: Customer[] = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    email: "ahmet.yilmaz@example.com",
    phone: "+90 555 123 4567",
    totalOrders: 12,
    totalSpent: 15250,
    status: 'active',
    loyaltyPoints: 520,
    lastOrderDate: "2023-08-15"
  },
  {
    id: 2,
    name: "Ayşe Demir",
    email: "ayse.demir@example.com",
    phone: "+90 555 765 4321",
    totalOrders: 5,
    totalSpent: 7800,
    status: 'active',
    loyaltyPoints: 150,
    lastOrderDate: "2023-09-22"
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    email: "mehmet.kaya@example.com",
    phone: "+90 555 333 2211",
    totalOrders: 8,
    totalSpent: 9650,
    status: 'inactive',
    loyaltyPoints: 310,
    lastOrderDate: "2023-06-10"
  },
  {
    id: 4,
    name: "Zeynep Öztürk",
    email: "zeynep.ozturk@example.com",
    phone: "+90 555 987 6543",
    totalOrders: 20,
    totalSpent: 32500,
    status: 'active',
    loyaltyPoints: 950,
    lastOrderDate: "2023-10-05"
  },
  {
    id: 5,
    name: "Mustafa Şahin",
    email: "mustafa.sahin@example.com",
    phone: "+90 555 456 7890",
    totalOrders: 3,
    totalSpent: 2100,
    status: 'active',
    loyaltyPoints: 45,
    lastOrderDate: "2023-10-18"
  }
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(mockCustomers);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Customer['status'] | 'all'>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, statusFilter, customers]);

  const filterCustomers = () => {
    let filtered = customers;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }
    
    setFilteredCustomers(filtered);
  };

  const handleViewCustomer = (customerId: number) => {
    toast({
      title: 'Bilgi',
      description: `Müşteri ${customerId} görüntüleniyor.`,
    });
    // router.push(`/dashboard/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: number) => {
    toast({
      title: 'Bilgi',
      description: `Müşteri ${customerId} düzenleniyor.`,
    });
    // router.push(`/dashboard/customers/${customerId}/edit`);
  };

  const handleCreateCustomer = () => {
    toast({
      title: 'Bilgi',
      description: 'Yeni müşteri oluşturuluyor.',
    });
    // router.push('/dashboard/customers/create');
  };

  const handleDeleteCustomer = (customerId: number) => {
    // Silme işlemi simülasyonu
    setCustomers(customers.filter(customer => customer.id !== customerId));
    
    toast({
      title: 'Başarılı',
      description: 'Müşteri başarıyla silindi.',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Pasif</Badge>;
      default:
        return null;
    }
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
          <CardTitle>Müşteriler</CardTitle>
          <CardDescription>
            Tüm müşterilerinizi yönetin ve müşteri bilgilerini takip edin.
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
                Durum: {statusFilter === 'all' ? 'Tümü' : statusFilter === 'active' ? 'Aktif' : 'Pasif'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Tümü
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Aktif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                Pasif
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreateCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Müşteri Adı</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Sipariş Sayısı</TableHead>
              <TableHead>Toplam Harcama</TableHead>
              <TableHead>Sadakat Puanı</TableHead>
              <TableHead>Son Sipariş</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  {statusFilter === 'all' && !searchTerm 
                    ? 'Henüz müşteri bulunmuyor.' 
                    : 'Arama kriterlerinize uygun müşteri bulunamadı.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">#{customer.id}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                  <TableCell>{customer.loyaltyPoints}</TableCell>
                  <TableCell>{formatDate(customer.lastOrderDate)}</TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Açılır menü</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Görüntüle</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Düzenle</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleDeleteCustomer(customer.id)}>
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