/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'microblog-backend-1jv9.onrender.com', 'via.placeholder.com', 'res.cloudinary.com'],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ];
  },
  output: 'standalone',
};

module.exports = nextConfig;