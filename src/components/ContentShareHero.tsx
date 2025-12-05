'use client'

import { useState, useEffect } from 'react'
import { Movie, Series } from '@/types/content'
import { ReviewStats } from '@/lib/reviews-service'
import { PlayIcon } from '@heroicons/react/24/outline'
import YouTubePlayer from './YouTubePlayer'
import { HomepageContentService } from '@/lib/homepage-content-service'

interface ContentShareHeroProps {
  content: Movie | Series
  youtubeId: string | null
  reviewStats: ReviewStats
}

export default function ContentShareHero({ content, youtubeId, reviewStats }: ContentShareHeroProps) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [homepageContent, setHomepageContent] = useState(HomepageContentService.getContent())

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setHomepageContent(loadedContent)
  }, [])

  const handlePlayTrailer = () => {
    setShowTrailer(true)
  }

  const handleCloseTrailer = () => {
    setShowTrailer(false)
  }

  if (!youtubeId) {
    return null
  }

  return (
    <div className="relative overflow-x-hidden w-full mb-6 sm:mb-8">
      {/* Lecteur vidéo - Même structure que VideoPlayerSection */}
      <div className="aspect-video bg-black overflow-hidden relative lg:mt-4 xl:mt-5 2xl:mt-6 lg:mx-auto lg:max-w-[85%] xl:max-w-[80%] 2xl:max-w-[75%] rounded-none lg:rounded-xl lg:shadow-2xl" id="video-player-container">
        {showTrailer ? (
          <YouTubePlayer
            videoId={youtubeId}
            title={`${content.title} - Bande d&apos;Annonce`}
            onClose={handleCloseTrailer}
            autoplay={true}
            height="100%"
          />
        ) : (
          <>
            {content.posterUrl ? (
              <div className="w-full h-full relative">
                <img
                  src={content.posterUrl}
                  alt={`Aperçu de ${content.title}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback vers l'icône play si l'image ne charge pas
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center hidden">
                  <PlayIcon className="w-20 h-20 text-gray-400" />
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900"
              >
              </div>
            )}
            
            {/* Overlay avec icône play et texte toujours visibles */}
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer group"
              onClick={handlePlayTrailer}
              title="Cliquer pour regarder"
            >
              <div className="flex flex-col items-center justify-center">
                {/* Bouton play avec design moderne */}
                <div className="relative mb-3 sm:mb-4">
                  {/* Cercle extérieur avec animation */}
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75"></div>
                  {/* Cercle principal avec gradient - Responsive pour tous les écrans */}
                  <div 
                    className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-24 lg:h-24 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl"
                    style={isClient ? {
                      background: `linear-gradient(135deg, ${homepageContent.appIdentity.colors.primary}CC, ${homepageContent.appIdentity.colors.secondary}CC)`,
                      boxShadow: `0 0 30px ${homepageContent.appIdentity.colors.primary}80, inset 0 0 20px rgba(255,255,255,0.1)`,
                      border: `2px solid ${homepageContent.appIdentity.colors.primary}`
                    } : {
                      background: 'linear-gradient(135deg, #3B82F6CC, #2563ebCC)',
                      boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(255,255,255,0.1)',
                      border: '2px solid #3B82F6'
                    }}
                  >
                    {/* Icône play centrée - Responsive */}
                    <PlayIcon 
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-11 xl:h-11 2xl:w-12 2xl:h-12 text-white transition-transform duration-300 group-hover:scale-110" 
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))', marginLeft: '2px' }}
                    />
                  </div>
                </div>
                <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mt-2 drop-shadow-md font-medium text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>Cliquer pour regarder</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

