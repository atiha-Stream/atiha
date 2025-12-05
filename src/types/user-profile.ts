export interface UserProfile {
  id: string
  userId: string
  displayName: string
  bio?: string
  avatar?: string
  preferences: UserPreferences
  watchHistory: WatchHistoryEntry[]
  watchlist: WatchlistEntry[]
  ratings: UserRating[]
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  // Préférences de contenu
  favoriteGenres: string[]
  favoriteActors: string[]
  favoriteDirectors: string[]
  preferredLanguages: string[]
  
  // Préférences de lecture
  autoPlay: boolean
  autoPlayDelay: number // en secondes
  subtitlesEnabled: boolean
  preferredSubtitleLanguage: string
  videoQuality: 'auto' | '720p' | '1080p' | '4K'
  
  // Préférences de notification
  emailNotifications: boolean
  pushNotifications: boolean
  newContentNotifications: boolean
  recommendationNotifications: boolean
  
  // Préférences d'affichage
  theme: 'dark' | 'light' | 'auto'
  language: string
  timezone: string
}

export interface WatchHistoryEntry {
  id: string
  contentId: string
  contentType: 'movie' | 'series'
  episodeId?: string // Pour les séries
  title: string
  posterUrl?: string
  watchedAt: Date
  watchDuration: number // en minutes
  totalDuration: number // en minutes
  progress: number // pourcentage (0-100)
  completed: boolean
}

export interface WatchlistEntry {
  id: string
  contentId: string
  contentType: 'movie' | 'series'
  title: string
  posterUrl?: string
  addedAt: Date
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

export interface UserRating {
  id: string
  contentId: string
  contentType: 'movie' | 'series'
  rating: number // 1-5 étoiles
  review?: string
  ratedAt: Date
  helpful: number // nombre de "utile"
  notHelpful: number // nombre de "pas utile"
}

export interface UserStats {
  totalWatchTime: number // en minutes
  moviesWatched: number
  seriesWatched: number
  episodesWatched: number
  averageRating: number
  favoriteGenre: string
  mostWatchedActor: string
  mostWatchedDirector: string
  watchStreak: number // jours consécutifs
  longestWatchSession: number // en minutes
}

export interface Recommendation {
  id: string
  contentId: string
  contentType: 'movie' | 'series'
  title: string
  posterUrl?: string
  reason: string
  confidence: number // 0-100
  algorithm: 'collaborative' | 'content-based' | 'hybrid'
  createdAt: Date
}


