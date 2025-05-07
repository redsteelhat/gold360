'use client';

import { useEffect, useState } from 'react';

// This is a sample "heavy" component that might take time to load
export default function HeavyComponent() {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    // Simulate heavy data loading
    const loadData = async () => {
      // Artificial delay to simulate heavy component loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setData(Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        description: `This is the description for item ${i + 1}`,
        price: Math.floor(Math.random() * 1000) + 100
      })));
    };
    
    loadData();
  }, []);
  
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Heavy Component Loaded</h2>
      
      <div className="grid gap-4">
        {data.length > 0 ? (
          data.map(item => (
            <div key={item.id} className="p-3 border rounded-md">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
              <p className="text-right font-bold">${item.price}</p>
            </div>
          ))
        ) : (
          <div className="animate-pulse bg-gray-100 p-4 rounded">Loading data...</div>
        )}
      </div>
    </div>
  );
} 