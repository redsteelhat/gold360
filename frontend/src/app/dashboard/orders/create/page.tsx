"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder, OrderInput } from '@/utils/orderService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{id: number, quantity: number}[]>([]);
  const [formData, setFormData] = useState<Partial<OrderInput>>({
    customerId: 0,
    items: [],
    paymentMethod: 'credit_card',
    shippingMethod: 'standard',
    shippingAddress: '',
    billingAddress: '',
    notes: '',
  });

  // Gerçek bir uygulamada API'dan müşteri ve ürün verilerini alırdık
  useEffect(() => {
    // Örnek veri
    setCustomers([
      { id: 1, firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@example.com' },
      { id: 2, firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@example.com' },
      { id: 3, firstName: 'Ayşe', lastName: 'Demir', email: 'ayse@example.com' },
    ]);

    setProducts([
      { id: 1, name: 'Altın Bilezik', sku: 'BLZ-001', price: 5000, stockQuantity: 10 },
      { id: 2, name: 'Gümüş Kolye', sku: 'KLY-001', price: 1500, stockQuantity: 15 },
      { id: 3, name: 'Pırlanta Yüzük', sku: 'YZK-001', price: 8000, stockQuantity: 5 },
    ]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      customerId: parseInt(e.target.value),
    });
  };

  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, { id: 0, quantity: 1 }]);
  };

  const handleProductChange = (index: number, productId: number, quantity: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index] = { id: productId, quantity };
    setSelectedProducts(updatedProducts);
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.customerId === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir müşteri seçin.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProducts.length === 0 || selectedProducts.some(p => p.id === 0)) {
      toast({
        title: 'Hata',
        description: 'Lütfen en az bir ürün ekleyin ve tüm ürünleri seçin.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.shippingAddress || !formData.billingAddress) {
      toast({
        title: 'Hata',
        description: 'Lütfen teslimat ve fatura adreslerini doldurun.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Sipariş verilerini hazırla
      const orderData: OrderInput = {
        customerId: formData.customerId!,
        items: selectedProducts.map(p => ({
          productId: p.id,
          quantity: p.quantity,
        })),
        paymentMethod: formData.paymentMethod as OrderInput['paymentMethod'],
        shippingMethod: formData.shippingMethod!,
        shippingAddress: formData.shippingAddress!,
        billingAddress: formData.billingAddress!,
        notes: formData.notes,
      };

      // Siparişi oluştur
      await createOrder(orderData);
      
      toast({
        title: 'Başarılı',
        description: 'Sipariş başarıyla oluşturuldu.',
      });
      
      // Sipariş listesine geri dön
      router.push('/dashboard/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Hata',
        description: 'Sipariş oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni Sipariş Oluştur</CardTitle>
        <CardDescription>
          Yeni bir sipariş oluşturmak için aşağıdaki formu doldurun.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Müşteri Seçimi */}
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
              Müşteri
            </label>
            <select
              id="customerId"
              name="customerId"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={formData.customerId}
              onChange={handleCustomerChange}
            >
              <option value={0}>Müşteri Seçin</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Ürün Seçimi */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Ürünler
              </label>
              <Button 
                type="button" 
                onClick={handleAddProduct}
                variant="outline"
                size="sm"
              >
                Ürün Ekle
              </Button>
            </div>
            
            {selectedProducts.length === 0 ? (
              <div className="text-sm text-gray-500 mt-2">
                Henüz ürün eklenmedi.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map((selectedProduct, index) => (
                  <div key={index} className="flex space-x-2 items-end">
                    <div className="flex-grow">
                      <label className="block text-xs text-gray-500">
                        Ürün
                      </label>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={selectedProduct.id}
                        onChange={(e) => handleProductChange(index, parseInt(e.target.value), selectedProduct.quantity)}
                      >
                        <option value={0}>Ürün Seçin</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.price.toFixed(2)} TL (Stok: {product.stockQuantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500">
                        Adet
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={selectedProduct.quantity}
                        onChange={(e) => handleProductChange(index, selectedProduct.id, parseInt(e.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      Kaldır
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ödeme Yöntemi */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              Ödeme Yöntemi
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={formData.paymentMethod}
              onChange={handleInputChange}
            >
              <option value="credit_card">Kredi Kartı</option>
              <option value="debit_card">Banka Kartı</option>
              <option value="bank_transfer">Banka Havalesi</option>
              <option value="cash">Nakit</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* Kargo Yöntemi */}
          <div>
            <label htmlFor="shippingMethod" className="block text-sm font-medium text-gray-700">
              Kargo Yöntemi
            </label>
            <input
              type="text"
              id="shippingMethod"
              name="shippingMethod"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.shippingMethod}
              onChange={handleInputChange}
            />
          </div>

          {/* Teslimat Adresi */}
          <div>
            <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
              Teslimat Adresi
            </label>
            <textarea
              id="shippingAddress"
              name="shippingAddress"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.shippingAddress}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Fatura Adresi */}
          <div>
            <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
              Fatura Adresi
            </label>
            <textarea
              id="billingAddress"
              name="billingAddress"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.billingAddress}
              onChange={handleInputChange}
            ></textarea>
            <div className="mt-1 flex items-center">
              <input
                id="sameAsShipping"
                name="sameAsShipping"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      billingAddress: formData.shippingAddress,
                    });
                  }
                }}
              />
              <label htmlFor="sameAsShipping" className="ml-2 block text-sm text-gray-700">
                Teslimat adresi ile aynı
              </label>
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Sipariş Notları (İsteğe Bağlı)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.notes}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/orders')}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'İşleniyor...' : 'Sipariş Oluştur'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 