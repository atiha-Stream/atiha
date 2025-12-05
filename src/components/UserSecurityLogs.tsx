'use client'

import React, { useEffect, useState } from 'react'
import { securityLogger } from '@/lib/security-logger'
import type { SecurityLog } from '@/lib/security-logger'
import { logger } from '@/lib/logger'
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

interface UserSecurityLogsProps {
  className?: string
}

export default function UserSecurityLogs({ className = '' }: UserSecurityLogsProps) {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSecurityLogs()
  }, [])

  const loadSecurityLogs = () => {
    try {
      securityLogger.initialize()
      const allLogs = securityLogger.getLogs(100)
      // Filtrer uniquement les logs utilisateurs
      const userLogs = allLogs.filter((log) => isUserScopedLog(log))
      setLogs(userLogs)
      setIsLoading(false)
    } catch (error) {
      logger.error('Erreur chargement logs utilisateurs', error as Error)
      setIsLoading(false)
    }
  }

  const isUserScopedLog = (log: SecurityLog) => {
    if (log.category === 'user') return true
    if (log.category === 'authentication') {
      // Heuristique: on considère utilisateur si ce n&apos;est pas explicitement une action admin
      const action = (log.action || '').toLowerCase()
      const isAdminAction = action.includes('admin') || action.includes('admin_')
      return !isAdminAction
    }
    return false
  }

  const getActionIcon = (action: string, level: string) => {
    switch (action) {
      case 'login_success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'login_failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'login_attempt':
        return <KeyIcon className="w-5 h-5 text-blue-500" />
      case 'password_reset':
        return <ShieldCheckIcon className="w-5 h-5 text-purple-500" />
      default:
        if (level === 'critical' || level === 'error') {
          return <XCircleIcon className="w-5 h-5 text-red-500" />
        }
        if (level === 'warning') {
          return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
        }
        return <CheckCircleIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getActionColor = (action: string, level: string) => {
    if (action === 'login_success' || level === 'info') {
      return 'bg-green-900/30 text-green-400 border-green-700'
    }
    
    switch (action) {
      case 'login_failed':
      case 'critical':
      case 'error':
        return 'bg-red-900/30 text-red-400 border-red-700'
      case 'login_attempt':
        return 'bg-blue-900/30 text-blue-400 border-blue-700'
      case 'password_reset':
        return 'bg-purple-900/30 text-purple-400 border-purple-700'
      case 'warning':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-700'
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login_success':
        return 'Connexion réussie'
      case 'login_failed':
        return 'Connexion échouée'
      case 'login_attempt':
        return 'Tentative de connexion'
      case 'password_reset':
        return 'Réinitialisation mot de passe'
      default:
        return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getRecentLogs = () => logs.slice(0, 10)
  const getFailedLogs = () => logs.filter(log => log.level === 'error' || log.level === 'critical' || log.action === 'login_failed')
  const getSuccessLogs = () => logs.filter(log => log.action === 'login_success' || (log.level === 'info' && log.action?.includes('success')))

  const handleClearLogs = () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir vider tous les logs de sécurité utilisateurs ? Cette action est irréversible.')) {
      try {
        // Supprimer uniquement les logs utilisateurs
        const allLogs = securityLogger.getLogs()
        const adminLogs = allLogs.filter((log) => !isUserScopedLog(log))
        // Réinitialiser les logs avec uniquement les logs admin
        if (typeof window !== 'undefined') {
          localStorage.setItem('atiha_security_logs', JSON.stringify(adminLogs.map(log => ({
            ...log,
            timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp
          }))))
        }
        loadSecurityLogs()
        alert('✅ Logs de sécurité utilisateurs vidés avec succès')
      } catch (error) {
        logger.error('Erreur lors du vidage des logs', error as Error)
        alert('❌ Erreur lors du vidage des logs')
      }
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-8 ${className}`}>
        <div className="text-center py-8 text-gray-400">Chargement des logs...</div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Logs</p>
              <p className="text-white text-2xl font-bold">{logs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Connexions Réussies</p>
              <p className="text-white text-2xl font-bold">{getSuccessLogs().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <XCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Tentatives Échouées</p>
              <p className="text-white text-2xl font-bold">{getFailedLogs().length}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Logs Critiques</p>
              <p className="text-white text-2xl font-bold">
                {logs.filter(log => log.level === 'critical' || log.level === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={loadSecurityLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Vider les logs</span>
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-400 mb-2">ℹ️ Informations sur les Logs Utilisateurs</h3>
            <p className="text-gray-300 mb-3">
              <strong>Surveillance :</strong> Cette section affiche uniquement les logs de sécurité liés aux utilisateurs (connexions, authentification, accès aux données).
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <strong>Connexions :</strong> Toutes les tentatives de connexion utilisateur sont enregistrées</p>
              <p>• <strong>Actions suspectes :</strong> Les actions à risque sont automatiquement signalées</p>
              <p>• <strong>Conservation :</strong> Les logs sont conservés pour une période de 90 jours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Logs de Sécurité Récents</h3>
          <button
            onClick={handleClearLogs}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Vider les logs</span>
          </button>
        </div>
        
        {getRecentLogs().length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4" />
            <p>Aucun log de sécurité trouvé.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getRecentLogs().map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border ${getActionColor(log.action, log.level)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getActionIcon(log.action, log.level)}
                    <span className="font-medium">{getActionLabel(log.action)}</span>
                    {log.userEmail && (
                      <span className="text-sm opacity-75">par {log.userEmail}</span>
                    )}
                  </div>
                  <span className="text-sm opacity-75">{formatTimestamp(log.timestamp)}</span>
                </div>
                
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-sm opacity-90 ml-8">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </p>
                )}
                
                {(log.userAgent || log.ipAddress) && (
                  <p className="text-xs opacity-60 ml-8 mt-1">
                    {log.userAgent ? log.userAgent.split(' ')[0] : ''} • {log.ipAddress || 'IP non disponible'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
