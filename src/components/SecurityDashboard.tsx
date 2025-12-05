'use client'

import React, { useState, useEffect } from 'react'
import { securityLogger, SecurityLog, SecurityAlert, SecurityStats } from '@/lib/security-logger'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

interface SecurityDashboardProps {
  className?: string
}

export default function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([])
  const [activeAlerts, setActiveAlerts] = useState<SecurityAlert[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSecurityData()
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
  }, [selectedCategory])

  const loadSecurityData = () => {
    try {
      // Initialiser le logger de sécurité
      securityLogger.initialize()
      
      // Charger les statistiques
      const securityStats = securityLogger.getSecurityStats()
      setStats(securityStats)
      
      // Charger les logs récents
      const logs = securityLogger.getLogs(50, selectedCategory === 'all' ? undefined : selectedCategory)
      setRecentLogs(logs)
      
      // Charger les alertes actives
      const alerts = securityLogger.getActiveAlerts()
      setActiveAlerts(alerts)
      
      setIsLoading(false)
    } catch (error) {
      logger.error('Erreur lors du chargement des données de sécurité', error as Error)
      setIsLoading(false)
    }
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'text-red-500'
    if (riskScore >= 60) return 'text-orange-500'
    if (riskScore >= 40) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-900 text-red-200 border-red-700'
      case 'error': return 'bg-orange-900 text-orange-200 border-orange-700'
      case 'warning': return 'bg-yellow-900 text-yellow-200 border-yellow-700'
      case 'info': return 'bg-blue-900 text-blue-200 border-blue-700'
      default: return 'bg-gray-900 text-gray-200 border-gray-700'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp)
  }

  if (isLoading) {
    return (
      <div className={`bg-dark-200 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-200 rounded-lg p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShieldCheckIcon className="w-8 h-8 text-primary-500" />
          <h2 className="text-2xl font-bold text-white">Tableau de Bord de Sécurité</h2>
        </div>
        <button
          onClick={loadSecurityData}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Statistiques principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-gray-400 text-sm">Total des Logs</p>
                <p className="text-2xl font-bold text-white">{stats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-gray-400 text-sm">Logs Critiques</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalLogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ExclamationCircleIcon className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-gray-400 text-sm">Alertes Actives</p>
                <p className="text-2xl font-bold text-orange-500">{stats.activeAlerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-100 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <EyeIcon className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-gray-400 text-sm">Risque Élevé</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.highRiskLogs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-100 text-gray-400 hover:bg-dark-300'
            }`}
          >
            Tous
          </button>
          {['authentication', 'authorization', 'data_access', 'admin', 'system', 'user'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 text-gray-400 hover:bg-dark-300'
              }`}
            >
              {category.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs récents */}
        <div className="bg-dark-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ClockIcon className="w-5 h-5 mr-2" />
            Logs Récents
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Aucun log trouvé</p>
            ) : (
              recentLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{log.action.replace('_', ' ')}</span>
                    <span className={`text-sm font-bold ${getRiskColor(log.riskScore)}`}>
                      {log.riskScore}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mb-1">
                    <span className="capitalize">{log.category}</span>
                    {log.userEmail && (
                      <span className="ml-2 text-gray-400">• {log.userEmail}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTimestamp(log.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertes actives */}
        <div className="bg-dark-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            Alertes Actives
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Aucune alerte active</p>
            ) : (
              activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-dark-200 border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white">{alert.title}</h4>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`}
                      ></div>
                      <span className="text-sm text-gray-400 capitalize">
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatTimestamp(alert.timestamp)}</span>
                    <span className="font-bold">Score: {alert.riskScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Principales menaces */}
      {stats && stats.topThreats.length > 0 && (
        <div className="mt-6 bg-dark-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Principales Menaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topThreats.map((threat, index) => (
              <div key={index} className="bg-dark-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium capitalize">
                    {threat.category.replace('_', ' ')}
                  </span>
                  <span className="text-primary-500 font-bold">{threat.count}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${(threat.count / Math.max(...stats.topThreats.map(t => t.count))) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
