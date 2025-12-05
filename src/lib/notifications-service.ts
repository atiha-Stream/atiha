'use client'

import { Movie, Series } from '@/types/content'
import { ContentService } from './content-service'
import { logger } from './logger'

export interface ContentNotification {
  id: string
  type: 'new_arrival' | 'new_episode'
  contentId: string
  contentTitle: string
  contentType: 'movie' | 'series'
  posterUrl?: string
  episodeTitle?: string
  episodeNumber?: number
  seasonNumber?: number
  date: string // Date ISO string
  isRead: boolean
}

interface NotificationStorage {
  notifications: ContentNotification[]
  lastResetDate: string // Date du dernier reset (début du mois)
  lastCheckDate: string // Date de la dernière vérification
}

export class NotificationsService {
  private static readonly STORAGE_KEY = 'atiha_notifications'
  private static readonly LAST_CHECK_KEY = 'atiha_notifications_last_check'

  // Vérifier et créer les notifications pour les nouveaux contenus
  static checkForNewContent(): ContentNotification[] {
    if (typeof window === 'undefined') return []

    // Réinitialiser au début du mois
    this.resetIfNewMonth()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Récupérer la date de la dernière vérification
    const lastCheckDateStr = localStorage.getItem(this.LAST_CHECK_KEY)
    let lastCheckDateOnly: Date
    
    if (lastCheckDateStr) {
      const lastCheckDate = new Date(lastCheckDateStr)
      // Normaliser la date pour ne garder que la partie date (sans l'heure)
      lastCheckDateOnly = new Date(lastCheckDate.getFullYear(), lastCheckDate.getMonth(), lastCheckDate.getDate())
    } else {
      // Première vérification : utiliser le début du mois
      lastCheckDateOnly = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    logger.debug('🔍 Notifications - Date aujourd\'hui', { date: today.toISOString() })
    logger.debug('🔍 Notifications - Dernière vérification', { date: lastCheckDateOnly.toISOString() })

    // Charger les notifications existantes une seule fois pour éviter les recherches répétées
    const existingNotifications = this.getNotifications()
    const existingMap = new Map<string, boolean>()
    existingNotifications.forEach(n => {
      const key = `${n.contentId}_${n.type}_${n.date.split('T')[0]}`
      existingMap.set(key, true)
    })

    logger.debug('🔍 Notifications existantes', { count: existingNotifications.length })

    const newNotifications: ContentNotification[] = []

    // Récupérer tous les contenus
    const allContent = ContentService.getAllContent()
    logger.debug('Total contenus trouvés', { count: allContent.length })

    // Vérifier les nouveaux films (les films ont videoUrl directement, les séries ont seasons)
    const movies = allContent.filter(c => 'videoUrl' in c && !('seasons' in c)) as Movie[]
    logger.debug('Films trouvés', { count: movies.length })
    
    for (const movie of movies) {
      // Gérer les dates (peuvent être Date ou string ISO)
      let movieDate: Date
      if (movie.createdAt instanceof Date) {
        movieDate = movie.createdAt
      } else if (typeof movie.createdAt === 'string') {
        movieDate = new Date(movie.createdAt)
      } else {
        logger.warn('Date createdAt invalide pour le film', { movieId: movie.id, createdAt: movie.createdAt })
        continue
      }
      
      // Vérifier si la date est valide
      if (isNaN(movieDate.getTime())) {
        logger.warn('Date createdAt invalide (NaN) pour le film', { movieId: movie.id, createdAt: movie.createdAt })
        continue
      }
      
      const movieDateOnly = new Date(movieDate.getFullYear(), movieDate.getMonth(), movieDate.getDate())
      
      logger.debug(`Film "${movie.title}"`, { 
        createdDate: movieDateOnly.toISOString(), 
        today: today.toISOString() 
      })
      
      // Détecter tous les contenus créés aujourd'hui OU après la dernière vérification
      // Si c'est aujourd'hui, on détecte toujours (peu importe l'heure de la dernière vérification)
      // Si c'est après la dernière vérification, on détecte aussi
      const isToday = movieDateOnly.getTime() === today.getTime()
      const isAfterLastCheck = movieDateOnly > lastCheckDateOnly
      
      // Toujours détecter si c'est aujourd'hui OU si c'est après la dernière vérification
      if (isToday || isAfterLastCheck) {
        // Vérifier si la notification existe déjà (utiliser la Map pour une recherche O(1))
        const dateKey = movieDateOnly.toISOString().split('T')[0]
        const key = `${movie.id}_new_arrival_${dateKey}`
        
        if (!existingMap.has(key)) {
          logger.info('Nouveau film détecté', { title: movie.title })
          newNotifications.push({
            id: `movie_${movie.id}_${movieDateOnly.getTime()}`,
            type: 'new_arrival',
            contentId: movie.id,
            contentTitle: movie.title,
            contentType: 'movie',
            posterUrl: movie.posterUrl,
            date: movieDateOnly.toISOString(),
            isRead: false
          })
          // Ajouter à la map pour éviter les doublons dans cette session
          existingMap.set(key, true)
        } else {
          logger.debug('Film déjà notifié', { title: movie.title })
        }
      } else {
        logger.debug('Film trop ancien', { title: movie.title, createdDate: movieDateOnly.toISOString() })
      }
    }

    // Vérifier les nouvelles séries et épisodes
    const series = allContent.filter((c): c is Series => 'seasons' in c)
    logger.debug('Séries trouvées', { count: series.length })
    
    for (const serie of series) {
      // Vérifier si c'est une nouvelle série
      // Gérer les dates (peuvent être Date ou string ISO)
      let serieDate: Date
      if (serie.createdAt instanceof Date) {
        serieDate = serie.createdAt
      } else if (typeof serie.createdAt === 'string') {
        serieDate = new Date(serie.createdAt)
      } else {
        logger.warn('Date createdAt invalide pour la série', { serieId: serie.id, createdAt: serie.createdAt })
        continue
      }
      
      if (isNaN(serieDate.getTime())) {
        logger.warn('Date createdAt invalide (NaN) pour la série', { serieId: serie.id, createdAt: serie.createdAt })
        continue
      }
      
      const serieDateOnly = new Date(serieDate.getFullYear(), serieDate.getMonth(), serieDate.getDate())
      
      const isTodaySerie = serieDateOnly.getTime() === today.getTime()
      const isAfterLastCheckSerie = serieDateOnly > lastCheckDateOnly
      
      // Toujours détecter si c'est aujourd'hui OU si c'est après la dernière vérification
      if (isTodaySerie || isAfterLastCheckSerie) {
        const dateKey = serieDateOnly.toISOString().split('T')[0]
        const key = `${serie.id}_new_arrival_${dateKey}`
        
        if (!existingMap.has(key)) {
          logger.info('Nouvelle série détectée', { title: serie.title })
          newNotifications.push({
            id: `series_${serie.id}_${serieDateOnly.getTime()}`,
            type: 'new_arrival',
            contentId: serie.id,
            contentTitle: serie.title,
            contentType: 'series',
            posterUrl: serie.posterUrl,
            date: serieDateOnly.toISOString(),
            isRead: false
          })
          existingMap.set(key, true)
        }
      }

      // Ne plus créer de notifications pour les épisodes individuels
      // On notifie seulement les nouveaux contenus (films et séries), pas les épisodes
    }

    logger.debug('Nouvelles notifications trouvées', { count: newNotifications.length })
    
    // Filtrer les notifications existantes pour exclure les notifications d'épisodes
    // On ne veut garder que les notifications de type 'new_arrival' (nouveaux contenus)
    const existingNotificationsFiltered = existingNotifications.filter(n => n.type === 'new_arrival')
    
    // Ajouter les nouvelles notifications
    if (newNotifications.length > 0 || existingNotificationsFiltered.length !== existingNotifications.length) {
      const updated = [...newNotifications, ...existingNotificationsFiltered]
      this.saveNotifications(updated)
      logger.info('Notifications sauvegardées', { count: updated.length })
      if (existingNotificationsFiltered.length !== existingNotifications.length) {
        logger.info('Notifications d\'épisodes supprimées', { 
          count: existingNotifications.length - existingNotificationsFiltered.length 
        })
      }
    }

    // Toujours mettre à jour la date de dernière vérification, même s'il n'y a pas de nouvelles notifications
    // Cela garantit que les prochains contenus créés seront détectés
    localStorage.setItem(this.LAST_CHECK_KEY, today.toISOString())

    return newNotifications
  }

  // Réinitialiser les notifications au début du mois
  private static resetIfNewMonth(): void {
    if (typeof window === 'undefined') return

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        const data: NotificationStorage = JSON.parse(stored)
        const lastReset = new Date(data.lastResetDate)
        const lastResetMonth = lastReset.getMonth()
        const lastResetYear = lastReset.getFullYear()

        // Si on est dans un nouveau mois, réinitialiser
        if (currentMonth !== lastResetMonth || currentYear !== lastResetYear) {
          this.saveNotifications([])
          localStorage.setItem(this.LAST_CHECK_KEY, new Date(currentYear, currentMonth, 1).toISOString())
        }
      } catch (error) {
        logger.error('Error resetting notifications', error as Error)
      }
    }
  }

  // Récupérer toutes les notifications
  static getNotifications(): ContentNotification[] {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        const data: NotificationStorage = JSON.parse(stored)
        return data.notifications || []
      } catch (error) {
        logger.error('Error loading notifications', error as Error)
        return []
      }
    }

    return []
  }

  // Sauvegarder les notifications
  private static saveNotifications(notifications: ContentNotification[]): void {
    if (typeof window === 'undefined') return

    const now = new Date()
    const data: NotificationStorage = {
      notifications,
      lastResetDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      lastCheckDate: now.toISOString()
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  }

  // Marquer une notification comme lue
  static markAsRead(notificationId: string): void {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    )
    this.saveNotifications(updated)
  }

  // Marquer toutes les notifications comme lues
  static markAllAsRead(): void {
    const notifications = this.getNotifications()
    const updated = notifications.map(n => ({ ...n, isRead: true }))
    this.saveNotifications(updated)
  }

  // Obtenir le nombre de notifications non lues
  static getUnreadCount(): number {
    // Filtrer pour exclure les notifications d'épisodes
    return this.getNotifications().filter(n => n.type === 'new_arrival' && !n.isRead).length
  }

  // Supprimer une notification
  static deleteNotification(notificationId: string): void {
    const notifications = this.getNotifications()
    const updated = notifications.filter(n => n.id !== notificationId)
    this.saveNotifications(updated)
  }

  // Supprimer toutes les notifications
  static clearAll(): void {
    this.saveNotifications([])
  }

  // Vérifier si deux dates sont le même jour
  private static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  // Grouper les notifications par jour
  static getNotificationsByDay(): Array<{
    date: Date
    label: string
    notifications: ContentNotification[]
  }> {
    // Filtrer pour exclure les notifications d'épisodes
    const notifications = this.getNotifications().filter(n => n.type === 'new_arrival')
    const grouped = new Map<string, ContentNotification[]>()

    notifications.forEach(notification => {
      const date = new Date(notification.date)
      const dateKey = date.toISOString().split('T')[0] // Format YYYY-MM-DD
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(notification)
    })

    // Convertir en tableau et trier par date (plus récent en premier)
    const result = Array.from(grouped.entries())
      .map(([dateKey, notifs]) => {
        const date = new Date(dateKey)
        const label = this.formatDateLabel(date)
        return {
          date,
          label,
          notifications: notifs.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    return result
  }

  // Formater le label de date (ex: "Il y a 2 jours", "Il y a 1 semaine")
  private static formatDateLabel(date: Date): string {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffTime = today.getTime() - notificationDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Aujourd'hui"
    } else if (diffDays === 1) {
      return 'Il y a 1 jour'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else if (diffDays < 14) {
      return 'Il y a 1 semaine'
    } else if (diffDays < 21) {
      return 'Il y a 2 semaines'
    } else if (diffDays < 28) {
      return 'Il y a 3 semaines'
    } else {
      return 'Il y a 1 mois'
    }
  }
}

