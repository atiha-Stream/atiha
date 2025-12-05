'use client'

import React, { useState, useRef, useEffect } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  threshold?: number
  rootMargin?: string
}

export default function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    // Créer l&apos;observateur d&apos;intersection
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observerRef.current.observe(img)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold, rootMargin])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const defaultPlaceholder = (
    <div className={`bg-gray-700 flex items-center justify-center ${className}`}>
      <PhotoIcon className="w-8 h-8 text-gray-400" />
    </div>
  )

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10">
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* Image d&apos;erreur */}
      {hasError && (
        <div className="absolute inset-0 z-10 bg-gray-700 flex items-center justify-center">
          <div className="text-center">
            <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Image non disponible</p>
          </div>
        </div>
      )}

      {/* Image réelle */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}


