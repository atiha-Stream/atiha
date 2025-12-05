/**
 * Service de validation des variables d'environnement
 * Vérifie que toutes les variables requises sont présentes au démarrage
 */

import { logger } from './logger'

interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
}

class EnvValidator {
  /**
   * Variables d'environnement requises pour la production
   */
  private readonly REQUIRED_VARS = [
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'ADMIN_SECURITY_CODE',
  ]

  /**
   * Variables d'environnement recommandées (avertissements si manquantes)
   */
  private readonly RECOMMENDED_VARS = [
    'ENCRYPTION_KEY',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ]

  /**
   * Valide toutes les variables d'environnement
   */
  validate(): EnvValidationResult {
    const missing: string[] = []
    const warnings: string[] = []

    // Vérifier les variables requises
    for (const varName of this.REQUIRED_VARS) {
      if (!process.env[varName] || process.env[varName]!.trim() === '') {
        missing.push(varName)
      }
    }

    // Vérifier les variables recommandées
    for (const varName of this.RECOMMENDED_VARS) {
      if (!process.env[varName] || process.env[varName]!.trim() === '') {
        warnings.push(varName)
      }
    }

    // Vérifier les valeurs par défaut dangereuses
    if (process.env.ADMIN_PASSWORD === 'Atiasekbaby@89#2025!') {
      warnings.push('ADMIN_PASSWORD utilise la valeur par défaut (INSÉCURISÉ)')
    }

    if (process.env.ADMIN_SECURITY_CODE === '101089555@ABC') {
      warnings.push('ADMIN_SECURITY_CODE utilise la valeur par défaut (INSÉCURISÉ)')
    }

    // Vérifier l'utilisation de NEXT_PUBLIC_* pour des données sensibles
    if (process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      warnings.push('NEXT_PUBLIC_ADMIN_PASSWORD est exposé côté client. Utiliser ADMIN_PASSWORD (sans NEXT_PUBLIC_)')
    }

    if (process.env.NEXT_PUBLIC_ADMIN_SECURITY_CODE) {
      warnings.push('NEXT_PUBLIC_ADMIN_SECURITY_CODE est exposé côté client. Utiliser ADMIN_SECURITY_CODE (sans NEXT_PUBLIC_)')
    }

    return {
      isValid: missing.length === 0,
      missing,
      warnings
    }
  }

  /**
   * Valide et affiche les résultats (à appeler au démarrage de l'application)
   * Note: En Next.js, les variables sans NEXT_PUBLIC_ ne sont disponibles que côté serveur
   * Cette validation côté client peut échouer même si les variables sont définies
   */
  validateAndReport(): boolean {
    // En Next.js, les variables d'environnement sans NEXT_PUBLIC_ ne sont pas accessibles côté client
    // On vérifie si on est côté serveur ou client
    const isServer = typeof window === 'undefined'
    
    const result = this.validate()

    if (!result.isValid) {
      // Côté client, les variables serveur ne sont pas accessibles, c'est normal
      if (!isServer) {
        logger.debug('Variables d\'environnement serveur non accessibles côté client (normal en Next.js)', { missing: result.missing })
        // Ne pas bloquer côté client, les variables seront vérifiées côté serveur
        return true
      }
      
      // Côté serveur, c'est une vraie erreur
      logger.error('Variables d\'environnement manquantes', new Error('Configuration invalide'), { missing: result.missing })
      for (const varName of result.missing) {
        logger.error(`Variable manquante: ${varName}`)
      }
      logger.warn('Veuillez configurer ces variables dans votre fichier .env.local')
      return false
    }

    if (result.warnings.length > 0) {
      logger.warn('Avertissements de configuration', { warnings: result.warnings })
      for (const warning of result.warnings) {
        logger.warn(warning)
      }
    }

    if (result.isValid && result.warnings.length === 0 && isServer) {
      logger.info('Toutes les variables d\'environnement sont correctement configurées')
    }

    return result.isValid
  }

  /**
   * Valide et lance une erreur si des variables sont manquantes (pour la production)
   */
  validateOrThrow(): void {
    const result = this.validate()

    if (!result.isValid) {
      throw new Error(
        `Variables d'environnement manquantes: ${result.missing.join(', ')}\n` +
        'Veuillez configurer ces variables avant de démarrer l\'application.'
      )
    }

    if (result.warnings.length > 0 && process.env.NODE_ENV === 'production') {
      // En production, les avertissements deviennent des erreurs
      throw new Error(
        `Configuration invalide en production:\n${result.warnings.join('\n')}\n` +
        'Veuillez corriger ces problèmes avant de déployer.'
      )
    }
  }
}

// Export d'une instance singleton
export const envValidator = new EnvValidator()

// Export par défaut pour compatibilité
export default envValidator

