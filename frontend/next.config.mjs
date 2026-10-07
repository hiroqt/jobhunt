/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/openapi.json',
        destination: 'https://jobhunt-1e11.onrender.com/openapi.json',
      },
      {
        source: '/mcp/:path*',
        destination: 'https://jobhunt-1e11.onrender.com/mcp/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'https://jobhunt-1e11.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
