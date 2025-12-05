'use client'

import { useState, useCallback } from 'react'
import { ErrorLogger } from '@/lib/error-logger'
import { getErrorMessage, ErrorMessages } from '@/lib/error-messages'

interface UseErrorHandlerReturn {
  error: string | null
  errorDetails: string | null
  setError: (error: string | null) => void
  setErrorDetails: (details: string | null) => void
  clearError: () => void
  handleError: (error: any, context?: any) => void
  handleAsyncError: (asyncFn: () => Promise<any>, context?: any) => Promise<any>
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
    setErrorDetails(null)
  }, [])

  const handleError = useCallback((error: any, context?: any) => {
    const errorMessage = getErrorMessage(error)
    setError(errorMessage)
    
    // Logger l&apos;erreur
    ErrorLogger.log(
      error instanceof Error ? error : new Error(errorMessage),
      'medium',
      'javascript',
      context
    )
    
    // Ajouter des détails pour le développement
    if (process.env.NODE_ENV === 'development' && error?.stack) {
      setErrorDetails(error.stack)
    }
  }, [])

  const handleAsyncError = useCallback(async (asyncFn: () => Promise<any>, context?: any) => {
    try {
      clearError()
      return await asyncFn()
    } catch (error) {
      handleError(error, context)
      throw error
    }
  }, [handleError, clearError])

  return {
    error,
    errorDetails,
    setError,
    setErrorDetails,
    clearError,
    handleError,
    handleAsyncError
  }
}


