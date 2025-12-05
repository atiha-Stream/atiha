'use client'

import { useState, useRef, useEffect } from 'react'
import { Country } from '@/types/phone'
import { getSortedCountries } from '@/lib/countries'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface CountrySelectorProps {
  selectedCountry: Country | null
  onCountrySelect: (country: Country) => void
  className?: string
}

export default function CountrySelector({ 
  selectedCountry, 
  onCountrySelect, 
  className = '' 
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [countries] = useState<Country[]>(getSortedCountries())
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrer les pays selon la recherche
  const filteredCountries = countries.filter(country => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase().trim()
    const countryNameLower = country.name.toLowerCase()
    const countryCodeLower = country.code.toLowerCase()
    
    // Recherche stricte : seulement si le terme correspond vraiment
    const nameStartsWith = countryNameLower.startsWith(searchLower)
    const nameContains = countryNameLower.includes(searchLower) && !nameStartsWith
    const codeMatches = countryCodeLower === searchLower
    const phoneCodeMatches = country.phoneCode === searchTerm.trim()
    
    // Recherche par mots séparés (plus stricte)
    const wordsMatch = countryNameLower.split(/[\s\-\(\)]+/).some(word => 
      word.startsWith(searchLower) || word === searchLower
    )
    
    return nameStartsWith || nameContains || codeMatches || phoneCodeMatches || wordsMatch
  }).sort((a, b) => {
    if (!searchTerm) return a.name.localeCompare(b.name)
    
    const searchLower = searchTerm.toLowerCase()
    const aNameLower = a.name.toLowerCase()
    const bNameLower = b.name.toLowerCase()
    
    // 1. Priorité absolue aux noms qui commencent par le terme
    const aStartsWith = aNameLower.startsWith(searchLower)
    const bStartsWith = bNameLower.startsWith(searchLower)
    
    if (aStartsWith && !bStartsWith) return -1
    if (!aStartsWith && bStartsWith) return 1
    
    // 2. Si les deux commencent, priorité aux plus courts
    if (aStartsWith && bStartsWith) {
      return aNameLower.length - bNameLower.length
    }
    
    // 3. Si aucun ne commence, trier par ordre alphabétique
    return aNameLower.localeCompare(bNameLower)
  })

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton de sélection */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-dark-300 border border-gray-600 text-white rounded-lg hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedCountry ? (
            <>
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div className="text-left">
                <div className="font-medium">{selectedCountry.name}</div>
                <div className="text-sm text-gray-400">{selectedCountry.phoneCode}</div>
              </div>
            </>
          ) : (
            <span className="text-gray-400">Sélectionner un pays</span>
          )}
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-dark-200 border border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-gray-600">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full pl-10 pr-4 py-2 bg-dark-300 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>
          </div>

          {/* Liste des pays */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-dark-300 transition-colors text-left"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white flex items-center space-x-2">
                      <span className="text-sm font-mono country-code-white">{country.code}</span>
                      <span>{country.name}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {country.phoneCode} • Ex: {country.example}
                    </div>
                  </div>
                  {selectedCountry?.code === country.code && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}