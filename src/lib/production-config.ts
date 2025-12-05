/**
 * Configuration pour la production
 * Gestion des domaines d'images et fallbacks
 */

export interface ProductionConfig {
  imageDomains: string[]
  fallbackImages: {
    movie: string
    series: string
    episode: string
    user: string
    default: string
  }
  cdnConfig?: {
    enabled: boolean
    baseUrl: string
    transformations?: {
      quality: number
      format: 'webp' | 'avif' | 'auto'
      width?: number
      height?: number
    }
  }
}

export const PRODUCTION_CONFIG: ProductionConfig = {
  imageDomains: [
    // Domaines de production
    'your-domain.com',
    'cdn.your-domain.com',
    'images.your-domain.com',
    
    // Domaines de contenu
    'image.tmdb.org',
    'media.themoviedb.org',
    'fr.web.img6.acsta.net',
    'img.lemde.fr',
    'megastreaming.ink',
    
    // Domaines de streaming
    'live-hls-abr-cdn.livepush.io',
    'commondatastorage.googleapis.com',
    
    // Domaines génériques (avec wildcards)
    '*.tmdb.org',
    '*.themoviedb.org',
    '*.googleapis.com',
    '*.gstatic.com',
    '*.youtube.com',
    '*.ytimg.com',
    '*.vimeocdn.com',
    '*.dailymotion.com'
  ],
  
  fallbackImages: {
    movie: '/images/fallback-movie.jpg',
    series: '/images/fallback-series.jpg',
    episode: '/images/fallback-episode.jpg',
    user: '/images/fallback-user.jpg',
    default: '/placeholder-video.jpg'
  },
  
  cdnConfig: {
    enabled: false, // Activer si vous utilisez un CDN
    baseUrl: 'https://cdn.your-domain.com',
    transformations: {
      quality: 80,
      format: 'auto',
      width: 800,
      height: 600
    }
  }
}

/**
 * Obtient la configuration selon l'environnement
 */
export function getImageConfig(): ProductionConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    return PRODUCTION_CONFIG
  }
  
  // Configuration de développement
  return {
    ...PRODUCTION_CONFIG,
    imageDomains: [
      'localhost',
      '127.0.0.1',
      ...PRODUCTION_CONFIG.imageDomains
    ]
  }
}

/**
 * Génère la configuration Next.js pour les images
 */
export function generateNextImageConfig() {
  const config = getImageConfig()
  
  return {
    domains: config.imageDomains.filter(domain => !domain.includes('*')),
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http' as const,
        hostname: '**',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
}
