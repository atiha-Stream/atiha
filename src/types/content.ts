export interface Movie {
  id: string
  title: string
  description: string
  duration: number // en minutes
  year: number
  catalogue: string // Catalogue du film
  genre: string[]
  rating: number
  posterUrl: string
  videoUrl: string
  videoType?: 'mp4' | 'youtube' | 'vimeo' | 'iframe' | 'hls' | 'auto' // Type de lien vidéo
  backupUrls?: string[] // URLs de secours
  trailerUrl?: string // URL YouTube de la bande d'annonce
  previewUrl?: string // URL d'aperçu vidéo (image ou vidéo courte)
  director: string
  cast: string[]
  isPremium?: boolean
  // Configuration HLS
  hlsConfig?: {
    enabled: boolean
    quality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p'
    preset: 'ultrafast' | 'fast' | 'medium' | 'slow'
    serverUrl?: string
  }
  createdAt: Date
}

export interface Series {
  id: string
  title: string
  description: string
  year: number
  catalogue: string // Catalogue de la série
  genre: string[]
  rating: number
  posterUrl: string
  seasons: Season[]
  director: string
  cast: string[]
  videoType?: 'mp4' | 'youtube' | 'vimeo' | 'iframe' | 'hls' | 'auto' // Type de lien vidéo
  backupUrls?: string[] // URLs de secours
  trailerUrl?: string // URL YouTube de la bande d'annonce
  previewUrl?: string // URL d'aperçu vidéo (image ou vidéo courte)
  isPremium?: boolean
  // Configuration HLS
  hlsConfig?: {
    enabled: boolean
    quality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p'
    preset: 'ultrafast' | 'fast' | 'medium' | 'slow'
    serverUrl?: string
  }
  createdAt: Date
}

export interface Season {
  id: string
  seasonNumber: number
  title: string
  description: string
  episodes: Episode[]
  posterUrl: string
  year: number
}

export interface Episode {
  id: string
  episodeNumber: number
  title: string
  description: string
  duration: number // en minutes
  videoUrl: string
  videoType?: 'mp4' | 'youtube' | 'vimeo' | 'iframe' | 'hls' | 'auto' // Type de lien vidéo
  backupUrls?: string[] // URLs de secours
  previewUrl?: string // URL d'aperçu vidéo (image ou vidéo courte)
  thumbnailUrl: string
  airDate: Date
  // Configuration HLS
  hlsConfig?: {
    enabled: boolean
    quality: 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p'
    preset: 'ultrafast' | 'fast' | 'medium' | 'slow'
    serverUrl?: string
  }
}

export interface WatchProgress {
  contentId: string
  episodeId?: string // pour les séries
  currentTime: number // en secondes
  duration: number // en secondes
  completed: boolean
  lastWatched: Date
}

export interface VideoPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playbackRate: number
  isFullscreen: boolean
  showControls: boolean
  buffering: boolean
}
