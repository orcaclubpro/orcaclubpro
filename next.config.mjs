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
  
  // SECURITY: Enhanced security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Content Security Policy - protect against XSS and injection attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://vercel.live https://*.google.com https://api.resend.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Permissions Policy - restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Strict Transport Security - enforce HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig);
