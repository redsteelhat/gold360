import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShoppingCart, CheckCircle, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import api, { secureApi } from '@/utils/api';

interface StockAlert {
  id: number;
  productId: number;
  warehouseId: number;
  threshold: number;
  currentLevel: number;
  status: 'active' | 'resolved' | 'ignored';
  notificationSent: boolean;
  notificationDate: string | null;
  createdAt: string;
  Product: {
    id: number;
    name: string;
    sku: string;
  };
  Warehouse: {
    id: number;
    name: string;
  };
}

interface LowStockAlertsProps {
  limit?: number;
  showHeader?: boolean;
  onlyActive?: boolean;
}

const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ 
  limit = 5, 
  showHeader = true,
  onlyActive = true
}) => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    totalAlerts: 0,
    criticalAlerts: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        
        try {
          const alertsResponse = await secureApi.get(`/stock-alerts${onlyActive ? '?status=active' : ''}`);
          setAlerts(alertsResponse.data.slice(0, limit));
          
          const statsResponse = await secureApi.get('/stock-alerts/dashboard');
          setStats(statsResponse.data);
        } catch (apiError: any) {
          if (!apiError.noAuth) {
            console.error('Error fetching low stock alerts:', apiError);
            toast({
              title: 'Error',
              description: 'Failed to load low stock alerts',
              variant: 'destructive',
            });
          } else {
            console.log('Authentication required for stock alerts');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [limit, onlyActive, toast]);

  const handleAlertDismiss = async (id: number) => {
    try {
      await secureApi.put(`/stock-alerts/${id}`, { status: 'ignored' });
      
      setAlerts(alerts.filter(alert => alert.id !== id));
      setStats({
        ...stats,
        activeAlerts: stats.activeAlerts - 1
      });
      
      toast({
        title: 'Alert dismissed',
        description: 'The stock alert has been marked as ignored',
      });
    } catch (error: any) {
      if (error.noAuth) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to dismiss alerts',
          variant: 'destructive',
        });
        return;
      }
      
      console.error('Error dismissing alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss the alert',
        variant: 'destructive',
      });
    }
  };

  const getStockLevelBadge = (alert: StockAlert) => {
    if (alert.currentLevel === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (alert.currentLevel <= alert.threshold / 2) {
      return <Badge variant="destructive">Critical</Badge>;
    } else {
      return <Badge variant="default">Low Stock</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>
            Items that need replenishment soon
          </CardDescription>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div className="bg-muted rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-semibold">{stats.activeAlerts}</p>
            </div>
            <div className="bg-muted rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-lg font-semibold">{stats.criticalAlerts}</p>
            </div>
            <div className="bg-muted rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{stats.totalAlerts}</p>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-medium text-center">No low stock alerts</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              All your inventory items are at healthy levels
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mr-4">
                  <h4 className="font-medium">{alert.Product.name}</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="mr-2">SKU: {alert.Product.sku}</span>
                    <span>•</span>
                    <span className="ml-2">{alert.Warehouse.name}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    {getStockLevelBadge(alert)}
                    <span className="ml-2 text-sm">
                      <span className="font-medium">{alert.currentLevel}</span>
                      <span className="text-muted-foreground"> / Threshold: {alert.threshold}</span>
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAlertDismiss(alert.id)}
                  >
                    Dismiss
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/dashboard/inventory/product/${alert.productId}`}>
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Restock
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {alerts.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="ghost" 
                  asChild
                >
                  <Link href="/dashboard/inventory/low-stock">
                    View all alerts
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockAlerts; 