import { ErrorLog, ErrorStats, ErrorFilter } from '@/types/errors'
import { ActivityService } from './activity-service'
import { logger } from './logger'

// Service pour gérer le logging d&apos;erreurs
export class ErrorLogger {
  private static readonly STORAGE_KEY = 'atiha_error_logs'
  private static readonly MAX_LOGS = 1000 // Limite de logs stockés

  // Logger une erreur
  static log(
    error: Error | string,
    severity: ErrorLog['severity'] = 'medium',
    category: ErrorLog['category'] = 'other',
    context?: any
  ): void {
    try {
      // Validation de l'erreur
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Unknown error')
      if (!errorMessage || errorMessage.trim() === '' || errorMessage === 'Unknown error') {
        logger.warn('Tentative de log d\'une erreur vide ou invalide, ignorée', {
          errorType: typeof error,
          errorValue: error,
          errorMessage: errorMessage
        })
        return
      }

      const errorLog: ErrorLog = {
        id: this.generateId(),
        timestamp: new Date(),
        userId: this.getCurrentUserId(),
        userEmail: this.getCurrentUserEmail(),
        error: errorMessage,
        stack: typeof error === 'object' && error.stack ? error.stack : undefined,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        severity,
        category,
        context: context ? JSON.stringify(context) : undefined,
        resolved: false
      }

      // Récupérer les logs existants
      const existingLogs = this.getStoredLogs()
      
      // Ajouter le nouveau log
      const updatedLogs = [errorLog, ...existingLogs].slice(0, this.MAX_LOGS)
      
      // Sauvegarder
      this.saveLogs(updatedLogs)

      // Log dans la console pour le développement - seulement si l'erreur est valide
      if (errorMessage && errorMessage.trim() !== '' && errorMessage !== 'Unknown error') {
        const logData = {
          message: errorMessage,
          severity: errorLog.severity || 'medium',
          category: errorLog.category || 'other',
          url: errorLog.url || 'Unknown URL',
          timestamp: errorLog.timestamp ? errorLog.timestamp.toISOString() : new Date().toISOString(),
          stack: errorLog.stack || undefined
        }
        
        // Vérifier que logData n'est pas un objet vide ou invalide
        const hasValidData = logData.message && 
                            logData.message.trim() !== '' && 
                            logData.message !== 'Unknown error' &&
                            (logData.severity || logData.category || logData.url || logData.stack)
        
        if (hasValidData) {
          logger.error('Error logged', undefined, logData)
        } else {
          logger.warn('Tentative de log d\'une erreur avec données invalides, ignorée', {
            errorType: typeof error,
            errorValue: error,
            errorMessage: errorMessage,
            logData
          })
          return
        }
      } else {
        logger.warn('Tentative de log d\'une erreur invalide, ignorée', {
          errorType: typeof error,
          errorValue: error,
          errorMessage: errorMessage
        })
        return
      }

      // Enregistrer comme activité système
      ActivityService.logSystemActivity(
        severity === 'critical' ? 'error' : severity === 'high' ? 'warning' : 'info',
        `Erreur ${category}: ${errorMessage}`,
        {
          errorId: errorLog.id,
          category: category,
          url: errorLog.url,
          userEmail: errorLog.userEmail
        }
      )

      // Envoyer une notification si l&apos;erreur est critique
      if (severity === 'critical') {
        this.sendCriticalErrorNotification(errorLog)
      }
    } catch (logError) {
      logger.error('Failed to log error', logError)
    }
  }

  // Récupérer tous les logs
  static getLogs(): ErrorLog[] {
    return this.getStoredLogs()
  }

  // Récupérer les logs avec filtres
  static getFilteredLogs(filter: ErrorFilter): ErrorLog[] {
    let logs = this.getStoredLogs()

    if (filter.severity) {
      logs = logs.filter(log => log.severity === filter.severity)
    }

    if (filter.category) {
      logs = logs.filter(log => log.category === filter.category)
    }

    if (filter.resolved !== undefined) {
      logs = logs.filter(log => log.resolved === filter.resolved)
    }

    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom)
      logs = logs.filter(log => new Date(log.timestamp) >= fromDate)
    }

    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo)
      logs = logs.filter(log => new Date(log.timestamp) <= toDate)
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      logs = logs.filter(log => 
        log.error.toLowerCase().includes(searchLower) ||
        log.url.toLowerCase().includes(searchLower) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(searchLower))
      )
    }

    return logs
  }

  // Obtenir les statistiques
  static getStats(): ErrorStats {
    const logs = this.getStoredLogs()
    const now = new Date()
    
    // Calculer les statistiques par sévérité
    const bySeverity = {
      low: logs.filter(log => log.severity === 'low').length,
      medium: logs.filter(log => log.severity === 'medium').length,
      high: logs.filter(log => log.severity === 'high').length,
      critical: logs.filter(log => log.severity === 'critical').length
    }
    
    // Calculer les statistiques par catégorie
    const byCategory = {
      javascript: logs.filter(log => log.category === 'javascript').length,
      network: logs.filter(log => log.category === 'network').length,
      authentication: logs.filter(log => log.category === 'authentication').length,
      video: logs.filter(log => log.category === 'video').length,
      admin: logs.filter(log => log.category === 'admin').length,
      other: logs.filter(log => log.category === 'other').length
    }
    
    // Calculer les statistiques des 7 derniers jours
    const byDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0]
        return logDate === dateStr
      }).length
      byDay.push({ date: dateStr, count })
    }

    return {
      total: logs.length,
      bySeverity,
      byCategory,
      byDay,
      unresolved: logs.filter(log => !log.resolved).length,
      recent: logs.slice(0, 10)
    }
  }

  // Marquer une erreur comme résolue
  static resolveError(logId: string, resolvedBy: string): void {
    const logs = this.getStoredLogs()
    const logIndex = logs.findIndex(log => log.id === logId)
    
    if (logIndex !== -1) {
      logs[logIndex].resolved = true
      logs[logIndex].resolvedAt = new Date()
      logs[logIndex].resolvedBy = resolvedBy
      this.saveLogs(logs)
    }
  }

  // Supprimer un log
  static deleteLog(logId: string): void {
    const logs = this.getStoredLogs().filter(log => log.id !== logId)
    this.saveLogs(logs)
  }

  // Vider tous les logs
  static clearAllLogs(): void {
    this.saveLogs([])
  }

  // Méthodes privées
  private static generateId(): string {
    return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private static getCurrentUserId(): string | undefined {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('atiha_user')
      if (user) {
        try {
          return JSON.parse(user).id
        } catch {
          return undefined
        }
      }
    }
    return undefined
  }

  private static getCurrentUserEmail(): string | undefined {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('atiha_user')
      if (user) {
        try {
          return JSON.parse(user).email
        } catch {
          return undefined
        }
      }
    }
    return undefined
  }

  private static getStoredLogs(): ErrorLog[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY)
        if (stored) {
          const logs = JSON.parse(stored)
          // Convertir les timestamps en Date objects
          return logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
            resolvedAt: log.resolvedAt ? new Date(log.resolvedAt) : undefined
          }))
        }
      } catch (error) {
        logger.error('Error parsing stored logs', error)
      }
    }
    return []
  }

  private static saveLogs(logs: ErrorLog[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs))
      } catch (error) {
        logger.error('Error saving logs', error)
      }
    }
  }

  private static sendCriticalErrorNotification(errorLog: ErrorLog): void {
    // Ici on pourrait envoyer une notification email, Slack, etc.
    logger.critical('CRITICAL ERROR DETECTED', undefined, errorLog)
    
    // Pour l&apos;instant, on peut juste afficher une alerte dans l&apos;admin
    if (typeof window !== 'undefined') {
      const criticalErrors = JSON.parse(localStorage.getItem('atiha_critical_errors') || '[]')
      criticalErrors.push({
        ...errorLog,
        notified: false
      })
      localStorage.setItem('atiha_critical_errors', JSON.stringify(criticalErrors))
    }
  }
}

// Hook pour capturer les erreurs globales
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    // Erreurs JavaScript non capturées
    window.addEventListener('error', (event) => {
      ErrorLogger.log(
        event.error || event.message,
        'high',
        'javascript',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      )
    })

    // Promesses rejetées non capturées
    window.addEventListener('unhandledrejection', (event) => {
      ErrorLogger.log(
        event.reason,
        'high',
        'javascript',
        { type: 'unhandledrejection' }
      )
    })
  }
}
