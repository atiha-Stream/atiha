'use client'

import React, { useMemo } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface OptimizedPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
  showFirstLast?: boolean
  className?: string
}

export default function OptimizedPagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  className = ''
}: OptimizedPaginationProps) {
  // Calculer les pages à afficher
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    const end = Math.min(totalPages, start + maxVisiblePages - 1)

    // Ajuster le début si on est proche de la fin
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [currentPage, totalPages, maxVisiblePages])

  // Gestionnaires d'événements
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleFirst = () => {
    onPageChange(1)
  }

  const handleLast = () => {
    onPageChange(totalPages)
  }

  // Ne pas afficher si une seule page
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className={`flex items-center justify-center space-x-1 ${className}`} aria-label="Pagination">
      {/* Bouton Première page */}
      {showFirstLast && currentPage > 2 && (
        <>
          <button
            onClick={handleFirst}
            className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Première page"
          >
            1
          </button>
          {currentPage > 3 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}

      {/* Bouton Précédent */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-1"
        aria-label="Page précédente"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span>Précédent</span>
      </button>

      {/* Pages visibles */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            page === currentPage
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Bouton Suivant */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-1"
        aria-label="Page suivante"
      >
        <span>Suivant</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>

      {/* Bouton Dernière page */}
      {showFirstLast && currentPage < totalPages - 1 && (
        <>
          {currentPage < totalPages - 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <button
            onClick={handleLast}
            className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Dernière page"
          >
            {totalPages}
          </button>
        </>
      )}
    </nav>
  )
}

// Composant de pagination avec informations
interface PaginationWithInfoProps extends OptimizedPaginationProps {
  totalItems: number
  itemsPerPage: number
  showInfo?: boolean
}

export function PaginationWithInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  ...paginationProps
}: PaginationWithInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
      {/* Informations */}
      {showInfo && (
        <div className="text-sm text-gray-400">
          Affichage de <span className="font-medium text-white">{startItem}</span> à{' '}
          <span className="font-medium text-white">{endItem}</span> sur{' '}
          <span className="font-medium text-white">{totalItems}</span> éléments
        </div>
      )}

      {/* Pagination */}
      <OptimizedPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        {...paginationProps}
      />
    </div>
  )
}
