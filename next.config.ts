import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // in nextjs 
  async redirects() {
    return [
      {
        source: '/',
        destination: '/graph',
        permanent: true, 
      },
    ];
  },
};

export default nextConfig;
