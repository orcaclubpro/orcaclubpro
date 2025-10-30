import { withPayload } from '@payloadcms/next/withPayload';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    // Configure turbopack options if needed
  },

  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      '@payloadcms/next',
      '@payloadcms/richtext-lexical',
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ]
  },
  
  // Webpack configuration for bun compatibility
  webpack: (config, { isServer }) => {
    // Optimize for bun runtime
    if (process.env.USE_BUN_RUNTIME !== 'false') {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Add any bun-specific aliases here if needed
      };
    }
    
    return config;
  },
  
  // Build-time environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  
  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
