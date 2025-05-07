"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const carriers = [
    { id: 'aras', name: 'Aras Kargo' },
    { id: 'yurtici', name: 'Yurtiçi Kargo' },
    { id: 'mng', name: 'MNG Kargo' },
    { id: 'ups', name: 'UPS' },
    { id: 'fedex', name: 'FedEx' },
    { id: 'dhl', name: 'DHL' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }
    
    if (!carrier) {
      setError('Please select a carrier');
      return;
    }
    
    // Navigate to the tracking details page
    router.push(`/shipping/track/${trackingNumber}/${carrier}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Track Your Shipment</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="trackingNumber">
                Tracking Number
              </label>
              <input
                type="text"
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your tracking number"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carrier">
                Carrier
              </label>
              <select
                id="carrier"
                value={carrier}
                onChange={(e) => {
                  setCarrier(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a carrier</option>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Track Package
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">Need help with your shipment?</p>
          <p>Contact our customer service at <span className="font-semibold">support@gold360.com</span></p>
        </div>
      </div>
    </div>
  );
} 