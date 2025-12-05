'use client'

import React from 'react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ErrorAlert } from '@/components/ErrorMessage'
import { ErrorLogger } from '@/lib/error-logger'

export function ErrorDemo() {
  const { error, errorDetails, clearError, handleError, handleAsyncError } = useErrorHandler()

  const triggerNetworkError = () => {
    handleError(new Error('Erreur de connexion réseau'), { 
      action: 'triggerNetworkError',
      timestamp: new Date().toISOString()
    })
  }

  const triggerValidationError = () => {
    handleError(new Error('Email invalide'), { 
      action: 'triggerValidationError',
      field: 'email'
    })
  }

  const triggerAsyncError = async () => {
    await handleAsyncError(async () => {
      // Simuler une erreur asynchrone
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Erreur de chargement des données')), 1000)
      })
    }, { action: 'triggerAsyncError' })
  }

  const triggerCriticalError = () => {
    ErrorLogger.log(
      new Error('Erreur critique détectée'),
      'critical',
      'javascript',
      { action: 'triggerCriticalError' }
    )
    handleError(new Error('Erreur critique détectée'))
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Démonstration de gestion d&apos;erreurs</h2>
      
      {error && (
        <ErrorAlert
          message={error}
          details={errorDetails || undefined}
          onClose={clearError}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={triggerNetworkError}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Erreur réseau
        </button>
        
        <button
          onClick={triggerValidationError}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Erreur de validation
        </button>
        
        <button
          onClick={triggerAsyncError}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Erreur asynchrone
        </button>
        
        <button
          onClick={triggerCriticalError}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Erreur critique
        </button>
      </div>
    </div>
  )
}


