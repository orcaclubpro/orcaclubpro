import { withPayload } from '@payloadcms/next/withPayload';
import { LEGACY_REDIRECTS } from './src/lib/seo/redirect-map.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production to reduce memory usage
  productionBrowserSourceMaps: false,

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
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'sonner',
      'recharts'
    ],
    // Enable webpack memory optimizations
    webpackMemoryOptimizations: true,
    // Inline critical CSS to reduce render-blocking resources
    optimizeCss: true,
    // Client router cache: serve recently-visited dynamic routes (dashboard
    // tabs) from cache on back/forward and repeat visits within the window.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
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
  
  async redirects() {
    return [
      // SONAR subdomain → main domain. Host-scoped so these only fire on
      // sonar.orcaclub.pro. The explicit /s rules come first so an old
      // internal-mount URL lands on /sonar/* in one hop, not /sonar/s/*.
      {
        source: '/s',
        has: [{ type: 'host', value: 'sonar.orcaclub.pro' }],
        destination: 'https://orcaclub.pro/sonar',
        permanent: true,
      },
      {
        source: '/s/:path*',
        has: [{ type: 'host', value: 'sonar.orcaclub.pro' }],
        destination: 'https://orcaclub.pro/sonar/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'sonar.orcaclub.pro' }],
        destination: 'https://orcaclub.pro/sonar/:path*',
        permanent: true,
      },

      // Legacy IA → new IA (Phase-2 cutover). Single source of truth:
      // src/lib/seo/redirect-map.mjs. Order matters — static /solutions/*
      // entries precede the :slug catch-all.
      ...LEGACY_REDIRECTS.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://vercel.live https://*.google.com https://api.resend.com https://www.googletagmanager.com https://www.google-analytics.com",
              "frame-src https://www.googletagmanager.com",
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
