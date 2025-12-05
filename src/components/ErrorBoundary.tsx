'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorLogger } from '@/lib/error-logger'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l&apos;erreur
    ErrorLogger.log(
      error,
      'critical',
      'javascript',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    )

    this.setState({ errorId: Date.now().toString() })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                Oups ! Une erreur s&apos;est produite
              </h1>
              
              <p className="text-gray-400 mb-6">
                Nous nous excusons pour ce désagrément. Notre équipe a été notifiée et travaille à résoudre le problème.
              </p>

              {this.state.errorId && (
                <div className="bg-dark-300 rounded-lg p-3 mb-4">
                  <p className="text-gray-500 text-sm">
                    ID d&apos;erreur : <code className="text-red-400">{this.state.errorId}</code>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>Réessayer</span>
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Retour à l&apos;accueil
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-gray-400 cursor-pointer hover:text-white">
                    Détails techniques (développement)
                  </summary>
                  <div className="mt-2 bg-dark-300 rounded-lg p-4">
                    <pre className="text-red-400 text-xs overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}


