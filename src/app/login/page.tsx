'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { PlayIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { UserFriendlyErrorAlert } from '@/components/UserFriendlyError'
import { getErrorMessage, ErrorMessages } from '@/lib/error-messages'
import { HomepageContentService } from '@/lib/homepage-content-service'
import SessionManagementModal from '@/components/SessionManagementModal'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const { login, isLoading, sessionValidationResult, isAuthenticated } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  // Rediriger les utilisateurs connectés vers le dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Gérer l'affichage du modal de gestion des sessions
  useEffect(() => {
    if (sessionValidationResult && !sessionValidationResult.canLogin) {
      setShowSessionModal(true)
      // Récupérer l'ID utilisateur depuis l'email (temporaire)
      setCurrentUserId(email) // On utilisera l'email comme ID temporaire
    }
  }, [sessionValidationResult, email])

  const handleSessionModalClose = () => {
    setShowSessionModal(false)
    setCurrentUserId(null)
  }

  const handleSessionDisconnected = () => {
    // Relancer la tentative de connexion
    handleSubmit(new Event('submit') as any)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorDetails('')

    // Validation côté client
    if (!email.trim()) {
      setError(ErrorMessages.validation.required)
      return
    }

    if (!password.trim()) {
      setError(ErrorMessages.validation.required)
      return
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(ErrorMessages.auth.invalidEmail)
      return
    }

    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (error: any) {
      const errorMessage = getErrorMessage(error, ErrorMessages.auth.invalidCredentials)
      setError(errorMessage)
      
      // Ajouter des détails pour le développement
      if (process.env.NODE_ENV === 'development' && error?.stack) {
        setErrorDetails(error.stack)
      }
    }
  }

  // Afficher un écran de chargement pendant la vérification de l'authentification
  // ou si l'utilisateur est connecté (pendant la redirection)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center m-4">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
            >
              <PlayIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 m-4">
          <h1 className="text-2xl font-bold text-white mb-2">Connexion</h1>
          <p className="text-gray-400 mb-6">Connectez-vous à votre compte</p>

          {error && (
            <UserFriendlyErrorAlert
              error={error}
              onClose={() => {
                setError('')
                setErrorDetails('')
              }}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              style={isClient ? { 
                backgroundColor: content.appIdentity.colors.primary,
                '--hover-color': content.appIdentity.colors.secondary
              } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
              onMouseEnter={(e) => {
                if (isClient && !isLoading) {
                  e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                }
              }}
              onMouseLeave={(e) => {
                if (isClient && !isLoading) {
                  e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                }
              }}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Pas encore de compte ?{' '}
              <Link 
                href="/register" 
                className="font-medium transition-colors"
                style={isClient ? { 
                  color: content.appIdentity.colors.primary,
                  '--hover-color': content.appIdentity.colors.secondary
                } as React.CSSProperties : { color: '#3B82F6' }}
                onMouseEnter={(e) => {
                  if (isClient) {
                    e.currentTarget.style.color = content.appIdentity.colors.secondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClient) {
                    e.currentTarget.style.color = content.appIdentity.colors.primary
                  }
                }}
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center space-y-2">
            <div>
              <Link href="/reset-password" className="text-red-500 hover:text-red-400 text-sm font-medium">
                Mot de passe oublié ? Réinitialiser
              </Link>
            </div>
            <div>
              <Link href="/" className="text-gray-400 hover:text-white text-sm">
                ← Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de gestion des sessions */}
      {showSessionModal && currentUserId && sessionValidationResult && (
        <SessionManagementModal
          isOpen={showSessionModal}
          onClose={handleSessionModalClose}
          userId={currentUserId}
          activeSessions={sessionValidationResult.activeSessions || []}
          onSessionDisconnected={handleSessionDisconnected}
        />
      )}
    </div>
  )
}
