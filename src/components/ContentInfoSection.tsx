'use client'

import React, { useState, useEffect } from 'react'
import { Movie, Series } from '@/types/content'
import { CalendarIcon, ClockIcon, StarIcon, UserGroupIcon, FilmIcon } from '@heroicons/react/24/outline'
import { ReviewsService, ReviewStats } from '@/lib/reviews-service'
import ShareButton from './ShareButton'

interface ContentInfoSectionProps {
  content: Movie | Series
}

export default function ContentInfoSection({ content }: ContentInfoSectionProps) {
  const isMovie = 'videoUrl' in content
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ 
    averageRating: 0, 
    totalReviews: 0, 
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } 
  })

  useEffect(() => {
    const stats = ReviewsService.getReviewStats(content.id)
    setReviewStats(stats)
  }, [content.id])

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      {/* Titre et informations principales */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">{content.title}</h1>
          <ShareButton contentId={content.id} contentTitle={content.title} />
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400 text-sm mb-4">
          <span className="flex items-center space-x-1">
            <CalendarIcon className="w-4 h-4" />
            <span>{content.year}</span>
          </span>
          <span className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span>
              {reviewStats.averageRating > 0 
                ? `${reviewStats.averageRating.toFixed(1)} (${reviewStats.totalReviews})` 
                : 'N/A'
              }
            </span>
          </span>
          {isMovie && 'duration' in content && (
            <span className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDuration(content.duration)}</span>
            </span>
          )}
          <span className="flex items-center space-x-1">
            <FilmIcon className="w-4 h-4" />
            <span>{Array.isArray(content.genre) ? content.genre.join(', ') : content.genre}</span>
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-gray-300 text-lg leading-relaxed">{content.description}</p>
      </div>

      {/* Informations détaillées */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5" />
            <span>Réalisateur</span>
          </h3>
          <p className="text-gray-400">{content.director}</p>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2 flex items-center space-x-2">
            <UserGroupIcon className="w-5 h-5" />
            <span>Acteurs</span>
          </h3>
          <p className="text-gray-400">{Array.isArray(content.cast) ? content.cast.join(', ') : content.cast}</p>
        </div>
      </div>


      {/* Informations supplémentaires pour les films */}
      {isMovie && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Informations du film</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Durée:</span>
              <span className="text-white ml-2">{formatDuration(content.duration)}</span>
            </div>
            <div>
              <span className="text-gray-400">Année:</span>
              <span className="text-white ml-2">{content.year}</span>
            </div>
            <div>
              <span className="text-gray-400">Genre:</span>
              <span className="text-white ml-2">{Array.isArray(content.genre) ? content.genre.join(', ') : content.genre}</span>
            </div>
            <div>
              <span className="text-gray-400">Note:</span>
              <span className="text-white ml-2">
                {reviewStats.averageRating > 0 
                  ? `${reviewStats.averageRating.toFixed(1)}/5 (${reviewStats.totalReviews} avis)` 
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
