'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import api, { secureApi } from '@/utils/api';

// Types
interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
}

interface StockAlert {
  id: number;
  productId: number;
  warehouseId: number;
  threshold: number;
  currentLevel: number;
  status: 'active' | 'resolved' | 'ignored';
  notificationSent: boolean;
  notificationDate?: string;
  createdAt: string;
  updatedAt: string;
  Product: Product;
  Warehouse: Warehouse;
}

const LowStockPage = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<StockAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    criticalAlerts: 0,
    totalAlerts: 0
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Kullanıcı kimlik doğrulamasını kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await secureApi.get('/warehouses');
        setWarehouses(response.data);
      } catch (error: any) {
        if (!error.noAuth) {
          console.error('Error fetching warehouses:', error);
          toast({
            title: 'Error',
            description: 'Failed to load warehouses. Please try again later.',
            variant: 'destructive',
          });
        }
      }
    };

    fetchWarehouses();
  }, [toast]);

  // Fetch stock alerts
  useEffect(() => {
    const fetchStockAlerts = async () => {
      setIsLoading(true);
      try {
        // Construct query params
        const params = new URLSearchParams();
        
        if (selectedStatus !== 'all') {
          params.append('status', selectedStatus);
        }
        
        if (selectedWarehouse !== 'all') {
          params.append('warehouseId', selectedWarehouse);
        }
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        // Fetch alerts using secureApi
        const alertsResponse = await secureApi.get(`/stock-alerts${queryString}`);
        setAlerts(alertsResponse.data);
        setFilteredAlerts(alertsResponse.data);
        
        // Fetch dashboard stats using secureApi
        const statsResponse = await secureApi.get('/stock-alerts/dashboard');
        setStats(statsResponse.data);
      } catch (error: any) {
        if (!error.noAuth) {
          console.error('Error fetching stock alerts:', error);
          toast({
            title: 'Error',
            description: 'Failed to load stock alerts. Please try again later.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockAlerts();
  }, [selectedWarehouse, selectedStatus, toast]);

  // Filter alerts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAlerts(alerts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = alerts.filter(alert => 
      alert.Product.name.toLowerCase().includes(query) || 
      alert.Product.sku.toLowerCase().includes(query) ||
      alert.Warehouse.name.toLowerCase().includes(query) ||
      alert.Warehouse.location.toLowerCase().includes(query)
    );
    
    setFilteredAlerts(filtered);
  }, [searchQuery, alerts]);

  // Get stock status badge
  const getStockStatusBadge = (alert: StockAlert) => {
    if (alert.currentLevel === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (alert.currentLevel <= alert.threshold / 2) {
      return <Badge variant="destructive">Critical</Badge>;
    } else {
      return <Badge variant="default">Low Stock</Badge>;
    }
  };
  
  // Handle alert status change
  const handleStatusChange = async (alertId: number, newStatus: 'active' | 'resolved' | 'ignored') => {
    try {
      await secureApi.put(`/stock-alerts/${alertId}`, { status: newStatus });
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: newStatus }
          : alert
      ));
      
      toast({
        title: 'Status Updated',
        description: `Alert has been marked as ${newStatus}`,
      });
    } catch (error: any) {
      if (error.noAuth) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to update alert status',
          variant: 'destructive',
        });
        return;
      }
      
      console.error('Error updating alert status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert status',
        variant: 'destructive',
      });
    }
  };
  
  // Run inventory check
  const runInventoryCheck = async () => {
    try {
      const response = await secureApi.post('/stock-alerts/check');
      const data = response.data;
      
      toast({
        title: 'Inventory Check Complete',
        description: `Found ${data.results.created} new alerts, updated ${data.results.updated}, resolved ${data.results.resolved}`,
      });
      
      // Refresh alerts
      const refreshResponse = await secureApi.get('/stock-alerts');
      setAlerts(refreshResponse.data);
      setFilteredAlerts(refreshResponse.data);
      
      // Refresh stats
      const statsResponse = await secureApi.get('/stock-alerts/dashboard');
      setStats(statsResponse.data);
    } catch (error: any) {
      if (error.noAuth) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to run inventory check',
          variant: 'destructive',
        });
        return;
      }
      
      console.error('Error running inventory check:', error);
      toast({
        title: 'Error',
        description: 'Failed to run inventory check',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Low Stock Alerts</h1>
          <p className="text-muted-foreground">
            View and manage items with low stock levels across all warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runInventoryCheck}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Run Stock Check
          </Button>
          <Button asChild>
            <Link href="/dashboard/inventory">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Manage Inventory
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeAlerts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.criticalAlerts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {stats.totalAlerts}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>Items that need to be restocked</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                  <SelectItem value="all">All Statuses</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline">Export</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No alerts found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery ? "Try adjusting your search query or filters" : "All your inventory items are at healthy levels"}
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Threshold</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.Product.name}</TableCell>
                      <TableCell>{alert.Product.sku}</TableCell>
                      <TableCell>{alert.Warehouse.name}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${alert.currentLevel === 0 ? 'text-destructive' : ''}`}>
                          {alert.currentLevel}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{alert.threshold}</TableCell>
                      <TableCell className="text-center">
                        {getStockStatusBadge(alert)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {alert.status === 'active' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusChange(alert.id, 'ignored')}
                              >
                                Ignore
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusChange(alert.id, 'resolved')}
                              >
                                Resolve
                              </Button>
                            </>
                          )}
                          {alert.status === 'ignored' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(alert.id, 'active')}
                            >
                              Unignore
                            </Button>
                          )}
                          {alert.status === 'resolved' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStatusChange(alert.id, 'active')}
                            >
                              Reactivate
                            </Button>
                          )}
                          <Button 
                            variant="default" 
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/inventory/product/${alert.productId}`}>
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Restock
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockPage; 