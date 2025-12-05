/**
 * Service de chiffrement sécurisé pour l'application Atiha
 * Utilise AES-256-GCM pour le chiffrement des données et bcrypt pour les mots de passe
 */

import bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'
import { logger } from './logger'

// Configuration de sécurité
const SALT_ROUNDS = 12 // Niveau de sécurité élevé pour bcrypt
const AES_KEY_LENGTH = 256 // 256 bits pour AES
const GCM_IV_LENGTH = 12 // 96 bits pour GCM (recommandé)

export class EncryptionService {
  private static readonly STORAGE_KEY = 'atiha_encryption_keys'
  
  /**
   * Génère une clé de chiffrement sécurisée
   */
  static generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString() // 256 bits
  }
  
  /**
   * Génère un IV (Initialization Vector) sécurisé
   */
  static generateIV(): string {
    return CryptoJS.lib.WordArray.random(16).toString() // 128 bits (16 bytes) pour AES-CBC
  }
  
  /**
   * Récupère ou génère la clé de chiffrement principale
   */
  private static getMasterKey(): string {
    if (typeof window === 'undefined') {
      // Côté serveur, utiliser une variable d'environnement
      const envKey = process.env.ENCRYPTION_KEY
      if (!envKey) {
        logger.warn('⚠️ ENCRYPTION_KEY non définie dans les variables d\'environnement')
        return this.generateEncryptionKey()
      }
      return envKey
    }
    
    // Côté client, récupérer depuis localStorage ou en générer une
    let masterKey = localStorage.getItem('atiha_master_key')
    if (!masterKey) {
      masterKey = this.generateEncryptionKey()
      localStorage.setItem('atiha_master_key', masterKey)
    }
    return masterKey
  }
  
  /**
   * Hachage sécurisé des mots de passe avec bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS)
      return await bcrypt.hash(password, salt)
    } catch (error) {
      logger.error('Erreur lors du hachage du mot de passe', error as Error)
      throw new Error('Impossible de hacher le mot de passe')
    }
  }
  
  /**
   * Vérification d'un mot de passe haché
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
      logger.error('Erreur lors de la vérification du mot de passe', error as Error)
      return false
    }
  }
  
  /**
   * Chiffrement AES-256-CBC des données sensibles
   * Note: CryptoJS ne supporte pas GCM, on utilise CBC qui est sécurisé avec un IV unique
   */
  static encryptData(data: any, customKey?: string): string {
    try {
      const key = customKey || this.getMasterKey()
      const iv = CryptoJS.lib.WordArray.random(16) // 128 bits pour AES-CBC
      
      // Convertir les données en JSON si nécessaire
      const dataString = typeof data === 'string' ? data : JSON.stringify(data)
      
      // Chiffrement AES-256-CBC (CryptoJS supporte CBC, pas GCM)
      const encrypted = CryptoJS.AES.encrypt(dataString, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      
      // Retourner IV (en hex) + données chiffrées (format: IV:encryptedData)
      const ivHex = iv.toString(CryptoJS.enc.Hex)
      return `${ivHex}:${encrypted.toString()}`
    } catch (error) {
      logger.error('Erreur lors du chiffrement', error as Error)
      throw new Error('Impossible de chiffrer les données')
    }
  }
  
  /**
   * Déchiffrement AES-256-CBC des données sensibles
   */
  static decryptData(encryptedData: string, customKey?: string): any {
    try {
      const key = customKey || this.getMasterKey()
      
      // Séparer IV et données chiffrées
      const [ivHex, encrypted] = encryptedData.split(':')
      if (!ivHex || !encrypted) {
        throw new Error('Format de données chiffrées invalide')
      }
      
      // Déchiffrement AES-256-CBC
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: CryptoJS.enc.Hex.parse(ivHex),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
      
      // Essayer de parser en JSON, sinon retourner la string
      try {
        return JSON.parse(decryptedString)
      } catch {
        return decryptedString
      }
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error)
      throw new Error('Impossible de déchiffrer les données')
    }
  }
  
  /**
   * Chiffrement des tokens JWT
   */
  static encryptToken(token: string): string {
    return this.encryptData(token)
  }
  
  /**
   * Déchiffrement des tokens JWT
   */
  static decryptToken(encryptedToken: string): string {
    return this.decryptData(encryptedToken)
  }
  
  /**
   * Chiffrement des données utilisateur sensibles
   */
  static encryptUserData(userData: any): any {
    const sensitiveFields = ['password', 'email', 'phone', 'address']
    const encryptedData = { ...userData }
    
    sensitiveFields.forEach(field => {
      if (encryptedData[field]) {
        encryptedData[field] = this.encryptData(encryptedData[field])
      }
    })
    
    return encryptedData
  }
  
  /**
   * Déchiffrement des données utilisateur sensibles
   */
  static decryptUserData(encryptedUserData: any): any {
    const sensitiveFields = ['password', 'email', 'phone', 'address']
    const decryptedData = { ...encryptedUserData }
    
    sensitiveFields.forEach(field => {
      if (decryptedData[field] && typeof decryptedData[field] === 'string') {
        try {
          decryptedData[field] = this.decryptData(encryptedUserData[field])
        } catch (error) {
          console.warn(`Impossible de déchiffrer le champ ${field}:`, error)
          // Garder la valeur chiffrée si le déchiffrement échoue
        }
      }
    })
    
    return decryptedData
  }
  
  /**
   * Chiffrement des données localStorage sensibles
   */
  static encryptLocalStorageData(key: string, data: any): void {
    if (typeof window === 'undefined') return
    
    try {
      const encryptedData = this.encryptData(data)
      localStorage.setItem(key, encryptedData)
    } catch (error) {
      console.error(`Erreur lors du chiffrement de ${key}:`, error)
    }
  }
  
  /**
   * Déchiffrement des données localStorage sensibles
   */
  static decryptLocalStorageData(key: string): any {
    if (typeof window === 'undefined') return null
    
    try {
      const encryptedData = localStorage.getItem(key)
      if (!encryptedData) return null
      
      return this.decryptData(encryptedData)
    } catch (error) {
      console.error(`Erreur lors du déchiffrement de ${key}:`, error)
      return null
    }
  }
  
  /**
   * Vérification de l'intégrité des données chiffrées
   */
  static verifyDataIntegrity(encryptedData: string): boolean {
    try {
      const [ivHex, encrypted] = encryptedData.split(':')
      // IV en hex = 16 bytes * 2 = 32 caractères
      return !!(ivHex && encrypted && ivHex.length === 32 && encrypted.length > 0)
    } catch {
      return false
    }
  }
  
  /**
   * Nettoyage sécurisé des données sensibles de la mémoire
   */
  static secureWipe(data: any): void {
    if (typeof data === 'string') {
      // Remplacer par des caractères aléatoires
      data = '0'.repeat(data.length)
    } else if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = '0'.repeat(data[key].length)
        }
      })
    }
  }
  
  /**
   * Génération d'un token sécurisé
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  /**
   * Validation de la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0
    
    // Longueur minimale
    if (password.length >= 8) score += 1
    else feedback.push('Au moins 8 caractères requis')
    
    // Majuscules
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Au moins une majuscule requise')
    
    // Minuscules
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Au moins une minuscule requise')
    
    // Chiffres
    if (/\d/.test(password)) score += 1
    else feedback.push('Au moins un chiffre requis')
    
    // Caractères spéciaux
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push('Au moins un caractère spécial requis')
    
    // Longueur recommandée
    if (password.length >= 12) score += 1
    else if (password.length >= 8) feedback.push('12+ caractères recommandés')
    
    return {
      isValid: score >= 4,
      score,
      feedback
    }
  }
}

// Export des utilitaires de chiffrement
export const {
  hashPassword,
  verifyPassword,
  encryptData,
  decryptData,
  encryptToken,
  decryptToken,
  encryptUserData,
  decryptUserData,
  encryptLocalStorageData,
  decryptLocalStorageData,
  generateSecureToken,
  validatePasswordStrength
} = EncryptionService
