/**
 * Service de stockage sécurisé pour localStorage
 * Chiffre automatiquement les données sensibles avec AES-256-CBC
 */

'use client'

import { EncryptionService } from './encryption-service'
import { logger } from './logger'

/**
 * Liste des clés localStorage sensibles à chiffrer
 */
const SENSITIVE_KEYS = [
  'atiha_user',
  'atiha_admin_user',
  'atiha_token',
  'atiha_admin_token',
  'atiha_premium_codes',
  'atiha_user_sessions_db',
  'atiha_user_sessions', // Ancienne clé (migration)
  'atiha_admin_credentials',
  'atiha_admin_lockout',
  'atiha_admin_security_logs',
  'atiha_user_premium',
  'atiha_user_location',
  'atiha_geographic_restrictions',
  'atiha_payment_links',
  'atiha_payment_links_active',
  'atiha_post_payment_codes',
  'atiha_post_payment_codes_active',
  'atiha_post_payment_links',
  'atiha_post_payment_links_active'
]

/**
 * Préfixe pour identifier les données chiffrées
 */
const ENCRYPTED_PREFIX = '__encrypted__'

/**
 * Vérifie si une clé est sensible et doit être chiffrée
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some(sensitiveKey => key === sensitiveKey || key.startsWith(sensitiveKey + '_'))
}

/**
 * Vérifie si une valeur est déjà chiffrée
 */
function isEncrypted(value: string): boolean {
  try {
    // Format: __encrypted__:data
    return value.startsWith(ENCRYPTED_PREFIX)
  } catch {
    return false
  }
}

/**
 * Stockage sécurisé avec chiffrement automatique
 */
export class SecureStorage {
  /**
   * Stocke une valeur de manière sécurisée
   */
  static setItem(key: string, value: any): void {
    if (typeof window === 'undefined') return

    try {
      // Convertir en JSON si nécessaire
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)

      // Chiffrer si la clé est sensible
      if (isSensitiveKey(key)) {
        const encrypted = EncryptionService.encryptData(stringValue)
        localStorage.setItem(key, `${ENCRYPTED_PREFIX}${encrypted}`)
      } else {
        // Stocker normalement pour les clés non sensibles
        localStorage.setItem(key, stringValue)
      }
    } catch (error) {
      logger.error(`Erreur lors du stockage sécurisé de ${key}`, error, { key })
      // Fallback: stocker sans chiffrement si le chiffrement échoue
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
        localStorage.setItem(key, stringValue)
        logger.warn(`Stockage fallback utilisé pour ${key} (sans chiffrement)`, { key })
      } catch (fallbackError) {
        logger.error(`Erreur lors du stockage fallback de ${key}`, fallbackError, { key })
      }
    }
  }

  /**
   * Récupère une valeur de manière sécurisée
   */
  static getItem(key: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      const value = localStorage.getItem(key)
      if (!value) return null

      // Si la valeur est chiffrée, la déchiffrer
      if (isEncrypted(value)) {
        const encryptedData = value.substring(ENCRYPTED_PREFIX.length)
        const decrypted = EncryptionService.decryptData(encryptedData)
        return typeof decrypted === 'string' ? decrypted : JSON.stringify(decrypted)
      }

      // Si la clé est sensible mais pas chiffrée, migrer automatiquement
      if (isSensitiveKey(key) && !isEncrypted(value)) {
        // Migrer vers le format chiffré
        this.setItem(key, value)
        // Retourner la valeur originale
        return value
      }

      return value
    } catch (error) {
      logger.error(`Erreur lors de la récupération sécurisée de ${key}`, error, { key })
      // En cas d'erreur, essayer de retourner la valeur non chiffrée
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    }
  }

  /**
   * Récupère une valeur et la parse en JSON
   */
  static getItemJSON<T = any>(key: string): T | null {
    const value = this.getItem(key)
    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  /**
   * Supprime une valeur
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }

  /**
   * Vérifie si une clé existe
   */
  static hasItem(key: string): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(key) !== null
  }

  /**
   * Nettoie toutes les clés sensibles
   */
  static clearSensitiveData(): void {
    if (typeof window === 'undefined') return
    
    SENSITIVE_KEYS.forEach(key => {
      localStorage.removeItem(key)
    })
  }

  /**
   * Migre les données existantes vers le format chiffré
   */
  static migrateToEncrypted(): void {
    if (typeof window === 'undefined') return

    logger.info('Migration des données sensibles vers le format chiffré...')
    let migratedCount = 0

    SENSITIVE_KEYS.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (value && !isEncrypted(value)) {
          // Si la valeur existe et n'est pas déjà chiffrée, la chiffrer
          this.setItem(key, value)
          migratedCount++
        }
      } catch (error) {
        logger.error(`Erreur lors de la migration de ${key}`, error, { key })
      }
    })

    if (migratedCount > 0) {
      logger.info(`${migratedCount} clé(s) migrée(s) vers le format chiffré`)
    }
  }

  /**
   * Vérifie si les données sont chiffrées
   */
  static checkEncryptionStatus(): {
    totalSensitiveKeys: number
    encryptedKeys: number
    unencryptedKeys: string[]
  } {
    if (typeof window === 'undefined') {
      return { totalSensitiveKeys: 0, encryptedKeys: 0, unencryptedKeys: [] }
    }

    const unencryptedKeys: string[] = []

    SENSITIVE_KEYS.forEach(key => {
      const value = localStorage.getItem(key)
      if (value && !isEncrypted(value)) {
        unencryptedKeys.push(key)
      }
    })

    const encryptedCount = SENSITIVE_KEYS.filter(key => {
      const value = localStorage.getItem(key)
      return value && isEncrypted(value)
    }).length

    return {
      totalSensitiveKeys: SENSITIVE_KEYS.length,
      encryptedKeys: encryptedCount,
      unencryptedKeys
    }
  }
}

/**
 * Wrapper pour maintenir la compatibilité avec localStorage
 * Utilise SecureStorage en interne pour les clés sensibles
 */
export const secureLocalStorage = {
  setItem: (key: string, value: string) => SecureStorage.setItem(key, value),
  getItem: (key: string) => SecureStorage.getItem(key),
  removeItem: (key: string) => SecureStorage.removeItem(key),
  hasItem: (key: string) => SecureStorage.hasItem(key),
  clear: () => {
    if (typeof window === 'undefined') return
    localStorage.clear()
  }
}

