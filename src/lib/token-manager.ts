// Service pour gérer les tokens JWT dans les URLs de streaming
import { logger } from './logger'

export interface TokenInfo {
  expired: boolean
  expiresIn?: number
  expiresAt?: Date
  payload?: any
}

export class TokenManager {
  /**
   * Vérifie si un token JWT est expiré
   */
  static checkTokenExpiration(url: string): TokenInfo {
    try {
      const tokenMatch = url.match(/token=([^&]+)/)
      if (!tokenMatch) {
        return { expired: false }
      }

      const token = tokenMatch[1]
      const parts = token.split('.')
      
      if (parts.length !== 3) {
        return { expired: false }
      }

      // Décoder le payload JWT
      const payload = JSON.parse(atob(parts[1]))
      const expiration = payload.exp * 1000 // Convertir en millisecondes
      const now = Date.now()
      
      const expiresAt = new Date(expiration)
      const expiresIn = expiration - now

      return {
        expired: now > expiration,
        expiresIn: expiresIn > 0 ? expiresIn : 0,
        expiresAt,
        payload
      }
    } catch (error) {
      logger.warn('Erreur lors de la vérification du token', { error })
      return { expired: false }
    }
  }

  /**
   * Extrait les informations du token d'une URL
   */
  static extractTokenInfo(url: string): {
    hasToken: boolean
    token?: string
    apiKey?: string
    domain?: string
    rate?: string
    role?: string
  } {
    try {
      const tokenMatch = url.match(/token=([^&]+)/)
      const apiKeyMatch = url.match(/api-key=([^&]+)/)
      
      if (!tokenMatch) {
        return { hasToken: false }
      }

      const token = tokenMatch[1]
      const parts = token.split('.')
      
      if (parts.length !== 3) {
        return { hasToken: true, token }
      }

      const payload = JSON.parse(atob(parts[1]))
      
      return {
        hasToken: true,
        token,
        apiKey: apiKeyMatch?.[1],
        domain: payload.domain,
        rate: payload.rate,
        role: payload.role
      }
    } catch (error) {
      logger.warn('Erreur lors de l\'extraction du token', { error })
      return { hasToken: false }
    }
  }

  /**
   * Vérifie si une URL nécessite un renouvellement de token
   */
  static needsTokenRenewal(url: string, thresholdMinutes: number = 30): boolean {
    const tokenInfo = this.checkTokenExpiration(url)
    
    if (!tokenInfo.expired && tokenInfo.expiresIn) {
      // Vérifier si le token expire dans moins de thresholdMinutes
      const thresholdMs = thresholdMinutes * 60 * 1000
      return tokenInfo.expiresIn < thresholdMs
    }
    
    return tokenInfo.expired
  }

  /**
   * Génère un avertissement pour les tokens qui expirent bientôt
   */
  static getTokenWarning(url: string): string | null {
    const tokenInfo = this.checkTokenExpiration(url)
    
    if (tokenInfo.expired) {
      return '⚠️ Le token de cette URL a expiré. La vidéo pourrait ne pas se charger.'
    }
    
    if (tokenInfo.expiresIn && tokenInfo.expiresIn < 60 * 60 * 1000) { // Moins d'1 heure
      const hours = Math.floor(tokenInfo.expiresIn / (60 * 60 * 1000))
      const minutes = Math.floor((tokenInfo.expiresIn % (60 * 60 * 1000)) / (60 * 1000))
      
      if (hours > 0) {
        return `⚠️ Le token expire dans ${hours}h ${minutes}min.`
      } else {
        return `⚠️ Le token expire dans ${minutes}min.`
      }
    }
    
    return null
  }

  /**
   * Valide une URL de streaming
   */
  static validateStreamingUrl(url: string): {
    isValid: boolean
    type: 'cosmic-crab' | 'other' | 'unknown'
    warning?: string
    tokenInfo?: TokenInfo
  } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, type: 'unknown' }
    }

    // Détecter le type de service
    let type: 'cosmic-crab' | 'other' | 'unknown' = 'unknown'
    
    if (url.includes('api.cosmic-crab.buzz')) {
      type = 'cosmic-crab'
    } else if (url.includes('token=') || url.includes('api-key=')) {
      type = 'other'
    }

    // Vérifier le token si présent
    const tokenInfo = this.checkTokenExpiration(url)
    const warning = this.getTokenWarning(url)

    return {
      isValid: !tokenInfo.expired,
      type,
      warning: warning ?? undefined,
      tokenInfo
    }
  }

  /**
   * Formate les informations du token pour l'affichage
   */
  static formatTokenInfo(url: string): string {
    const info = this.extractTokenInfo(url)
    const tokenInfo = this.checkTokenExpiration(url)
    
    if (!info.hasToken) {
      return 'Aucun token détecté'
    }

    let result = `Token: ${info.token?.substring(0, 20)}...\n`
    
    if (info.role) result += `Rôle: ${info.role}\n`
    if (info.rate) result += `Limite: ${info.rate}\n`
    if (info.domain) result += `Domaine: ${info.domain}\n`
    
    if (tokenInfo.expiresAt) {
      result += `Expire: ${tokenInfo.expiresAt.toLocaleString()}\n`
    }
    
    if (tokenInfo.expired) {
      result += '❌ EXPIRÉ'
    } else if (tokenInfo.expiresIn) {
      const hours = Math.floor(tokenInfo.expiresIn / (60 * 60 * 1000))
      const minutes = Math.floor((tokenInfo.expiresIn % (60 * 60 * 1000)) / (60 * 1000))
      result += `✅ Valide (${hours}h ${minutes}min restantes)`
    }

    return result
  }
}

// Instance exportée pour faciliter l'utilisation
export const tokenManager = new TokenManager()
