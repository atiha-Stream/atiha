'use client'

import { useState, useEffect } from 'react'
import { Country, PhoneValidation } from '@/types/phone'
import { PhoneValidationService } from '@/lib/phone-validation'
import { COUNTRIES } from '@/lib/countries'
import CountrySelector from './CountrySelector'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface PhoneInputProps {
  value: string
  onChange: (value: string, country: Country | null) => void
  onValidationChange?: (validation: PhoneValidation) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export default function PhoneInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "Numéro de téléphone",
  className = "",
  required = false
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [validation, setValidation] = useState<PhoneValidation>({
    isValid: false,
    formattedNumber: '',
    country: null
  })

  // Initialiser avec la France par défaut
  useEffect(() => {
    if (!selectedCountry) {
      const france = COUNTRIES.find(c => c.code === 'FR')
      if (france) {
        setSelectedCountry(france)
      }
    }
  }, [selectedCountry])

  // Valider le numéro quand il change
  useEffect(() => {
    if (selectedCountry && phoneNumber) {
      const validationResult = PhoneValidationService.validatePhoneNumber(phoneNumber, selectedCountry.code)
      setValidation(validationResult)
      onValidationChange?.(validationResult)
    } else {
      const emptyValidation: PhoneValidation = {
        isValid: false,
        formattedNumber: '',
        country: selectedCountry
      }
      setValidation(emptyValidation)
      onValidationChange?.(emptyValidation)
    }
  }, [phoneNumber, selectedCountry, onValidationChange])

  // Mettre à jour la valeur parent quand la validation change
  useEffect(() => {
    if (validation.isValid && validation.country) {
      onChange(validation.formattedNumber, validation.country)
    } else {
      onChange('', selectedCountry)
    }
  }, [validation, onChange, selectedCountry])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setPhoneNumber('') // Réinitialiser le numéro quand on change de pays
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '') // Garder seulement les chiffres
    setPhoneNumber(inputValue)
  }

  const getValidationIcon = () => {
    if (!phoneNumber) return null
    
    if (validation.isValid) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    } else {
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
    }
  }

  const getValidationMessage = () => {
    if (!phoneNumber) return null
    
    if (validation.isValid) {
      return (
        <div className="flex items-center space-x-2 text-green-400 text-sm mt-1">
          <CheckCircleIcon className="w-4 h-4" />
          <span>Numéro WhatsApp valide</span>
        </div>
      )
    } else if (validation.error) {
      return (
        <div className="text-red-400 text-sm mt-1">
          {validation.error}
        </div>
      )
    }
  }

  const getSuggestions = () => {
    if (!selectedCountry || !phoneNumber || validation.isValid) return null
    
    const suggestions = PhoneValidationService.getSuggestions(phoneNumber, selectedCountry)
    if (suggestions.length === 0) return null
    
    return (
      <div className="mt-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-blue-400 text-sm font-medium mb-1">Suggestions :</div>
            <ul className="text-blue-300 text-sm space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Sélecteur de pays */}
      <CountrySelector
        selectedCountry={selectedCountry}
        onCountrySelect={handleCountrySelect}
      />

      {/* Champ de saisie du numéro */}
      <div className="relative">
        <div className="flex items-center space-x-3">
          {/* Code pays (lecture seule) */}
          <div className="flex items-center space-x-2 px-3 py-3 bg-dark-300 border border-gray-600 rounded-lg text-gray-400">
            <span className="text-sm font-medium">
              {selectedCountry?.phoneCode || '+33'}
            </span>
          </div>

          {/* Champ de saisie */}
          <div className="flex-1 relative">
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder={selectedCountry?.example || "0612345678"}
              className="w-full px-4 py-3 bg-dark-300 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              required={required}
            />
            
            {/* Icône de validation */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getValidationIcon()}
            </div>
          </div>
        </div>

        {/* Message de validation */}
        {getValidationMessage()}

        {/* Suggestions */}
        {getSuggestions()}

        {/* Aperçu du numéro complet */}
        {validation.isValid && (
          <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="text-green-400 text-sm">
              <span className="font-medium">Numéro WhatsApp :</span> {validation.formattedNumber}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}