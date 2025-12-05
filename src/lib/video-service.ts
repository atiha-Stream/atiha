// src/lib/video-service.ts

import { logger } from './logger'

export class VideoService {
  /**
   * Vérifie si une URL de vidéo est valide et accessible.
   * Note: Cette méthode peut être coûteuse en requêtes réseau et peut être bloquée par CORS.
   * À utiliser avec parcimonie ou pour des vérifications côté serveur.
   * Pour le client, se fier principalement à l'événement onError du composant video.
   */
  static async isValidVideoUrl(url: string): Promise<boolean> {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      // Vérifier la structure de l'URL
      const urlObj = new URL(url);
      
      // Vérifier le protocole
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Si c'est une URL HTTP/HTTPS valide, considérer comme valide
      // (même sans extension visible - comme les URLs de streaming)
      logger.debug('URL vidéo considérée comme valide', { url })
      return true;
      
    } catch (error) {
      logger.warn(`URL vidéo invalide: ${url}`, { error })
      return false;
    }
  }

  /**
   * Retourne une URL de vidéo de fallback si l'URL principale est invalide ou manquante.
   */
  static getFallbackVideoUrl(originalUrl?: string | null, defaultFallback: string = '/placeholder-video.mp4'): string {
    if (originalUrl && typeof originalUrl === 'string' && originalUrl.trim() !== '') {
      return originalUrl;
    }
    return defaultFallback;
  }

  /**
   * Détecte le type de vidéo basé sur l'URL
   */
  static detectVideoType(url: string): 'direct' | 'hls' | 'youtube' | 'vimeo' | 'dailymotion' | 'unknown' {
    if (!url || typeof url !== 'string') {
      return 'unknown';
    }

    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'youtube';
    }
    
    if (lowerUrl.includes('vimeo.com')) {
      return 'vimeo';
    }
    
    if (lowerUrl.includes('dailymotion.com')) {
      return 'dailymotion';
    }
    
    if (lowerUrl.includes('.m3u8')) {
      return 'hls';
    }
    
    // Vérifier les extensions de fichiers vidéo
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.flv', '.wmv'];
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
    
    if (hasVideoExtension) {
      return 'direct';
    }
    
    return 'unknown';
  }

  /**
   * Génère un message d'erreur approprié basé sur le type de vidéo
   */
  static getErrorMessage(videoType: string, originalError?: string): string {
    switch (videoType) {
      case 'hls':
        return 'Erreur de lecture HLS. Vérifiez votre connexion réseau.';
      case 'youtube':
        return 'Erreur de lecture YouTube. La vidéo pourrait être privée ou supprimée.';
      case 'vimeo':
        return 'Erreur de lecture Vimeo. La vidéo pourrait être privée ou supprimée.';
      case 'dailymotion':
        return 'Erreur de lecture Dailymotion. La vidéo pourrait être privée ou supprimée.';
      case 'direct':
        return 'Erreur de lecture vidéo. Le fichier pourrait être corrompu ou inaccessible.';
      default:
        return originalError || 'Erreur de lecture vidéo inconnue.';
    }
  }

  /**
   * Optimise une URL de vidéo pour un CDN ou un service d'optimisation.
   * Ceci est un exemple et devrait être adapté à votre service CDN.
   */
  static getOptimizedVideoUrl(url: string, quality: 'low' | 'medium' | 'high' = 'medium'): string {
    if (!url || url.startsWith('/')) { // Gérer les vidéos locales ou les fallbacks
      return url;
    }
    
    // Exemple pour un CDN imaginaire:
    // return `https://mycdn.com/optimize?url=${encodeURIComponent(url)}&quality=${quality}&format=mp4`;
    return url; // Pour l'instant, retourne l'URL originale
  }

  /**
   * Vérifie si le navigateur supporte un type de vidéo spécifique
   */
  static isVideoTypeSupported(videoType: string): boolean {
    if (typeof window === 'undefined') {
      return false; // Côté serveur
    }

    const video = document.createElement('video');
    
    switch (videoType) {
      case 'hls':
        return 'application/vnd.apple.mpegurl' in video || 
               (window as any).Hls && (window as any).Hls.isSupported();
      case 'direct':
        return video.canPlayType('video/mp4') !== '' || 
               video.canPlayType('video/webm') !== '';
      default:
        return true; // YouTube, Vimeo, etc. sont gérés par des iframes
    }
  }
}
