/**
 * @fileoverview Service de sécurité admin pour l'application Atiha
 * @module admin-security
 * @description Gère l'authentification admin, la protection contre les attaques par force brute, le verrouillage de compte et les logs de sécurité
 */

import { ErrorLogger } from './error-logger'
import { userDatabase } from './user-database'
import { EncryptionService } from './encryption-service'
import { SecureStorage } from './secure-storage'
import { logger } from './logger'

export interface AdminCredentials {
  username: string
  password: string
  securityCode: string
  securityQuestion?: string
  securityAnswer?: string
}

export interface AdminSecurityLog {
  id: string
  timestamp: string
  action: 'login_attempt' | 'login_success' | 'login_failed' | 'password_reset' | 'security_code_used' | 'auto_reset_triggered' | 'auto_reset_failed' | 'backup_restored'
  username: string
  ip?: string
  userAgent?: string
  details?: string
  success: boolean
}

export interface AdminSecuritySettings {
  maxLoginAttempts: number
  lockoutDuration: number // en minutes
  passwordMinLength: number
  securityCodeMinLength: number
}

/**
 * Classe gérant la sécurité et l'authentification des administrateurs
 * @class AdminSecurity
 * @description Protège contre les attaques par force brute, gère le verrouillage de compte et les logs de sécurité
 */
class AdminSecurity {
  private readonly STORAGE_KEY = 'atiha_admin_credentials'
  private readonly LOGS_KEY = 'atiha_admin_security_logs'
  private readonly SETTINGS_KEY = 'atiha_admin_security_settings'
  private readonly LOCKOUT_KEY = 'atiha_admin_lockout'
  private readonly BACKUP_KEY = 'atiha_admin_backup_data'

  // Obtenir les credentials depuis les variables d'environnement (sans valeurs par défaut)
  private getCredentialsFromEnv(): AdminCredentials | null {
    // ⚠️ SÉCURITÉ: Ne jamais utiliser NEXT_PUBLIC_* pour des données sensibles
    // Ces variables sont exposées côté client. Utiliser des variables serveur uniquement.
    // Note: En Next.js, ces variables ne sont disponibles que côté serveur
    const username = process.env.ADMIN_USERNAME
    const password = process.env.ADMIN_PASSWORD
    const securityCode = process.env.ADMIN_SECURITY_CODE
    
    // En développement, permettre des valeurs par défaut uniquement si explicitement activé
    const allowDefaults = process.env.NODE_ENV === 'development' && 
                         process.env.ALLOW_DEFAULT_ADMIN_CREDENTIALS === 'true'
    
    // Vérifier si on est côté client (où les variables ne sont pas accessibles)
    const isClient = typeof window !== 'undefined'
    
    if (!username || !password || !securityCode) {
      if (allowDefaults) {
        // Uniquement en développement avec flag explicite
        return {
          username: username || 'leGenny',
          password: password || 'Atiasekbaby@89#2025!',
          securityCode: securityCode || '101089555@ABC',
          securityQuestion: 'Quel est votre film préféré ?',
          securityAnswer: 'Atiha'
        }
      }
      
      // Si on est côté client, ne pas logger d'erreur critique (c'est normal)
      if (isClient) {
        // Côté client, les variables d'environnement ne sont pas accessibles, c'est normal
        return null
      }
      
      // Côté serveur, c'est une vraie erreur
      logger.critical(
        'Variables d\'environnement admin manquantes',
        new Error('Configuration invalide'),
        { requiredVars: ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_SECURITY_CODE'] }
      )
      return null
    }
    
    return {
      username,
      password,
      securityCode,
      securityQuestion: process.env.ADMIN_SECURITY_QUESTION || 'Quel est votre film préféré ?',
      securityAnswer: process.env.ADMIN_SECURITY_ANSWER || 'Atiha'
    }
  }

  // Paramètres de sécurité (peuvent être configurés via variables d'environnement)
  private getDefaultSettings(): AdminSecuritySettings {
    return {
      maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS || 5),
      lockoutDuration: Number(process.env.LOCKOUT_DURATION_MINUTES || 5),
    passwordMinLength: 12,
    securityCodeMinLength: 10
    }
  }

  // Initialiser le système de sécurité
  public initialize(): void {
    if (typeof window === 'undefined') return

    // Initialiser les identifiants si pas encore définis
    if (!SecureStorage.hasItem(this.STORAGE_KEY)) {
      // En Next.js, les variables d'environnement sans NEXT_PUBLIC_ ne sont disponibles que côté serveur
      // Côté client, on ne peut pas les lire directement depuis process.env
      // Solution: Permettre l'utilisation de valeurs par défaut en développement si explicitement activé
      const allowDefaults = process.env.NODE_ENV === 'development' && 
                           process.env.ALLOW_DEFAULT_ADMIN_CREDENTIALS === 'true'
      
      if (allowDefaults) {
        // En développement avec flag explicite, utiliser des valeurs par défaut
        const defaultCredentials: AdminCredentials = {
          username: 'leGenny',
          password: 'Atiasekbaby@89#2025!',
          securityCode: '101089555@ABC',
          securityQuestion: 'Quel est votre film préféré ?',
          securityAnswer: 'Atiha'
        }
        this.saveCredentials(defaultCredentials)
        logger.info('Credentials admin initialisés avec des valeurs par défaut (développement uniquement)')
      } else {
        // Sans flag, essayer d'obtenir depuis les variables d'environnement
        // (ne fonctionnera pas côté client, mais on essaie quand même)
        const credentials = this.getCredentialsFromEnv()
        if (credentials) {
          this.saveCredentials(credentials)
        } else {
          // Côté client, les variables d'environnement ne sont pas accessibles
          // En développement, utiliser des valeurs par défaut si aucune n'est sauvegardée
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Variables d\'environnement non accessibles côté client. Utilisation de valeurs par défaut en développement.')
            const defaultCredentials: AdminCredentials = {
              username: 'leGenny',
              password: 'Atiasekbaby@89#2025!',
              securityCode: '101089555@ABC',
              securityQuestion: 'Quel est votre film préféré ?',
              securityAnswer: 'Atiha'
            }
            this.saveCredentials(defaultCredentials)
            logger.info('Credentials admin initialisés avec des valeurs par défaut (développement uniquement)')
          } else {
            logger.debug('Credentials admin non initialisés côté client (variables d\'environnement non accessibles)')
          }
        }
      }
    }

    // Initialiser les paramètres de sécurité
    if (!SecureStorage.hasItem(this.SETTINGS_KEY)) {
      this.saveSettings(this.getDefaultSettings())
    }

    // Initialiser les logs si pas encore définis
    if (!SecureStorage.hasItem(this.LOGS_KEY)) {
      this.saveLogs([])
    }
  }

  // Sauvegarder les identifiants (chiffrés)
  private saveCredentials(credentials: AdminCredentials): void {
    if (typeof window === 'undefined') return
    
    // Chiffrement simple (en production, utiliser une vraie méthode de chiffrement)
    const encrypted = {
      username: this.simpleEncrypt(credentials.username),
      password: this.simpleEncrypt(credentials.password),
      securityCode: this.simpleEncrypt(credentials.securityCode),
      securityQuestion: credentials.securityQuestion ? this.simpleEncrypt(credentials.securityQuestion) : undefined,
      securityAnswer: credentials.securityAnswer ? this.simpleEncrypt(credentials.securityAnswer) : undefined
    }
    
    // Utiliser SecureStorage pour chiffrer automatiquement
    SecureStorage.setItem(this.STORAGE_KEY, encrypted)
  }

  // Charger les identifiants (déchiffrés)
  private loadCredentials(): AdminCredentials | null {
    if (typeof window === 'undefined') return null
    
    // Utiliser SecureStorage pour déchiffrer automatiquement
    const encrypted = SecureStorage.getItemJSON<any>(this.STORAGE_KEY)
    if (!encrypted) return null

    try {
      return {
        username: this.simpleDecrypt(encrypted.username),
        password: this.simpleDecrypt(encrypted.password),
        securityCode: this.simpleDecrypt(encrypted.securityCode),
        securityQuestion: encrypted.securityQuestion ? this.simpleDecrypt(encrypted.securityQuestion) : undefined,
        securityAnswer: encrypted.securityAnswer ? this.simpleDecrypt(encrypted.securityAnswer) : undefined
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des identifiants', error)
      return null
    }
  }

  // Sauvegarder les paramètres de sécurité
  private saveSettings(settings: AdminSecuritySettings): void {
    if (typeof window === 'undefined') return
    SecureStorage.setItem(this.SETTINGS_KEY, settings)
  }

  // Charger les paramètres de sécurité
  private loadSettings(): AdminSecuritySettings {
    const defaultSettings = this.getDefaultSettings()
    
    if (typeof window === 'undefined') return defaultSettings
    
    const settings = SecureStorage.getItemJSON<AdminSecuritySettings>(this.SETTINGS_KEY)
    if (!settings) return defaultSettings

    try {
      // Vérifier que tous les champs requis sont présents
      if (!settings.maxLoginAttempts || !settings.lockoutDuration) {
        logger.warn('Paramètres de sécurité incomplets, utilisation des valeurs par défaut')
        return defaultSettings
      }
      return settings
    } catch (error) {
      logger.error('Erreur lors du chargement des paramètres', error as Error)
      return defaultSettings
    }
  }

  // Sauvegarder les logs de sécurité
  private saveLogs(logs: AdminSecurityLog[]): void {
    if (typeof window === 'undefined') return
    
    // Garder seulement les 100 derniers logs
    const limitedLogs = logs.slice(-100)
    SecureStorage.setItem(this.LOGS_KEY, limitedLogs)
  }

  // Charger les logs de sécurité
  private loadLogs(): AdminSecurityLog[] {
    if (typeof window === 'undefined') return []
    
    const logs = SecureStorage.getItemJSON<AdminSecurityLog[]>(this.LOGS_KEY)
    if (!logs) return []

    try {
      return logs
    } catch (error) {
      logger.error('Erreur lors du chargement des logs', error)
      return []
    }
  }

  // Ajouter un log de sécurité
  private addSecurityLog(log: Omit<AdminSecurityLog, 'id' | 'timestamp'>): void {
    const logs = this.loadLogs()
    const newLog: AdminSecurityLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    
    logs.push(newLog)
    this.saveLogs(logs)

    // Logger aussi dans le système d&apos;erreurs global
    if (!log.success) {
      ErrorLogger.log(
        new Error(`Tentative de connexion admin échouée: ${log.details}`),
        'high',
        'admin',
        { username: log.username, action: log.action }
      )
    }
  }

  // Vérifier si le compte est verrouillé
  private isAccountLocked(): boolean {
    if (typeof window === 'undefined') return false
    
    const lockoutData = SecureStorage.getItemJSON<{ attempts: number; lockedUntil: number }>(this.LOCKOUT_KEY)
    if (!lockoutData) return false

    try {
      const { attempts, lockedUntil } = lockoutData
      const now = Date.now()
      
      // Si le verrouillage a expiré, le supprimer
      if (lockedUntil && now > lockedUntil) {
        SecureStorage.removeItem(this.LOCKOUT_KEY)
        return false
      }
      
      return attempts >= this.loadSettings().maxLoginAttempts
    } catch (error) {
      logger.error('Erreur lors de la vérification du verrouillage', error)
      // En cas d&apos;erreur, supprimer les données corrompues
      SecureStorage.removeItem(this.LOCKOUT_KEY)
      return false
    }
  }

  // Enregistrer une tentative de connexion
  private recordLoginAttempt(success: boolean, username: string, details?: string): void {
    if (typeof window === 'undefined') return
    
    const settings = this.loadSettings()
    // Vérification de sécurité : s'assurer que settings est valide
    if (!settings || typeof settings.maxLoginAttempts !== 'number') {
      logger.error('Paramètres de sécurité invalides, utilisation des valeurs par défaut')
      const defaultSettings = this.getDefaultSettings()
      this.saveSettings(defaultSettings)
      // Utiliser les paramètres par défaut pour cette tentative
      const now = Date.now()
      if (!success) {
        const lockoutData = SecureStorage.getItemJSON<{ attempts: number; lastAttempt: number; lockedUntil: number | null }>(this.LOCKOUT_KEY) || { attempts: 0, lastAttempt: now, lockedUntil: null }
        lockoutData.attempts += 1
        lockoutData.lastAttempt = now
        SecureStorage.setItem(this.LOCKOUT_KEY, lockoutData)
      }
      return
    }
    
    const now = Date.now()

    let lockoutData: { attempts: number; lastAttempt: number; lockedUntil: number | null } = { attempts: 0, lastAttempt: now, lockedUntil: null }
    const stored = SecureStorage.getItemJSON<{ attempts: number; lastAttempt: number; lockedUntil: number | null }>(this.LOCKOUT_KEY)
    
    if (stored) {
      try {
        lockoutData = stored
      } catch (error) {
        logger.error('Erreur lors du chargement des données de verrouillage', error)
        // Réinitialiser les données corrompues
        lockoutData = { attempts: 0, lastAttempt: now, lockedUntil: null }
      }
    }

    if (success) {
      // Connexion réussie, réinitialiser les tentatives
      SecureStorage.removeItem(this.LOCKOUT_KEY)
      this.addSecurityLog({
        action: 'login_success',
        username,
        success: true,
        details: 'Connexion réussie'
      })
    } else {
      // Connexion échouée, incrémenter les tentatives
      lockoutData.attempts += 1
      lockoutData.lastAttempt = now
      
      if (lockoutData.attempts >= settings.maxLoginAttempts) {
        lockoutData.lockedUntil = now + (settings.lockoutDuration * 60 * 1000)
        
        // 🚨 AUTO-RESET DE LA BASE DE DONNÉES POUR SÉCURITÉ
        this.triggerAutoReset()
        
        this.addSecurityLog({
          action: 'login_failed',
          username,
          success: false,
          details: `Compte verrouillé après ${settings.maxLoginAttempts} tentatives échouées - Base de données réinitialisée pour sécurité`
        })
      } else {
        this.addSecurityLog({
          action: 'login_failed',
          username,
          success: false,
          details: `Tentative ${lockoutData.attempts}/${settings.maxLoginAttempts} échouée`
        })
      }
      
      SecureStorage.setItem(this.LOCKOUT_KEY, lockoutData)
    }
  }

  // Authentification admin
  public async authenticate(username: string, password: string): Promise<{ success: boolean; message: string; remainingAttempts?: number }> {
    this.initialize()

    // Vérifier si le compte est verrouillé
    if (this.isAccountLocked()) {
      try {
        const lockoutData = SecureStorage.getItemJSON<{ lockedUntil: number }>(this.LOCKOUT_KEY) || { lockedUntil: 0 }
        const remainingTime = Math.ceil((lockoutData.lockedUntil - Date.now()) / (1000 * 60))
        
        this.addSecurityLog({
          action: 'login_attempt',
          username,
          success: false,
          details: `Tentative de connexion sur compte verrouillé (${remainingTime} min restantes)`
        })

        return {
          success: false,
          message: `🚨 COMPTE VERROUILLÉ`
        }
      } catch (error) {
        logger.error('Erreur lors de la vérification du verrouillage', error)
        SecureStorage.removeItem(this.LOCKOUT_KEY)
      }
    }

    // Charger les identifiants
    let credentials = this.loadCredentials()
    if (!credentials) {
      // Si les credentials ne sont pas chargés, essayer de les initialiser une dernière fois
      // (peut-être qu'ils n'ont pas été initialisés au démarrage)
      this.initialize()
      const retryCredentials = this.loadCredentials()
      
      if (!retryCredentials) {
        this.recordLoginAttempt(false, username, 'Identifiants non trouvés')
        return {
          success: false,
          message: 'Erreur de configuration système. Veuillez redémarrer le serveur de développement.'
        }
      }
      
      credentials = retryCredentials
    }

    // Vérifier les identifiants dans la nouvelle base de données unifiée
    const adminUser = userDatabase.getAdminByUsername(username)
    
    if (!adminUser || !adminUser.isActive) {
      this.recordLoginAttempt(false, username, 'Utilisateur non trouvé ou inactif')
      try {
        const lockoutData = SecureStorage.getItemJSON<{ attempts: number }>(this.LOCKOUT_KEY) || { attempts: 0 }
        const remainingAttempts = this.loadSettings().maxLoginAttempts - lockoutData.attempts - 1
        
        return {
          success: false,
          message: 'Identifiants incorrects',
          remainingAttempts: Math.max(0, remainingAttempts)
        }
      } catch (error) {
        return {
          success: false,
          message: 'Identifiants incorrects',
          remainingAttempts: this.loadSettings().maxLoginAttempts - 1
        }
      }
    }

    // 🔐 Vérifier le mot de passe avec bcrypt (compatible avec les anciens mots de passe en clair)
    let isValid = false
    
    // Helper pour détecter si un mot de passe est haché
    const isPasswordHashed = (pwd: string): boolean => {
      return pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$')
    }

    if (isPasswordHashed(adminUser.password)) {
      // Mot de passe haché avec bcrypt
      const { EncryptionService } = await import('./encryption-service')
      isValid = await EncryptionService.verifyPassword(password, adminUser.password)
    } else {
      // Ancien mot de passe en clair (compatibilité pendant la migration)
      if (adminUser.password === password) {
        isValid = true
        // Migrer automatiquement vers bcrypt
        try {
          const { EncryptionService } = await import('./encryption-service')
          const hashedPassword = await EncryptionService.hashPassword(password)
          const updateResult = userDatabase.updateAdmin(username, { password: hashedPassword })
          if (updateResult.success) {
            if (process.env.NODE_ENV === 'development') {
              logger.info('Mot de passe admin migré automatiquement vers bcrypt')
            }
          }
        } catch (error) {
          logger.error('Erreur lors de la migration du mot de passe admin', error)
        }
      }
    }

    if (isValid) {
      this.recordLoginAttempt(true, username)
      return {
        success: true,
        message: 'Connexion réussie'
      }
    } else {
      try {
        const lockoutData = SecureStorage.getItemJSON<{ attempts: number }>(this.LOCKOUT_KEY) || { attempts: 0 }
        const remainingAttempts = this.loadSettings().maxLoginAttempts - lockoutData.attempts - 1
        
        this.recordLoginAttempt(false, username, 'Identifiants incorrects')
        
        return {
          success: false,
          message: `❌ Identifiants incorrects. Tentatives restantes: ${Math.max(0, remainingAttempts)}`,
          remainingAttempts: Math.max(0, remainingAttempts)
        }
      } catch (error) {
        logger.error('Erreur lors de la vérification des tentatives', error)
        this.recordLoginAttempt(false, username, 'Identifiants incorrects')
        
        return {
          success: false,
          message: '❌ Identifiants incorrects',
          remainingAttempts: this.loadSettings().maxLoginAttempts - 1
        }
      }
    }
  }

  // Réinitialisation du mot de passe avec le code de sécurité
  public resetPasswordWithSecurityCode(securityCode: string, newPassword: string): { success: boolean; message: string } {
    this.initialize()

    const credentials = this.loadCredentials()
    if (!credentials) {
      return {
        success: false,
        message: 'Erreur de configuration système'
      }
    }

    // Vérifier le code de sécurité
    if (securityCode !== credentials.securityCode) {
      this.addSecurityLog({
        action: 'password_reset',
        username: credentials.username,
        success: false,
        details: 'Code de sécurité incorrect'
      })
      
      return {
        success: false,
        message: 'Code de sécurité incorrect'
      }
    }

    // Valider le nouveau mot de passe
    const settings = this.loadSettings()
    if (newPassword.length < settings.passwordMinLength) {
      return {
        success: false,
        message: `Le mot de passe doit contenir au moins ${settings.passwordMinLength} caractères`
      }
    }

    // Mettre à jour le mot de passe
    const updatedCredentials = {
      ...credentials,
      password: newPassword
    }
    
    this.saveCredentials(updatedCredentials)
    
    // Déverrouiller le compte
    localStorage.removeItem(this.LOCKOUT_KEY)
    
    this.addSecurityLog({
      action: 'password_reset',
      username: credentials.username,
      success: true,
      details: 'Mot de passe réinitialisé avec succès'
    })

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    }
  }

  // Obtenir les logs de sécurité
  public getSecurityLogs(): AdminSecurityLog[] {
    return this.loadLogs().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // Obtenir les paramètres de sécurité
  public getSecuritySettings(): AdminSecuritySettings {
    return this.loadSettings()
  }

  // Vider tous les logs de sécurité
  public clearSecurityLogs(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.LOGS_KEY)
      logger.info('Logs de sécurité vidés')
    } catch (error) {
      logger.error('Erreur lors du vidage des logs', error)
    }
  }

  // Mettre à jour les paramètres de sécurité
  public updateSecuritySettings(newSettings: Partial<AdminSecuritySettings>): void {
    const currentSettings = this.loadSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    this.saveSettings(updatedSettings)
  }

  // Déverrouiller manuellement le compte
  // Déverrouiller le compte avec vérification du mot de passe
  public unlockAccount(password: string): { success: boolean; message: string } {
    this.initialize()
    
    // Charger les credentials pour vérifier le mot de passe
    const credentials = this.loadCredentials()
    if (!credentials) {
      return {
        success: false,
        message: 'Erreur de configuration système'
      }
    }
    
    // Vérifier le mot de passe
    if (password !== credentials.password) {
      this.addSecurityLog({
        action: 'login_attempt',
        username: 'SYSTEM',
        success: false,
        details: 'Tentative de déverrouillage avec mot de passe incorrect'
      })
      return {
        success: false,
        message: 'Mot de passe incorrect'
      }
    }
    
    // Déverrouiller le compte
    SecureStorage.removeItem(this.LOCKOUT_KEY)
    this.addSecurityLog({
      action: 'login_attempt',
      username: 'SYSTEM',
      success: true,
      details: 'Compte déverrouillé manuellement par l\'administrateur'
    })
    
    return {
      success: true,
      message: 'Compte déverrouillé avec succès'
    }
  }

  // Vérifier si le lien &quot;Mot de passe oublié&quot; doit être affiché
  public canShowPasswordResetLink(): boolean {
    if (typeof window === 'undefined') return false
    
    const lockoutData = SecureStorage.getItemJSON<{ attempts: number; lockedUntil: number }>(this.LOCKOUT_KEY)
    if (!lockoutData) return false

    try {
      const { attempts, lockedUntil } = lockoutData
      const now = Date.now()
      
      // Afficher le lien seulement si :
      // 1. Le compte a été verrouillé (3 tentatives atteintes)
      // 2. Le temps de verrouillage a expiré OU n&apos;existe plus
      return attempts >= this.loadSettings().maxLoginAttempts && 
             (!lockedUntil || now > lockedUntil)
    } catch (error) {
      logger.error('Erreur lors de la vérification du lien de réinitialisation', error)
      return false
    }
  }

  // Obtenir le temps restant de verrouillage
  public getRemainingLockTime(): number | null {
    if (typeof window === 'undefined') return null
    
    const lockoutData = SecureStorage.getItemJSON<{ attempts: number; lockedUntil: number; lastAttempt: number }>(this.LOCKOUT_KEY)
    if (!lockoutData) return null

    try {
      const { lockedUntil } = lockoutData
      if (!lockedUntil) return null
      
      const now = Date.now()
      const remainingMs = lockedUntil - now
      
      if (remainingMs <= 0) {
        // Le verrouillage a expiré, nettoyer les données
        SecureStorage.removeItem(this.LOCKOUT_KEY)
        return null
      }
      
      return Math.ceil(remainingMs / (1000 * 60)) // Retourner en minutes
    } catch (error) {
      logger.error('Erreur lors du calcul du temps restant', error)
      // Nettoyer les données corrompues
      SecureStorage.removeItem(this.LOCKOUT_KEY)
      return null
    }
  }

  // Chiffrement simple (pour la démo - en production utiliser une vraie méthode)
  private simpleEncrypt(text: string): string {
    return btoa(text)
  }

  // Déchiffrement simple (pour la démo - en production utiliser une vraie méthode)
  private simpleDecrypt(encryptedText: string): string {
    try {
      return atob(encryptedText)
    } catch (error) {
      logger.error('Erreur de déchiffrement', error)
      return ''
    }
  }

  // 🚨 AUTO-RESET DE LA BASE DE DONNÉES POUR SÉCURITÉ
  private triggerAutoReset(): void {
    if (typeof window === 'undefined') return

    try {
      // 🚨 AUTO-RESET SANS SAUVEGARDE AUTOMATIQUE
      // L&apos;admin doit faire ses propres sauvegardes manuelles
      
      logger.warn('AUTO-RESET: Début de la réinitialisation...')
      
      // 1. Supprimer toutes les données utilisateurs
      this.clearUserDatabase()
      logger.warn('AUTO-RESET: Base de données utilisateurs effacée')
      
      // 2. Supprimer les tokens de session
      this.clearUserSessions()
      logger.warn('AUTO-RESET: Sessions utilisateurs effacées')
      
      // 3. Recréer les utilisateurs par défaut activés
      this.recreateDefaultUsers()
      logger.warn('AUTO-RESET: Utilisateurs par défaut recréés et activés')
      
      // 3. Log de sécurité
      this.addSecurityLog({
        action: 'auto_reset_triggered',
        username: 'SYSTEM',
        success: true,
        details: 'Base de données utilisateurs réinitialisée automatiquement pour sécurité (sans sauvegarde automatique)'
      })
      
      logger.warn('AUTO-RESET: Réinitialisation terminée')
      logger.info('Rappel: Faites vos sauvegardes manuelles avant chaque déconnexion !')
    } catch (error) {
      logger.error('Erreur lors du auto-reset', error)
      this.addSecurityLog({
        action: 'auto_reset_failed',
        username: 'SYSTEM',
        success: false,
        details: `Erreur lors du auto-reset: ${error}`
      })
    }
  }

  // Créer une sauvegarde avant le reset
  private createBackup(): void {
    if (typeof window === 'undefined') return

    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        users: localStorage.getItem('atiha_users_database'), // ✅ Clé correcte
        bannedUsers: localStorage.getItem('atiha_banned_users'), // ✅ Utilisateurs bannis
        userStats: localStorage.getItem('atiha_user_stats'),
        adminToken: localStorage.getItem('atiha_admin_token'),
        adminUser: localStorage.getItem('atiha_admin_user')
      }
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData))
      logger.info('Sauvegarde créée avant auto-reset')
    } catch (error) {
      logger.error('Erreur lors de la création de la sauvegarde', error)
    }
  }

  // Effacer la base de données utilisateurs
  private clearUserDatabase(): void {
    if (typeof window === 'undefined') return

    const keysToRemove = [
      'atiha_all_users',
      'atiha_users_database', // ✅ Clé correcte de la base de données
      'atiha_banned_users',   // ✅ Clé des utilisateurs bannis
      'atiha_user_stats',     // ✅ Statistiques utilisateurs
      'atiha_user_token',
      'atiha_user_data',
      'atiha_user_login_attempts',
      'atiha_user_database',
      'atiha_user_backup',
      'atiha_user_sessions'
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    // Effacer aussi toutes les clés qui commencent par 'atiha_user_'
    const allKeys = Object.keys(localStorage)
    allKeys.forEach(key => {
      if (key.startsWith('atiha_user_')) {
        localStorage.removeItem(key)
      }
    })
  }

  // Effacer les sessions utilisateurs
  private clearUserSessions(): void {
    if (typeof window === 'undefined') return

    const sessionKeys = [
      'atiha_user_token',
      'atiha_user_data',
      'atiha_user_login_attempts'
    ]

    sessionKeys.forEach(key => {
      localStorage.removeItem(key)
    })
  }

  // Recréer les utilisateurs par défaut activés
  private recreateDefaultUsers(): void {
    if (typeof window === 'undefined') return

    try {
      // Recréer directement les utilisateurs par défaut dans localStorage
      const defaultUsers = [
        {
          id: 'admin_demo',
          email: 'admin@user.com',
          name: 'Admin user',
          phone: '+000000000001',
          password: process.env.ADMIN_DEFAULT_PASSWORD || `admin_temp_${Date.now()}`,
          country: 'MA',
          isActive: true,
          isBanned: false,
          loginCount: 0,
          registrationDate: new Date().toISOString(),
          createdAt: new Date()
        }
      ]
      
      // Sauvegarder les utilisateurs par défaut
      localStorage.setItem('atiha_users_database', JSON.stringify(defaultUsers))
      logger.info(`Utilisateurs par défaut recréés et activés: ${defaultUsers.length}`)
      
    } catch (error) {
      logger.error('Erreur lors de la recréation des utilisateurs par défaut', error)
    }
  }


  // Restaurer la base de données depuis la sauvegarde
  public restoreFromBackup(): { success: boolean; message: string } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Fonction non disponible côté serveur' }
    }

    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY)
      if (!backupData) {
        return { success: false, message: 'Aucune sauvegarde trouvée' }
      }

      const backup = JSON.parse(backupData)
      
      // Restaurer les données
      if (backup.users) localStorage.setItem('atiha_users_database', backup.users) // ✅ Clé correcte
      if (backup.bannedUsers) localStorage.setItem('atiha_banned_users', backup.bannedUsers) // ✅ Utilisateurs bannis
      if (backup.userStats) localStorage.setItem('atiha_user_stats', backup.userStats)
      if (backup.adminToken) localStorage.setItem('atiha_admin_token', backup.adminToken)
      if (backup.adminUser) localStorage.setItem('atiha_admin_user', backup.adminUser)

      this.addSecurityLog({
        action: 'backup_restored',
        username: 'SYSTEM',
        success: true,
        details: `Base de données restaurée depuis la sauvegarde du ${new Date(backup.timestamp).toLocaleString()}`
      })

      return { success: true, message: 'Base de données restaurée avec succès' }
    } catch (error) {
      logger.error('Erreur lors de la restauration', error)
      return { success: false, message: `Erreur lors de la restauration: ${error}` }
    }
  }

  // Vérifier si une sauvegarde existe
  public hasBackup(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(this.BACKUP_KEY) !== null
  }

  // Obtenir les informations de la sauvegarde
  public getBackupInfo(): { exists: boolean; timestamp?: string; userCount?: number } {
    if (typeof window === 'undefined') {
      return { exists: false }
    }

    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY)
      if (!backupData) {
        return { exists: false }
      }

      const backup = JSON.parse(backupData)
      const users = backup.users ? JSON.parse(backup.users) : []
      
      return {
        exists: true,
        timestamp: backup.timestamp,
        userCount: Array.isArray(users) ? users.length : 0
      }
    } catch (error) {
      logger.error('Erreur lors de la lecture de la sauvegarde', error)
      return { exists: false }
    }
  }
}

// Instance singleton
export const adminSecurity = new AdminSecurity()
