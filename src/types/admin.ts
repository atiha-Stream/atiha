export interface AdminUser {
  id: string
  username: string
  email: string
  role: string // Rôle personnalisé
  permissions?: AdminPermission[] // Permissions spécifiques
  createdAt: Date
  lastLogin?: Date
}

export interface AdminAuthState {
  admin: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AdminLoginCredentials {
  username: string
  password: string
}

export interface ContentFormData {
  title: string
  description: string
  year: number
  catalogue: string
  genre: string[]
  director: string
  cast: string[]
  videoUrl: string
  posterUrl?: string
  trailerUrl?: string
  previewUrl?: string
  isPremium?: boolean
  type: 'movie' | 'series'
  // Pour les séries
  seasons?: {
    seasonNumber: number
    title: string
    description: string
    episodes: {
      episodeNumber: number
      title: string
      description: string
      duration: number
      videoUrl: string
      previewUrl?: string
      thumbnailUrl?: string
    }[]
  }[]
}

export interface ImportResult {
  success: boolean
  importedCount: number
  errors: string[]
}

// Types pour la gestion des administrateurs
export type AdminPermission = 
  | 'Ajouter du contenu'
  | 'Import Excel/CSV'
  | 'Gestion des Utilisateurs'
  | 'Analytics'
  | 'Gestion des Données'
  | 'Éditeur de Page d\'Accueil'
  | 'Sécurité Admin'
  | 'Gestion des Erreurs'
  | 'Abonnement Premium'
  | 'Activité récente'
  | 'Galerie de contenu'

export interface Admin {
  id: string
  username: string
  password: string
  role: string // Rôle personnalisé créé par leGenny
  permissions: AdminPermission[] // Permissions spécifiques
  createdAt: Date
  lastLogin?: Date
  isActive: boolean
}

export interface AdminRoleInfo {
  role: string
  description: string
  permissions: AdminPermission[]
  color: string
  isCustom: boolean // true si créé par leGenny, false si c'est leGenny lui-même
}

// Permissions disponibles pour la création de rôles
export const AVAILABLE_PERMISSIONS: AdminPermission[] = [
  'Ajouter du contenu',
  'Import Excel/CSV',
  'Gestion des Utilisateurs',
  'Analytics',
  'Gestion des Données',
  'Éditeur de Page d\'Accueil',
  'Sécurité Admin',
  'Gestion des Erreurs',
  'Abonnement Premium',
  'Activité récente',
  'Galerie de contenu'
]

// Couleurs disponibles pour les rôles personnalisés
export const ROLE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-gray-500'
]

// Rôle spécial leGenny (non modifiable)
export const LEGENNY_ROLE: AdminRoleInfo = {
  role: 'leGenny',
  description: 'Administrateur principal avec tous les privilèges',
  permissions: AVAILABLE_PERMISSIONS, // Toutes les permissions
  color: 'bg-red-500',
  isCustom: false
}