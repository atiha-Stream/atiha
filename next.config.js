// Import Sentry (optionnel, ne bloque pas si non configuré)
let withSentry = (config) => config
try {
  withSentry = require('@sentry/nextjs').withSentryConfig
} catch (e) {
  // Sentry non configuré, continuer sans
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Optimisation des images avec Next.js Image
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fr.web.img5.acsta.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.themoviedb.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.themoviedb.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      // Ajouts pour accepter vos URLs d'affiches et d'aperçus
      {
        protocol: 'https',
        hostname: 'www.cpasmieux.is',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cpasbienfr.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.torrent911.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www5.torrent9.to',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.cosmic-crab.buzz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'webtor.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'french-stream.qpon',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.ecranlarge.com',
        port: '',
        pathname: '/**',
      }
      ,
      // Nouveaux domaines d'images demandés
      {
        protocol: 'https',
        hostname: 'www.filmoflix.is',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www1.oxtorrent.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'photos.tf1.fr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hfs322.serversicuro.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hfs323.serversicuro.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'hfs303.serversicuro.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  experimental: {
    // Optimisation des imports de packages lourds
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'react-beautiful-dnd', '@dnd-kit/core'],
  },
  turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
      },
    },
  },
  // Optimisations de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimisation du bundle
  webpack: (config, { dev, isServer }) => {
    // Ignorer les warnings de dépendances critiques de Prisma/OpenTelemetry
    // Ces warnings sont normaux et n'affectent pas le fonctionnement
    config.ignoreWarnings = [
      { module: /@prisma\/instrumentation/ },
      { module: /@opentelemetry/ },
      { message: /Critical dependency/ },
    ]

    // Optimisations pour la production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Bundle des vendors
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // Bundle commun
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          },
          // Bundle des composants UI
          ui: {
            name: 'ui',
            test: /[\\/]components[\\/]/,
            chunks: 'all',
            priority: 5
          },
          // Bundle des pages
          pages: {
            name: 'pages',
            test: /[\\/]app[\\/]/,
            chunks: 'all',
            priority: 5
          }
        }
      }
    }

    return config
  },
  // Configuration pour le PWA et sécurité HTTPS
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    
    const securityHeaders = isProduction ? [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
      }
    ] : []

    const headersConfig = [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]

    // Ajouter les headers de sécurité HTTPS uniquement en production (pas de tableau vide)
    if (isProduction && securityHeaders.length > 0) {
      headersConfig.push({
        source: '/:path*',
        headers: securityHeaders,
      })
    }

    return headersConfig
  },
}

// Wrapper avec Sentry si disponible
export default withSentry(nextConfig, {
  // Options Sentry
  silent: true, // Ne pas afficher les logs Sentry pendant le build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
})
