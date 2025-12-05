'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Movie, Series, WatchProgress } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import VideoPlayerSection from '@/components/VideoPlayerSection'
import ContentInfoSection from '@/components/ContentInfoSection'
import ReviewsSection from '@/components/ReviewsSection'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import VideoOrientationTest from '@/components/VideoOrientationTest'
import { logger } from '@/lib/logger'

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [content, setContent] = useState<Movie | Series | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [homepageContent, setHomepageContent] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  const contentId = params.id as string

  // Charger le contenu de la page d'accueil pour la couleur primaire
  useEffect(() => {
    const loadHomepageContent = async () => {
      try {
        const content = await HomepageContentService.getContent()
        setHomepageContent(content)
        setIsClient(true)
      } catch (error) {
        logger.error('Erreur lors du chargement du contenu', error as Error)
        setIsClient(true)
      }
    }
    loadHomepageContent()
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        
        // Essayer de charger comme un film d&apos;abord
        const movie = await ContentService.getMovieById(contentId)
        if (movie) {
          setContent(movie)
          // Charger le progrès de visionnage
          const progress = await ContentService.getWatchProgress(contentId)
          setWatchProgress(progress)
        } else {
          // Si ce n&apos;est pas un film, essayer comme une série
          const series = await ContentService.getSeriesById(contentId)
          if (series) {
            setContent(series)
            // Pour les séries, on charge le progrès du premier épisode par défaut
            if (series.seasons.length > 0 && series.seasons[0].episodes.length > 0) {
              const firstEpisode = series.seasons[0].episodes[0]
              setSelectedEpisode(firstEpisode.id)
              const progress = await ContentService.getWatchProgress(contentId, firstEpisode.id)
              setWatchProgress(progress)
            }
          }
        }
      } catch (error) {
        logger.error('Error loading content', error as Error)
      } finally {
        setIsLoading(false)
      }
    }

    if (contentId) {
      loadContent()
    }
  }, [contentId])

  const handleProgressUpdate = (progress: WatchProgress) => {
    setWatchProgress(progress)
  }

  const handleEpisodeSelect = async (episodeId: string) => {
    setSelectedEpisode(episodeId)
    const progress = await ContentService.getWatchProgress(contentId, episodeId)
    setWatchProgress(progress)
  }

  // Raccourcis clavier
  useKeyboardShortcuts({
    onPlayPause: () => {
      logger.debug('Play/Pause')
    },
    onNextEpisode: () => {
      if (content && !('videoUrl' in content) && content.seasons.length > 0) {
        const allEpisodes = content.seasons.flatMap(s => s.episodes)
        const currentIndex = allEpisodes.findIndex(ep => ep.id === selectedEpisode)
        if (currentIndex < allEpisodes.length - 1) {
          handleEpisodeSelect(allEpisodes[currentIndex + 1].id)
        }
      }
    },
    onPreviousEpisode: () => {
      if (content && !('videoUrl' in content) && content.seasons.length > 0) {
        const allEpisodes = content.seasons.flatMap(s => s.episodes)
        const currentIndex = allEpisodes.findIndex(ep => ep.id === selectedEpisode)
        if (currentIndex > 0) {
          handleEpisodeSelect(allEpisodes[currentIndex - 1].id)
        }
      }
    },
    onToggleFullscreen: () => {
      logger.debug('Toggle Fullscreen')
    },
    onToggleMute: () => {
      logger.debug('Toggle Mute')
    }
  })

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement...</p>
          </div>
        </div>
      ) : !content ? (
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Contenu non trouvé</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      ) : (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={isClient ? { 
              backgroundColor: homepageContent?.appIdentity?.colors?.primary || '#3B82F6',
              color: 'white'
            } : { 
              backgroundColor: '#3B82F6',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              if (isClient) {
                e.currentTarget.style.backgroundColor = homepageContent?.appIdentity?.colors?.secondary || '#1E40AF'
              } else {
                e.currentTarget.style.backgroundColor = '#1E40AF'
              }
            }}
            onMouseLeave={(e) => {
              if (isClient) {
                e.currentTarget.style.backgroundColor = homepageContent?.appIdentity?.colors?.primary || '#3B82F6'
              } else {
                e.currentTarget.style.backgroundColor = '#3B82F6'
              }
            }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            title="Raccourcis clavier (?)"
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span>Raccourcis</span>
          </button>
        </div>
      </header>

      <main className="px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Partie 1: Lecteur vidéo */}
          <section>
            <VideoPlayerSection
              content={content}
              selectedEpisode={selectedEpisode || undefined}
              watchProgress={watchProgress}
              onProgressUpdate={handleProgressUpdate}
              onEpisodeSelect={handleEpisodeSelect}
            />
          </section>

          {/* Partie 2: Informations du contenu */}
          <section>
            <ContentInfoSection
              content={content}
            />
          </section>

          {/* Partie 3: Avis et commentaires */}
          <section>
            <ReviewsSection
              contentId={content.id}
              contentType={'videoUrl' in content ? 'movie' : 'series'}
              contentTitle={content.title}
            />
          </section>

        </div>
      </main>

      {/* Aide des raccourcis clavier */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
      
      {/* Composant de test d'orientation (temporaire pour les tests) */}
      <VideoOrientationTest />
    </div>
      )}
    </ProtectedRoute>
  )
}