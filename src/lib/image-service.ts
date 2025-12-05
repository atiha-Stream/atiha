/**
 * Service de gestion des images avec fallback et validation
 */

export interface ImageConfig {
  src: string
  fallbackSrc?: string
  width?: number
  height?: number
  quality?: number
}

export class ImageService {
  private static readonly DEFAULT_FALLBACK = '/placeholder-video.jpg'
  private static readonly ALLOWED_DOMAINS = [
    'localhost',
    'french-stream.qpon',
    'fr.web.img6.acsta.net',
    'montpellier.megarama.fr',
    'img.lemde.fr',
    'megastreaming.ink',
    'image.tmdb.org',
    'media.themoviedb.org',
    'example.com',
    'commondatastorage.googleapis.com',
    'live-hls-abr-cdn.livepush.io'
  ]

  /**
   * Valide une URL d'image
   */
  static isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false
    
    try {
      const urlObj = new URL(url)
      
      // Vérifier le protocole
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false
      }
      
      // Vérifier l'extension
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().includes(ext)
      )
      
      return hasValidExtension
    } catch {
      return false
    }
  }

  /**
   * Vérifie si un domaine est autorisé
   */
  static isDomainAllowed(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      
      // Vérifier les domaines exacts
      if (this.ALLOWED_DOMAINS.includes(hostname)) {
        return true
      }
      
      // Vérifier les sous-domaines
      return this.ALLOWED_DOMAINS.some(domain => {
        if (domain.startsWith('*.')) {
          const baseDomain = domain.substring(2)
          return hostname.endsWith(baseDomain)
        }
        return false
      })
    } catch {
      return false
    }
  }

  /**
   * Obtient une URL d'image sécurisée avec fallback
   */
  static getSafeImageUrl(src: string, fallbackSrc?: string): string {
    // Si l'URL est valide et le domaine autorisé, l'utiliser
    if (this.isValidImageUrl(src) && this.isDomainAllowed(src)) {
      return src
    }
    
    // Sinon, utiliser le fallback
    return fallbackSrc || this.DEFAULT_FALLBACK
  }

  /**
   * Génère une URL d'image optimisée
   */
  static getOptimizedImageUrl(src: string, width?: number, height?: number, quality: number = 75): string {
    if (!this.isValidImageUrl(src)) {
      return this.DEFAULT_FALLBACK
    }

    // Pour les images locales ou déjà optimisées, retourner l'URL telle quelle
    if (src.startsWith('/') || src.includes('_next/image')) {
      return src
    }

    // Pour les images externes, on pourrait ajouter des paramètres d'optimisation
    // selon le service utilisé (ex: Cloudinary, ImageKit, etc.)
    return src
  }

  /**
   * Vérifie la disponibilité d'une image
   */
  static async checkImageAvailability(src: string): Promise<boolean> {
    if (!this.isValidImageUrl(src)) {
      return false
    }

    try {
      const response = await fetch(src, { 
        method: 'HEAD',
        mode: 'no-cors' // Éviter les problèmes CORS
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Obtient les métadonnées d'une image
   */
  static async getImageMetadata(src: string): Promise<{ width: number; height: number } | null> {
    if (!this.isValidImageUrl(src)) {
      return null
    }

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      img.onerror = () => {
        resolve(null)
      }
      img.src = src
    })
  }

  /**
   * Génère un placeholder blur
   */
  static generateBlurDataURL(width: number = 10, height: number = 10): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Créer un gradient simple
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#374151')
      gradient.addColorStop(1, '#1f2937')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
    
    return canvas.toDataURL()
  }

  /**
   * Ajoute un nouveau domaine autorisé (pour la configuration dynamique)
   */
  static addAllowedDomain(domain: string): void {
    if (!this.ALLOWED_DOMAINS.includes(domain)) {
      this.ALLOWED_DOMAINS.push(domain)
    }
  }

  /**
   * Obtient la liste des domaines autorisés
   */
  static getAllowedDomains(): string[] {
    return [...this.ALLOWED_DOMAINS]
  }
}
