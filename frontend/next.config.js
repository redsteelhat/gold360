/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimisticClientCache: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable gzip compression
  compress: true,
  // Improved production builds
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig; 