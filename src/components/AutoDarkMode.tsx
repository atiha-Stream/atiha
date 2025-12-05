'use client'

import { useEffect, useState } from 'react'

export default function AutoDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(true) // Par défaut en mode sombre
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Détecter la préférence système
    const detectSystemPreference = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setSystemPreference('dark')
        setIsDarkMode(true)
      } else {
        setSystemPreference('light')
        setIsDarkMode(false)
      }
    }

    // Détecter la préférence stockée
    const detectStoredPreference = () => {
      const stored = localStorage.getItem('atiha-dark-mode')
      if (stored !== null) {
        setIsDarkMode(stored === 'true')
      } else {
        detectSystemPreference()
      }
    }

    // Détecter l'heure pour le mode automatique
    const detectTimeBasedMode = () => {
      const hour = new Date().getHours()
      const isNightTime = hour < 6 || hour > 18
      
      if (localStorage.getItem('atiha-auto-dark-mode') === 'true') {
        setIsDarkMode(isNightTime)
      }
    }

    // Initialisation
    detectStoredPreference()
    detectTimeBasedMode()

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
      
      // Si le mode automatique est activé, suivre la préférence système
      if (localStorage.getItem('atiha-auto-dark-mode') === 'true') {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)

    // Vérifier l'heure toutes les minutes
    const timeInterval = setInterval(detectTimeBasedMode, 60000)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange)
      clearInterval(timeInterval)
    }
  }, [])

  useEffect(() => {
    // Appliquer le mode sombre au document
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }

    // Sauvegarder la préférence
    localStorage.setItem('atiha-dark-mode', isDarkMode.toString())
  }, [isDarkMode])

  // Fonction pour basculer le mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Fonction pour activer le mode automatique
  const enableAutoMode = () => {
    localStorage.setItem('atiha-auto-dark-mode', 'true')
    const hour = new Date().getHours()
    const isNightTime = hour < 6 || hour > 18
    setIsDarkMode(isNightTime)
  }

  // Fonction pour désactiver le mode automatique
  const disableAutoMode = () => {
    localStorage.setItem('atiha-auto-dark-mode', 'false')
  }

  return {
    isDarkMode,
    systemPreference,
    toggleDarkMode,
    enableAutoMode,
    disableAutoMode
  }
}

// Hook pour utiliser le mode sombre
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isAutoMode, setIsAutoMode] = useState(false)

  useEffect(() => {
    // Charger les préférences
    const storedDarkMode = localStorage.getItem('atiha-dark-mode')
    const storedAutoMode = localStorage.getItem('atiha-auto-dark-mode')

    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true')
    }

    if (storedAutoMode !== null) {
      setIsAutoMode(storedAutoMode === 'true')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('atiha-dark-mode', newMode.toString())
  }

  const toggleAutoMode = () => {
    const newAutoMode = !isAutoMode
    setIsAutoMode(newAutoMode)
    localStorage.setItem('atiha-auto-dark-mode', newAutoMode.toString())

    if (newAutoMode) {
      // Activer le mode automatique basé sur l'heure
      const hour = new Date().getHours()
      const isNightTime = hour < 6 || hour > 18
      setIsDarkMode(isNightTime)
    }
  }

  return {
    isDarkMode,
    isAutoMode,
    toggleDarkMode,
    toggleAutoMode
  }
}

// Composant pour le sélecteur de thème
export function ThemeSelector() {
  const { isDarkMode, isAutoMode, toggleDarkMode, toggleAutoMode } = useDarkMode()

  return (
    <div className="bg-dark-200 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Thème</h3>
      
      <div className="space-y-3">
        {/* Mode automatique */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAutoMode}
            onChange={toggleAutoMode}
            className="w-4 h-4 text-primary-600 bg-dark-300 border-gray-600 rounded focus:ring-primary-500"
          />
          <span className="text-gray-300">Mode automatique (basé sur l&apos;heure)</span>
        </label>

        {/* Mode sombre manuel */}
        {!isAutoMode && (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleDarkMode}
              className="w-4 h-4 text-primary-600 bg-dark-300 border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-gray-300">Mode sombre</span>
          </label>
        )}

        {/* Indicateur de statut */}
        <div className="text-sm text-gray-400">
          {isAutoMode ? (
            <span>Mode automatique activé</span>
          ) : (
            <span>Mode {isDarkMode ? 'sombre' : 'clair'} activé</span>
          )}
        </div>
      </div>
    </div>
  )
}
