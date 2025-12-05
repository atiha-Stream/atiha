import { SecureStorage } from './secure-storage'
import { logger } from './logger'

export interface UserSession {
  userId: string
  deviceId: string
  deviceInfo: {
    userAgent: string
    platform: string
    timestamp: string
    location?: string
  }
  isActive: boolean
  lastActivity: string
}

/**
 * Interface représentant le résultat de la validation d'une session
 * @interface SessionValidationResult
 */
export interface SessionValidationResult {
  canLogin: boolean
  message: string
  activeSessions?: UserSession[]
  needsDisconnection?: boolean
}

/**
 * Classe gérant les sessions utilisateur et les limites d'appareils
 * @class SessionManager
 */
class SessionManager {
  private readonly STORAGE_KEY = 'atiha_user_sessions'
  private readonly USER_SESSIONS_KEY = 'atiha_user_sessions_db' // Stockage centralisé dans la base de données

  private generateDeviceId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getMaxDevicesForType(type: string): number {
    switch(type) {
      case 'individuel': return 1
      case 'famille': return 5
      case 'individuel-annuel': return 1
      case 'famille-annuel': return 5
      case 'post-payment-individuel': return 1
      case 'post-payment-famille': return 5
      case 'post-payment-individuel-flexible': return 1
      case 'post-payment-famille-flexible': return 5
      default: return 1 // Par défaut pour les autres types
    }
  }

  private isSessionManagedType(type: string): boolean {
    return [
      'individuel', 
      'famille', 
      'individuel-annuel', 
      'famille-annuel',
      'post-payment-individuel',
      'post-payment-famille',
      'post-payment-individuel-flexible',
      'post-payment-famille-flexible'
    ].includes(type)
  }

  private getAllSessions(): { [userId: string]: UserSession[] } {
    if (typeof window === 'undefined') return {}
    
    try {
      // Utiliser le stockage centralisé pour que toutes les sessions soient visibles depuis n'importe quel appareil
      const sessions = SecureStorage.getItemJSON<{ [userId: string]: UserSession[] }>(this.USER_SESSIONS_KEY)
      if (sessions) {
        return sessions
      }
      
      // Récupérer aussi les anciennes sessions du localStorage local pour migration
      const oldSessions = SecureStorage.getItemJSON<{ [userId: string]: UserSession[] }>(this.STORAGE_KEY)
      if (oldSessions) {
        // Migrer vers le stockage centralisé
        this.saveSessions(oldSessions)
        // Supprimer l'ancien stockage
        SecureStorage.removeItem(this.STORAGE_KEY)
        return oldSessions
      }
      
      return {}
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions', error as Error)
      return {}
    }
  }

  private saveSessions(sessions: { [userId: string]: UserSession[] }): void {
    if (typeof window === 'undefined') return
    
    try {
      // Sauvegarder dans le stockage centralisé pour que toutes les sessions soient visibles depuis n'importe quel appareil
      SecureStorage.setItem(this.USER_SESSIONS_KEY, sessions)
      
      // Sauvegarder aussi dans le localStorage local pour compatibilité
      SecureStorage.setItem(this.STORAGE_KEY, sessions)
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des sessions', error as Error)
    }
  }

  public getUserSessions(userId: string): UserSession[] {
    const allSessions = this.getAllSessions()
    return allSessions[userId] || []
  }

  public getUserActiveSessions(userId: string): UserSession[] {
    const userSessions = this.getUserSessions(userId)
    const now = new Date()
    const activeThreshold = 60 * 60 * 1000 // 1 heure en millisecondes (sessions récentes considérées comme actives)
    
    return userSessions.filter(session => {
      // Considérer comme actif si :
      // 1. La session est marquée comme active ET
      // 2. La dernière activité est récente (dans la dernière heure)
      const lastActivity = new Date(session.lastActivity)
      const timeSinceActivity = now.getTime() - lastActivity.getTime()
      
      return session.isActive && timeSinceActivity <= activeThreshold
    })
  }

  private updateUserSessions(userId: string, sessions: UserSession[]): void {
    const allSessions = this.getAllSessions()
    allSessions[userId] = sessions
    this.saveSessions(allSessions)
  }

  private cleanupInactiveSessions(): void {
    const allSessions = this.getAllSessions()
    const now = new Date()
    const inactiveThreshold = 24 * 60 * 60 * 1000 // 24 heures

    Object.keys(allSessions).forEach(userId => {
      const userSessions = allSessions[userId].filter(session => {
        const lastActivity = new Date(session.lastActivity)
        return (now.getTime() - lastActivity.getTime()) < inactiveThreshold
      })
      
      if (userSessions.length !== allSessions[userId].length) {
        allSessions[userId] = userSessions
      }
    })

    this.saveSessions(allSessions)
  }

  /**
   * Valide si un utilisateur peut se connecter en fonction de ses sessions actives et du type de code premium
   * @param {string} userId - ID de l'utilisateur
   * @param {string} codeType - Type de code premium ('individuel', 'famille', etc.)
   * @returns {SessionValidationResult} Résultat de la validation avec canLogin, message, sessions actives
   * 
   * @example
   * ```ts
   * const result = sessionManager.validateLogin('user123', 'individuel')
   * if (result.canLogin) {
   *   // Autoriser la connexion
   * } else {
   *   // Afficher result.message à l'utilisateur
   * }
   * ```
   */
  validateLogin(userId: string, codeType: string): SessionValidationResult {
    // Nettoyer les sessions inactives
    this.cleanupInactiveSessions()

    // Vérifier si ce type de code gère les sessions
    if (!this.isSessionManagedType(codeType)) {
      return { 
        canLogin: true, 
        message: 'Connexion autorisée (type de code non géré par le système de sessions)' 
      }
    }

    // Chaque identifiant a sa propre limite selon le type de code qu'il utilise
    const maxDevices = this.getMaxDevicesForType(codeType)
    // Pour la validation, compter TOUTES les sessions actives (pas seulement celles avec activité récente)
    // Cela garantit que la limite est respectée même si certaines sessions sont inactives depuis un moment
    const userActiveSessions = this.getUserSessions(userId).filter(session => session.isActive)
    
    // Vérifier si l'utilisateur se reconnecte depuis le même appareil
    const currentDeviceId = this.getCurrentDeviceId()
    const existingSessionOnSameDevice = userActiveSessions.find(s => s.deviceId === currentDeviceId)
    
    // Si l'utilisateur se reconnecte depuis le même appareil, autoriser la connexion
    if (existingSessionOnSameDevice) {
      return { 
        canLogin: true, 
        message: 'Connexion autorisée (même appareil)',
        activeSessions: userActiveSessions
      }
    }
    
    // Sinon, vérifier la limite d'appareils (on compte toutes les sessions actives)
    if (userActiveSessions.length < maxDevices) {
      return { 
        canLogin: true, 
        message: 'Connexion autorisée',
        activeSessions: userActiveSessions
      }
    }
    
    return {
      canLogin: false,
      message: `Limite d'appareils atteinte pour votre compte (${maxDevices}). Déconnectez-vous d'un autre appareil pour vous connecter ici.`,
      activeSessions: userActiveSessions,
      needsDisconnection: true
    }
  }

  /**
   * Ajoute une nouvelle session pour un utilisateur ou réactive une session existante sur le même appareil
   * @param {string} userId - ID de l'utilisateur
   * @param {string} codeType - Type de code premium
   * @returns {UserSession} Session créée ou réactivée
   * @throws {Error} Si le type de code ne gère pas les sessions
   * 
   * @example
   * ```ts
   * const session = sessionManager.addSession('user123', 'individuel')
   * console.log(session.deviceId) // ID unique de l'appareil
   * ```
   */
  addSession(userId: string, codeType: string): UserSession {
    if (!this.isSessionManagedType(codeType)) {
      throw new Error('Ce type de code ne gère pas les sessions')
    }

    // Générer un deviceId unique basé sur les caractéristiques du navigateur
    const deviceId = this.getCurrentDeviceId()
    
    // Vérifier si une session existe déjà pour ce device
    const userSessions = this.getUserSessions(userId)
    const existingSession = userSessions.find(s => s.deviceId === deviceId)
    
    if (existingSession) {
      // Réactiver la session existante et mettre à jour l'activité
      existingSession.isActive = true
      existingSession.lastActivity = new Date().toISOString()
      existingSession.deviceInfo = {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        timestamp: new Date().toISOString()
      }
      this.updateUserSessions(userId, userSessions)
      return existingSession
    }

    // Créer une nouvelle session
    const session: UserSession = {
      userId,
      deviceId,
      deviceInfo: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        timestamp: new Date().toISOString()
      },
      isActive: true,
      lastActivity: new Date().toISOString()
    }
    
    userSessions.push(session)
    this.updateUserSessions(userId, userSessions)
    
    return session
  }

  /**
   * Supprime une session utilisateur pour un appareil spécifique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} deviceId - ID de l'appareil à déconnecter
   * @returns {boolean} True si la session a été supprimée, false si elle n'existait pas
   * 
   * @example
   * ```ts
   * const removed = sessionManager.removeSession('user123', 'device_abc')
   * if (removed) {
   *   console.log('Session supprimée avec succès')
   * }
   * ```
   */
  removeSession(userId: string, deviceId: string): boolean {
    const userSessions = this.getUserSessions(userId)
    const sessionIndex = userSessions.findIndex(session => session.deviceId === deviceId)
    
    if (sessionIndex !== -1) {
      userSessions.splice(sessionIndex, 1)
      this.updateUserSessions(userId, userSessions)
      return true
    }
    
    return false
  }

  deactivateSession(userId: string, deviceId: string): boolean {
    const userSessions = this.getUserSessions(userId)
    const session = userSessions.find(session => session.deviceId === deviceId)
    
    if (session) {
      session.isActive = false
      session.lastActivity = new Date().toISOString()
      this.updateUserSessions(userId, userSessions)
      return true
    }
    
    return false
  }

  getActiveSessions(userId: string): UserSession[] {
    return this.getUserSessions(userId).filter(session => session.isActive)
  }

  updateSessionActivity(userId: string, deviceId: string): void {
    const userSessions = this.getUserSessions(userId)
    const session = userSessions.find(session => session.deviceId === deviceId)
    
    if (session) {
      session.lastActivity = new Date().toISOString()
      this.updateUserSessions(userId, userSessions)
    }
  }

  getCurrentDeviceId(): string {
    // Générer un ID basé sur les caractéristiques du navigateur
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('Device ID', 10, 10)
    const fingerprint = canvas.toDataURL()
    
    return btoa(fingerprint + navigator.userAgent + navigator.language).substr(0, 16)
  }

  formatDeviceInfo(deviceInfo: UserSession['deviceInfo']): string {
    const platform = deviceInfo.platform || 'Unknown'
    const timestamp = new Date(deviceInfo.timestamp).toLocaleString('fr-FR')
    
    // Détecter le type d'appareil basé sur userAgent
    const userAgent = deviceInfo.userAgent.toLowerCase()
    let deviceType = 'Desktop'
    
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      deviceType = 'Mobile'
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      deviceType = 'Tablet'
    }
    
    return `${deviceType} (${platform}) - ${timestamp}`
  }

  // Méthode pour obtenir le type de code d'un utilisateur
  getUserCodeType(userId: string): string | null {
    // Cette méthode devrait être appelée avec le service premium-codes
    // Pour l'instant, on retourne null et on se fie au paramètre passé
    return null
  }

  // Méthode pour valider la connexion avec récupération automatique du type de code
  validateLoginWithAutoCodeType(userId: string, getUserCodeTypeCallback: (userId: string) => string | null): SessionValidationResult {
    const codeType = getUserCodeTypeCallback(userId)
    
    if (!codeType) {
      return {
        canLogin: true,
        message: 'Connexion autorisée (aucun code premium actif)'
      }
    }

    return this.validateLogin(userId, codeType)
  }

  // Méthode pour obtenir les statistiques des sessions
  getSessionStats(): { totalUsers: number, totalSessions: number, activeSessions: number } {
    const allSessions = this.getAllSessions()
    let totalUsers = 0
    let totalSessions = 0
    let activeSessions = 0

    Object.keys(allSessions).forEach(userId => {
      totalUsers++
      const userSessions = allSessions[userId]
      totalSessions += userSessions.length
      activeSessions += userSessions.filter(session => session.isActive).length
    })

    return { totalUsers, totalSessions, activeSessions }
  }

  // Méthode pour obtenir les statistiques par type de code
  getSessionStatsByCodeType(): { [codeType: string]: { users: number, sessions: number, activeSessions: number } } {
    const allSessions = this.getAllSessions()
    const stats: { [codeType: string]: { users: number, sessions: number, activeSessions: number } } = {}

    Object.keys(allSessions).forEach(userId => {
      const userSessions = allSessions[userId]
      const activeUserSessions = userSessions.filter(session => session.isActive)
      
      // Pour chaque session, on devrait avoir le type de code
      // Pour l'instant, on groupe par utilisateur
      const codeType = 'unknown' // À améliorer avec le vrai type de code
      
      if (!stats[codeType]) {
        stats[codeType] = { users: 0, sessions: 0, activeSessions: 0 }
      }
      
      stats[codeType].users++
      stats[codeType].sessions += userSessions.length
      stats[codeType].activeSessions += activeUserSessions.length
    })

    return stats
  }
}

export const sessionManager = new SessionManager()
