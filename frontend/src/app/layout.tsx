import type { Metadata } from 'next';
import '@/styles/globals.css';

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
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 