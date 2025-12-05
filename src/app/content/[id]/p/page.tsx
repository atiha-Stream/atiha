'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Movie, Series } from '@/types/content'
import { ContentService } from '@/lib/content-service'
import { CalendarIcon, ClockIcon, StarIcon, UserGroupIcon, FilmIcon, PlayIcon } from '@heroicons/react/24/outline'
import { ReviewsService, ReviewStats } from '@/lib/reviews-service'
import { HomepageContentService } from '@/lib/homepage-content-service'
import Link from 'next/link'
import Image from 'next/image'
import ContentShareHero from '@/components/ContentShareHero'
import RecentContentCarousel from '@/components/RecentContentCarousel'
import { logger } from '@/lib/logger'

export default function ContentSharePage() {
  const params = useParams()
  const contentId = params.id as string
  const [content, setContent] = useState<Movie | Series | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ 
    averageRating: 0, 
    totalReviews: 0, 
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } 
  })

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setHomepageContent(loadedContent)

    // Écouter les changements du contenu de la page d'accueil
    const handleContentUpdate = () => {
      const updatedContent = HomepageContentService.getContent()
      setHomepageContent(updatedContent)
    }

    window.addEventListener('homepageContentUpdated', handleContentUpdate)
    
    return () => {
      window.removeEventListener('homepageContentUpdated', handleContentUpdate)
    }
  }, [])

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        
        // Essayer de charger comme un film d'abord
        const movie = await ContentService.getMovieById(contentId)
        if (movie) {
          setContent(movie)
          const stats = ReviewsService.getReviewStats(contentId)
          setReviewStats(stats)
        } else {
          // Si ce n'est pas un film, essayer comme une série
          const series = await ContentService.getSeriesById(contentId)
          if (series) {
            setContent(series)
            const stats = ReviewsService.getReviewStats(contentId)
            setReviewStats(stats)
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

  // Mettre à jour les meta tags Open Graph
  useEffect(() => {
    if (!content) return

    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/content/${contentId}/p`
      : `/content/${contentId}/p`

    // Mettre à jour le titre
    const appName = isClient ? homepageContent.appIdentity.name : 'Atiha'
    document.title = `${content.title} - ${appName}`

    // Meta tags Open Graph
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Meta tags Twitter
    const updateTwitterTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Open Graph
    updateMetaTag('og:title', content.title)
    updateMetaTag('og:description', content.description)
    updateMetaTag('og:image', content.posterUrl || '')
    updateMetaTag('og:url', shareUrl)
    updateMetaTag('og:type', 'video.movie')
    updateMetaTag('og:site_name', appName)

    // Twitter Card
    updateTwitterTag('twitter:card', 'summary_large_image')
    updateTwitterTag('twitter:title', content.title)
    updateTwitterTag('twitter:description', content.description)
    updateTwitterTag('twitter:image', content.posterUrl || '')

    // Meta description standard
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', content.description)
  }, [content, contentId, isClient, homepageContent])

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getTrailerUrl = (): string | null => {
    if (!content) return null
    return content.trailerUrl || null
  }

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mx-auto mb-4 sm:mb-5"></div>
          <p className="text-white text-base sm:text-lg md:text-xl">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-center p-4 sm:p-5 md:p-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-5">Contenu non trouvé</h1>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 sm:space-x-2.5 text-blue-400 hover:text-blue-300 transition-colors text-base sm:text-lg md:text-xl min-h-[44px]"
          >
            <span>←</span>
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </div>
    )
  }

  const isMovie = 'videoUrl' in content
  const trailerUrl = getTrailerUrl()
  const youtubeId = trailerUrl ? extractYouTubeId(trailerUrl) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
      {/* Header minimal */}
      <header className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {isClient ? homepageContent.appIdentity.name : 'Atiha'}
          </Link>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors text-base sm:text-lg md:text-xl min-h-[44px] flex items-center"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 text-white rounded-lg transition-colors text-base sm:text-lg md:text-xl font-medium min-h-[44px] sm:min-h-[48px] flex items-center justify-center"
              style={isClient ? { 
                backgroundColor: homepageContent.appIdentity.colors.primary,
                '--hover-color': homepageContent.appIdentity.colors.secondary
              } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
              onMouseEnter={(e) => {
                if (isClient) {
                  e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.secondary
                }
              }}
              onMouseLeave={(e) => {
                if (isClient) {
                  e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.primary
                }
              }}
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      <main className="pb-6 sm:pb-8 md:pb-10">
        {/* Hero Section avec bande d'annonce - Pleine largeur */}
        {(!isClient || (homepageContent.sharePage?.showFilmTrailer ?? true)) && (
          <ContentShareHero 
            content={content}
            youtubeId={youtubeId}
            reviewStats={reviewStats}
          />
        )}

        {/* Section Affiche + Fiche technique */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {(!isClient || (homepageContent.sharePage?.showFilmDetails ?? true) || (homepageContent.sharePage?.showFilmImage ?? true)) && (
        <section className="mt-6 sm:mt-8 md:mt-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Affiche - Taille réelle à gauche */}
          {(!isClient || (homepageContent.sharePage?.showFilmImage ?? true)) && (
          <div className="flex-shrink-0 w-full md:w-auto">
            <div className="relative w-full max-w-[300px] mx-auto md:mx-0 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={content.posterUrl || '/placeholder-poster.jpg'}
                alt={`Affiche de ${content.title}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>
          </div>
          )}

          {/* Fiche technique - À droite */}
          {(!isClient || (homepageContent.sharePage?.showFilmDetails ?? true)) && (
          <div className="flex-1 bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700 min-h-[450px] md:h-[450px] flex flex-col overflow-y-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">{content.title}</h1>
            
            {/* Informations principales */}
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 sm:gap-y-2.5 text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
              <span className="flex items-center space-x-1.5 sm:space-x-2">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{content.year}</span>
              </span>
              <span className="flex items-center space-x-1.5 sm:space-x-2">
                <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                <span>
                  {reviewStats.averageRating > 0 
                    ? `${reviewStats.averageRating.toFixed(1)} (${reviewStats.totalReviews} avis)` 
                    : 'N/A'
                  }
                </span>
              </span>
              {isMovie && 'duration' in content && content.duration > 0 && (
                <span className="flex items-center space-x-1.5 sm:space-x-2">
                  <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>{formatDuration(content.duration)}</span>
                </span>
              )}
              <span className="flex items-center space-x-1.5 sm:space-x-2">
                <FilmIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{Array.isArray(content.genre) ? content.genre.join(', ') : content.genre}</span>
              </span>
            </div>

            {/* Description */}
            <div className="mb-3 sm:mb-4">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed line-clamp-4">{content.description}</p>
            </div>

            {/* Informations détaillées */}
            <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
              <div>
                <h3 className="text-white font-semibold mb-2 sm:mb-2.5 text-base sm:text-lg flex items-center space-x-2 sm:space-x-2.5">
                  <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Réalisateur</span>
                </h3>
                <p className="text-gray-400 text-base sm:text-lg">{content.director}</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2 sm:mb-2.5 text-base sm:text-lg flex items-center space-x-2 sm:space-x-2.5">
                  <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Acteurs</span>
                </h3>
                <p className="text-gray-400 text-base sm:text-lg line-clamp-2">
                  {Array.isArray(content.cast) ? content.cast.join(', ') : content.cast}
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-auto pt-4 sm:pt-5 md:pt-6 border-t border-gray-700">
              {isClient && homepageContent.sharePage?.watchNowButton?.text ? (
                <Link
                  href={homepageContent.sharePage.watchNowButton.link || '/register'}
                  className="inline-flex items-center justify-center space-x-2 sm:space-x-2.5 w-full px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 text-white rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-colors shadow-lg min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                  style={{ 
                    backgroundColor: homepageContent.appIdentity.colors.primary,
                    '--hover-color': homepageContent.appIdentity.colors.secondary
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.secondary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = homepageContent.appIdentity.colors.primary
                  }}
                >
                  <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  <span>{homepageContent.sharePage.watchNowButton.text}</span>
                </Link>
              ) : !isClient ? (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center space-x-2 sm:space-x-2.5 w-full px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 text-white rounded-lg font-semibold text-base sm:text-lg md:text-xl transition-colors shadow-lg min-h-[44px] sm:min-h-[48px] md:min-h-[52px]"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  <span>Regarder maintenant</span>
                </Link>
              ) : null}
              <p className="text-center text-gray-400 text-base sm:text-lg mt-3 sm:mt-4">
                Inscrivez-vous gratuitement pour accéder à ce contenu
              </p>
            </div>
          </div>
          )}
        </section>
        )}

        {/* Liste des contenus récents */}
        {isClient && (homepageContent.sharePage?.showRecentContent ?? true) && (
          <section className="mt-12 sm:mt-14 md:mt-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-5 md:mb-6">Ajoutés récemment</h2>
            <RecentContentCarousel excludeId={contentId} />
          </section>
        )}

        {/* Call to Action final */}
        {isClient && (homepageContent.sharePage?.showFinalCTA ?? true) && (
        <section className="mt-12 sm:mt-14 md:mt-16 mb-8 sm:mb-10 md:mb-12">
          <div 
            className="rounded-2xl p-6 sm:p-8 md:p-12 text-center"
            style={isClient ? {
              background: `linear-gradient(to right, ${homepageContent.appIdentity.colors.primary}, ${homepageContent.appIdentity.colors.secondary})`
            } : {
              background: 'linear-gradient(to right, #3B82F6, #1E40AF)'
            }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6">
              {isClient && homepageContent.sharePage?.title 
                ? homepageContent.sharePage.title.replace('{appName}', homepageContent.appIdentity.name)
                : `Rejoignez ${isClient ? homepageContent.appIdentity.name : 'Atiha'} dès aujourd'hui`
              }
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-100 mb-6 sm:mb-7 md:mb-8 max-w-2xl mx-auto">
              {isClient && homepageContent.sharePage?.description 
                ? homepageContent.sharePage.description
                : 'Accédez à des milliers de films et séries en streaming haute qualité'
              }
            </p>

            {/* Partenaires de Paiement */}
            {isClient && homepageContent.sharePage?.paymentPartners?.isVisible && 
             homepageContent.sharePage.paymentPartners.items && 
             homepageContent.sharePage.paymentPartners.items.filter(item => item.isVisible).length > 0 && (
              <div className="mb-6 sm:mb-7 md:mb-8">
                {homepageContent.sharePage.paymentPartners.title && (
                  <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-5">
                    {homepageContent.sharePage.paymentPartners.title}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 md:gap-6">
                  {homepageContent.sharePage.paymentPartners.items
                    .filter(item => item.isVisible && item.logoUrl)
                    .map((partner) => (
                      <img
                        key={partner.id}
                        src={partner.logoUrl}
                        alt="Logo partenaire de paiement"
                        className="h-8 sm:h-10 md:h-12 object-contain opacity-90 hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {isClient && homepageContent.sharePage?.primaryButton?.text ? (
                <Link
                  href={homepageContent.sharePage.primaryButton.link || '/register'}
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-white rounded-lg font-semibold text-base sm:text-lg md:text-xl hover:bg-gray-100 transition-colors shadow-lg text-center min-h-[44px] sm:min-h-[48px] md:min-h-[52px] flex items-center justify-center"
                  style={{
                    color: homepageContent.appIdentity.colors.primary
                  }}
                >
                  {homepageContent.sharePage.primaryButton.text}
                </Link>
              ) : !isClient ? (
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-white rounded-lg font-semibold text-base sm:text-lg md:text-xl hover:bg-gray-100 transition-colors shadow-lg text-center min-h-[44px] sm:min-h-[48px] md:min-h-[52px] flex items-center justify-center"
                  style={{ color: '#3B82F6' }}
                >
                  S&apos;inscrire gratuitement
                </Link>
              ) : null}
              {isClient && homepageContent.sharePage?.secondaryButton?.text ? (
                <Link
                  href={homepageContent.sharePage.secondaryButton.link || '/login'}
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg md:text-xl hover:bg-white/10 transition-colors text-center min-h-[44px] sm:min-h-[48px] md:min-h-[52px] flex items-center justify-center"
                >
                  {homepageContent.sharePage.secondaryButton.text}
                </Link>
              ) : !isClient ? (
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg md:text-xl hover:bg-white/10 transition-colors text-center min-h-[44px] sm:min-h-[48px] md:min-h-[52px] flex items-center justify-center"
                >
                  Se connecter
                </Link>
              ) : null}
              {isClient && homepageContent.sharePage?.subscriptionButton?.text && (
                <Link
                  href={homepageContent.sharePage.subscriptionButton.link || '/subscription'}
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-white/20 backdrop-blur-sm border-2 border-white text-white rounded-lg font-semibold text-base sm:text-lg md:text-xl hover:bg-white/30 transition-colors text-center min-h-[44px] sm:min-h-[48px] md:min-h-[52px] flex items-center justify-center"
                >
                  {homepageContent.sharePage.subscriptionButton.text}
                </Link>
              )}
            </div>
          </div>
        </section>
        )}
        </div>
      </main>
    </div>
  )
}

