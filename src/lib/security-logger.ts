/**
 * Service de logs de sécurité avancé pour l'application Atiha
 * Surveille et enregistre toutes les activités de sécurité
 */

import { EncryptionService } from './encryption-service'
import { logger } from './logger'

// Types pour les logs de sécurité
export interface SecurityLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'authentication' | 'authorization' | 'data_access' | 'system' | 'admin' | 'user'
  action: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  details: Record<string, any>
  riskScore: number // 0-100
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface SecurityAlert {
  id: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'suspicious_login' | 'multiple_failures' | 'data_breach' | 'admin_action' | 'system_error'
  title: string
  description: string
  affectedUsers: string[]
  riskScore: number
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface SecurityStats {
  totalLogs: number
  criticalLogs: number
  highRiskLogs: number
  activeAlerts: number
  resolvedAlerts: number
  topThreats: Array<{ category: string; count: number }>
  riskTrend: Array<{ date: string; riskScore: number }>
}

class SecurityLogger {
  private static readonly STORAGE_KEY = 'atiha_security_logs'
  private static readonly ALERTS_KEY = 'atiha_security_alerts'
  private static readonly STATS_KEY = 'atiha_security_stats'
  private static readonly MAX_LOGS = 10000
  private static readonly MAX_ALERTS = 1000
  private static readonly RETENTION_DAYS = 90

  // Initialiser le système de logs
  static initialize(): void {
    if (typeof window === 'undefined') return

    // Initialiser les logs si pas encore définis
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      this.saveLogs([])
    }

    // Initialiser les alertes si pas encore définies
    if (!localStorage.getItem(this.ALERTS_KEY)) {
      this.saveAlerts([])
    }

    // Initialiser les statistiques
    if (!localStorage.getItem(this.STATS_KEY)) {
      this.saveStats(this.generateEmptyStats())
    }

    // Nettoyer les anciens logs
    this.cleanupOldLogs()
  }

  // Enregistrer un log de sécurité
  static logSecurityEvent(
    level: SecurityLog['level'],
    category: SecurityLog['category'],
    action: string,
    details: Record<string, any> = {},
    userId?: string,
    userEmail?: string
  ): void {
    try {
      const log: SecurityLog = {
        id: this.generateId(),
        timestamp: new Date(),
        level,
        category,
        action,
        userId,
        userEmail,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        details: this.sanitizeDetails(details),
        riskScore: this.calculateRiskScore(level, category, action, details),
        resolved: false
      }

      // Sauvegarder le log
      const logs = this.getStoredLogs()
      logs.unshift(log) // Ajouter au début
      
      // Limiter le nombre de logs
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS)
      }

      this.saveLogs(logs)

      // Vérifier si une alerte est nécessaire
      this.checkForAlerts(log)

      // Mettre à jour les statistiques
      this.updateStats()

      // Log dans la console en développement
      logger.debug(`🔒 [${level.toUpperCase()}] ${category}: ${action}`, { log })
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement du log de sécurité', error as Error)
    }
  }

  // Enregistrer une tentative de connexion
  static logLoginAttempt(
    email: string,
    success: boolean,
    details: Record<string, any> = {}
  ): void {
    const level = success ? 'info' : 'warning'
    const action = success ? 'login_success' : 'login_failed'
    
    this.logSecurityEvent(
      level,
      'authentication',
      action,
      {
        email,
        success,
        ...details
      },
      undefined,
      email
    )

    // Vérifier les tentatives multiples
    if (!success) {
      this.checkMultipleFailedAttempts(email)
    }
  }

  // Enregistrer une action admin
  static logAdminAction(
    adminId: string,
    adminEmail: string,
    action: string,
    details: Record<string, any> = {}
  ): void {
    this.logSecurityEvent(
      'info',
      'admin',
      action,
      {
        adminId,
        adminEmail,
        ...details
      },
      adminId,
      adminEmail
    )
  }

  // Enregistrer un accès aux données
  static logDataAccess(
    userId: string,
    userEmail: string,
    dataType: string,
    action: 'read' | 'write' | 'delete' | 'export' | 'import',
    details: Record<string, any> = {}
  ): void {
    this.logSecurityEvent(
      'info',
      'data_access',
      `data_${action}`,
      {
        dataType,
        action,
        ...details
      },
      userId,
      userEmail
    )
  }

  // Enregistrer une erreur système
  static logSystemError(
    error: Error,
    context: string,
    details: Record<string, any> = {}
  ): void {
    this.logSecurityEvent(
      'error',
      'system',
      'system_error',
      {
        error: error.message,
        stack: error.stack,
        context,
        ...details
      }
    )
  }

  // Créer une alerte de sécurité
  static createAlert(
    severity: SecurityAlert['severity'],
    type: SecurityAlert['type'],
    title: string,
    description: string,
    affectedUsers: string[] = [],
    riskScore: number = 50
  ): void {
    const alert: SecurityAlert = {
      id: this.generateId(),
      timestamp: new Date(),
      severity,
      type,
      title,
      description,
      affectedUsers,
      riskScore,
      acknowledged: false,
      resolved: false
    }

    const alerts = this.getAlerts()
    alerts.unshift(alert)

    // Limiter le nombre d'alertes
    if (alerts.length > this.MAX_ALERTS) {
      alerts.splice(this.MAX_ALERTS)
    }

    this.saveAlerts(alerts)

    // Notification en temps réel (si supporté)
    this.notifyAlert(alert)
  }

  // Récupérer les logs de sécurité
  static getLogs(limit: number = 100, category?: string): SecurityLog[] {
    let logs = this.getStoredLogs()
    
    if (category) {
      logs = logs.filter(log => log.category === category)
    }
    
    return logs.slice(0, limit)
  }

  // Récupérer les alertes actives
  static getActiveAlerts(): SecurityAlert[] {
    return this.getAlerts().filter(alert => !alert.resolved)
  }

  // Récupérer les statistiques de sécurité
  static getSecurityStats(): SecurityStats {
    const stats = this.getStoredStats()
    if (!stats) {
      return this.generateEmptyStats()
    }
    return stats
  }

  // Rechercher des patterns suspects
  static detectSuspiciousActivity(): SecurityAlert[] {
    const logs = this.getLogs(1000)
    const alerts: SecurityAlert[] = []

    // Détecter les tentatives de connexion multiples
    const failedLogins = logs.filter(log => 
      log.category === 'authentication' && 
      log.action === 'login_failed'
    )

    const loginAttemptsByIP = new Map<string, number>()
    const loginAttemptsByEmail = new Map<string, number>()

    failedLogins.forEach(log => {
      const ip = log.ipAddress || 'unknown'
      const email = log.userEmail || 'unknown'
      
      loginAttemptsByIP.set(ip, (loginAttemptsByIP.get(ip) || 0) + 1)
      loginAttemptsByEmail.set(email, (loginAttemptsByEmail.get(email) || 0) + 1)
    })

    // Alerte pour IP suspecte
    loginAttemptsByIP.forEach((count, ip) => {
      if (count >= 10) {
        alerts.push({
          id: this.generateId(),
          timestamp: new Date(),
          severity: 'high',
          type: 'suspicious_login',
          title: 'Tentatives de connexion multiples depuis une IP',
          description: `${count} tentatives de connexion échouées depuis l'IP ${ip}`,
          affectedUsers: [],
          riskScore: Math.min(count * 5, 100),
          acknowledged: false,
          resolved: false
        })
      }
    })

    // Alerte pour email suspect
    loginAttemptsByEmail.forEach((count, email) => {
      if (count >= 5) {
        alerts.push({
          id: this.generateId(),
          timestamp: new Date(),
          severity: 'medium',
          type: 'suspicious_login',
          title: 'Tentatives de connexion multiples pour un email',
          description: `${count} tentatives de connexion échouées pour ${email}`,
          affectedUsers: [email],
          riskScore: Math.min(count * 10, 100),
          acknowledged: false,
          resolved: false
        })
      }
    })

    return alerts
  }

  // Calculer le score de risque
  private static calculateRiskScore(
    level: SecurityLog['level'],
    category: SecurityLog['category'],
    action: string,
    details: Record<string, any>
  ): number {
    let score = 0

    // Score basé sur le niveau
    switch (level) {
      case 'info': score += 10; break
      case 'warning': score += 30; break
      case 'error': score += 50; break
      case 'critical': score += 80; break
    }

    // Score basé sur la catégorie
    switch (category) {
      case 'authentication': score += 20; break
      case 'authorization': score += 30; break
      case 'data_access': score += 15; break
      case 'admin': score += 25; break
      case 'system': score += 10; break
      case 'user': score += 5; break
    }

    // Score basé sur l'action
    if (action.includes('failed') || action.includes('error')) {
      score += 20
    }
    if (action.includes('delete') || action.includes('export')) {
      score += 15
    }
    if (action.includes('admin') || action.includes('sensitive')) {
      score += 25
    }

    return Math.min(score, 100)
  }

  // Vérifier si une alerte est nécessaire
  private static checkForAlerts(log: SecurityLog): void {
    // Alerte pour score de risque élevé
    if (log.riskScore >= 80) {
      this.createAlert(
        'critical',
        'system_error',
        'Activité à haut risque détectée',
        `Action: ${log.action}, Score: ${log.riskScore}`,
        log.userEmail ? [log.userEmail] : [],
        log.riskScore
      )
    }

    // Alerte pour erreurs critiques
    if (log.level === 'critical') {
      this.createAlert(
        'critical',
        'system_error',
        'Erreur critique détectée',
        `Erreur: ${log.action}`,
        log.userEmail ? [log.userEmail] : [],
        90
      )
    }
  }

  // Vérifier les tentatives multiples échouées
  private static checkMultipleFailedAttempts(email: string): void {
    const recentLogs = this.getLogs(50, 'authentication')
    const failedAttempts = recentLogs.filter(log => 
      log.userEmail === email && 
      log.action === 'login_failed' &&
      Date.now() - log.timestamp.getTime() < 15 * 60 * 1000 // 15 minutes
    )

    if (failedAttempts.length >= 5) {
      this.createAlert(
        'high',
        'multiple_failures',
        'Tentatives de connexion multiples échouées',
        `${failedAttempts.length} tentatives échouées pour ${email} dans les 15 dernières minutes`,
        [email],
        75
      )
    }
  }

  // Notifier une alerte
  private static notifyAlert(alert: SecurityAlert): void {
    // Notification browser si supportée
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🚨 Alerte de sécurité: ${alert.title}`, {
          body: alert.description,
          icon: '/icons/icon-192x192.svg'
        })
      }
    }

    // Log dans la console
    logger.warn(`🚨 ALERTE SÉCURITÉ [${alert.severity.toUpperCase()}]: ${alert.title}`)
  }

  // Nettoyer les anciens logs
  private static cleanupOldLogs(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS)

    const logs = this.getLogs()
    const filteredLogs = logs.filter(log => log.timestamp > cutoffDate)
    
    if (filteredLogs.length !== logs.length) {
      this.saveLogs(filteredLogs)
      logger.info(`Nettoyage des logs: ${logs.length - filteredLogs.length} anciens logs supprimés`)
    }
  }

  // Mettre à jour les statistiques
  private static updateStats(): void {
    const logs = this.getLogs()
    const alerts = this.getAlerts()
    
    const stats: SecurityStats = {
      totalLogs: logs.length,
      criticalLogs: logs.filter(log => log.level === 'critical').length,
      highRiskLogs: logs.filter(log => log.riskScore >= 70).length,
      activeAlerts: alerts.filter(alert => !alert.resolved).length,
      resolvedAlerts: alerts.filter(alert => alert.resolved).length,
      topThreats: this.calculateTopThreats(logs),
      riskTrend: this.calculateRiskTrend(logs)
    }

    this.saveStats(stats)
  }

  // Calculer les principales menaces
  private static calculateTopThreats(logs: SecurityLog[]): Array<{ category: string; count: number }> {
    const threats = new Map<string, number>()
    
    logs.forEach(log => {
      if (log.riskScore >= 50) {
        threats.set(log.category, (threats.get(log.category) || 0) + 1)
      }
    })

    return Array.from(threats.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  // Calculer la tendance des risques
  private static calculateRiskTrend(logs: SecurityLog[]): Array<{ date: string; riskScore: number }> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    return last7Days.map(date => {
      const dayLogs = logs.filter(log => 
        log.timestamp.toISOString().split('T')[0] === date
      )
      
      const avgRisk = dayLogs.length > 0 
        ? dayLogs.reduce((sum, log) => sum + log.riskScore, 0) / dayLogs.length
        : 0

      return { date, riskScore: Math.round(avgRisk) }
    })
  }

  // Méthodes utilitaires
  private static generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static getClientIP(): string {
    // En production, récupérer l'IP réelle
    return typeof window !== 'undefined' ? 'client_ip' : 'server_ip'
  }

  private static getUserAgent(): string {
    return typeof window !== 'undefined' ? navigator.userAgent : 'server'
  }

  private static sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details }
    
    // Supprimer les données sensibles
    delete sanitized.password
    delete sanitized.token
    delete sanitized.secret
    
    return sanitized
  }

  private static generateEmptyStats(): SecurityStats {
    return {
      totalLogs: 0,
      criticalLogs: 0,
      highRiskLogs: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      topThreats: [],
      riskTrend: []
    }
  }

  // Méthodes de stockage
  private static getStoredLogs(): SecurityLog[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []
    
    try {
      const logs = JSON.parse(stored)
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))
    } catch {
      return []
    }
  }

  private static saveLogs(logs: SecurityLog[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs))
  }

  private static getAlerts(): SecurityAlert[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(this.ALERTS_KEY)
    if (!stored) return []
    
    try {
      const alerts = JSON.parse(stored)
      return alerts.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
        acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
        resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
      }))
    } catch {
      return []
    }
  }

  private static saveAlerts(alerts: SecurityAlert[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts))
  }

  private static getStoredStats(): SecurityStats | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem(this.STATS_KEY)
    if (!stored) return null
    
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  private static saveStats(stats: SecurityStats): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats))
  }
}

// Export du service
export const securityLogger = SecurityLogger

// Export des utilitaires
export const {
  logSecurityEvent,
  logLoginAttempt,
  logAdminAction,
  logDataAccess,
  logSystemError,
  createAlert,
  getLogs,
  getActiveAlerts,
  getSecurityStats,
  detectSuspiciousActivity
} = SecurityLogger
