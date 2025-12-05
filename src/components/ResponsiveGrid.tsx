'use client'

import React from 'react'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  minItemWidth?: string
  gap?: string
}

export default function ResponsiveGrid({ 
  children, 
  className = '',
  minItemWidth = '280px',
  gap = '1rem'
}: ResponsiveGridProps) {
  return (
    <div 
      className={`grid gap-4 sm:gap-6 ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
        gap: gap
      }}
    >
      {children}
    </div>
  )
}

// Composant spécialisé pour les cartes de films/séries
export function ContentGrid({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveGrid
      className={className}
      minItemWidth="250px"
      gap="1.5rem"
    >
      {children}
    </ResponsiveGrid>
  )
}

// Composant spécialisé pour les miniatures
export function ThumbnailGrid({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveGrid
      className={className}
      minItemWidth="120px"
      gap="0.75rem"
    >
      {children}
    </ResponsiveGrid>
  )
}

// Composant spécialisé pour les statistiques
export function StatsGrid({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  )
}

// Composant spécialisé pour les formulaires
export function FormGrid({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  )
}

// Composant spécialisé pour les tableaux responsive
export function ResponsiveTable({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-700">
        {children}
      </table>
    </div>
  )
}

// Composant pour les cartes empilées sur mobile
export function StackedCards({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  )
}

// Composant pour les sections avec espacement responsive
export function ResponsiveSection({ 
  children, 
  className = '',
  padding = 'responsive'
}: {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'small' | 'medium' | 'large' | 'responsive'
}) {
  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
    responsive: 'p-4 sm:p-6 lg:p-8'
  }

  return (
    <section className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </section>
  )
}

// Composant pour les conteneurs avec largeur maximale responsive
export function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = '7xl'
}: {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
}) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  )
}
