'use client'

import { UserProfileService } from './user-profile-service'
import { logger } from './logger'

interface FavoriteNotification {
  contentId: string
  addedAt: string // Date ISO string
  isSeen: boolean
}

interface FavoritesNotificationStorage {
  notifications: FavoriteNotification[]
  lastSeenDate: string // Date de la dernière consultation
}

export class FavoritesNotificationService {
  private static readonly STORAGE_KEY = 'atiha_favorites_notifications'

  // Détecter les nouveaux favoris ajoutés
  static checkForNewFavorites(userId: string): FavoriteNotification[] {
    if (typeof window === 'undefined') return []

    try {
      const watchlist = UserProfileService.getWatchlistSync(userId)
      const existingNotifications = this.getNotifications()
      const existingMap = new Map<string, boolean>()
      
      existingNotifications.forEach(n => {
        existingMap.set(n.contentId, true)
      })

      const newNotifications: FavoriteNotification[] = []

      // Vérifier chaque favori dans la watchlist
      for (const entry of watchlist) {
        // Si ce favori n'a pas encore de notification, en créer une
        if (!existingMap.has(entry.contentId)) {
          newNotifications.push({
            contentId: entry.contentId,
            addedAt: entry.addedAt instanceof Date 
              ? entry.addedAt.toISOString() 
              : typeof entry.addedAt === 'string' 
                ? entry.addedAt 
                : new Date().toISOString(),
            isSeen: false
          })
        }
      }

      // Supprimer les notifications pour les favoris qui n'existent plus
      const currentFavoriteIds = new Set(watchlist.map(e => e.contentId))
      const validNotifications = existingNotifications.filter(n => 
        currentFavoriteIds.has(n.contentId)
      )

      // Ajouter les nouvelles notifications
      if (newNotifications.length > 0 || validNotifications.length !== existingNotifications.length) {
        const updated = [...newNotifications, ...validNotifications]
        this.saveNotifications(updated)
        
        // Déclencher un événement pour notifier les pages
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
            detail: { unseenCount: this.getUnseenCount() }
          }))
        }
      }

      return newNotifications
    } catch (error) {
      logger.error('Error checking for new favorites', error as Error)
      return []
    }
  }

  // Marquer tous les favoris comme vus
  static markAllAsSeen(): void {
    if (typeof window === 'undefined') return

    const notifications = this.getNotifications()
    const updated = notifications.map(n => ({ ...n, isSeen: true }))
    this.saveNotifications(updated)
    
    // Mettre à jour la date de dernière consultation
    const now = new Date()
    const storage = this.getStorage()
    storage.lastSeenDate = now.toISOString()
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage))
  }

  // Obtenir le nombre de favoris non vus
  static getUnseenCount(): number {
    return this.getNotifications().filter(n => !n.isSeen).length
  }

  // Récupérer toutes les notifications
  private static getNotifications(): FavoriteNotification[] {
    if (typeof window === 'undefined') return []

    const storage = this.getStorage()
    return storage.notifications || []
  }

  // Sauvegarder les notifications
  private static saveNotifications(notifications: FavoriteNotification[]): void {
    if (typeof window === 'undefined') return

    const storage = this.getStorage()
    storage.notifications = notifications
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage))
  }

  // Récupérer le storage
  private static getStorage(): FavoritesNotificationStorage {
    if (typeof window === 'undefined') {
      return { notifications: [], lastSeenDate: new Date().toISOString() }
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        logger.error('Error parsing favorites notifications storage', error as Error)
      }
    }

    return { notifications: [], lastSeenDate: new Date().toISOString() }
  }

  // Réinitialiser les notifications (utile pour les tests ou le nettoyage)
  static clearAll(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }
}

