'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
  itemName: string
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemName
}: PaginationProps) {
  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 10
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si le total est petit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Logique pour afficher les pages avec ellipses
      if (currentPage <= 6) {
        // Début de la liste
        for (let i = 1; i <= 9; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 5) {
        // Fin de la liste
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 8; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Milieu de la liste
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 3; i <= currentPage + 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalItems <= itemsPerPage) {
    return null
  }

  return (
    <>
      {/* Pagination */}
      <div className="mt-12 flex justify-center">
        <div className="flex items-center space-x-2 bg-dark-200 rounded-lg p-2 border border-gray-700">
          {/* Bouton Précédent */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded transition-colors ${
              currentPage === 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Page précédente"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Numéros de page */}
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-3 py-2 rounded transition-colors ${
                    currentPage === page
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              )}
            </div>
          ))}

          {/* Bouton Suivant */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded transition-colors ${
              currentPage === totalPages
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Page suivante"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Informations de pagination */}
      <div className="mt-4 text-center text-gray-400 text-sm">
        Page {currentPage} sur {totalPages} • {totalItems} {itemName}{totalItems > 1 ? 's' : ''} au total
      </div>
    </>
  )
}
