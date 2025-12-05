'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface YouTubePlayerProps {
  videoId: string
  title?: string
  onClose?: () => void
  autoplay?: boolean
  width?: string | number
  height?: string | number
}

export default function YouTubePlayer({ 
  videoId, 
  title = "Bande d&apos;annonce", 
  onClose, 
  autoplay = false,
  width = "100%",
  height = "400px"
}: YouTubePlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Extraire l'ID vidéo YouTube depuis l'URL
  const extractVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : url
  }

  const youtubeVideoId = extractVideoId(videoId)

  useEffect(() => {
    setIsLoaded(true)
    
    // Lancer automatiquement en plein écran pour les bandes-annonces
    if (autoplay) {
      const iframe = document.querySelector('iframe[src*="youtube.com"]') as HTMLIFrameElement
      if (iframe && !document.fullscreenElement) {
        iframe.requestFullscreen().catch((error) => {
          logger.warn('Impossible de lancer YouTube en plein écran', { error })
        })
      }
    }
  }, [videoId, autoplay])

  if (!youtubeVideoId) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-lg p-8">
        <p className="text-gray-400">URL YouTube invalide</p>
      </div>
    )
  }

  return (
    <div className="relative bg-black rounded-none overflow-hidden w-full h-full video-player-container">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="relative w-full h-full">
        {isLoaded && (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  )
}
