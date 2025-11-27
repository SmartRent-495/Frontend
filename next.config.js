/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

const nextConfig = {
  reactStrictMode: true,

  // // Temporarily skip ESLint during builds on Vercel to avoid plugin/version crashes
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd205bpvrqc9yn1.cloudfront.net' },
    ],
  },

  async rewrites() {
    if (API_BASE) {
      return [
        { source: '/api/:path*', destination: `${API_BASE}/api/:path*` },
      ];
    }
    if (process.env.NODE_ENV !== 'production') {
      return [
        { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
