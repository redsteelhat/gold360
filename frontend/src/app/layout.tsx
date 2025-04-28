import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

// Import global CSS
import './globals.css';

// Import Inter font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'Gold360 - Kuyumcu Yönetim Sistemi',
  description: 'Kuyumcu işletmeleri için eksiksiz dijital çözüm',
  keywords: 'kuyumcu, e-ticaret, CRM, envanter yönetimi, altın, perakende, dijital platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="bg-bg-light min-h-screen">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
} 