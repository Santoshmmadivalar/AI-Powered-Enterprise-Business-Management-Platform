import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(process.cwd(), '../node_modules/react'),
      'react-dom': path.resolve(process.cwd(), '../node_modules/react-dom'),
    };
    return config;
  },
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
    resolveAlias: {
      'react': '../node_modules/react',
      'react-dom': '../node_modules/react-dom',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5050/api/:path*',
      },
    ];
  },
};

export default nextConfig;
