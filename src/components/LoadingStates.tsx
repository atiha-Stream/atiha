'use client'

import React from 'react'
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  FilmIcon, 
  TvIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ArrowPathIcon className={`${sizeClasses[size]} text-primary-500 animate-spin`} />
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className = '' }: LoadingCardProps) {
  return (
    <div className={`bg-dark-200 rounded-lg p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-24 bg-gray-700 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  icon: Icon = FilmIcon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ 
  title = "Une erreur s&apos;est produite", 
  message, 
  onRetry, 
  className = '' 
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Réessayer</span>
        </button>
      )}
    </div>
  )
}

interface SearchEmptyStateProps {
  query: string
  onClearSearch?: () => void
}

export function SearchEmptyState({ query, onClearSearch }: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={MagnifyingGlassIcon}
      title="Aucun résultat trouvé"
      description={`Aucun contenu ne correspond à votre recherche "${query}". Essayez avec d&apos;autres mots-clés.`}
      action={
        onClearSearch && (
          <button
            onClick={onClearSearch}
            className="text-primary-500 hover:text-primary-400 font-medium"
          >
            Effacer la recherche
          </button>
        )
      }
    />
  )
}

interface ContentEmptyStateProps {
  type: 'movies' | 'series' | 'all'
  onAddContent?: () => void
}

export function ContentEmptyState({ type, onAddContent }: ContentEmptyStateProps) {
  const getContentInfo = () => {
    switch (type) {
      case 'movies':
        return {
          icon: FilmIcon,
          title: 'Aucun film disponible',
          description: 'Il n\'y a actuellement aucun film dans la bibliothèque.',
          addText: 'Ajouter un film'
        }
      case 'series':
        return {
          icon: TvIcon,
          title: 'Aucune série disponible',
          description: 'Il n\'y a actuellement aucune série dans la bibliothèque.',
          addText: 'Ajouter une série'
        }
      default:
        return {
          icon: FilmIcon,
          title: 'Aucun contenu disponible',
          description: 'Il n\'y a actuellement aucun contenu dans la bibliothèque.',
          addText: 'Ajouter du contenu'
        }
    }
  }

  const { icon, title, description, addText } = getContentInfo()

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={
        onAddContent && (
          <button
            onClick={onAddContent}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {addText}
          </button>
        )
      }
    />
  )
}


