'use client'

import React, { useState } from 'react'
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  className?: string
  width?: string
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  sortable?: boolean
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  actions?: (item: T) => React.ReactNode
  selectable?: boolean
  onSelectionChange?: (selectedItems: T[]) => void
}

export default function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  onSearch,
  sortable = false,
  onSort,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  pagination,
  actions,
  selectable = false,
  onSelectionChange
}: ResponsiveTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedItems, setSelectedItems] = useState<T[]>([])

  // Gestion de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  // Gestion du tri
  const handleSort = (key: keyof T) => {
    if (!sortable) return

    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  // Gestion de la sélection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems([...data])
    } else {
      setSelectedItems([])
    }
    onSelectionChange?.(checked ? [...data] : [])
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    let newSelection: T[]
    if (checked) {
      newSelection = [...selectedItems, item]
    } else {
      newSelection = selectedItems.filter(selected => selected !== item)
    }
    setSelectedItems(newSelection)
    onSelectionChange?.(newSelection)
  }

  // Données filtrées
  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    return columns.some(column => {
      const value = item[column.key]
      return value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  if (loading) {
    return (
      <div className={`bg-dark-200 rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header avec recherche */}
      {(searchable || selectable) && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {searchable && (
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            {selectable && selectedItems.length > 0 && (
              <div className="text-sm text-gray-400">
                {selectedItems.length} élément(s) sélectionné(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          {/* En-tête */}
          <thead className="bg-dark-300">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-dark-100 border-gray-600 rounded focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortable && column.sortable && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {sortKey === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )
                        ) : (
                          <FunnelIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Corps */}
          <tbody className="bg-dark-200 divide-y divide-gray-700">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-dark-100 transition-colors">
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={(e) => handleSelectItem(item, e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-dark-100 border-gray-600 rounded focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 text-sm text-gray-300 ${
                        column.className || ''
                      }`}
                    >
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {pagination.currentPage} sur {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm bg-dark-100 hover:bg-dark-300 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm bg-dark-100 hover:bg-dark-300 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant de carte pour les données sur mobile
interface ResponsiveCardProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  loading?: boolean
  emptyMessage?: string
  actions?: (item: T) => React.ReactNode
}

export function ResponsiveCard<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  onSearch,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  actions
}: ResponsiveCardProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    return columns.some(column => {
      const value = item[column.key]
      return value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  if (loading) {
    return (
      <div className={`bg-dark-200 rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recherche */}
      {searchable && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Cartes */}
      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map((item, index) => (
            <div key={index} className="bg-dark-200 rounded-lg p-4 border border-gray-700">
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={String(column.key)} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-400">
                      {column.label}:
                    </span>
                    <span className="text-sm text-white text-right flex-1 ml-4">
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </span>
                  </div>
                ))}
                {actions && (
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center space-x-2">
                      {actions(item)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
