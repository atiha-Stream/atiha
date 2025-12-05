'use client'

import React, { useEffect, useRef, useState } from 'react'

// Hook pour les animations optimisées
export function useOptimizedAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element || hasAnimated) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true)
          setHasAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [hasAnimated])

  return { ref, isVisible, hasAnimated }
}

// Composant pour les animations de fade-in
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  className = '' 
}: FadeInProps) {
  const { ref, isVisible } = useOptimizedAnimation()

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-${duration} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

// Composant pour les animations de slide-up
interface SlideUpProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function SlideUp({ 
  children, 
  delay = 0, 
  duration = 500, 
  className = '' 
}: SlideUpProps) {
  const { ref, isVisible } = useOptimizedAnimation()

  return (
    <div
      ref={ref}
      className={`transition-all duration-${duration} ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

// Composant pour les animations de scale
interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function ScaleIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  className = '' 
}: ScaleInProps) {
  const { ref, isVisible } = useOptimizedAnimation()

  return (
    <div
      ref={ref}
      className={`transition-all duration-${duration} ${
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      } ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

// Composant pour les animations de stagger (décalage)
interface StaggerProps {
  children: React.ReactNode[]
  staggerDelay?: number
  className?: string
}

export function Stagger({ 
  children, 
  staggerDelay = 100, 
  className = '' 
}: StaggerProps) {
  const { ref, isVisible } = useOptimizedAnimation()

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={`transition-all duration-500 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
          style={{ 
            transitionDelay: `${index * staggerDelay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// Hook pour les animations de scroll
export function useScrollAnimation(threshold: number = 0.1) {
  const [isScrolled, setIsScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(entry.isIntersecting)
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isScrolled }
}

// Composant pour les animations de parallaxe
interface ParallaxProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export function Parallax({ 
  children, 
  speed = 0.5, 
  className = '' 
}: ParallaxProps) {
  const { ref, isScrolled } = useScrollAnimation(0)

  return (
    <div
      ref={ref}
      className={`transform transition-transform duration-75 ${className}`}
      style={{
        transform: isScrolled 
          ? `translateY(${window.scrollY * speed}px)` 
          : 'translateY(0)'
      }}
    >
      {children}
    </div>
  )
}

// Composant pour les animations de hover optimisées
interface HoverScaleProps {
  children: React.ReactNode
  scale?: number
  duration?: number
  className?: string
}

export function HoverScale({ 
  children, 
  scale = 1.05, 
  duration = 200, 
  className = '' 
}: HoverScaleProps) {
  return (
    <div
      className={`transition-transform duration-${duration} hover:scale-${Math.round(scale * 100)} ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transform: `scale(${scale})`
      }}
    >
      {children}
    </div>
  )
}

// Composant pour les animations de skeleton loading
interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  animate?: boolean
}

export function Skeleton({ 
  width = '100%', 
  height = '20px', 
  className = '',
  animate = true
}: SkeletonProps) {
  return (
    <div
      className={`bg-gray-700 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
      style={{ width, height }}
    />
  )
}

// Composant pour les animations de skeleton pour les cartes
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-dark-200 rounded-lg p-4 ${className}`}>
      <Skeleton height="200px" className="mb-4" />
      <Skeleton height="20px" width="80%" className="mb-2" />
      <Skeleton height="16px" width="60%" className="mb-2" />
      <Skeleton height="16px" width="40%" />
    </div>
  )
}

// Composant pour les animations de skeleton pour les listes
export function ListSkeleton({ 
  count = 5, 
  className = '' 
}: { 
  count?: number
  className?: string 
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 mb-4">
          <Skeleton width="60px" height="60px" className="rounded" />
          <div className="flex-1">
            <Skeleton height="20px" width="70%" className="mb-2" />
            <Skeleton height="16px" width="50%" />
          </div>
        </div>
      ))}
    </div>
  )
}
