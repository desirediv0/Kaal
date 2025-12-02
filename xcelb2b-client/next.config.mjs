/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false 
    };
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        jodit: {
          test: /jodit-react/,
          name: 'jodit',
          chunks: 'all',
        }
      }
    };
    return config;
  },
  transpilePackages: ['jodit', 'jodit-react'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "desirediv-storage.blr1.digitaloceanspaces.com"
      },
      {
        protocol: "https",
        hostname: "blr1.digitaloceanspaces.com"
      }
    ],
  },
};

export default nextConfig;