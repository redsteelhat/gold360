'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Building2, MapPin, Phone, Trash, Edit, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { secureApi } from '@/utils/api';

// Types
interface Warehouse {
  id: number;
  name: string;
  location: string;
  address: string;
  capacity: number;
  isActive: boolean;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

const WarehousesPage = () => {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      setIsLoading(true);
      try {
        const response = await secureApi.get('/warehouses');
        setWarehouses(response.data);
        setFilteredWarehouses(response.data);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load warehouses. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouses();
  }, [toast]);

  // Filter warehouses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWarehouses(warehouses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = warehouses.filter(warehouse => 
      warehouse.name.toLowerCase().includes(query) || 
      warehouse.location.toLowerCase().includes(query) ||
      warehouse.address.toLowerCase().includes(query) ||
      (warehouse.contactPerson && warehouse.contactPerson.toLowerCase().includes(query))
    );
    
    setFilteredWarehouses(filtered);
  }, [searchQuery, warehouses]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">
            Manage your warehouses and view inventory levels
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Warehouse
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Active Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouses.filter(w => w.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Inactive Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouses.filter(w => !w.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search warehouses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">No warehouses found</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery ? "Try adjusting your search query" : "Create your first warehouse to get started"}
          </p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Warehouse
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className={warehouse.isActive ? '' : 'opacity-70'}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{warehouse.name}</CardTitle>
                  <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <MapPin className="h-3.5 w-3.5 mr-1" /> {warehouse.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{warehouse.address}</p>
                  {warehouse.contactPerson && (
                    <p className="flex items-center">
                      <span className="font-medium mr-1">Contact:</span> {warehouse.contactPerson}
                    </p>
                  )}
                  {warehouse.contactPhone && (
                    <p className="flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1" /> {warehouse.contactPhone}
                    </p>
                  )}
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1">Capacity Usage</div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>45% Used</span>
                      <span>Capacity: {warehouse.capacity}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
                <Link href={`/dashboard/warehouses/${warehouse.id}`} passHref>
                  <Button variant="default" size="sm">
                    Details <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehousesPage; 