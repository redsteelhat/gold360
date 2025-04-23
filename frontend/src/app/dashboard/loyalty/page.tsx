'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { 
  LoyaltyProgram, 
  getLoyaltyPrograms, 
  processExpiredPoints, 
  getCustomerLoyalty,
  CustomerLoyalty
} from '@/utils/loyaltyService';
import { getAllCustomers, Customer } from '@/utils/customerService';
import { PlusCircle, Award, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import NewProgramDialog from '@/components/Loyalty/NewProgramDialog';

export default function LoyaltyPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewProgramDialog, setShowNewProgramDialog] = useState(false);

  // Fetch loyalty programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoading(true);
        const data = await getLoyaltyPrograms();
        setPrograms(data);
      } catch (error) {
        console.error('Error fetching loyalty programs:', error);
        toast({
          title: 'Hata',
          description: 'Sadakat programları yüklenirken bir hata oluştu.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, [toast]);

  // Fetch customers with loyalty data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        const customersData = await getAllCustomers();
        
        // Get top 10 customers by loyalty points
        const topCustomers = customersData
          .sort((a: Customer, b: Customer) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
          .slice(0, 10);
        
        // Fetch loyalty details for each customer
        const customerLoyaltyPromises = topCustomers.map((customer: Customer) => 
          getCustomerLoyalty(customer.id)
            .catch(err => {
              console.error(`Error fetching loyalty for customer ${customer.id}:`, err);
              return null;
            })
        );
        
        const customerLoyalties = (await Promise.all(customerLoyaltyPromises)).filter((data: any) => data !== null) as CustomerLoyalty[];
        setCustomers(customerLoyalties);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: 'Hata',
          description: 'Müşteri bilgileri yüklenirken bir hata oluştu.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [toast]);

  // Process expired points
  const handleProcessExpiredPoints = async () => {
    try {
      setIsProcessing(true);
      const result = await processExpiredPoints();
      
      toast({
        title: 'İşlem Tamamlandı',
        description: `${result.processed} adet süresi geçmiş puan işlendi.`,
      });
    } catch (error) {
      console.error('Error processing expired points:', error);
      toast({
        title: 'Hata',
        description: 'Süresi geçmiş puanlar işlenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle program creation
  const handleProgramCreated = (newProgram: LoyaltyProgram) => {
    setPrograms([newProgram, ...programs]);
    setShowNewProgramDialog(false);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Müşteri Sadakat Yönetimi</h1>
          <p className="text-muted-foreground">
            Sadakat programlarını ve müşteri puanlarını yönetin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleProcessExpiredPoints}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>İşleniyor...</>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Süresi Geçmiş Puanları İşle
              </>
            )}
          </Button>
          <Button onClick={() => setShowNewProgramDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Program Oluştur
          </Button>
        </div>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Sadakat Programları</TabsTrigger>
          <TabsTrigger value="customers">Müşteri Puanları</TabsTrigger>
        </TabsList>
        
        <TabsContent value="programs" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : programs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sadakat Programları</CardTitle>
                <CardDescription>
                  Henüz hiç sadakat programı oluşturulmamış.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">Program bulunamadı</h3>
                <p className="text-muted-foreground text-sm mt-1 text-center max-w-md">
                  Müşteri sadakat sistemi oluşturmak için yeni bir sadakat programı tanımlayın.
                </p>
                <Button className="mt-4" onClick={() => setShowNewProgramDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Program Oluştur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <Card key={program.id} className={!program.isActive ? 'opacity-70' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{program.name}</CardTitle>
                      <Badge variant={program.isActive ? 'default' : 'secondary'}>
                        {program.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {program.description || 'Açıklama bulunmuyor'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground">Puan Değeri:</p>
                          <p className="font-medium">{program.pointsPerCurrency} puan / ₺</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Minimum Kullanım:</p>
                          <p className="font-medium">{program.minimumPointsForRedemption} puan</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Puan Değeri:</p>
                          <p className="font-medium">{program.pointValueInCurrency} ₺</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Geçerlilik:</p>
                          <p className="font-medium">{program.expiryMonths} ay</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/dashboard/loyalty/programs/${program.id}`}>
                        <Award className="mr-2 h-4 w-4" />
                        Detaylar
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Puanları</CardTitle>
              <CardDescription>
                En yüksek puanlı müşteriler ve puan hareketleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Seviye</TableHead>
                      <TableHead className="text-right">Toplam Puan</TableHead>
                      <TableHead className="text-right">Toplam Harcama</TableHead>
                      <TableHead className="text-right">Son İşlem</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCustomers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell className="font-medium">Henüz veri bulunmuyor</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ) : (
                      customers.map((item) => (
                        <TableRow key={item.customer.id}>
                          <TableCell className="font-medium">{item.customer.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.loyalty.tier || 'Standart'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.customer.loyaltyPoints.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{item.customer.totalSpent.toLocaleString()} ₺</TableCell>
                          <TableCell className="text-right">{formatDate(item.customer.lastPurchaseDate)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/customers/${item.customer.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Program Dialog */}
      {showNewProgramDialog && (
        <NewProgramDialog 
          open={showNewProgramDialog}
          onOpenChange={setShowNewProgramDialog}
          onProgramCreated={handleProgramCreated}
        />
      )}
    </div>
  );
} 