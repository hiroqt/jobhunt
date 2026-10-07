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
        source: '/messages/:path*',
        destination: 'https://jobhunt-1e11.onrender.com/messages/:path*',
      },
      {
        source: '/messages',
        destination: 'https://jobhunt-1e11.onrender.com/messages',
      },
      {
        source: '/sse',
        destination: 'https://jobhunt-1e11.onrender.com/sse',
      },
      {
        source: '/api/:path*',
        destination: 'https://jobhunt-1e11.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
