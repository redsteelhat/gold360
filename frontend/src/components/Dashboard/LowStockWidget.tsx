import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useLowStockAlerts, LowStockItem } from '@/utils/hooks/useLowStockAlerts';
import { Skeleton } from '@/components/ui/skeleton';

interface LowStockWidgetProps {
  limit?: number;
}

export function LowStockWidget({ limit = 5 }: LowStockWidgetProps) {
  const { lowStockItems, loading, error } = useLowStockAlerts(limit);

  const getSeverityBadge = (severity: LowStockItem['severity']) => {
    switch(severity) {
      case 'critical':
        return <Badge variant="destructive">Stokta Yok</Badge>;
      case 'warning':
        return <Badge variant="warning">Kritik Seviye</Badge>;
      default:
        return <Badge variant="outline">Az Stok</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Stok Uyarıları
          </CardTitle>
          <Badge variant="outline">{loading ? '...' : lowStockItems.length}</Badge>
        </div>
        <CardDescription>
          Stok seviyesi düşük olan ürünler
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-6 text-center text-muted-foreground">
            Stok bilgileri alınırken bir hata oluştu.
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            Stok seviyesi düşük ürün bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-start justify-between p-2 rounded-lg border">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.sku}</div>
                  <div className="flex items-center mt-1 space-x-2">
                    {getSeverityBadge(item.severity)}
                    <span className="text-sm">
                      {item.currentQuantity} / {item.threshold}
                    </span>
                  </div>
                </div>
                {item.warehouseName && (
                  <Badge variant="outline" className="ml-2 self-start">
                    {item.warehouseName}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link href="/dashboard/inventory?filter=lowStock">
            Tüm stok uyarılarını görüntüle
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 