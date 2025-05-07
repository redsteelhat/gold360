'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';

// Instead of importing directly, use dynamic import for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="p-4 animate-pulse bg-gray-200 rounded">Loading...</div>,
  ssr: false, // This component will only load on client-side
});

// Example of a component with dynamic imports
export default function DynamicImportExample() {
  const [showComponent, setShowComponent] = useState(false);

  return (
    <div>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowComponent(!showComponent)}
      >
        {showComponent ? 'Hide' : 'Show'} Heavy Component
      </button>

      {showComponent && (
        <Suspense fallback={<div className="p-4 bg-gray-100 rounded">Loading component...</div>}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
} 