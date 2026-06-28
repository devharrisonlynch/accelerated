/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@accelerated/sdk'],
  experimental: {
    optimizePackageImports: ['lightweight-charts', 'framer-motion'],
  },
};

export default nextConfig;
