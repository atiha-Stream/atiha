'use client'

import { useState, useEffect } from 'react'

interface UsePaginationProps {
  itemsPerPage?: number
}

export function usePagination({ itemsPerPage = 24 }: UsePaginationProps = {}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Lire les paramètres URL pour la pagination
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const pageParam = urlParams.get('page')
      if (pageParam) {
        const page = parseInt(pageParam)
        if (page > 0) {
          setCurrentPage(page)
        }
      }
    }
  }, [])

  // Fonction pour mettre à jour l'URL
  const updateURL = (page: number) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (page === 1) {
        url.searchParams.delete('page')
      } else {
        url.searchParams.set('page', page.toString())
      }
      window.history.pushState({}, '', url.toString())
    }
  }

  // Fonction pour changer de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      updateURL(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Fonction pour calculer le nombre total de pages
  const calculateTotalPages = (totalItems: number) => {
    const totalPagesCount = Math.ceil(totalItems / itemsPerPage)
    setTotalPages(totalPagesCount)
    
    // Réinitialiser à la page 1 si la page actuelle dépasse le nombre total de pages
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(1)
      updateURL(1)
    }
  }

  // Fonction pour obtenir les éléments de la page actuelle
  const getCurrentPageItems = <T>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  // Fonction pour réinitialiser à la page 1 (utile lors du changement de filtres)
  const resetToFirstPage = () => {
    setCurrentPage(1)
    updateURL(1)
  }

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    calculateTotalPages,
    getCurrentPageItems,
    resetToFirstPage
  }
}
