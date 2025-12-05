// Service pour gérer le transcodage HLS
import { logger } from './logger'

export interface HLSStreamingConfig {
  serverUrl: string
  port: number
  outputDir: string
  quality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p'
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow'
}

export interface HLSStreamingResult {
  success: boolean
  hlsUrl?: string
  masterPlaylistUrl?: string
  error?: string
  transcodingStatus?: 'pending' | 'transcoding' | 'completed' | 'failed'
}

export class HLSTranscoderService {
  private static readonly DEFAULT_CONFIG: HLSStreamingConfig = {
    serverUrl: 'http://localhost',
    port: 8080,
    outputDir: '/tmp/hls',
    quality: 'auto',
    preset: 'fast'
  }

  // Démarrer le transcodage d'une URL vidéo
  static async startTranscoding(
    videoUrl: string, 
    config: Partial<HLSStreamingConfig> = {}
  ): Promise<HLSStreamingResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    try {
      // Vérifier si le serveur de transcodage est disponible
      const isServerAvailable = await this.checkServerHealth(finalConfig)
      if (!isServerAvailable) {
        return {
          success: false,
          error: 'Serveur de transcodage HLS non disponible'
        }
      }

      // Construire l'URL de transcodage
      const transcodeUrl = `${finalConfig.serverUrl}:${finalConfig.port}/index.m3u8`
      const params = new URLSearchParams({
        source_url: videoUrl,
        preset: finalConfig.preset,
        quality: finalConfig.quality
      })

      const hlsUrl = `${transcodeUrl}?${params.toString()}`
      const masterPlaylistUrl = `${finalConfig.serverUrl}:${finalConfig.port}/index.m3u8?source_url=${encodeURIComponent(videoUrl)}`

      return {
        success: true,
        hlsUrl,
        masterPlaylistUrl,
        transcodingStatus: 'pending'
      }
    } catch (error) {
      logger.error('Erreur lors du démarrage du transcodage HLS', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  // Vérifier l'état du serveur de transcodage
  static async checkServerHealth(config: HLSStreamingConfig): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(`${config.serverUrl}:${config.port}/health`, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      logger.warn('Serveur de transcodage HLS non disponible', { error })
      return false
    }
  }

  // Vérifier le statut du transcodage
  static async getTranscodingStatus(
    videoUrl: string, 
    config: Partial<HLSStreamingConfig> = {}
  ): Promise<HLSStreamingResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    try {
      const statusUrl = `${finalConfig.serverUrl}:${finalConfig.port}/index.m3u8?source_url=${encodeURIComponent(videoUrl)}&done=true`
      
      const response = await fetch(statusUrl)
      
      if (response.status === 200) {
        return {
          success: true,
          transcodingStatus: 'completed'
        }
      } else if (response.status === 404) {
        return {
          success: true,
          transcodingStatus: 'transcoding'
        }
      } else {
        return {
          success: false,
          error: 'Erreur lors de la vérification du statut'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  // Obtenir l'URL HLS pour un contenu
  static getHLSStreamUrl(
    videoUrl: string, 
    config: Partial<HLSStreamingConfig> = {}
  ): string {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    return `${finalConfig.serverUrl}:${finalConfig.port}/index.m3u8?source_url=${encodeURIComponent(videoUrl)}`
  }

  // Vérifier si une URL est compatible avec le transcodage HLS
  static isCompatibleUrl(url: string): boolean {
    const compatibleExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm']
    const compatibleProtocols = ['http:', 'https:']
    
    try {
      const urlObj = new URL(url)
      
      // Exclure les URLs cosmic-crab.buzz du transcodage HLS
      if (url.includes('api.cosmic-crab.buzz')) {
        return false
      }
      
      // Vérifier le protocole
      if (!compatibleProtocols.includes(urlObj.protocol)) {
        return false
      }
      
      // Vérifier l'extension
      const hasCompatibleExtension = compatibleExtensions.some(ext => 
        urlObj.pathname.toLowerCase().endsWith(ext)
      )
      
      return hasCompatibleExtension
    } catch {
      return false
    }
  }

  // Configuration pour différents environnements
  static getConfigForEnvironment(env: 'development' | 'production' | 'docker'): HLSStreamingConfig {
    switch (env) {
      case 'development':
        return {
          serverUrl: 'http://localhost',
          port: 8080,
          outputDir: './tmp/hls',
          quality: 'auto',
          preset: 'fast'
        }
      
      case 'production':
        return {
          serverUrl: 'https://your-hls-server.com',
          port: 443,
          outputDir: '/data/hls',
          quality: 'auto',
          preset: 'medium'
        }
      
      case 'docker':
        return {
          serverUrl: 'http://hls-transcoder',
          port: 8080,
          outputDir: '/data/hls',
          quality: 'auto',
          preset: 'fast'
        }
      
      default:
        return this.DEFAULT_CONFIG
    }
  }
}

// Instance exportée pour faciliter l'utilisation
export const hlsTranscoderService = new HLSTranscoderService()
