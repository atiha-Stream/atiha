'use client'

import React, { useState, useEffect } from 'react'
import { Recommendation } from '@/types/user-profile'
import { UserProfileService } from '@/lib/user-profile-service'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { PosterImage } from '@/components/OptimizedImage'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { logger } from '@/lib/logger'
import { 
  ChartBarIcon, 
  EyeIcon, 
  SparklesIcon, 
  StarIcon, 
  ArrowPathIcon, 
  PlayIcon, 
  HeartIcon 
} from '@heroicons/react/24/outline'
interface RecommendationsProps {
  className?: string
}

export default function Recommendations({ className = '' }: RecommendationsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'collaborative' | 'content-based' | 'hybrid'>('all')

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    if (user) {
      loadRecommendations()
    }
  }, [user])

  const loadRecommendations = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const recs = await UserProfileService.getRecommendations(user.id, 20)
      setRecommendations(recs)
    } catch (error) {
      logger.error('Error loading recommendations', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWatchContent = (recommendation: Recommendation) => {
    router.push(`/watch/${recommendation.contentId}`)
  }

  const handleAddToWatchlist = async (recommendation: Recommendation) => {
    if (!user) return

    try {
      await UserProfileService.addToWatchlist(
        user.id,
        recommendation.contentId,
        recommendation.contentType,
        recommendation.title
      )
    } catch (error) {
      logger.error('Error adding to watchlist', error as Error)
    }
  }

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative':
        return <ChartBarIcon className="w-4 h-4 text-blue-400" />
      case 'content-based':
        return <EyeIcon className="w-4 h-4 text-green-400" />
      case 'hybrid':
        return <SparklesIcon className="w-4 h-4 text-purple-400" />
      default:
        return <StarIcon className="w-4 h-4 text-yellow-400" />
    }
  }

  const getAlgorithmLabel = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative':
        return 'Basé sur les utilisateurs similaires'
      case 'content-based':
        return 'Basé sur vos préférences'
      case 'hybrid':
        return 'Recommandation hybride'
      default:
        return 'Recommandation'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const filteredRecommendations = recommendations.filter(rec => 
    activeFilter === 'all' || rec.algorithm === activeFilter
  )

  if (isLoading) {
    return (
      <div className={`bg-dark-200 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-200 rounded-lg ${className}`}>
      {/* En-tête */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">Recommandations pour vous</h2>
          </div>
          
          <button
            onClick={loadRecommendations}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="text-sm">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'collaborative', label: 'Collaboratives' },
            { key: 'content-based', label: 'Basées sur le contenu' },
            { key: 'hybrid', label: 'Hybrides' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                activeFilter === filter.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des recommandations */}
      <div className="p-4">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Aucune recommandation</h3>
            <p className="text-gray-400 mb-4">
              Regardez plus de contenu pour recevoir des recommandations personnalisées
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Découvrir du contenu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="bg-dark-300 rounded-lg overflow-hidden hover:bg-dark-100 transition-colors">
                {/* Miniature */}
                <div className="relative">
                  <div className="w-full bg-gray-700 overflow-hidden">
                    {recommendation.posterUrl ? (
                      <PosterImage
                        src={recommendation.posterUrl}
                        alt={recommendation.title}
                        className="w-full h-auto object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center">
                        <PlayIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Badge de confiance */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-dark-900/80 ${getConfidenceColor(recommendation.confidence)}`}>
                      {recommendation.confidence}%
                    </span>
                  </div>

                  {/* Overlay avec bouton play */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleWatchContent(recommendation)}
                      className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors"
                      style={isClient ? { 
                        backgroundColor: content.appIdentity.colors.primary,
                        '--hover-color': content.appIdentity.colors.secondary
                      } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
                      onMouseEnter={(e) => {
                        if (isClient) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                        }
                      }}
                    >
                      <PlayIcon className="w-5 h-5" />
                      <span>Regarder</span>
                    </button>
                  </div>
                </div>

                {/* Informations */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">
                    {recommendation.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {recommendation.reason}
                  </p>

                  {/* Algorithme */}
                  <div className="flex items-center space-x-2 mb-3">
                    {getAlgorithmIcon(recommendation.algorithm)}
                    <span className="text-gray-400 text-xs">
                      {getAlgorithmLabel(recommendation.algorithm)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleWatchContent(recommendation)}
                      className="flex items-center space-x-1 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm transition-colors"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Regarder</span>
                    </button>
                    
                    <button
                      onClick={() => handleAddToWatchlist(recommendation)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-sm transition-colors"
                    >
                      <HeartIcon className="w-4 h-4" />
                      <span>À regarder</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistiques des recommandations */}
      {recommendations.length > 0 && (
        <div className="p-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{recommendations.length}</p>
              <p className="text-gray-400 text-sm">Recommandations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.round(recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length)}%
              </p>
              <p className="text-gray-400 text-sm">Confiance moyenne</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {recommendations.filter(rec => rec.algorithm === 'collaborative').length}
              </p>
              <p className="text-gray-400 text-sm">Collaboratives</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {recommendations.filter(rec => rec.algorithm === 'content-based').length}
              </p>
              <p className="text-gray-400 text-sm">Basées sur le contenu</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


