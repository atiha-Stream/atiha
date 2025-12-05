/**
 * @fileoverview Contexte d'authentification pour l'application Atiha
 * @module auth-context
 * @description Gère l'authentification, l'inscription, la déconnexion et la validation des sessions utilisateur
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types/auth'
import { ErrorLogger } from './error-logger'
import { userDatabase } from './user-database'
import { premiumCodesService } from './premium-codes-service'
import { ActivityService } from './activity-service'
import { sessionManager } from './session-manager'
import { EncryptionService } from './encryption-service'
import { securityLogger } from './security-logger'
import { SecureStorage } from './secure-storage'
import { logger } from './logger'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<{ hasPremiumTrial: boolean; trialDays?: number }>
  logout: () => void
  getTotalUsers: () => number
  updateUser: (updates: Partial<User>) => Promise<void>
  sessionValidationResult?: {
    canLogin: boolean
    message: string
    activeSessions?: any[]
    needsDisconnection?: boolean
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provider d'authentification pour l'application
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Composants enfants à envelopper
 * @returns {JSX.Element} Provider d'authentification
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionValidationResult, setSessionValidationResult] = useState<{
    canLogin: boolean
    message: string
    activeSessions?: any[]
    needsDisconnection?: boolean
  } | undefined>(undefined)

  useEffect(() => {
    // Vérifier si l&apos;utilisateur est connecté au chargement
    const checkAuth = () => {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      const token = SecureStorage.getItem('atiha_token')
      const userData = SecureStorage.getItemJSON<User>('atiha_user')
      
      if (token && userData) {
        try {
          setUser(userData)
        } catch (error) {
          logger.error('Error parsing user data', error)
          SecureStorage.removeItem('atiha_token')
          SecureStorage.removeItem('atiha_user')
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Mettre à jour l'activité de la session régulièrement
  useEffect(() => {
    if (!user) return

    const updateSessionActivity = () => {
      try {
        const currentDeviceId = sessionManager.getCurrentDeviceId()
        sessionManager.updateSessionActivity(user.id, currentDeviceId)
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    }

    // Mettre à jour immédiatement
    updateSessionActivity()

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(updateSessionActivity, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Fonction pour récupérer le type de code premium d&apos;un utilisateur
  const getUserActiveCodeType = (userId: string): string | null => {
    const premiumStatus = premiumCodesService.getUserPremiumStatus(userId)
        return premiumStatus.isPremium ? (premiumStatus.codeType || null) : null
  }

  /**
   * Connecte un utilisateur avec ses identifiants
   * @param {LoginCredentials} credentials - Identifiants de connexion (email, password)
   * @returns {Promise<void>} Promise qui se résout quand la connexion est terminée
   * @throws {Error} Si les identifiants sont incorrects ou si la limite de sessions est atteinte
   * 
   * @example
   * ```tsx
   * await login({ email: 'user@example.com', password: 'password123' })
   * ```
   */
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setSessionValidationResult(undefined)
    
    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Utiliser la nouvelle base de données JSON (maintenant async avec bcrypt)
      const userRecord = await userDatabase.loginUser(credentials.email, credentials.password)
      
      if (userRecord) {
        // Log de sécurité - connexion réussie
        securityLogger.logLoginAttempt(credentials.email, true, {
          userId: userRecord.id,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
        // Récupérer le type de code premium de l&apos;utilisateur
        const userCodeType = getUserActiveCodeType(userRecord.id)
        
        // Vérifier les sessions avec le bon type de code
        if (userCodeType) {
          const sessionResult = sessionManager.validateLogin(userRecord.id, userCodeType)
          
          if (!sessionResult.canLogin) {
            // Limite d&apos;appareils atteinte pour cet utilisateur spécifique
            setSessionValidationResult(sessionResult)
            setIsLoading(false)
            
            // Log de l'activité bloquée
            ActivityService.logUserActivity('warning', `Connexion bloquée - Limite de sessions atteinte: ${userRecord.email}`, {
              userId: userRecord.id,
              userEmail: userRecord.email,
              codeType: userCodeType,
              activeSessions: sessionResult.activeSessions?.length || 0
            })
            
            return
          }
          
          // Ajouter la nouvelle session avec le bon type de code (seulement si le type gère les sessions)
          try {
            sessionManager.addSession(userRecord.id, userCodeType)
          } catch (error) {
            logger.warn('Type de code ne gère pas les sessions, connexion autorisée sans session', error)
          }
        }
        
        // Utilisateur trouvé et validé
        const mockToken = 'mock_jwt_token_' + Date.now()
               SecureStorage.setItem('atiha_token', mockToken)
               SecureStorage.setItem('atiha_user', userRecord)
        setUser(userRecord)
        
        // Enregistrer l'activité de connexion
        ActivityService.logUserActivity('success', `Utilisateur connecté: ${userRecord.email}`, {
          userName: userRecord.name,
          userEmail: userRecord.email,
          userAgent: navigator.userAgent,
          url: window.location.href,
          codeType: userCodeType
        })
      } else {
        // Log de sécurité - connexion échouée
        securityLogger.logLoginAttempt(credentials.email, false, {
          reason: 'invalid_credentials',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
        
        // Utilisateur non trouvé
        ActivityService.logUserActivity('error', `Tentative de connexion échouée: ${credentials.email}`, {
          userEmail: credentials.email,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
        throw new Error('Email ou mot de passe incorrect')
      }
    } catch (error) {
        logger.error('Login error', error)
        ErrorLogger.log(
          error instanceof Error ? error : new Error('Erreur de connexion'),
          'medium',
          'authentication',
          { email: credentials.email }
        )
        throw error
      } finally {
        setIsLoading(false)
      }
  }

  const register = async (credentials: RegisterCredentials): Promise<{ hasPremiumTrial: boolean; trialDays?: number }> => {
    setIsLoading(true)
    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Utiliser la nouvelle base de données JSON (maintenant async avec bcrypt)
      const newUserRecord = await userDatabase.registerUser({
        email: credentials.email,
        name: credentials.name,
        phone: credentials.phone,
        password: credentials.password, // 🔑 Le mot de passe sera haché automatiquement
        country: credentials.country,
        avatar: undefined
      })
      
      const mockToken = 'mock_jwt_token_' + Date.now()
      
      // Sauvegarder l&apos;utilisateur connecté
      localStorage.setItem('atiha_token', mockToken)
      localStorage.setItem('atiha_user', JSON.stringify(newUserRecord))
      
      // Activer automatiquement le code d'inscription s'il existe
      let hasPremiumTrial = false
      let trialDays = 0
      
      try {
        const activationResult = premiumCodesService.activateInscriptionCodeForNewUser(newUserRecord.id)
        if (activationResult.success) {
          logger.info('Code d\'inscription activé automatiquement', { message: activationResult.message })
          hasPremiumTrial = true
          trialDays = 5 // Durée par défaut des codes d'inscription
        } else {
          logger.debug('Aucun code d\'inscription disponible', { message: activationResult.message })
        }
      } catch (error) {
        logger.error('Erreur lors de l\'activation du code d\'inscription', error)
        // Ne pas faire échouer l'inscription si l&apos;activation du code échoue
      }
      
      setUser(newUserRecord)
      
      return { hasPremiumTrial, trialDays }
    } catch (error) {
        logger.error('Register error', error)
        ErrorLogger.log(
          error instanceof Error ? error : new Error('Erreur d\'inscription'),
          'medium',
          'authentication',
          { email: credentials.email }
        )
        throw error
      } finally {
        setIsLoading(false)
      }
  }

  const logout = () => {
    // Enregistrer l'activité de déconnexion avant de supprimer les données
    if (user) {
      // Supprimer la session actuelle
      const currentDeviceId = sessionManager.getCurrentDeviceId()
      sessionManager.removeSession(user.id, currentDeviceId)
      
      ActivityService.logUserActivity('info', `Utilisateur déconnecté: ${user.email}`, {
        userName: user.name,
        userEmail: user.email,
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
    
    if (typeof window !== 'undefined') {
             SecureStorage.removeItem('atiha_token')
             SecureStorage.removeItem('atiha_user')
    }
    setUser(null)
    setSessionValidationResult(undefined)
  }

  /**
   * Récupère le nombre total d'utilisateurs inscrits
   * @returns {number} Nombre total d'utilisateurs
   * 
   * @example
   * ```tsx
   * const total = getTotalUsers()
   * console.log(`Il y a ${total} utilisateurs inscrits`)
   * ```
   */
  const getTotalUsers = (): number => {
    return userDatabase.getStats().totalUsers
  }

  /**
   * Met à jour les informations de l'utilisateur connecté
   * @param {Partial<User>} updates - Objet contenant les champs à mettre à jour
   * @returns {Promise<void>} Promise qui se résout quand la mise à jour est terminée
   * @throws {Error} Si aucun utilisateur n'est connecté
   * 
   * @example
   * ```tsx
   * await updateUser({ name: 'Nouveau nom', phone: '+33987654321' })
   * ```
   */
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('Aucun utilisateur connecté')
    }

    try {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
               SecureStorage.setItem('atiha_user', updatedUser)
      }
      
      // Mettre à jour dans la base de données
      await userDatabase.updateUser(user.id, updates)
    } catch (error) {
      ErrorLogger.log(error as Error, 'medium')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    getTotalUsers,
    updateUser,
    sessionValidationResult
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
