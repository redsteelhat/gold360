'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  LoyaltyProgram, 
  getLoyaltyProgramById, 
  updateLoyaltyProgram 
} from '@/utils/loyaltyService';
import { 
  ChevronLeft,
  Edit,
  Save,
  X,
  Calendar,
  CreditCard,
  Award,
  Percent,
  User
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProgram, setEditedProgram] = useState<Partial<LoyaltyProgram>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchProgram = async () => {
      try {
        setIsLoading(true);
        const data = await getLoyaltyProgramById(Number(id));
        setProgram(data);
        setEditedProgram(data);
      } catch (error) {
        console.error('Error fetching loyalty program:', error);
        toast({
          title: 'Hata',
          description: 'Sadakat programı yüklenirken bir hata oluştu.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProgram();
    }
  }, [id, toast]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit
      setEditedProgram(program || {});
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!program || !editedProgram) return;
    
    try {
      setIsSaving(true);
      const updatedProgram = await updateLoyaltyProgram(program.id, editedProgram);
      setProgram(updatedProgram);
      setIsEditing(false);
      
      toast({
        title: 'Başarılı',
        description: 'Sadakat programı başarıyla güncellendi.',
      });
    } catch (error) {
      console.error('Error updating loyalty program:', error);
      toast({
        title: 'Hata',
        description: 'Sadakat programı güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setEditedProgram({
      ...editedProgram,
      [field]: value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Program Bulunamadı</CardTitle>
            <CardDescription>
              İstediğiniz sadakat programı bulunamadı veya erişim izniniz yok.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
        </div>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleEditToggle}>
                <X className="mr-2 h-4 w-4" />
                İptal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  className="text-2xl font-bold p-1 border rounded w-full mb-1"
                  value={editedProgram.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              ) : (
                <CardTitle className="text-2xl">{program.name}</CardTitle>
              )}
              
              <CardDescription>
                Sadakat Programı #{program.id}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Durum:</span>
              {isEditing ? (
                <Switch
                  checked={!!editedProgram.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              ) : (
                <Badge variant={program.isActive ? 'default' : 'secondary'}>
                  {program.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Program Detayları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Açıklama</div>
                  {isEditing ? (
                    <textarea
                      className="w-full p-2 border rounded min-h-[80px]"
                      value={editedProgram.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  ) : (
                    <p>{program.description || 'Açıklama bulunmuyor'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Oluşturulma Tarihi</div>
                    <p>{formatDate(program.createdAt)}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Son Güncelleme</div>
                    <p>{formatDate(program.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Percent className="mr-2 h-5 w-5" />
                  Puan Metrikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Puan Oranı (₺)</div>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="w-full p-2 border rounded"
                        value={editedProgram.pointsPerCurrency || 0}
                        onChange={(e) => handleInputChange('pointsPerCurrency', parseFloat(e.target.value))}
                      />
                    ) : (
                      <p className="font-medium">{program.pointsPerCurrency} puan / ₺</p>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Minimum Puan Kullanımı</div>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2 border rounded"
                        value={editedProgram.minimumPointsForRedemption || 0}
                        onChange={(e) => handleInputChange('minimumPointsForRedemption', parseInt(e.target.value))}
                      />
                    ) : (
                      <p className="font-medium">{program.minimumPointsForRedemption} puan</p>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Puan Değeri (₺)</div>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="w-full p-2 border rounded"
                        value={editedProgram.pointValueInCurrency || 0}
                        onChange={(e) => handleInputChange('pointValueInCurrency', parseFloat(e.target.value))}
                      />
                    ) : (
                      <p className="font-medium">{program.pointValueInCurrency} ₺</p>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Geçerlilik Süresi</div>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        className="w-full p-2 border rounded"
                        value={editedProgram.expiryMonths || 0}
                        onChange={(e) => handleInputChange('expiryMonths', parseInt(e.target.value))}
                      />
                    ) : (
                      <p className="font-medium">{program.expiryMonths} ay</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" />
                Kayıtlı Müşteriler
              </CardTitle>
              <CardDescription>
                Bu sadakat programına kayıtlı müşterilerin listesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Puanlar</TableHead>
                      <TableHead className="text-right">Son İşlem</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Henüz bir müşteri verisi bulunmuyor
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 