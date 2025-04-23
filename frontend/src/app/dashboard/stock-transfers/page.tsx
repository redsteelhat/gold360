'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileDown, Filter, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

// Types
interface Warehouse {
  id: number;
  name: string;
  location: string;
}

interface TransferItem {
  id: number;
  productId: number;
  product: {
    name: string;
    sku: string;
  };
  quantity: number;
  receivedQuantity?: number;
  status: string;
}

interface StockTransfer {
  id: number;
  referenceNumber: string;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  sourceWarehouse: Warehouse;
  destinationWarehouse: Warehouse;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  initiatedDate: string;
  completedDate?: string;
  initiatedBy: {
    id: number;
    name: string;
  };
  items: TransferItem[];
}

const StockTransfersPage = () => {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<StockTransfer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch stock transfers
  useEffect(() => {
    const fetchTransfers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stock-transfers`);
        if (!response.ok) throw new Error('Failed to fetch stock transfers');
        
        const data = await response.json();
        setTransfers(data);
        setFilteredTransfers(data);
      } catch (error) {
        console.error('Error fetching stock transfers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load stock transfers. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, [toast]);

  // Filter transfers based on search query and status
  useEffect(() => {
    let filtered = [...transfers];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transfer => transfer.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transfer => 
        transfer.referenceNumber.toLowerCase().includes(query) || 
        transfer.sourceWarehouse.name.toLowerCase().includes(query) ||
        transfer.destinationWarehouse.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredTransfers(filtered);
  }, [searchQuery, statusFilter, transfers]);

  // Get badge color for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'IN_TRANSIT':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-muted-foreground">
            Manage transfers between warehouses
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Transfer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transfers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transfers.filter(t => t.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {transfers.filter(t => t.status === 'IN_TRANSIT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {transfers.filter(t => t.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Stock Transfers</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4 space-x-2">
            <div className="flex items-center w-full max-w-sm space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transfers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No transfers found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || statusFilter !== 'all' 
                  ? "Try adjusting your search filters" 
                  : "Create your first stock transfer to get started"}
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> New Transfer
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Reference</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[100px]">Items</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.referenceNumber}</TableCell>
                      <TableCell>{transfer.sourceWarehouse.name}</TableCell>
                      <TableCell>{transfer.destinationWarehouse.name}</TableCell>
                      <TableCell>{new Date(transfer.initiatedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {transfer.items ? transfer.items.length : 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(transfer.status)}>
                          {transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/stock-transfers/${transfer.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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

export default StockTransfersPage; 