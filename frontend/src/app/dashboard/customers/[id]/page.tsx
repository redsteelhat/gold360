'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Edit,
  Trash,
  Mail,
  Phone,
  Calendar,
  MessageCircle,
  ShoppingBag,
  AlertTriangle,
  Send
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Customer, 
  getCustomerById, 
  getCustomerOrders, 
  deleteCustomer, 
  sendCustomerMessage 
} from '@/utils/customerService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageChannel, setMessageChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Müşteri verilerini yükle
  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const customerData = await getCustomerById(customerId);
        setCustomer(customerData);

        // Müşteri siparişlerini yükle
        const orderData = await getCustomerOrders(customerId);
        setOrders(orderData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        toast({
          title: 'Hata',
          description: 'Müşteri bilgileri yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId, toast]);

  // Tarih formatlama
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  // Para formatı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  // Müşteri silme işlemi
  const handleDeleteCustomer = async () => {
    try {
      await deleteCustomer(customerId);
      toast({
        title: 'Başarılı',
        description: 'Müşteri başarıyla silindi',
      });
      router.push('/dashboard/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Hata',
        description: 'Müşteri silinirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Müşteriye mesaj gönderme
  const handleSendMessage = async () => {
    if (!customer) return;
    
    setIsSending(true);
    try {
      await sendCustomerMessage(customer.id, {
        channel: messageChannel,
        subject: messageSubject,
        message: messageContent
      });
      
      toast({
        title: 'Başarılı',
        description: `Mesaj başarıyla gönderildi.`,
      });
      
      setIsMessageDialogOpen(false);
      setMessageContent('');
      setMessageSubject('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Müşteri segment badge'i
  const getSegmentBadge = (segment: Customer['segment']) => {
    switch (segment) {
      case 'vip':
        return <Badge variant="success">VIP</Badge>;
      case 'regular':
        return <Badge>Düzenli</Badge>;
      case 'new':
        return <Badge variant="outline">Yeni</Badge>;
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

  if (!customer) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Müşteri bulunamadı</h3>
          <p className="text-muted-foreground mt-2">
            İstediğiniz müşteri bilgileri bulunamadı veya erişim yetkiniz yok.
          </p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Müşteri Listesine Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsMessageDialogOpen(true)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Mesaj Gönder
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/dashboard/customers/${customerId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Müşteri Bilgileri</CardTitle>
            <CardDescription>
              Temel müşteri bilgileri ve iletişim detayları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium">
                  {customer.firstName} {customer.lastName}
                </h3>
                <div className="mt-1 flex items-center space-x-2">
                  {getSegmentBadge(customer.segment)}
                  <Badge variant={customer.isActive ? "success" : "secondary"}>
                    {customer.isActive ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">İletişim Bilgileri</h4>
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Diğer Bilgiler</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">{customer.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-medium">{customer.userId}</span>
                  </div>
                  {customer.birthDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doğum Tarihi:</span>
                      <span className="font-medium">{formatDate(customer.birthDate)}</span>
                    </div>
                  )}
                  {customer.gender && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cinsiyet:</span>
                      <span className="font-medium">
                        {customer.gender === 'male' ? 'Erkek' : 
                         customer.gender === 'female' ? 'Kadın' : 'Diğer'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kayıt Tarihi:</span>
                    <span className="font-medium">{formatDate(customer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="orders">Siparişler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Müşteri Özeti</CardTitle>
                  <CardDescription>
                    Müşteri aktiviteleri ve genel bilgiler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-xl font-bold">
                          {formatCurrency(Number(customer.totalSpent))}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          Toplam Harcama
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-xl font-bold">
                          {customer.loyaltyPoints}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          Sadakat Puanı
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {customer.notes && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Notlar</h3>
                      <div className="p-3 bg-muted rounded-md">
                        {customer.notes}
                      </div>
                    </div>
                  )}

                  {customer.lastPurchaseDate && (
                    <div className="mt-6 flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Son sipariş: </span>
                      <span className="ml-1 font-medium">{formatDate(customer.lastPurchaseDate)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Siparişler
                  </CardTitle>
                  <CardDescription>
                    Müşterinin tüm sipariş geçmişi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Bu müşteriye ait sipariş bulunmamaktadır.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sipariş No</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                order.status === 'delivered' ? 'success' :
                                order.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                              >
                                Detay
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Silme Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri Sil</DialogTitle>
            <DialogDescription>
              Bu işlem müşteriyi pasif duruma getirecektir. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Müşteriyi Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mesaj Gönderme Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mesaj Gönder</DialogTitle>
            <DialogDescription>
              {customer && (
                <span>
                  {customer.firstName} {customer.lastName} müşterisine mesaj gönder
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel>İletişim Kanalı</FormLabel>
              <Select value={messageChannel} onValueChange={(value: any) => setMessageChannel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kanal seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {messageChannel === 'email' && (
              <div className="space-y-2">
                <FormLabel>Konu</FormLabel>
                <Input value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} placeholder="Mesaj konusu" />
              </div>
            )}

            <div className="space-y-2">
              <FormLabel>Mesaj</FormLabel>
              <Textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Mesaj içeriği" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} disabled={isSending}>
              İptal
            </Button>
            <Button onClick={handleSendMessage} disabled={!messageContent || isSending}>
              {isSending ? 'Gönderiliyor...' : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 