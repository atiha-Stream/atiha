'use client'

import Link from 'next/link'
import { useAdminAuth } from '@/lib/admin-auth-context'
import { useAuth } from '@/lib/auth-context'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useState, useEffect } from 'react'
import { Movie, Series } from '@/types/content'
import { AdminContentService } from '@/lib/admin-content-service'
import { ActivityService, Activity } from '@/lib/activity-service'
import { userDatabase } from '@/lib/user-database'
import { premiumCodesService } from '@/lib/premium-codes-service'
import { 
  PlayIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon, 
  PlusIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  FilmIcon,
  TvIcon,
  ChartBarIcon,
  DocumentIcon,
  PencilIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import dynamic from 'next/dynamic'

// Lazy loading de la galerie de contenu admin (composant lourd)
const AdminContentGallery = dynamic(() => import('@/components/AdminContentGallery'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-400">Chargement de la galerie...</div>
    </div>
  )
})
import { HomepageContentService } from '@/lib/homepage-content-service'
import { RestrictedButton } from '@/components/RestrictedButton'
import { hasPermission } from '@/lib/admin-permissions'
import { AdminPermission } from '@/types/admin'
import { logger } from '@/lib/logger'

export default function AdminDashboardPage() {
  const { admin, logout } = useAdminAuth()
  const { getTotalUsers } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalAdmins, setTotalAdmins] = useState(0)
  const [totalPremiumCodes, setTotalPremiumCodes] = useState(0)
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [showActivities, setShowActivities] = useState(true)

  // Fonction helper pour vérifier si c'est leGenny (accès total)
  const isLeGenny = admin?.username === 'leGenny'

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Charger les activités récentes
    const activities = ActivityService.getRecentActivities(10)
    setRecentActivities(activities)
    
    // Ajouter une activité de connexion admin si c'est la première fois
    if (admin?.username) {
      ActivityService.logAdminActivity('success', `Admin connecté: ${admin.username}`, {
        userName: admin.username,
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        const [moviesData, seriesData] = await Promise.all([
          AdminContentService.getStoredMovies(),
          AdminContentService.getStoredSeries()
        ])
        
        setMovies(moviesData)
        setSeries(seriesData)
        
        // Charger le nombre d&apos;utilisateurs normaux (sans les admins)
        const normalUsers = userDatabase.getNormalUsers()
        setTotalUsers(normalUsers ? normalUsers.length : 0)
        
        // Charger le nombre d&apos;administrateurs
        const admins = userDatabase.getAllAdmins()
        setTotalAdmins(admins ? admins.length : 0)
        
        // Charger le nombre de codes premium
        const premiumCodes = premiumCodesService.getAllCodes()
        setTotalPremiumCodes(premiumCodes ? premiumCodes.length : 0)
        
        // Ajouter des activités de démonstration
        if (moviesData.length > 0) {
          ActivityService.logContentActivity('info', `${moviesData.length} films chargés dans le dashboard`)
        }
        if (seriesData.length > 0) {
          ActivityService.logContentActivity('info', `${seriesData.length} séries chargées dans le dashboard`)
        }
        if (getTotalUsers() > 0) {
          ActivityService.logUserActivity('info', `${getTotalUsers()} utilisateurs inscrits`)
        }
        
        // Recharger les activités pour affichage
        const updatedActivities = ActivityService.getRecentActivities(10)
        setRecentActivities(updatedActivities)
      } catch (error) {
        logger.error('Error loading content', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [getTotalUsers])

  // Fonction pour obtenir l'icône selon le type d'activité
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user': return <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      case 'content': return <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      case 'system': return <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      case 'security': return <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      case 'admin': return <PencilIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      default: return <DocumentIcon className="w-5 h-5 sm:w-6 sm:h-6" />
    }
  }

  // Fonction pour obtenir la couleur selon la gravité
  const getActivityColor = (severity: Activity['severity']) => {
    switch (severity) {
      case 'success': return 'text-green-400'
      case 'info': return 'text-blue-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  // Fonction pour obtenir la couleur du point
  const getActivityDotColor = (severity: Activity['severity']) => {
    switch (severity) {
      case 'success': return 'bg-green-500'
      case 'info': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Il y a quelques secondes'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    }
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-800">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <PlayIcon className="w-5 h-5 sm:w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'} Admin</span>
            </Link>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* User Menu */}
              <div className="flex items-center space-x-2 sm:space-x-3 bg-dark-200/50 rounded-lg px-2 sm:px-3 py-2 border border-gray-700">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#EF4444' }}
                  >
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-white font-semibold block leading-tight text-sm sm:text-base">{admin?.username}</span>
                    <span className="text-gray-400 text-xs sm:text-sm leading-tight">{admin?.username}</span>
                  </div>
                </div>
                <div className="h-6 sm:h-7 w-px bg-gray-600"></div>
                <button
                  onClick={logout}
                  className="flex items-center justify-center text-gray-400 hover:text-white transition-colors p-2 sm:p-2.5 rounded hover:bg-dark-300/50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
                Bienvenue, {admin?.username} ! 👋
              </h1>
              <p className="text-gray-400 text-base sm:text-lg">
                Gérez votre plateforme de streaming depuis ce tableau de bord
              </p>
            </div>

            {/* Quick Actions - Tous les boutons ensemble */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
              {/* Bouton 1: Ajouter du contenu */}
              {isLeGenny ? (
                <Link href="/admin/add-content" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Ajouter du contenu</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Films et séries</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/add-content"
                  requiredPermission="Ajouter du contenu"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Ajouter du contenu</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Films et séries</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 2: Import Excel/CSV */}
              {isLeGenny ? (
                <Link href="/admin/import" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DocumentArrowUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Import Excel/CSV</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Import en masse</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/import"
                  requiredPermission="Import Excel/CSV"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DocumentArrowUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Import Excel/CSV</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Import en masse</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 3: Éditeur de Page d'Accueil */}
              {isLeGenny ? (
                <Link href="/admin/homepage-editor" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PencilIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Éditeur de Page d&apos;Accueil</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Modifier le contenu</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/homepage-editor"
                  requiredPermission="Éditeur de Page d'Accueil"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PencilIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Éditeur de Page d&apos;Accueil</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Modifier le contenu</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 4: Abonnement Premium */}
              {isLeGenny ? (
                <button
                  onClick={() => window.location.href = '/admin/premium'}
                  className="group w-full"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Abonnement Premium</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Générer les codes premium</p>
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <RestrictedButton
                  onClick={() => window.location.href = '/admin/premium'}
                  requiredPermission="Abonnement Premium"
                  adminPermissions={admin?.permissions || []}
                  className="group w-full"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Abonnement Premium</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Générer les codes premium</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 5: Gestion des Utilisateurs */}
              {isLeGenny ? (
                <Link href="/admin/users" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Gestion des Utilisateurs</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Inscription, bannissement</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/users"
                  requiredPermission="Gestion des Utilisateurs"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Gestion des Utilisateurs</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Inscription, bannissement</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 6: Sécurité Admin */}
              {isLeGenny ? (
                <Link href="/admin/security" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Sécurité Admin</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Logs et verrouillage</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/security"
                  requiredPermission="Sécurité Admin"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Sécurité Admin</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Logs et verrouillage</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 7: Gestion des Données */}
              {isLeGenny ? (
                <Link href="/admin/data-management" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DocumentIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Gestion des Données</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Import, export, suppression</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/data-management"
                  requiredPermission="Gestion des Données"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DocumentIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Gestion des Données</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Import, export, suppression</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 8: Gestion des Erreurs */}
              {isLeGenny ? (
                <Link href="/admin/errors" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Gestion des Erreurs</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Logs et monitoring</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/errors"
                  requiredPermission="Gestion des Erreurs"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Gestion des Erreurs</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Logs et monitoring</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}

              {/* Bouton 9: Analytics */}
              {isLeGenny ? (
                <Link href="/admin/analytics" className="group">
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Analytics</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Statistiques et métriques</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <RestrictedButton
                  href="/admin/analytics"
                  requiredPermission="Analytics"
                  adminPermissions={admin?.permissions || []}
                  className="group"
                >
                  <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 group-hover:scale-105">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base sm:text-lg">Analytics</h3>
                        <p className="text-gray-400 text-sm sm:text-base">Statistiques et métriques</p>
                      </div>
                    </div>
                  </div>
                </RestrictedButton>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{movies.length}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Films</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TvIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{series.length}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Séries</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{totalUsers}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Utilisateurs</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{totalAdmins}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Admins</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl sm:text-2xl">{totalPremiumCodes}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Code Premium</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity - Toujours visible pour leGenny */}
            {(isLeGenny || hasPermission(admin?.permissions || [], 'Activité récente')) && (
              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3 sm:gap-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Activité récente</h2>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={() => setShowActivities(!showActivities)}
                      className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-dark-300/50 min-h-[44px] sm:min-h-0"
                      title={showActivities ? "Masquer les activités" : "Afficher les activités"}
                    >
                      {showActivities ? "👁️‍🗨️ Masquer" : "👁️ Afficher"}
                    </button>
                    <button
                      onClick={() => {
                        const activities = ActivityService.getRecentActivities(10)
                        setRecentActivities(activities)
                      }}
                      className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg hover:bg-dark-300/50 min-h-[44px] sm:min-h-0"
                      title="Actualiser"
                    >
                      🔄 Actualiser
                    </button>
                  </div>
                </div>
                
                {!showActivities ? (
                  <div className="text-center py-3 sm:py-4">
                    <div className="text-gray-400 text-base sm:text-lg">
                      👁️‍🗨️ Liste des activités masquée
                    </div>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 text-gray-400">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-base sm:text-lg">Aucune activité récente</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg hover:bg-dark-300/50 transition-colors">
                        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-2 ${getActivityDotColor(activity.severity)}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 sm:space-x-2.5 mb-1.5 sm:mb-2">
                            <div className={getActivityColor(activity.severity)}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <span className={`text-base sm:text-lg font-medium ${getActivityColor(activity.severity)}`}>
                              {activity.message}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-sm sm:text-base text-gray-400">
                            <span>{formatRelativeTime(activity.timestamp)}</span>
                            {activity.metadata?.userName && (
                              <span>• {activity.metadata.userName}</span>
                            )}
                            {activity.metadata?.ipAddress && (
                              <span>• {activity.metadata.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Gallery - Toujours visible pour leGenny */}
            {(isLeGenny || hasPermission(admin?.permissions || [], 'Galerie de contenu')) && (
              <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 mt-6 sm:mt-8">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">Galerie de contenu</h2>
                <AdminContentGallery />
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  )
}
