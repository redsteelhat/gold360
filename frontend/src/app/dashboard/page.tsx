'use client';

// This file won't be processed due to linter errors in the other files
// We'll fix the errors and component structure in a more comprehensive setup
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { LowStockWidget } from '@/components/Dashboard/LowStockWidget';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSales: '₺24,780',
    salesGrowth: '12%',
    orders: 156,
    ordersGrowth: '8%',
    customers: 96,
    customersGrowth: '15%',
    lowStockItems: 12,
    lowStockGrowth: '3'
  });

  return (
    <div className="space-y-6">
      {/* Genel Bakış */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Genel Bakış</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Satış Kartı */}
          <div className="card border-l-4 border-gold-primary">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-text-secondary">Toplam Satış</p>
                <p className="text-2xl font-bold text-text-primary">{stats.totalSales}</p>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <span className="mr-1">↑</span> Geçen aya göre {stats.salesGrowth}
                </p>
              </div>
              <div className="h-10 w-10 bg-gold-primary/20 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-gold-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Sipariş Kartı */}
          <div className="card border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-text-secondary">Siparişler</p>
                <p className="text-2xl font-bold text-text-primary">{stats.orders}</p>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <span className="mr-1">↑</span> Geçen aya göre {stats.ordersGrowth}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Müşteriler Kartı */}
          <div className="card border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-text-secondary">Müşteriler</p>
                <p className="text-2xl font-bold text-text-primary">{stats.customers}</p>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <span className="mr-1">↑</span> Geçen aya göre {stats.customersGrowth}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Düşük Stok Kartı */}
          <div className="card border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-text-secondary">Düşük Stok Ürünleri</p>
                <p className="text-2xl font-bold text-text-primary">{stats.lowStockItems}</p>
                <p className="text-xs text-red-500 flex items-center mt-1">
                  <span className="mr-1">↑</span> Geçen haftaya göre {stats.lowStockGrowth} fazla
                </p>
              </div>
              <div className="h-10 w-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Siparişler Bölümü */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-text-primary">Son Siparişler</h2>
            <Button variant="link" asChild>
              <Link href="/dashboard/orders" className="flex items-center">
                Tümünü Gör
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Sipariş No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Tutar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Sipariş satırları... */}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Düşük Stok Uyarıları Bölümü */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-text-primary">Düşük Stok Uyarıları</h2>
            <Button variant="link" asChild>
              <Link href="/dashboard/inventory/low-stock" className="flex items-center">
                Tümünü Gör
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <LowStockWidget limit={5} />
        </div>
      </div>
      
      {/* Gösterge panelinin geri kalanı... */}
    </div>
  );
}