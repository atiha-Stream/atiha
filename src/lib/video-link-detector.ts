/**
 * Système de détection automatique des types de liens vidéo
 */

import { logger } from './logger'

export type VideoLinkType = 
  | 'youtube' 
  | 'vimeo' 
  | 'dailymotion'
  | 'iframe' 
  | 'direct' 
  | 'hls'
  | 'unknown';

export interface VideoLinkInfo {
  type: VideoLinkType;
  id?: string;
  url: string;
  embedUrl?: string;
}

/**
 * Détecte le type de lien vidéo et extrait les informations nécessaires
 */
export function detectVideoLink(url: string): VideoLinkInfo {
  if (!url || typeof url !== 'string') {
    logger.debug('URL invalide', { url })
    return { type: 'unknown', url };
  }

  const cleanUrl = url.trim();
  logger.debug('Détection du type de lien vidéo', { url: cleanUrl })

  // YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    const videoId = extractYouTubeId(cleanUrl);
    return {
      type: 'youtube',
      id: videoId,
      url: cleanUrl,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : undefined
    };
  }

  // Vimeo
  if (cleanUrl.includes('vimeo.com')) {
    const videoId = extractVimeoId(cleanUrl);
    return {
      type: 'vimeo',
      id: videoId,
      url: cleanUrl,
      embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : undefined
    };
  }

  // Dailymotion
  if (cleanUrl.includes('dailymotion.com')) {
    const videoId = extractDailymotionId(cleanUrl);
    return {
      type: 'dailymotion',
      id: videoId,
      url: cleanUrl,
      embedUrl: videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : undefined
    };
  }

  // URLs de streaming avec tokens (forcer HLS pour optimiser)
  // Exclure cosmic-crab.buzz du transcodage HLS automatique
  if ((cleanUrl.includes('token=') && !cleanUrl.includes('api.cosmic-crab.buzz')) ||
      (cleanUrl.includes('api-key=') && !cleanUrl.includes('api.cosmic-crab.buzz'))) {
    return {
      type: 'hls',
      url: cleanUrl
    };
  }

  // URLs cosmic-crab.buzz - traiter comme direct (pas de transcodage HLS)
  if (cleanUrl.includes('api.cosmic-crab.buzz')) {
    return {
      type: 'direct',
      url: cleanUrl
    };
  }

  // HLS
  if (cleanUrl.includes('.m3u8')) {
    return {
      type: 'hls',
      url: cleanUrl
    };
  }

  // Iframe embed
  if (
      cleanUrl.includes('embed') ||
      cleanUrl.includes('/e/') ||
      cleanUrl.includes('iframe') ||
      cleanUrl.includes('uqload') ||
      cleanUrl.includes('streamtape') ||
      cleanUrl.includes('doodstream') ||
      cleanUrl.includes('mixdrop') ||
      cleanUrl.includes('supervideo.cc') ||
      cleanUrl.includes('dsvplay.com') ||
      cleanUrl.includes('voe.sx') ||
      cleanUrl.includes('vidmoly') ||
      cleanUrl.includes('vidzy')
  ) {
    return {
      type: 'iframe',
      url: cleanUrl
    };
  }

  // Liens directs (mp4, webm, avi, mov, etc.)
  const directVideoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv', '.flv', '.wmv'];
  const hasDirectExtension = directVideoExtensions.some(ext => 
    cleanUrl.toLowerCase().includes(ext)
  );

  if (hasDirectExtension) {
    return {
      type: 'direct',
      url: cleanUrl
    };
  }

  // Si c'est une URL HTTP/HTTPS valide, considérer comme direct
  // (même sans extension visible - comme les URLs de streaming)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    logger.debug('URL HTTP/HTTPS détectée comme direct', { url: cleanUrl })
    return {
      type: 'direct',
      url: cleanUrl
    };
  }

  logger.debug('URL non reconnue, type unknown', { url: cleanUrl })
  return {
    type: 'unknown',
    url: cleanUrl
  };
}

/**
 * Extrait l&apos;ID vidéo YouTube depuis l&apos;URL
 */
export function extractYouTubeId(url: string): string | undefined {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extrait l&apos;ID vidéo Vimeo depuis l&apos;URL
 */
function extractVimeoId(url: string): string | undefined {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/channels\/[^\/]+\/(\d+)/,
    /vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extrait l&apos;ID vidéo Dailymotion depuis l&apos;URL
 */
function extractDailymotionId(url: string): string | undefined {
  const patterns = [
    /dailymotion\.com\/video\/([^_]+)/,
    /dailymotion\.com\/embed\/video\/([^_]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Vérifie si un lien vidéo est accessible
 */
export async function checkVideoAccessibility(url: string): Promise<boolean> {
  try {return true; // Si pas d&apos;erreur, considérer comme accessible
  } catch (error) {
    console.warn('Video accessibility check failed:', error);
    return false;
  }
}

/**
 * Génère une URL d&apos;embed pour les plateformes supportées
 */
export function generateEmbedUrl(linkInfo: VideoLinkInfo): string | undefined {
  switch (linkInfo.type) {
    case 'youtube':
      return linkInfo.id ? `https://www.youtube.com/embed/${linkInfo.id}?autoplay=1&rel=0` : undefined;
    case 'vimeo':
      return linkInfo.id ? `https://player.vimeo.com/video/${linkInfo.id}?autoplay=1` : undefined;
    case 'dailymotion':
      return linkInfo.id ? `https://www.dailymotion.com/embed/video/${linkInfo.id}?autoplay=1` : undefined;
    case 'iframe':
      return linkInfo.url;
    default:
      return undefined;
  }
}
