'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { logger } from '@/lib/logger'

interface SafeImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  onError?: () => void
  onLoad?: () => void
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc = '/placeholder-video.jpg',
  onError,
  onLoad,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      logger.warn('Image failed to load, using fallback', { imgSrc, fallbackSrc })
      setImgSrc(fallbackSrc)
      setHasError(true)
      onError?.()
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  // Vérifier si l'URL est valide
  const isValidUrl = (url: string) => {
    if (!url || url.trim() === '') return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Si l'URL n&apos;est pas valide, utiliser directement le fallback
  if (!isValidUrl(imgSrc)) {
    return (
      <div className={`relative bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Image non disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-lg flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      <Image
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={imgSrc.startsWith('data:') || imgSrc.includes('blob:')}
        {...props}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-400 text-xs">Image non disponible</p>
          </div>
        </div>
      )}
    </div>
  )
}
