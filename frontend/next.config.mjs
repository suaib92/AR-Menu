
const nextConfig = {
  // Allow access from local network IP for testing on phones
  allowedDevOrigins: ['192.168.31.106'],
  
  // Proxy API requests to backend internally
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*'
      }
    ];
  }
};

export default nextConfig;
