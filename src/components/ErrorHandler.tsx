'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandling } from '@/lib/error-logger'

interface ErrorHandlerProps {
  children: React.ReactNode
}

export function ErrorHandler({ children }: ErrorHandlerProps) {
  useEffect(() => {
    // Configurer la capture globale d'erreurs
    setupGlobalErrorHandling()
  }, [])

  return <>{children}</>
}
