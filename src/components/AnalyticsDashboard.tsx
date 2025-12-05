'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { AnalyticsService, SystemAnalytics, UserAnalytics, ContentAnalytics } from '@/lib/analytics-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { logger } from '@/lib/logger'
import { 
  ChartBarIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  UsersIcon, 
  FilmIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  TvIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
interface AnalyticsDashboardProps {
  className?: string
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalytics | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAnalytics = useCallback(() => {
    try {
      setIsLoading(true)
      
      const system = AnalyticsService.getSystemAnalytics()
      const user = AnalyticsService.getUserAnalytics()
      const content = AnalyticsService.getAllContentAnalytics()
      
      setSystemAnalytics(system)
      setUserAnalytics(user)
      setContentAnalytics(content)
    } catch (error) {
      logger.error('Error loading analytics', error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const handleExportAnalytics = () => {
    try {
      const data = AnalyticsService.exportAnalytics()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `atiha-analytics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Error exporting analytics', error as Error)
    }
  }

  const handleExportTemplate = () => {
    try {
      // Créer un template d'exemple avec des données de démonstration
      const templateData = {
        events: [
          {
            id: "event_1",
            type: "page_view",
            category: "catalogue",
            action: "view",
            label: "Notre collection",
            value: undefined,
            timestamp: new Date().toISOString(),
            userId: "user_1",
            sessionId: "session_1",
            metadata: {
              page: "/collection",
              referrer: "https://example.com",
              url: "http://localhost:3001/collection"
            },
            country: "France",
            device: "desktop",
            hour: 20,
            catalogue: "Notre collection"
          },
          {
            id: "event_2",
            type: "content_view",
            category: "content",
            action: "view",
            label: "Film Exemple",
            value: 120,
            timestamp: new Date().toISOString(),
            userId: "user_1",
            sessionId: "session_1",
            metadata: {
              contentId: "movie_1",
              contentType: "movie",
              title: "Film Exemple",
              watchTime: 120,
              userId: "user_1"
            },
            country: "France",
            device: "mobile",
            hour: 21,
            catalogue: "Films Populaires"
          }
        ],
        userAnalytics: {
          userId: "user_1",
          totalSessions: 5,
          totalWatchTime: 1800,
          totalPageViews: 25,
          totalSearches: 8,
          favoriteGenres: ["Action", "Drame"],
          favoriteContent: ["movie_1", "series_1"],
          averageSessionDuration: 360,
          lastActive: new Date().toISOString(),
          deviceInfo: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            platform: "Win32",
            language: "fr-FR"
          }
        },
        contentAnalytics: [
          {
            contentId: "movie_1",
            contentType: "movie",
            title: "Film Exemple",
            totalViews: 15,
            totalWatchTime: 1800,
            averageRating: 4.5,
            totalRatings: 10,
            completionRate: 0.85,
            popularityScore: 8.5,
            lastViewed: new Date().toISOString()
          },
          {
            contentId: "series_1",
            contentType: "series",
            title: "Série Exemple",
            totalViews: 12,
            totalWatchTime: 2400,
            averageRating: 4.2,
            totalRatings: 8,
            completionRate: 0.75,
            popularityScore: 7.8,
            lastViewed: new Date().toISOString()
          }
        ],
        systemAnalytics: {
          totalUsers: 1,
          totalContent: 2,
          totalSessions: 5,
          averageSessionDuration: 360,
          mostPopularContent: [],
          userEngagement: {
            totalUsers: 1,
            dailyActiveUsers: 1,
            weeklyActiveUsers: 1,
            monthlyActiveUsers: 1
          },
          popularContent: {
            popularCatalogues: [
              { catalogue: "Notre collection", views: 8 },
              { catalogue: "Films Populaires", views: 5 },
              { catalogue: "Séries Populaires", views: 3 }
            ],
            popularMovies: [],
            popularSeries: []
          },
          geographic: {
            countries: [
              { country: "France", users: 8, percentage: 80 },
              { country: "États-Unis", users: 2, percentage: 20 }
            ]
          },
          devices: {
            mobile: 5,
            tablet: 2,
            desktop: 3
          },
          peakHours: [
            { hour: 20, users: 3, percentage: 30 },
            { hour: 19, users: 2, percentage: 20 },
            { hour: 21, users: 2, percentage: 20 },
            { hour: 18, users: 1, percentage: 10 },
            { hour: 22, users: 1, percentage: 10 },
            { hour: 14, users: 1, percentage: 10 }
          ],
          performance: {
            averagePageLoadTime: 1.2,
            errorRate: 0.02,
            cacheHitRate: 0.85
          }
        },
        exportDate: new Date().toISOString(),
        template: true,
        description: `Template d'exemple pour les analytics ${typeof window !== 'undefined' ? (HomepageContentService.getContent().appIdentity.name || 'Atiha') : 'Atiha'} avec des données de démonstration`
      }

      const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `atiha-analytics-template-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Error exporting template', error as Error)
    }
  }

  const handleImportAnalytics = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        const data = JSON.parse(jsonData)
        
        // Vérifier si c'est un template
        if (data.template) {
          const confirmImport = confirm(
            '📋 Template détecté !\n\n' +
            'Ce fichier contient des données d\'exemple pour tester les analytics.\n' +
            'Voulez-vous importer ces données de démonstration ?\n\n' +
            '✅ Oui - Importer le template\n' +
            '❌ Non - Annuler'
          )
          
          if (!confirmImport) {
            event.target.value = ''
            return
          }
        }
        
        const result = AnalyticsService.importAnalytics(jsonData)
        
        if (result.success) {
          const message = data.template 
            ? '✅ Template d\'analytics importé avec succès !\n\nLes données de démonstration sont maintenant disponibles.'
            : '✅ Analytics importés avec succès !'
          alert(message)
          loadAnalytics() // Recharger les données
        } else {
          alert(`❌ Erreur lors de l&apos;import: ${result.message}`)
        }
      } catch (error) {
        alert('❌ Erreur lors de la lecture du fichier\n\nVérifiez que le fichier est un JSON valide.')
        logger.error('Error reading file', error as Error)
      }
    }
    
    reader.onerror = () => {
      alert('❌ Erreur lors de la lecture du fichier')
    }
    
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  // Mémoriser les fonctions de formatage
  const formatDuration = useCallback((minutes: number): string => {
    // Arrondir les minutes à l'entier le plus proche
    const roundedMinutes = Math.round(minutes)
    const hours = Math.floor(roundedMinutes / 60)
    const mins = roundedMinutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }, [])

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }, [])
  
  // Mémoriser les listes populaires pour éviter les recalculs
  const popularMovies = useMemo(() => {
    if (!systemAnalytics) return []
    return systemAnalytics.popularContent.popularMovies.slice(0, 10)
  }, [systemAnalytics])
  
  const popularSeries = useMemo(() => {
    if (!systemAnalytics) return []
    return systemAnalytics.popularContent.popularSeries.slice(0, 10)
  }, [systemAnalytics])

  if (isLoading) {
    return (
      <div className={`bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 sm:h-7 md:h-8 bg-gray-700 rounded w-1/3 mb-4 sm:mb-5"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 sm:h-24 md:h-28 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ChartBarIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Analytics</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleExportAnalytics}
            className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-base sm:text-lg min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            aria-label="Exporter les données analytics"
          >
            <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            <span>Exporter</span>
          </button>
          
          <button
            onClick={handleExportTemplate}
            className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-base sm:text-lg min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            aria-label="Télécharger le template d&apos;import analytics"
          >
            <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            <span>Template</span>
          </button>
          
          <label 
            className="flex items-center justify-center space-x-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer text-base sm:text-lg min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            aria-label="Importer des données analytics depuis un fichier JSON"
          >
            <ArrowUpTrayIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            <span>Importer</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportAnalytics}
              className="hidden"
              aria-label="Sélectionner un fichier JSON à importer"
            />
          </label>
        </div>
      </div>

      {/* Instructions d'utilisation */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 sm:p-5 md:p-6">
        <h3 className="text-blue-400 font-semibold mb-3 sm:mb-4 flex items-center space-x-2 sm:space-x-2.5 text-base sm:text-lg md:text-xl">
          <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Comment utiliser les Analytics</span>
        </h3>
        <div className="text-gray-300 text-sm sm:text-base space-y-2 sm:space-y-2.5">
          <p><strong>📊 Exporter :</strong> Télécharge vos données analytics actuelles au format JSON</p>
          <p><strong>📋 Template :</strong> Télécharge un fichier d&apos;exemple avec des données de démonstration</p>
          <p><strong>📥 Importer :</strong> Importe des données analytics depuis un fichier JSON</p>
          <p><strong>💡 Conseil :</strong> Utilisez le Template pour voir un exemple de données complètes</p>
        </div>
      </div>

      {/* Métriques système */}
      {systemAnalytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm sm:text-base">Utilisateurs</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{formatNumber(systemAnalytics.totalUsers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm sm:text-base">Contenu</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{formatNumber(systemAnalytics.totalContent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm sm:text-base">Utilisateurs en ligne</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{formatNumber(systemAnalytics.totalSessions)}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowTrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm sm:text-base">Durée moyenne</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{formatDuration(systemAnalytics.averageSessionDuration)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Utilisateur */}
      {systemAnalytics && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center space-x-2 sm:space-x-2.5 text-lg sm:text-xl md:text-2xl">
            <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <span>Engagement Utilisateur</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.userEngagement.totalUsers)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Total Utilisateurs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.userEngagement.dailyActiveUsers)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Utilisateurs actifs (24h)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.userEngagement.weeklyActiveUsers)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Utilisateurs actifs (7j)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.userEngagement.monthlyActiveUsers)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Utilisateurs actifs (30j)</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenu Populaire */}
      {systemAnalytics && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center space-x-2 sm:space-x-2.5 text-lg sm:text-xl md:text-2xl">
            <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            <span>Contenu Populaire</span>
          </h3>
          
          {/* Catalogues Populaires */}
          <div className="mb-5 sm:mb-6">
            <h4 className="text-white font-medium mb-3 sm:mb-4 text-base sm:text-lg">Catalogue Populaire</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {systemAnalytics.popularContent.popularCatalogues.slice(0, 6).map((catalogue, index) => (
                <div key={catalogue.catalogue} className="flex items-center justify-between p-3 sm:p-4 bg-dark-300 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 font-bold text-sm sm:text-base">#{index + 1}</span>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base truncate">{catalogue.catalogue}</span>
                  </div>
                  <span className="text-gray-400 text-sm sm:text-base ml-2 sm:ml-3 flex-shrink-0">{formatNumber(catalogue.views)} vues</span>
                </div>
              ))}
            </div>
          </div>

          {/* Films Populaires */}
          <div className="mb-5 sm:mb-6">
            <h4 className="text-white font-medium mb-3 sm:mb-4 flex items-center space-x-2 sm:space-x-2.5 text-base sm:text-lg">
              <FilmIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>Films Populaires (Top 10)</span>
            </h4>
            <div className="space-y-2 sm:space-y-2.5">
              {popularMovies.map((movie, index) => (
                <div key={movie.contentId} className="flex items-center justify-between p-3 sm:p-4 bg-dark-300 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-bold text-sm sm:text-base">#{index + 1}</span>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base truncate">{movie.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base ml-2 sm:ml-3 flex-shrink-0">
                    <span className="text-gray-400">{formatNumber(movie.totalViews)} vues</span>
                    {movie.totalWatchTime > 0 && (
                    <span className="text-gray-400">{formatDuration(movie.totalWatchTime)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Séries Populaires */}
          <div>
            <h4 className="text-white font-medium mb-3 sm:mb-4 flex items-center space-x-2 sm:space-x-2.5 text-base sm:text-lg">
              <TvIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <span>Séries Populaires (Top 10)</span>
            </h4>
            <div className="space-y-2 sm:space-y-2.5">
              {popularSeries.map((series, index) => (
                <div key={series.contentId} className="flex items-center justify-between p-3 sm:p-4 bg-dark-300 rounded-lg">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm sm:text-base">#{index + 1}</span>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base truncate">{series.title}</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4 text-sm sm:text-base ml-2 sm:ml-3 flex-shrink-0">
                    <span className="text-gray-400">{formatNumber(series.totalViews)} vues</span>
                    {series.totalWatchTime > 0 && (
                    <span className="text-gray-400">{formatDuration(series.totalWatchTime)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pays/Régions */}
      {systemAnalytics && systemAnalytics.geographic.countries.length > 0 && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center space-x-2 sm:space-x-2.5 text-lg sm:text-xl md:text-2xl">
            <GlobeAltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            <span>Pays/Régions</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {systemAnalytics.geographic.countries.slice(0, 9).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between p-3 sm:p-4 bg-dark-300 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500/20 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 font-bold text-sm sm:text-base">#{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base truncate">{country.country}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{formatNumber(country.users)} utilisateurs</p>
                  </div>
                </div>
                <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                  <p className="text-orange-400 font-bold text-sm sm:text-base">{country.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appareils */}
      {systemAnalytics && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center space-x-2 sm:space-x-2.5 text-lg sm:text-xl md:text-2xl">
            <ComputerDesktopIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <span>Appareils</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <DevicePhoneMobileIcon className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.devices.mobile)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Mobile</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ComputerDesktopIcon className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.devices.tablet)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Tablette</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ComputerDesktopIcon className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{formatNumber(systemAnalytics.devices.desktop)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Desktop</p>
            </div>
          </div>
        </div>
      )}

      {/* Heures de Pointe */}
      {systemAnalytics && systemAnalytics.peakHours.length > 0 && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 flex items-center space-x-2 sm:space-x-2.5 text-lg sm:text-xl md:text-2xl">
            <CalendarDaysIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
            <span>Heures de Pointe</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {systemAnalytics.peakHours.slice(0, 12).map((hour) => (
              <div key={hour.hour} className="text-center p-3 sm:p-4 bg-dark-300 rounded-lg">
                <p className="text-white font-bold text-base sm:text-lg md:text-xl">{hour.hour}h</p>
                <p className="text-gray-400 text-sm sm:text-base">{formatNumber(hour.users)}</p>
                <p className="text-pink-400 text-xs sm:text-sm">{hour.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics utilisateur détaillés */}
      {userAnalytics && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-2xl">Analytics Utilisateur Détaillés</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatDuration(userAnalytics.totalWatchTime)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Temps de visionnage</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(userAnalytics.totalPageViews)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Pages vues</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(userAnalytics.totalSearches)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Recherches</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{formatNumber(userAnalytics.totalSessions)}</p>
              <p className="text-gray-400 text-sm sm:text-base">Sessions</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {systemAnalytics && (
        <div className="bg-dark-200 rounded-lg p-4 sm:p-5 md:p-6">
          <h3 className="text-white font-semibold mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl md:text-2xl">Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{systemAnalytics.performance.averagePageLoadTime.toFixed(2)}s</p>
              <p className="text-gray-400 text-sm sm:text-base">Temps de chargement moyen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{(systemAnalytics.performance.errorRate * 100).toFixed(1)}%</p>
              <p className="text-gray-400 text-sm sm:text-base">Taux d&apos;erreur</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{(systemAnalytics.performance.cacheHitRate * 100).toFixed(1)}%</p>
              <p className="text-gray-400 text-sm sm:text-base">Taux de cache</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
