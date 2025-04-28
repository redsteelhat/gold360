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
import { Eye, Edit, Plus, Trash, MessageSquare, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { 
  Customer, 
  getAllCustomers, 
  deleteCustomer, 
  sendCustomerMessage 
} from '@/utils/customerService';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [segmentFilter, setSegmentFilter] = useState<string | 'all'>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, filter, segmentFilter, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      const customersWithFullName = data.map(customer => ({
        ...customer,
        fullName: customer.fullName || `${customer.firstName} ${customer.lastName}`
      }));
      setCustomers(customersWithFullName);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Hata",
        description: "Müşteriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(customer => customer.status === filter);
    }
    
    // Filter by segment
    if (segmentFilter !== 'all') {
      filtered = filtered.filter(customer => customer.segment === segmentFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCustomers(filtered);
  };

  const handleViewCustomer = (customerId: number) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: number) => {
    router.push(`/dashboard/customers/${customerId}/edit`);
  };

  const handleCreateCustomer = () => {
    router.push('/dashboard/customers/create');
  };

  const handleDeleteCustomer = async (customerId: number) => {
    try {
      await deleteCustomer(customerId);
      
      // Update local state - müşterinin pasif (inactive) olarak işaretlendiği durumları da ele alalım
      if (filter === 'all') {
        // Tüm müşterileri gösterirken, pasif olanları da saklayalım
        setCustomers(prevCustomers => 
          prevCustomers.map(customer => 
            customer.id === customerId 
              ? { ...customer, status: 'inactive' as 'inactive' } 
              : customer
          )
        );
      } else {
        // Sadece aktif/pasif gösterirken, uygun olanlardan çıkaralım
        setCustomers(prevCustomers => 
          prevCustomers.filter(customer => customer.id !== customerId)
        );
      }
      
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla kaldırıldı.',
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Hata",
        description: "Müşteri silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (customerId: number) => {
    try {
      await sendCustomerMessage(customerId, {
        subject: "Merhaba",
        message: "Mağazamızda yeni ürünler var. İndirim fırsatlarını kaçırmayın!",
        channels: ["email", "sms"]
      });
      
      toast({
        title: 'Başarılı',
        description: 'Müşteriye mesaj gönderildi.',
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Customer['status']) => {
    const statusConfig = {
      active: { label: 'Aktif', variant: 'success' as const },
      inactive: { label: 'Pasif', variant: 'secondary' as const },
    };

    const config = statusConfig[status] || { label: 'Bilinmiyor', variant: 'outline' as const };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getSegmentBadge = (segment: string) => {
    const segmentConfig: Record<string, { label: string, variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' }> = {
      'gold': { label: 'Altın', variant: 'success' },
      'silver': { label: 'Gümüş', variant: 'secondary' },
      'bronze': { label: 'Bronz', variant: 'default' },
      'vip': { label: 'VIP', variant: 'destructive' },
    };

    const config = segmentConfig[segment] || { label: segment, variant: 'outline' };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const uniqueSegments = ['all', ...Array.from(new Set(customers.map(customer => customer.segment)))];

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
            Tüm müşterileri yönetin ve mesaj gönderin.
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
                Durum: {filter === 'all' ? 'Tümü' : filter === 'active' ? 'Aktif' : 'Pasif'}
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
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Segment: {segmentFilter === 'all' ? 'Tümü' : segmentFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {uniqueSegments.map((segment) => (
                <DropdownMenuItem 
                  key={segment} 
                  onClick={() => setSegmentFilter(segment)}
                >
                  {segment === 'all' ? 'Tümü' : segment}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreateCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {searchTerm || filter !== 'all' || segmentFilter !== 'all' ? 
              'Aradığınız kriterlere uygun müşteri bulunamadı.' : 
              'Henüz hiç müşteri bulunmuyor.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.fullName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{getSegmentBadge(customer.segment)}</TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewCustomer(customer.id)}
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditCustomer(customer.id)}
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSendMessage(customer.id)}
                        title="Mesaj Gönder"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        title="Sil"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 