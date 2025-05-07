"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { shippingService } from '../../../../../lib/api';

interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  statusDate?: string;
  events?: {
    date: string;
    location: string;
    description: string;
  }[];
  error?: string;
}

export default function TrackShipmentPage() {
  const params = useParams();
  const trackingNumber = params.trackingNumber as string;
  const carrier = params.carrier as string;
  
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrackingInfo = async () => {
      try {
        setIsLoading(true);
        const response = await shippingService.track(trackingNumber, carrier);
        setTrackingInfo(response.data);
        setError(null);
      } catch (err) {
        console.error('Error tracking shipment:', err);
        setError('Failed to retrieve tracking information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (trackingNumber && carrier) {
      fetchTrackingInfo();
    } else {
      setError('Missing tracking number or carrier information.');
      setIsLoading(false);
    }
  }, [trackingNumber, carrier]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || (trackingInfo && trackingInfo.error)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tracking Error</h1>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error || trackingInfo?.error}</p>
            </div>
            <div className="mt-6 text-center">
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingInfo) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Shipment Tracking</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-500">Carrier</div>
              <div className="font-semibold">{trackingInfo.carrier}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-500">Tracking Number</div>
              <div className="font-semibold">{trackingInfo.trackingNumber}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-semibold">{trackingInfo.status}</div>
            </div>
            {trackingInfo.estimatedDelivery && (
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-500">Estimated Delivery</div>
                <div className="font-semibold">{new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}</div>
              </div>
            )}
          </div>
          
          {trackingInfo.events && trackingInfo.events.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3">Tracking History</h2>
              <div className="space-y-4">
                {trackingInfo.events.map((event, index) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-4 py-2">
                    <div className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleString()}
                    </div>
                    <div className="font-medium">{event.description}</div>
                    <div className="text-sm">{event.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 