'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, PlayIcon, StarIcon, ChatBubbleLeftRightIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, ArrowDownTrayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { useEffect, useState } from 'react'
import PWAInstaller from '@/components/PWAInstaller'
import HeaderStatusIndicator from '@/components/HeaderStatusIndicator'
import GlobalFooter from '@/components/GlobalFooter'
import { useAuth } from '@/lib/auth-context'
import { ContentService } from '@/lib/content-service'
import OptimizedImage from '@/components/OptimizedImage'
import { ReviewsService } from '@/lib/reviews-service'
import { logger } from '@/lib/logger'

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(HomepageContentService.getSectionsOrder())
  const [sectionsVisibility, setSectionsVisibility] = useState(HomepageContentService.getSectionsVisibility())
  const [isClient, setIsClient] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [showSoundNotification, setShowSoundNotification] = useState(false)
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false)
  const [movies, setMovies] = useState<any[]>([])
  const [series, setSeries] = useState<any[]>([])
  const [collection, setCollection] = useState<any[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [isHeaderTransparent, setIsHeaderTransparent] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [videoFinished, setVideoFinished] = useState(false)

  // Fonction pour calculer le nombre de colonnes optimal
  const getGridCols = (itemCount: number) => {
    if (itemCount <= 6) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-6'
    if (itemCount <= 12) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    if (itemCount <= 18) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    if (itemCount <= 24) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    if (itemCount <= 30) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    if (itemCount <= 36) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    if (itemCount <= 42) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    if (itemCount <= 48) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6'
    return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6' // Maximum 6 colonnes
  }

  // Fonction pour obtenir le rating basé sur les avis
  const getContentRating = (contentId: string) => {
    const stats = ReviewsService.getReviewStats(contentId)
    return stats.averageRating || 0
  }

  // Rediriger les utilisateurs connectés vers le dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    const loadedSectionsOrder = HomepageContentService.getSectionsOrder()
    const loadedSectionsVisibility = HomepageContentService.getSectionsVisibility()
    
    
    setContent(loadedContent)
    setSectionsOrder(loadedSectionsOrder)
    setSectionsVisibility(loadedSectionsVisibility as any)
    
    // Écouter les changements de contenu de la homepage
    const handleContentUpdate = () => {
      const updatedContent = HomepageContentService.getContent()
      const updatedSectionsOrder = HomepageContentService.getSectionsOrder()
      const updatedSectionsVisibility = HomepageContentService.getSectionsVisibility()
      
      setContent(updatedContent)
      setSectionsOrder(updatedSectionsOrder)
      setSectionsVisibility(updatedSectionsVisibility as any)
    }
    
    window.addEventListener('homepageContentUpdated', handleContentUpdate)
    
    // Charger les données de contenu
    const loadContentData = async () => {
      try {
        const [moviesData, seriesData] = await Promise.all([
          ContentService.getMovies(),
          ContentService.getSeries()
        ])
        
        // Créer une collection mixte (alternance films/séries)
        const mixedCollection = []
        const maxItems = Math.max(moviesData.length, seriesData.length)
        for (let i = 0; i < maxItems; i++) {
          if (i < moviesData.length) mixedCollection.push(moviesData[i])
          if (i < seriesData.length) mixedCollection.push(seriesData[i])
        }
        
        setMovies(moviesData)
        setSeries(seriesData)
        setCollection(mixedCollection)
      } catch (error) {
        logger.error('Erreur lors du chargement du contenu', error as Error)
      }
    }

    loadContentData()
    
    return () => {
      window.removeEventListener('homepageContentUpdated', handleContentUpdate)
    }
  }, [])

  // Défilement automatique du slider
  useEffect(() => {
    const activeSlides = content.homepageSlider?.slides?.filter((slide: any) => slide.isActive) || []
    
    // Réinitialiser l'index si nécessaire
    if (currentSlideIndex >= activeSlides.length) {
      setCurrentSlideIndex(0)
    }
    
    if (activeSlides.length <= 1) {
      return // Pas besoin de défilement s'il n'y a qu'un slide ou moins
    }

    const autoplaySpeed = (content.homepageSlider?.autoplaySpeed || 5) * 1000 // Convertir en millisecondes
    
    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => {
        return (prevIndex + 1) % activeSlides.length
      })
    }, autoplaySpeed)

    return () => clearInterval(interval)
  }, [content.homepageSlider?.slides, content.homepageSlider?.autoplaySpeed, currentSlideIndex])

  // Gérer la transparence de l'en-tête quand le slider d'accueil est visible
  useEffect(() => {
    const hasHomepageSlider = !!(content.homepageSlider?.isVisible && 
                             content.homepageSlider?.slides && 
                             content.homepageSlider.slides.length > 0)
    setIsHeaderTransparent(hasHomepageSlider)
  }, [content.homepageSlider])

  // Fonctions pour le swipe du homepageSlider
  const nextHomepageSlide = () => {
    const activeSlides = content.homepageSlider?.slides?.filter((slide: any) => slide.isActive) || []
    if (activeSlides.length > 0) {
      setCurrentSlideIndex((prev) => 
        prev === activeSlides.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevHomepageSlide = () => {
    const activeSlides = content.homepageSlider?.slides?.filter((slide: any) => slide.isActive) || []
    if (activeSlides.length > 0) {
      setCurrentSlideIndex((prev) => 
        prev === 0 ? activeSlides.length - 1 : prev - 1
      )
    }
  }

  const goToHomepageSlide = (index: number) => {
    setCurrentSlideIndex(index)
  }

  // Fonctions pour le swipe touch
  const handleHomepageTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleHomepageTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleHomepageTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextHomepageSlide()
    } else if (isRightSwipe) {
      prevHomepageSlide()
    }
  }

  // Fonctions pour le drag avec la souris
  const handleHomepageMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(null)
    setTouchStart(e.clientX)
  }

  const handleHomepageMouseMove = (e: React.MouseEvent) => {
    if (touchStart !== null) {
      setTouchEnd(e.clientX)
    }
  }

  const handleHomepageMouseUp = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextHomepageSlide()
    } else if (isRightSwipe) {
      prevHomepageSlide()
    }
  }

  // Afficher la notification pour désactiver le son (son activé par défaut)
  useEffect(() => {
    if (isVideoPlaying && !isVideoMuted && content.media?.trailerUrl) {
      setShowSoundNotification(true)
    } else {
      setShowSoundNotification(false)
    }
  }, [isVideoPlaying, isVideoMuted, content.media?.trailerUrl])

  // Activer automatiquement le son pour les fichiers .mp4
  useEffect(() => {
    if (content.media?.videoUrl && content.media.videoUrl.toLowerCase().endsWith('.mp4')) {
      setIsVideoMuted(false) // Activer le son automatiquement
      setShowSoundNotification(false) // Masquer la notification
    }
  }, [content.media?.videoUrl])

  // Vérifier si l'autoplay a échoué (bloqué par le navigateur)
  useEffect(() => {
    const videoSource = content.media?.videoUrl || content.media?.trailerUrl
    if (!videoSource || videoFinished) return

    const checkAutoplay = () => {
      const videoElement = document.getElementById('media-video') as HTMLVideoElement | null
      if (videoElement && videoElement.tagName === 'VIDEO') {
        // Vérifier après un court délai si la vidéo joue vraiment
        setTimeout(() => {
          if (videoElement.paused && videoElement.readyState >= 2) {
            // La vidéo est chargée mais en pause = autoplay bloqué
            logger.warn('Autoplay bloqué par le navigateur. Affichage de l\'image de fallback.')
            if (content.media?.imageUrl) {
              setVideoFinished(true)
            }
          }
        }, 1000)
      }
    }

    checkAutoplay()
  }, [content.media?.videoUrl, content.media?.trailerUrl, videoFinished])

  // Fonction pour contrôler le son de la vidéo
  const toggleVideoSound = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la propagation vers le clic de la vidéo
    const mediaElement = document.getElementById('media-video') as HTMLVideoElement | HTMLIFrameElement
    if (!mediaElement) return

    if (mediaElement.tagName === 'VIDEO') {
      // Pour les vidéos HTML5 directes
      const video = mediaElement as HTMLVideoElement
      video.muted = !video.muted
      setIsVideoMuted(video.muted)
      
      // Masquer la notification si l&apos;utilisateur active le son
      if (!video.muted) {
        setShowSoundNotification(false)
      }
    } else if (mediaElement.tagName === 'IFRAME') {
      // Pour les vidéos YouTube, on ne peut pas contrôler directement le son
      // Mais on peut afficher un message d'information
      alert('Pour activer le son de la vidéo YouTube, cliquez sur l\'icône de son dans le lecteur vidéo.')
      // Masquer la notification car l&apos;utilisateur a cliqué sur le bouton
      setShowSoundNotification(false)
    }
  }

  // Fonction pour contrôler la lecture/pause de la vidéo
  const toggleVideoPlayPause = () => {
    const mediaElement = document.getElementById('media-video') as HTMLVideoElement | HTMLIFrameElement
    if (!mediaElement) return

    // Afficher l'icône play/pause temporairement
    setShowPlayPauseIcon(true)
    setTimeout(() => {
      setShowPlayPauseIcon(false)
    }, 1000) // Masquer après 1 seconde

    if (mediaElement.tagName === 'VIDEO') {
      // Pour les vidéos HTML5 directes
      const video = mediaElement as HTMLVideoElement
      if (video.paused) {
        video.play().then(() => {
          setIsVideoPlaying(true)
        }).catch((error) => logger.error('Erreur lors de la lecture', error as Error))
      } else {
        video.pause()
        setIsVideoPlaying(false)
      }
    } else if (mediaElement.tagName === 'IFRAME') {
      // Pour les vidéos YouTube, on ne peut pas contrôler directement la lecture
      // Mais on peut afficher un message d'information
      alert('Pour contrôler la lecture de la vidéo YouTube, utilisez les contrôles du lecteur vidéo.')
    }
  }

  // Gestion de la pause/lecture automatique de la vidéo selon le scroll
  useEffect(() => {
    const handleScroll = () => {
      const mediaElement = document.getElementById('media-video') as HTMLVideoElement | HTMLIFrameElement
      if (!mediaElement) return

      const mediaRect = mediaElement.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Si la vidéo est visible à plus de 50% dans la fenêtre
      const isVisible = mediaRect.top < windowHeight * 0.5 && mediaRect.bottom > windowHeight * 0.5
      
      // Pour les vidéos HTML5
      if (mediaElement.tagName === 'VIDEO') {
        const video = mediaElement as HTMLVideoElement
        if (isVisible) {
          if (video.paused) {
            video.play().then(() => {
              setIsVideoPlaying(true)
            }).catch((error) => logger.error('Erreur lors de la lecture', error as Error))
          }
        } else {
          if (!video.paused) {
            video.pause()
            setIsVideoPlaying(false)
          }
        }
      }
      // Pour les iframes YouTube, on ne peut pas contrôler la lecture directement
      // L'autoplay est géré par les paramètres de l'iframe
    }

    // Écouter le scroll
    window.addEventListener('scroll', handleScroll)
    
    // Vérifier l'état initial
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [content])

  // Afficher un écran de chargement pendant la vérification de l'authentification
  // ou si l'utilisateur est connecté (pendant la redirection)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
      {/* Header */}
      <header className={`px-6 py-4 transition-all duration-300 ${
        isHeaderTransparent 
          ? 'absolute top-0 left-0 right-0 z-50 bg-transparent' 
          : 'relative bg-transparent'
      }`}>
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${isHeaderTransparent ? 'backdrop-blur-sm bg-black/20 rounded-lg px-2 py-1 sm:px-3 sm:py-2' : ''}`}>
              <div 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
                style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
              >
                <PlayIcon className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className={`text-lg sm:text-xl md:text-2xl font-bold text-white ${isHeaderTransparent ? 'drop-shadow-lg' : ''}`}>
                {content.appIdentity.name}
              </span>
            </div>
            <div className="hidden sm:block">
              <HeaderStatusIndicator />
            </div>
          </div>
          <div className={`flex items-center space-x-2 sm:space-x-4 ${isHeaderTransparent ? 'backdrop-blur-sm bg-black/20 rounded-lg px-2 py-1 sm:px-3 sm:py-2' : ''}`}>
            <div className="hidden sm:block">
              <PWAInstaller />
            </div>
            {user ? (
              <Link 
                href="/dashboard" 
                className={`text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${isHeaderTransparent ? 'drop-shadow-lg' : ''}`}
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
                <span className="hidden sm:inline">Mon compte</span>
                <span className="sm:hidden">Compte</span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`text-gray-300 hover:text-white transition-colors text-sm sm:text-base ${isHeaderTransparent ? 'drop-shadow-lg' : ''}`}
                >
                  Connexion
                </Link>
                <Link 
                  href="/register" 
                  className={`text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${isHeaderTransparent ? 'drop-shadow-lg' : ''}`}
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
                  <span className="hidden sm:inline">Inscription</span>
                  <span className="sm:hidden">Inscrit</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section avec image de fond - Pleine largeur */}
      {sectionsVisibility.hero && content.hero.showBackground && content.hero.backgroundImageUrl && (() => {
        const hasContent = content.hero.title || content.hero.subtitle || content.hero.description || 
                          content.hero.primaryButton.text || content.hero.secondaryButton.text
        
        if (!hasContent) return null

        return (
          <div 
            key="hero-fullwidth"
            className="relative w-full h-[630px] sm:h-[720px] md:h-[810px] lg:h-[900px] xl:h-[990px] 2xl:h-[1080px] overflow-hidden mb-12 sm:mb-16 md:mb-20"
            style={{
              backgroundImage: `url(${content.hero.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Overlay pour améliorer la lisibilité du texte sur l'image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            
            {/* Contenu du hero - Centré comme dans le slider */}
            <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4 z-10">
              <div className="text-center max-w-4xl mx-auto px-4">
              {(content.hero.title || content.hero.subtitle) && (
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight drop-shadow-lg">
                {content.hero.title}
                  {content.hero.subtitle && (
                <span 
                  className="block"
                  style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
                >
                  {content.hero.subtitle}
                </span>
                  )}
              </h1>
              )}
              {content.hero.description && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto px-2 sm:px-4 drop-shadow-lg">
                {content.hero.description}
              </p>
              )}
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-fit mx-auto">
                {/* Première ligne mobile : "Commencer maintenant" et "Se connecter" côte à côte */}
                <div className="flex flex-row gap-4 md:contents">
                  {content.hero.primaryButton.text && content.hero.primaryButton.link && (
                  <Link 
                    href={content.hero.primaryButton.link} 
                    className="text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center justify-center whitespace-nowrap w-fit"
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
                    {content.hero.primaryButton.text}
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Link>
                  )}
                  {content.hero.secondaryButton.text && content.hero.secondaryButton.link && (
                  <Link 
                    href={content.hero.secondaryButton.link} 
                    className="border border-gray-600 hover:border-gray-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors whitespace-nowrap w-fit"
                  >
                    {content.hero.secondaryButton.text}
                  </Link>
                  )}
                </div>
                
                {/* Bouton "Télécharger notre application" - En bas sur mobile, à droite sur PC */}
                {content.hero?.downloadButtonText && content.hero?.downloadButtonLink && (
                <Link 
                  href={content.hero.downloadButtonLink} 
                  className="text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center justify-center whitespace-nowrap w-fit"
                  style={isClient ? { 
                    backgroundColor: content.appIdentity.colors.accent,
                    '--hover-color': content.appIdentity.colors.secondary
                  } as React.CSSProperties : { backgroundColor: '#F59E0B' }}
                  onMouseEnter={(e) => {
                    if (isClient) {
                      e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isClient) {
                      e.currentTarget.style.backgroundColor = content.appIdentity.colors.accent
                    }
                  }}
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  {content.hero.downloadButtonText}
                </Link>
                )}
              </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Homepage Slider - Pleine largeur */}
      {content.homepageSlider?.isVisible && content.homepageSlider?.slides && content.homepageSlider.slides.length > 0 && (
        <div className="mb-12 sm:mb-16 md:mb-20">
          {/* Slider avec défilement automatique - Hauteur adaptative */}
          <div 
            className="relative w-full h-[630px] sm:h-[720px] md:h-[810px] lg:h-[900px] xl:h-[990px] 2xl:h-[1080px] overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleHomepageTouchStart}
            onTouchMove={handleHomepageTouchMove}
            onTouchEnd={handleHomepageTouchEnd}
            onMouseDown={handleHomepageMouseDown}
            onMouseMove={handleHomepageMouseMove}
            onMouseUp={handleHomepageMouseUp}
            onMouseLeave={handleHomepageMouseUp}
          >
            {content.homepageSlider.slides
              .filter((slide: any) => slide.isActive)
              .map((slide: any, index: number) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlideIndex ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="relative w-full h-full">
                  <img
                    src={slide.imageUrl || '/placeholder-video.jpg'}
                    alt="Slide image"
                    className="w-full h-full object-cover object-center select-none"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-video.jpg'
                    }}
                  />
                  
                  {/* Overlay avec gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  {/* Contenu du slide - Centré */}
                  <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4">
                    <div className="text-center max-w-4xl mx-auto px-4">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-1 leading-tight">
                        {content.homepageSlider.title}
                      </h1>
                      {content.homepageSlider.title2 && (
                        <h2 
                          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 leading-tight"
                          style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
                        >
                          {content.homepageSlider.title2}
                        </h2>
                      )}
                      {content.homepageSlider.subtitle && (
                        <p className="text-gray-200 text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4 px-2">
                          {content.homepageSlider.subtitle}
                        </p>
                      )}
                      {content.homepageSlider.buttonText && (
                        <Link 
                          href={content.homepageSlider.buttonLink || '/'}
                          className="text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center justify-center whitespace-nowrap w-fit mx-auto"
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
                          {content.homepageSlider.buttonText}
                          <ArrowRightIcon className="w-5 h-5 ml-2" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicateurs de slides */}
            {content.homepageSlider.slides.filter((slide: any) => slide.isActive).length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {content.homepageSlider.slides
                  .filter((slide: any) => slide.isActive)
                  .map((slide: any, index: number) => (
                  <button
                    key={slide.id}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlideIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => {
                      goToHomepageSlide(index)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className={`px-6 ${((content.homepageSlider?.isVisible && content.homepageSlider?.slides && content.homepageSlider.slides.length > 0) || (sectionsVisibility.hero && content.hero.showBackground && content.hero.backgroundImageUrl)) ? 'pt-0 pb-12' : 'py-12'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Render sections in the specified order */}
          {sectionsOrder.map((sectionId, index) => {
            
            // Skip section if not visible (check both sectionsVisibility and individual section isVisible)
            if (!sectionsVisibility[sectionId as keyof typeof sectionsVisibility]) {
              return null
            }
            
            // Check individual section visibility
            if (sectionId === 'homepageSlider' && content.homepageSlider?.isVisible === false) return null
            // Hero visibility is controlled by sectionsVisibility (checked above)
            // Features visibility is controlled by sectionsVisibility (checked above)
            // FAQ visibility is controlled by sectionsVisibility (checked above)
            if (sectionId === 'newReleases' && content.newReleases?.isVisible === false) return null
            if (sectionId === 'media' && content.media?.isVisibleHomepage === false) return null

            // Vérifier si c'est la première section visible dans le main (après hero/slider)
            const hasHeroOrSlider = (content.homepageSlider?.isVisible && content.homepageSlider?.slides && content.homepageSlider.slides.length > 0) || 
                                   (sectionsVisibility.hero && content.hero.showBackground && content.hero.backgroundImageUrl)
            
            // Trouver l'index de la première section visible dans le main
            const visibleSectionsBefore = sectionsOrder.slice(0, index).filter((id) => {
              if (id === 'homepageSlider' || id === 'hero') return false // Ces sections sont rendues en dehors du main
              if (!sectionsVisibility[id as keyof typeof sectionsVisibility]) return false
              if (id === 'homepageSlider' && content.homepageSlider?.isVisible === false) return false
              if (id === 'newReleases' && content.newReleases?.isVisible === false) return false
              if (id === 'media' && content.media?.isVisibleHomepage === false) return false
              return true
            })
            
            const isFirstVisibleSection = hasHeroOrSlider && visibleSectionsBefore.length === 0

            if (sectionId === 'homepageSlider') {
              // Le homepageSlider est maintenant rendu en dehors du conteneur principal
              // pour prendre toute la largeur de la page
              return null
            }

            if (sectionId === 'hero') {
              // Vérifier s'il y a du contenu à afficher (titre, sous-titre, description, ou boutons)
              const hasContent = content.hero.title || content.hero.subtitle || content.hero.description || 
                                content.hero.primaryButton.text || content.hero.secondaryButton.text
              
              if (!hasContent) {
                return null // Ne pas afficher la section si aucun contenu
              }

              // Si l'image de fond est activée, sortir de la section normale pour prendre toute la largeur
              if (content.hero.showBackground && content.hero.backgroundImageUrl) {
                return null // On le rendra en dehors du conteneur
              }

              return (
                <div 
                  key="hero" 
                  className="text-center mb-16"
                >
                  {(content.hero.title || content.hero.subtitle) && (
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                    {content.hero.title}
                      {content.hero.subtitle && (
                    <span 
                      className="block"
                      style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
                    >
                      {content.hero.subtitle}
                    </span>
                      )}
                  </h1>
                  )}
                  {content.hero.description && (
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                    {content.hero.description}
                  </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-4xl mx-auto">
                    {content.hero.primaryButton.text && content.hero.primaryButton.link && (
                    <Link 
                      href={content.hero.primaryButton.link} 
                      className="text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center justify-center"
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
                      {content.hero.primaryButton.text}
                      <ArrowRightIcon className="w-5 h-5 ml-2" />
                    </Link>
                    )}
                    {content.hero.secondaryButton.text && content.hero.secondaryButton.link && (
                    <Link 
                      href={content.hero.secondaryButton.link} 
                      className="border border-gray-600 hover:border-gray-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors"
                    >
                      {content.hero.secondaryButton.text}
                    </Link>
                    )}
                    {content.hero?.downloadButtonText && content.hero?.downloadButtonLink && (
                    <Link 
                      href={content.hero.downloadButtonLink} 
                      className="text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors flex items-center justify-center"
                      style={isClient ? { 
                        backgroundColor: content.appIdentity.colors.accent,
                        '--hover-color': content.appIdentity.colors.secondary
                      } as React.CSSProperties : { backgroundColor: '#F59E0B' }}
                      onMouseEnter={(e) => {
                        if (isClient) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient) {
                          e.currentTarget.style.backgroundColor = content.appIdentity.colors.accent
                        }
                      }}
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      {content.hero.downloadButtonText}
                    </Link>
                    )}
                  </div>
                </div>
              )
            }
            
            if (sectionId === 'features') {
              // Vérifier s'il y a du contenu à afficher (au moins une fonctionnalité avec titre ou description)
              const hasContent = (content.features.streaming.title || content.features.streaming.description) ||
                                (content.features.premium.title || content.features.premium.description) ||
                                (content.features.noCommitment.title || content.features.noCommitment.description)
              
              if (!hasContent) {
                return null // Ne pas afficher la section si aucun contenu
              }

              return (
                <div key="features" className="grid md:grid-cols-3 gap-8 mb-16">
                  {(content.features.streaming.title || content.features.streaming.description) && (
                  <div className="text-center p-6">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                    >
                      <PlayIcon className="w-8 h-8 text-white" />
                    </div>
                      {content.features.streaming.title && (
                    <h3 className="text-xl font-semibold text-white mb-2">{content.features.streaming.title}</h3>
                      )}
                      {content.features.streaming.description && (
                    <p className="text-gray-400">
                      {content.features.streaming.description}
                    </p>
                      )}
                  </div>
                  )}
                  {(content.features.premium.title || content.features.premium.description) && (
                  <div className="text-center p-6">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                    >
                      <StarIcon className="w-8 h-8 text-white" />
                    </div>
                      {content.features.premium.title && (
                    <h3 className="text-xl font-semibold text-white mb-2">{content.features.premium.title}</h3>
                      )}
                      {content.features.premium.description && (
                    <p className="text-gray-400">
                      {content.features.premium.description}
                    </p>
                      )}
                  </div>
                  )}
                  {(content.features.noCommitment.title || content.features.noCommitment.description) && (
                  <div className="text-center p-6">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                    >
                      <ArrowRightIcon className="w-8 h-8 text-white" />
                    </div>
                      {content.features.noCommitment.title && (
                    <h3 className="text-xl font-semibold text-white mb-2">{content.features.noCommitment.title}</h3>
                      )}
                      {content.features.noCommitment.description && (
                    <p className="text-gray-400">
                      {content.features.noCommitment.description}
                    </p>
                      )}
                  </div>
                  )}
                </div>
              )
            }

            if (false && sectionId === 'download') {
              return (
                <div key="download" className="mb-16">
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      Téléchargez {isClient ? content.appIdentity.name : 'Atiha'}
                    </h2>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                      Installez {isClient ? content.appIdentity.name : 'Atiha'} sur tous vos appareils pour une expérience de streaming optimale, 
                      même hors ligne. Disponible sur mobile, tablette et ordinateur.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {/* Mobile */}
                    <div 
                      className="bg-dark-200 rounded-xl p-8 text-center border border-gray-700 transition-colors"
                      style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
                      onMouseEnter={(e) => {
                        if (isClient) {
                          e.currentTarget.style.borderColor = content.appIdentity.colors.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient) {
                          e.currentTarget.style.borderColor = '#374151'
                        }
                      }}
                    >
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                      >
                        <DevicePhoneMobileIcon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Mobile</h3>
                      <p className="text-gray-400 mb-6">
                        Installez {isClient ? content.appIdentity.name : 'Atiha'} sur votre smartphone pour regarder vos films et séries préférés 
                        partout, même sans connexion internet.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>📱</span>
                          <span>iOS & Android</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>📥</span>
                          <span>Téléchargement hors ligne</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>🔔</span>
                          <span>Notifications push</span>
                        </div>
                      </div>
                    </div>

                    {/* Tablette */}
                    <div 
                      className="bg-dark-200 rounded-xl p-8 text-center border border-gray-700 transition-colors"
                      style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
                      onMouseEnter={(e) => {
                        if (isClient) {
                          e.currentTarget.style.borderColor = content.appIdentity.colors.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient) {
                          e.currentTarget.style.borderColor = '#374151'
                        }
                      }}
                    >
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                      >
                        <ComputerDesktopIcon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Tablette</h3>
                      <p className="text-gray-400 mb-6">
                        Profitez d&apos;un écran plus grand avec la même qualité de streaming et 
                        toutes les fonctionnalités premium sur votre tablette.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>📱</span>
                          <span>iPad & Android</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>🎬</span>
                          <span>Qualité HD/4K</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>⚡</span>
                          <span>Performance optimisée</span>
                        </div>
                      </div>
                    </div>

                    {/* Ordinateur */}
                    <div 
                      className="bg-dark-200 rounded-xl p-8 text-center border border-gray-700 transition-colors"
                      style={isClient ? { '--hover-border-color': content.appIdentity.colors.primary } as React.CSSProperties : {}}
                      onMouseEnter={(e) => {
                        if (isClient) {
                          e.currentTarget.style.borderColor = content.appIdentity.colors.primary
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isClient) {
                          e.currentTarget.style.borderColor = '#374151'
                        }
                      }}
                    >
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                      >
                        <ComputerDesktopIcon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Ordinateur</h3>
                      <p className="text-gray-400 mb-6">
                        Utilisez {isClient ? content.appIdentity.name : 'Atiha'} directement dans votre navigateur ou installez-la 
                        comme une application native sur votre ordinateur.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>💻</span>
                          <span>Windows, Mac, Linux</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>🌐</span>
                          <span>Tous navigateurs</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                          <span>⌨️</span>
                          <span>Raccourcis clavier</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions d'installation */}
                  <div className="bg-gradient-to-r from-primary-900/20 to-purple-900/20 border border-primary-500/30 rounded-xl p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-4">
                        Comment installer {isClient ? content.appIdentity.name : 'Atiha'} ?
                      </h3>
                      <p className="text-gray-300">
                        Suivez ces étapes simples pour installer {isClient ? content.appIdentity.name : 'Atiha'} sur votre appareil
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Instructions pour navigateurs modernes */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <ComputerDesktopIcon className="w-5 h-5 mr-2 text-primary-400" />
                          Navigateurs modernes
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                            >1</div>
                            <p className="text-gray-300 text-sm">Cliquez sur le bouton &quot;Installer&quot; qui apparaît dans votre navigateur</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                            >2</div>
                            <p className="text-gray-300 text-sm">Confirmez l&apos;installation dans la popup qui s&apos;affiche</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                            >3</div>
                            <p className="text-gray-300 text-sm">{isClient ? content.appIdentity.name : 'Atiha'} sera ajoutée à votre écran d&apos;accueil ou menu d&apos;applications</p>
                          </div>
                        </div>
                      </div>

                      {/* Instructions pour iOS */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <DevicePhoneMobileIcon className="w-5 h-5 mr-2 text-primary-400" />
                          iOS (iPhone/iPad)
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                            >1</div>
                            <p className="text-gray-300 text-sm">Ouvrez {isClient ? content.appIdentity.name : 'Atiha'} dans Safari (pas dans Chrome ou Firefox)</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                            >2</div>
                            <p className="text-gray-300 text-sm">Appuyez sur le bouton de partage (📤) en bas de l&apos;écran</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
                              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                            >3</div>
                            <p className="text-gray-300 text-sm">Sélectionnez &quot;Ajouter à l&apos;écran d&apos;accueil&quot;</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'installation */}
                    <div className="mt-8 text-center space-y-4">
                      <PWAInstaller />
                      <div>
                        <Link 
                          href="/download" 
                          className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          <span>Guide d&apos;installation complet</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            if (sectionId === 'newReleases') {
              // Vérifier s'il y a du contenu à afficher (titre, sous-titre, ou itemsCount > 0)
              const hasContent = content.newReleases?.title || content.newReleases?.subtitle || (content.newReleases?.itemsCount && content.newReleases.itemsCount > 0)
              
              if (!hasContent) {
                return null // Ne pas afficher la section si aucun contenu
              }

              return (
                <div key="newReleases" className="mb-16">
                  {(content.newReleases?.title || content.newReleases?.subtitle) && (
                    <div className="text-center mb-8">
                      {content.newReleases?.title && (
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">{content.newReleases.title}</h2>
                      )}
                      {content.newReleases?.subtitle && (
                        <p className="text-gray-300 text-lg">{content.newReleases.subtitle}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Notre Collection */}
                  {(content.newReleases?.contentTypes?.collection ?? true) && collection.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">🎬</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Notre Collection</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {collection.slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`collection-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Films Populaires */}
                  {(content.newReleases?.contentTypes?.movies ?? true) && movies.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">🎭</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Films Populaires</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {movies.slice(0, content.newReleases?.itemsCount || 6).map((movie, index) => (
                          <Link key={`movie-${movie.id}`} href={`/content/${movie.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={movie.posterUrl || '/placeholder-video.jpg'}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{movie.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{movie.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(movie.id) > 0 ? getContentRating(movie.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Séries Populaires */}
                  {(content.newReleases?.contentTypes?.series ?? true) && series.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">📺</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Séries Populaires</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {series.slice(0, content.newReleases?.itemsCount || 6).map((serie, index) => (
                          <Link key={`series-${serie.id}`} href={`/content/${serie.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={serie.posterUrl || '/placeholder-video.jpg'}
                                alt={serie.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{serie.title}</h3>
                              <p className="text-gray-400 text-xs">Saison {serie.season || 1}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jeux */}
                  {(content.newReleases?.contentTypes?.jeux ?? true) && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">🎮</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Jeux</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {[...movies, ...series].filter(item => item.catalogue === 'jeux').slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`jeux-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sports */}
                  {(content.newReleases?.contentTypes?.sports ?? true) && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">⚽</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Sports</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {[...movies, ...series].filter(item => item.catalogue === 'sports').slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`sports-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Animes */}
                  {(content.newReleases?.contentTypes?.animes ?? true) && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">🎌</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Animes</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {[...movies, ...series].filter(item => item.catalogue === 'animes').slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`animes-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tendances */}
                  {(content.newReleases?.contentTypes?.tendances ?? true) && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">🔥</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Tendances</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {[...movies, ...series].filter(item => item.catalogue === 'tendances').slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`tendances-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documentaires */}
                  {(content.newReleases?.contentTypes?.documentaires ?? true) && (
                    <div className="mb-12">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">📖</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Documentaires</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {[...movies, ...series].filter(item => item.catalogue === 'documentaires').slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`documentaires-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divertissements */}
                  {(content.newReleases?.contentTypes?.divertissements ?? true) && (
                    <div>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-lg">✨</span>
                        </div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Divertissements</h3>
                      </div>
                      <div className={`grid ${getGridCols(content.newReleases?.itemsCount || 6)} gap-4`}>
                        {[...movies, ...series].filter(item => item.catalogue === 'divertissements').slice(0, content.newReleases?.itemsCount || 6).map((item, index) => (
                          <Link key={`divertissements-${item.id}`} href={`/content/${item.id}`} className="group cursor-pointer">
                            <div className="aspect-[2/3] bg-gray-700 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
                              <OptimizedImage
                                src={item.posterUrl || '/placeholder-video.jpg'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                width={200}
                                height={300}
                              />
                            </div>
                            <div className="mt-2">
                              <h3 className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>{item.year}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="w-3 h-3 text-yellow-400" />
                                  <span>{getContentRating(item.id) > 0 ? getContentRating(item.id).toFixed(1) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            if (sectionId === 'media') {
              // Vérifier s'il y a du contenu à afficher (titre, sous-titre, trailerUrl, ou bouton d'action)
              const hasContent = content.media?.title || content.media?.subtitle || content.media?.trailerUrl || content.media?.videoUrl || (content.media?.watchNowText && content.media?.contentUrl)
              
              if (!hasContent) {
                return null // Ne pas afficher la section si aucun contenu
              }

              // Fonction pour extraire l'ID YouTube
              const extractYouTubeId = (url: string): string | null => {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                const match = url.match(regExp)
                return (match && match[2].length === 11) ? match[2] : null
              }

              // Fonction pour extraire l'URL d'un code HTML embed (iframe)
              const extractEmbedUrl = (htmlString: string): string | null => {
                // Vérifier si c'est un code HTML contenant un iframe
                if (htmlString.includes('<iframe')) {
                  const iframeMatch = htmlString.match(/<iframe[^>]+src=["']([^"']+)["']/i)
                  if (iframeMatch && iframeMatch[1]) {
                    return iframeMatch[1]
                  }
                }
                return null
              }

              // Utiliser videoUrl en priorité, sinon trailerUrl
              const videoSource = content.media?.videoUrl || content.media?.trailerUrl

              return (
                <div key="media" className={`mb-16 ${isFirstVisibleSection ? 'pt-12 sm:pt-16 md:pt-20' : ''}`}>
                  <div 
                    className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer"
                    onClick={toggleVideoPlayPause}
                  >
                    {/* Image de fallback si pas de vidéo ou si la vidéo est terminée */}
                    {((!videoSource || videoFinished) && content.media?.imageUrl) && (
                      <img
                        src={content.media.imageUrl}
                        alt={content.media.title || 'Media'}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ aspectRatio: '16/9' }}
                      />
                    )}
                    
                    {/* Vidéo de fond - affichée seulement si elle n'est pas terminée */}
                    {videoSource && !videoFinished && (() => {
                      // Vérifier si c'est un code HTML embed
                      const embedUrl = extractEmbedUrl(videoSource)
                      const finalUrl = embedUrl || videoSource
                      
                      const youtubeId = extractYouTubeId(finalUrl)
                      if (youtubeId) {
                        // YouTube video
                        return (
                          <iframe
                            id="media-video"
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1`}
                            className="absolute inset-0 w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          />
                        )
                      } else if (embedUrl || finalUrl.includes('embed') || finalUrl.includes('/e/') || finalUrl.includes('iframe') || finalUrl.includes('uqload') || finalUrl.includes('streamtape') || finalUrl.includes('doodstream') || finalUrl.includes('mixdrop')) {
                        // Code embed détecté (iframe, embed, etc.)
                        // Note: Pour les iframes, on ne peut pas détecter la fin de la vidéo facilement
                        // On laisse l'iframe se comporter normalement
                        return (
                          <iframe
                            id="media-video"
                            src={finalUrl}
                            className="absolute inset-0 w-full h-full"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                          />
                        )
                      } else {
                        // Direct video link
                        return (
                      <video
                            id="media-video"
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay
                            muted={isVideoMuted}
                            playsInline
                            poster={content.media?.imageUrl || undefined}
                            onEnded={() => {
                              // Afficher l'image de fallback à la fin de la vidéo
                              setVideoFinished(true)
                            }}
                            onError={(e) => {
                              // Si l'autoplay échoue, afficher l'image de fallback
                              logger.warn('Erreur de lecture vidéo ou autoplay bloqué. Affichage de l\'image de fallback.')
                              if (content.media?.imageUrl) {
                                setVideoFinished(true)
                              }
                            }}
                          >
                            <source src={finalUrl} type="video/mp4" />
                            <source src={finalUrl} type="video/webm" />
                            <source src={finalUrl} type="video/ogg" />
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                        )
                      }
                    })()}

                    {/* Overlay avec gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Bouton de lecture/pause au centre */}
                    {videoSource && (() => {
                      const embedUrl = extractEmbedUrl(videoSource)
                      const finalUrl = embedUrl || videoSource
                      const youtubeId = extractYouTubeId(finalUrl)
                      return (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                          <div className="w-20 h-20 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 opacity-0 hover:opacity-100 pointer-events-auto">
                            {youtubeId ? (
                              <PlayIcon className="w-8 h-8 text-white" />
                            ) : (
                              isVideoPlaying ? (
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <div className="w-3 h-8 bg-white rounded-sm mr-1"></div>
                                  <div className="w-3 h-8 bg-white rounded-sm"></div>
                                </div>
                              ) : (
                                <PlayIcon className="w-8 h-8 text-white" />
                              )
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Icône play/pause temporaire au clic */}
                    {showPlayPauseIcon && videoSource && (() => {
                      const embedUrl = extractEmbedUrl(videoSource)
                      const finalUrl = embedUrl || videoSource
                      const youtubeId = extractYouTubeId(finalUrl)
                      return (
                        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                          <div className="w-20 h-20 bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/30 animate-pulse">
                            {youtubeId ? (
                              <PlayIcon className="w-8 h-8 text-white" />
                            ) : (
                              isVideoPlaying ? (
                                <div className="w-8 h-8 flex items-center justify-center">
                                  <div className="w-3 h-8 bg-white rounded-sm mr-1"></div>
                                  <div className="w-3 h-8 bg-white rounded-sm"></div>
                                </div>
                              ) : (
                                <PlayIcon className="w-8 h-8 text-white" />
                              )
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Bouton de contrôle du son */}
                    {videoSource && (() => {
                      const embedUrl = extractEmbedUrl(videoSource)
                      const finalUrl = embedUrl || videoSource
                      const youtubeId = extractYouTubeId(finalUrl)
                      return (
                        <button
                          onClick={toggleVideoSound}
                          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110 z-30"
                          aria-label={youtubeId ? "Contrôles YouTube disponibles" : (isVideoMuted ? "Activer le son" : "Désactiver le son")}
                        >
                          {youtubeId ? (
                            <SpeakerWaveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          ) : (
                            isVideoMuted ? (
                              <SpeakerXMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            ) : (
                              <SpeakerWaveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            )
                          )}
                        </button>
                      )
                    })()}

                    {/* Notification pour désactiver le son - à côté du bouton son */}
                    {showSoundNotification && (
                      <div className="absolute top-4 right-16 sm:top-6 sm:right-20 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 sm:px-4 sm:py-3 z-40 animate-pulse">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                          <span className="text-white text-xs sm:text-sm font-medium">
                            Cliquez sur l&apos;icône son pour désactiver l&apos;audio
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Contenu textuel */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
                      <div className="max-w-4xl">
                        {content.media?.title && (
                          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-2 md:mb-4">
                            {content.media.title}
                          </h2>
                        )}
                        {content.media?.subtitle && (
                          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-gray-200 mb-4 md:mb-8 max-w-2xl">
                            {content.media.subtitle}
                          </p>
                        )}
                        
                        {/* Bouton d'action */}
                        {(content.media?.watchNowText || content.media?.contentUrl) && (
                          <Link
                            href={content.media.contentUrl ? (content.media.contentUrl.startsWith('/') ? content.media.contentUrl : `/content/${content.media.contentUrl}`) : '/'}
                            className="inline-flex items-center space-x-2 text-white px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg relative z-30"
                            style={isClient ? { 
                              backgroundColor: content.appIdentity.colors.primary,
                              '--hover-color': content.appIdentity.colors.secondary
                            } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
                            onClick={(e) => {
                              e.stopPropagation() // Empêcher la propagation vers le clic de la vidéo
                            }}
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
                            <PlayIcon className="w-6 h-6" />
                            <span>{content.media.watchNowText}</span>
                          <ArrowRightIcon className="w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            if (sectionId === 'faq') {
              // Vérifier s'il y a des questions à afficher
              const hasQuestions = content.faq?.questions && content.faq.questions.length > 0
              
              if (!hasQuestions) {
                return null // Ne pas afficher la section si aucune question
              }

              return (
                <div key="faq" className="mb-16">
                  {/* Titre de la section */}
                  {content.faq.title && (
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 text-left">
                      {content.faq.title}
                    </h2>
                  )}

                  {/* Questions FAQ avec accordéon */}
                  <div className="space-y-2">
                    {content.faq.questions
                      .filter((question: any) => question.isActive)
                      .map((question: any) => {
                        // Remplacer "Atiha" par le nom dynamique de l'application
                        const appName = isClient ? content.appIdentity.name : 'Atiha'
                        const dynamicQuestion = question.question.replace(/Atiha/g, appName)
                        const dynamicAnswer = question.answer.replace(/Atiha/g, appName)
                        
                        return (
                      <div key={question.id} className="bg-gray-800 rounded-lg overflow-hidden">
                        {/* Question - Bouton d'accordéon */}
                        <button
                          onClick={() => {
                            setExpandedFaq(expandedFaq === question.id ? null : question.id)
                          }}
                          className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-white text-lg font-medium">
                            {dynamicQuestion}
                          </span>
                          <div className="flex-shrink-0 ml-4">
                            {expandedFaq === question.id ? (
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            )}
                          </div>
                        </button>
                        
                        {/* Réponse - Contenu de l'accordéon */}
                        {expandedFaq === question.id && (
                          <div className="px-6 py-4 bg-gray-700">
                            <p className="text-gray-200 text-base leading-relaxed">
                              {dynamicAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                        )
                      })}
                  </div>
                </div>
              )
            }

            
            return null
          })}

        </div>
      </main>

      {/* Footer uniquement sur la page d'accueil */}
      <GlobalFooter />
    </div>
  )
}
