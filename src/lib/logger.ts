/**
 * Service de logging centralisé pour l'application
 * Remplace tous les console.log/error/warn par un système unifié
 * Intègre Sentry pour le monitoring des erreurs en production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: any
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'
  
  // Niveau de log minimum (en production, ignorer debug et info)
  private minLevel: LogLevel = this.isProduction ? 'warn' : 'debug'

  // Cache pour Sentry (évite de recharger à chaque fois)
  private sentryCache: any = null
  private sentryLoadAttempted = false

  // Lazy load Sentry pour éviter les erreurs si non configuré
  private getSentry() {
    // Si déjà chargé, retourner le cache
    if (this.sentryCache !== null) {
      return this.sentryCache
    }

    // Si déjà tenté et échoué, retourner null
    if (this.sentryLoadAttempted && this.sentryCache === null) {
      return null
    }

    this.sentryLoadAttempted = true

    if (typeof window === 'undefined') {
      // Côté serveur
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        this.sentryCache = require('@sentry/nextjs')
        return this.sentryCache
      } catch {
        this.sentryCache = null
        return null
      }
    } else {
      // Côté client
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).Sentry || null
      } catch {
        return null
      }
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (context) {
      return `${prefix} ${message}\nContext: ${JSON.stringify(context, null, 2)}`
    }
    
    return `${prefix} ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(level)
    const minLevelIndex = levels.indexOf(this.minLevel)
    
    return currentLevelIndex >= minLevelIndex
  }

  /**
   * Log de debug (uniquement en développement)
   */
  debug(message: string, context?: any): void {
    if (!this.shouldLog('debug')) return
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  /**
   * Log d'information
   */
  info(message: string, context?: any): void {
    if (!this.shouldLog('info')) return
    
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context))
    } else {
      // En production, logger vers un service externe si nécessaire
      // Exemple: envoyer à un service de logging
    }
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: any): void {
    if (!this.shouldLog('warn')) return
    
    console.warn(this.formatMessage('warn', message, context))
    
    // En production, envoyer les warnings à Sentry
    if (this.isProduction) {
      const Sentry = this.getSentry()
      if (Sentry) {
        Sentry.captureMessage(message, {
          level: 'warning',
          extra: context
        })
      }
    }
  }

  /**
   * Log d'erreur
   */
  error(message: string, error?: Error | any, context?: any): void {
    if (!this.shouldLog('error')) return
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    
    console.error(this.formatMessage('error', message, { error: errorMessage, ...context }))
    
    if (stack && this.isDevelopment) {
      console.error('Stack trace:', stack)
    }
    
    // En production, envoyer les erreurs à Sentry
    if (this.isProduction) {
      const Sentry = this.getSentry()
      if (Sentry) {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            extra: { message, ...context }
          })
        } else {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: { error: errorMessage, ...context }
          })
        }
      }
    }
  }

  /**
   * Log d'erreur critique (toujours loggé)
   */
  critical(message: string, error?: Error | any, context?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    
    console.error('🚨 CRITICAL ERROR:', this.formatMessage('error', message, { error: errorMessage, ...context }))
    
    if (stack) {
      console.error('Stack trace:', stack)
    }
    
    // En production, envoyer immédiatement à Sentry avec priorité élevée
    if (this.isProduction) {
      const Sentry = this.getSentry()
      if (Sentry) {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            level: 'fatal',
            extra: { message, ...context }
          })
        } else {
          Sentry.captureMessage(message, {
            level: 'fatal',
            extra: { error: errorMessage, ...context }
          })
        }
      }
    }
  }

  /**
   * Log de groupe (pour organiser les logs)
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label)
    }
  }

  /**
   * Fin d'un groupe de logs
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  /**
   * Table (pour afficher des données tabulaires)
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data)
    }
  }
}

// Export d'une instance singleton
export const logger = new Logger()

// Export par défaut pour compatibilité
export default logger

