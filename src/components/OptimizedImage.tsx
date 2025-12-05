'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { ResourcePreloader } from '@/lib/performance-utils'
import { logger } from '@/lib/logger'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  quality?: number
  fill?: boolean
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
  preload?: boolean
}

// Placeholder blur optimisé pour de meilleures performances
const DEFAULT_BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

// Cache pour les images en erreur
const errorImageCache = new Set<string>()

export default function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 600,
  className = '',
  priority = false,
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL = DEFAULT_BLUR_DATA_URL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  fill = false,
  style = {},
  onLoad,
  onError,
  fallbackSrc = '/placeholder-video.jpg',
  preload = false
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // Fonction pour valider si l'URL est une image (mémorisée)
  const isValidImageUrl = useMemo(() => {
    return (url: string): boolean => {
      if (!url || typeof url !== 'string') return false
      
      // Vérifier les extensions d'image communes
      const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?.*)?$/i
      if (imageExtensions.test(url)) return true
      
      // Vérifier les domaines d'images connus
      const imageDomains = /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)\./i
      if (imageDomains.test(url)) return true
      
      // Vérifier les URLs de base64 d'images
      if (url.startsWith('data:image/')) return true
      
      // Vérifier les URLs de placeholder
      if (url.includes('placeholder') || url.includes('default')) return true
      
      return false
    }
  }, [])

  // Vérifier si l'image est en cache d'erreur
  const isInErrorCache = errorImageCache.has(src)

  // Validation de l'URL - déplacé après les hooks
  const isValidSrc = useMemo(() => {
    return src && typeof src === 'string' && !isInErrorCache && isValidImageUrl(src)
  }, [src, isInErrorCache, isValidImageUrl])

  // Précharger l'image si demandé
  useEffect(() => {
    if (preload && isValidSrc) {
      ResourcePreloader.preloadImage(src).catch((error) => logger.warn('Erreur lors du préchargement de l\'image', error as Error))
    }
  }, [preload, src, isValidSrc])

  const handleLoad = useCallback(() => {
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      errorImageCache.add(src)
      
      if (fallbackSrc && fallbackSrc !== src) {
        setImageSrc(fallbackSrc)
        setHasError(false)
      }
      
      onError?.()
    }
  }, [src, fallbackSrc, hasError, onError])

  // Si l'URL n&apos;est pas valide, afficher un placeholder
  if (!isValidSrc) {
    return (
      <div
        className={`bg-gray-700 flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-gray-400 text-sm">
          {src && !isValidImageUrl(src) ? 'URL non valide (vidéo détectée)' : 'Image non disponible'}
        </span>
      </div>
    )
  }

  // Si fill est true, on utilise fill au lieu de width/height
  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={className}
        priority={priority}
        loading={loading}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        quality={quality}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
      />
    )
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={loading}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      sizes={sizes}
      quality={quality}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
}

// Composant spécialisé pour les affiches de films/séries
export function PosterImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  fallbackSrc = '/placeholder-video.jpg'
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  fallbackSrc?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={600}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      quality={85}
      fallbackSrc={fallbackSrc}
    />
  )
}

// Composant spécialisé pour les miniatures d'épisodes
export function ThumbnailImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  fallbackSrc = '/placeholder-video.jpg'
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  fallbackSrc?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={120}
      height={68}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes="(max-width: 640px) 25vw, 15vw"
      quality={80}
      fallbackSrc={fallbackSrc}
    />
  )
}

// Composant spécialisé pour les avatars
export function AvatarImage({ 
  src, 
  alt, 
  className = '',
  priority = false,
  fallbackSrc = '/placeholder-video.jpg'
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  fallbackSrc?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={40}
      height={40}
      className={`rounded-full ${className}`}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes="40px"
      quality={90}
      fallbackSrc={fallbackSrc}
    />
  )
}

// Composant pour les images de fond (hero sections)
export function BackgroundImage({ 
  src, 
  alt, 
  className = '',
  priority = true,
  fallbackSrc = '/placeholder-video.jpg'
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
  fallbackSrc?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      loading="eager"
      sizes="100vw"
      quality={90}
      fallbackSrc={fallbackSrc}
    />
  )
}
