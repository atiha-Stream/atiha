'use client'

import React, { useState, useEffect } from 'react'
import { GeographicService } from '@/lib/geographic-service'
import { UserLocation } from '@/types/geographic'
import { logger } from '@/lib/logger'

interface GeographicBlockerProps {
  children: React.ReactNode
  bypassForAdmin?: boolean
}

export default function GeographicBlocker({ children, bypassForAdmin = true }: GeographicBlockerProps) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // En mode développement, autoriser l'accès par défaut
        if (process.env.NODE_ENV === 'development') {
          setIsAllowed(true)
          setIsLoading(false)
          return
        }

        // Vérifier si l&apos;utilisateur est admin (bypass possible)
        if (bypassForAdmin) {
          const isAdmin = localStorage.getItem('atiha_admin_logged_in') === 'true'
          if (isAdmin) {
            setIsAllowed(true)
            setIsLoading(false)
            return
          }
        }

        // Vérifier le cache de vérification géographique
        const cacheKey = 'atiha_geographic_check_cache'
        const cachedCheck = localStorage.getItem(cacheKey)
        if (cachedCheck) {
          const { isAllowed: cachedAllowed, userLocation: cachedLocation, timestamp } = JSON.parse(cachedCheck)
          const now = Date.now()
          const cacheAge = now - timestamp
          const maxCacheAge = 5 * 60 * 1000 // 5 minutes

          if (cacheAge < maxCacheAge) {
            setIsAllowed(cachedAllowed)
            setUserLocation(cachedLocation)
            setIsLoading(false)
            return
          }
        }

        // Détecter la localisation de l&apos;utilisateur
        const location = await GeographicService.detectUserLocation()
        setUserLocation(location)

        // Vérifier si l&apos;utilisateur est autorisé
        const allowed = await GeographicService.isUserAllowed()
        setIsAllowed(allowed)

        // Mettre en cache le résultat
        localStorage.setItem(cacheKey, JSON.stringify({
          isAllowed: allowed,
          userLocation: location,
          timestamp: Date.now()
        }))

      } catch (error) {
        logger.error('Erreur de vérification géographique', error as Error)
        setError('Erreur de vérification de localisation')
        // En cas d&apos;erreur, autoriser l&apos;accès par défaut
        setIsAllowed(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [bypassForAdmin])

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🌍</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Vérification de votre localisation</h2>
          <p className="text-gray-400">Veuillez patienter pendant que nous vérifions votre accès...</p>
        </div>
      </div>
    )
  }

  // Écran d&apos;erreur
  if (error) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Erreur de Vérification
          </h1>
          <p className="text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Écran de blocage géographique
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-dark-200 rounded-lg p-8 text-center">
          {/* Icône principale */}
          <div className="text-8xl mb-6">🌍</div>
          
          {/* Titre */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Accès Restreint
          </h1>
          
          {/* Message principal */}
          <p className="text-gray-400 mb-6 text-lg">
            Désolé, cette application n&apos;est pas disponible dans votre région.
          </p>
          
          {/* Informations de localisation */}
          {userLocation && (
            <div className="bg-dark-300 rounded-lg p-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center justify-center">
                <span className="mr-2">📍</span>
                Votre localisation détectée
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Pays :</span>
                  <span className="text-white font-medium">{userLocation.country}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Continent :</span>
                  <span className="text-white font-medium flex items-center">
                    <span className="mr-2">{GeographicService.getContinentFlag(userLocation.continent)}</span>
                    {GeographicService.getContinentDisplayName(userLocation.continent)}
                  </span>
                </div>
                {userLocation.region && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Région :</span>
                    <span className="text-white font-medium">{userLocation.region}</span>
                  </div>
                )}
                {userLocation.city && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ville :</span>
                    <span className="text-white font-medium">{userLocation.city}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Message d&apos;information */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm">
              <strong>Pourquoi suis-je bloqué ?</strong><br />
              L&apos;administrateur de cette application a configuré des restrictions géographiques. 
              Seuls les utilisateurs de certaines régions peuvent accéder au contenu.
            </p>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // Vider le cache et recharger
                localStorage.removeItem('atiha_geographic_check_cache')
                window.location.reload()
              }}
              className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              🔄 Réessayer
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              ← Retour
            </button>
          </div>
          
          {/* Contact */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Pour plus d&apos;informations ou pour demander un accès, 
              contactez l&apos;administrateur de l&apos;application.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Accès autorisé - afficher le contenu normal
  return <>{children}</>
}

// Composant pour afficher les informations de debug (uniquement en développement)
export function GeographicDebugInfo() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const location = await GeographicService.detectUserLocation()
        const allowed = await GeographicService.isUserAllowed()
        setUserLocation(location)
        setIsAllowed(allowed)
      } catch (error) {
        logger.error('Erreur de chargement des infos debug', error as Error)
      }
    }

    loadDebugInfo()
  }, [])

  // Ne s&apos;affiche qu&apos;en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-dark-800 border border-gray-600 rounded-lg p-4 text-xs max-w-sm z-50">
      <h4 className="text-white font-semibold mb-2">🌍 Debug Géographique</h4>
      {userLocation && (
        <div className="space-y-1 text-gray-300">
          <div>Pays: {userLocation.country}</div>
          <div>Continent: {userLocation.continent}</div>
          <div>IP: {userLocation.ip}</div>
          <div>Autorisé: {isAllowed ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  )
}
