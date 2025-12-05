/**
 * Service de protection CSRF (Cross-Site Request Forgery)
 * Génère et valide les tokens CSRF pour protéger contre les attaques cross-site
 */

'use client'

import { logger } from './logger'
import { SecureStorage } from './secure-storage'

const CSRF_TOKEN_KEY = 'atiha_csrf_token'
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 heures

interface CSRFToken {
  token: string
  expiresAt: number
}

/**
 * Génère un token CSRF sécurisé
 */
function generateCSRFToken(): string {
  // Générer un token aléatoire de 32 caractères
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Fallback pour les environnements sans crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Service CSRF
 */
export class CSRFService {
  /**
   * Génère un nouveau token CSRF et le stocke
   * @returns Le token CSRF généré
   */
  static generateToken(): string {
    if (typeof window === 'undefined') {
      logger.warn('CSRF token generation called on server side')
      return ''
    }

    const token = generateCSRFToken()
    const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY

    const tokenData: CSRFToken = {
      token,
      expiresAt
    }

    SecureStorage.setItem(CSRF_TOKEN_KEY, tokenData)
    logger.debug('CSRF token generated', { token: token.substring(0, 8) + '...' })

    return token
  }

  /**
   * Récupère le token CSRF actuel (en génère un nouveau si expiré ou absent)
   * @returns Le token CSRF actuel
   */
  static getToken(): string {
    if (typeof window === 'undefined') {
      return ''
    }

    const stored = SecureStorage.getItemJSON<CSRFToken>(CSRF_TOKEN_KEY)
    
    if (!stored) {
      return this.generateToken()
    }

    // Vérifier si le token a expiré
    if (Date.now() > stored.expiresAt) {
      logger.debug('CSRF token expired, generating new one')
      return this.generateToken()
    }

    return stored.token
  }

  /**
   * Valide un token CSRF
   * @param token - Le token à valider
   * @returns true si le token est valide, false sinon
   */
  static validateToken(token: string): boolean {
    if (typeof window === 'undefined') {
      logger.warn('CSRF token validation called on server side')
      return false
    }

    if (!token || typeof token !== 'string') {
      logger.warn('Invalid CSRF token format')
      return false
    }

    const stored = SecureStorage.getItemJSON<CSRFToken>(CSRF_TOKEN_KEY)
    
    if (!stored) {
      logger.warn('No CSRF token found in storage')
      return false
    }

    // Vérifier si le token a expiré
    if (Date.now() > stored.expiresAt) {
      logger.warn('CSRF token expired')
      SecureStorage.removeItem(CSRF_TOKEN_KEY)
      return false
    }

    // Comparer les tokens de manière sécurisée (timing-safe)
    const isValid = this.timingSafeEqual(token, stored.token)
    
    if (!isValid) {
      logger.warn('CSRF token mismatch', { 
        provided: token.substring(0, 8) + '...',
        expected: stored.token.substring(0, 8) + '...'
      })
    }

    return isValid
  }

  /**
   * Comparaison sécurisée contre les attaques par timing
   * @param a - Première chaîne
   * @param b - Deuxième chaîne
   * @returns true si les chaînes sont identiques
   */
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Supprime le token CSRF (utile pour la déconnexion)
   */
  static clearToken(): void {
    if (typeof window === 'undefined') return
    
    SecureStorage.removeItem(CSRF_TOKEN_KEY)
    logger.debug('CSRF token cleared')
  }

  /**
   * Vérifie si un token CSRF existe et est valide
   * @returns true si un token valide existe
   */
  static hasValidToken(): boolean {
    if (typeof window === 'undefined') return false

    const stored = SecureStorage.getItemJSON<CSRFToken>(CSRF_TOKEN_KEY)
    
    if (!stored) {
      return false
    }

    return Date.now() <= stored.expiresAt
  }
}

