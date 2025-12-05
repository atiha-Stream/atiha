'use client'

import React, { useState, useEffect } from 'react'
import { Episode, WatchProgress } from '@/types/content'
import { PlayIcon, PauseIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'
interface AutoPlayControlsProps {
  currentEpisode: Episode
  seriesId: string
  onNextEpisode: () => void
  onProgressUpdate: (progress: WatchProgress) => void
  className?: string
}

export default function AutoPlayControls({
  currentEpisode,
  seriesId,
  onNextEpisode,
  onProgressUpdate,
  className = ''
}: AutoPlayControlsProps) {
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [autoPlayDelay, setAutoPlayDelay] = useState(10) // 10 secondes par défaut

  // Démarrer le compte à rebours quand l'épisode se termine
  useEffect(() => {
    if (!autoPlayEnabled) return

    const checkEpisodeEnd = () => {
      // Simuler la vérification de fin d'épisode
      // En réalité, cela viendrait du lecteur vidéo
      const isNearEnd = false // À remplacer par la logique réelle
      
      if (isNearEnd && countdown === null) {
        startCountdown()
      }
    }

    const interval = setInterval(checkEpisodeEnd, 1000)
    return () => clearInterval(interval)
  }, [autoPlayEnabled, countdown])

  const startCountdown = () => {
    setCountdown(autoPlayDelay)
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          onNextEpisode()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelAutoPlay = () => {
    setCountdown(null)
  }

  const toggleAutoPlay = () => {
    setAutoPlayEnabled(!autoPlayEnabled)
    if (countdown) {
      setCountdown(null)
    }
  }

  const saveSettings = () => {
    // Sauvegarder les préférences dans localStorage
    localStorage.setItem('autoplay_settings', JSON.stringify({
      enabled: autoPlayEnabled,
      delay: autoPlayDelay
    }))
    setShowSettings(false)
  }

  // Charger les préférences au montage
  useEffect(() => {
    const savedSettings = localStorage.getItem('autoplay_settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setAutoPlayEnabled(settings.enabled ?? true)
        setAutoPlayDelay(settings.delay ?? 10)
      } catch (error) {
        logger.error('Error loading autoplay settings', error as Error)
      }
    }
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Contrôles d&apos;auto-play */}
      <div className="bg-dark-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAutoPlay}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoPlayEnabled
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {autoPlayEnabled ? (
                <PlayIcon className="w-4 h-4" />
              ) : (
                <PauseIcon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                Auto-play {autoPlayEnabled ? 'activé' : 'désactivé'}
              </span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Paramètres"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
          </div>

          {countdown !== null && (
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <p className="text-white text-sm font-medium">
                  Prochain épisode dans
                </p>
                <p className="text-primary-500 text-lg font-bold">
                  {countdown}s
                </p>
              </div>
              <button
                onClick={cancelAutoPlay}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                <span className="text-sm">Annuler</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal des paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Paramètres d&apos;auto-play</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Délai avant le prochain épisode (secondes)
                </label>
                <select
                  value={autoPlayDelay}
                  onChange={(e) => setAutoPlayDelay(parseInt(e.target.value))}
                  className="w-full bg-dark-300 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={5}>5 secondes</option>
                  <option value={10}>10 secondes</option>
                  <option value={15}>15 secondes</option>
                  <option value={30}>30 secondes</option>
                  <option value={60}>1 minute</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoplay-enabled"
                  checked={autoPlayEnabled}
                  onChange={(e) => setAutoPlayEnabled(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-dark-300 border-gray-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="autoplay-enabled" className="text-white text-sm">
                  Activer l&apos;auto-play automatiquement
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de progression de l'épisode */}
      <div className="bg-dark-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium">Progression de l&apos;épisode</h4>
          <span className="text-gray-400 text-sm">
            Épisode {currentEpisode.episodeNumber}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: '0%' }}>
            {/* La largeur sera mise à jour par le lecteur vidéo */}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          {currentEpisode.title}
        </p>
      </div>
    </div>
  )
}


