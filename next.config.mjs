/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // serverActions: true,
  },
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Add alias for better imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
    };

    return config;
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Enable SWC minification
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  // Add build-time environment variables
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

export default nextConfig