import type { Metadata } from 'next';
import '@/styles/globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Gold360 - Complete Jewelry Business Platform',
  description: 'Manage your jewelry business with our all-in-one platform. E-commerce, inventory, CRM and more.',
  keywords: 'jewelry, gold, e-commerce, inventory management, CRM, business platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body>
        <Providers>
          <ServiceWorkerRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
} 