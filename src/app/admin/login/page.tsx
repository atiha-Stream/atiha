'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/lib/admin-auth-context'
import { sanitizeString } from '@/lib/input-validation'
import { adminSecurity } from '@/lib/admin-security'
import { UserFriendlyErrorAlert, UserFriendlyWarningAlert } from '@/components/UserFriendlyError'
import { getErrorMessage, ErrorMessages } from '@/lib/error-messages'
import { ShieldCheckIcon, EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { HomepageContentService } from '@/lib/homepage-content-service'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const { login, isLoading, isAuthenticated } = useAdminAuth()
  const router = useRouter()
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  // Rediriger les admins connectés vers le dashboard admin
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Vérifier l'état du verrouillage
  useEffect(() => {
    const checkLockStatus = () => {
      const timeLeft = adminSecurity.getRemainingLockTime()
      setRemainingTime(timeLeft)
    }

    checkLockStatus()
    const interval = setInterval(checkLockStatus, 1000) // Vérifier chaque seconde

    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorDetails('')

    // Validation côté client
    if (!username.trim()) {
      setError(ErrorMessages.validation.required)
      return
    }

    if (!password.trim()) {
      setError(ErrorMessages.validation.required)
      return
    }

    try {
      const safeUsername = sanitizeString(username, { maxLen: 100 })
      await login({ username: safeUsername, password })
      router.push('/admin/dashboard')
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
  // ou si l'admin est connecté (pendant la redirection)
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo Admin */}
        <div className="text-center m-4">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-3xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
              <p className="text-red-400 text-sm font-medium">Administration</p>
            </div>
          </Link>
        </div>

        {/* Login Form */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20 m-4">
          <h1 className="text-2xl font-bold text-white mb-2">Connexion Admin</h1>
          <p className="text-gray-400 mb-6">Accès réservé aux administrateurs</p>

          {/* Alerte de verrouillage */}
          {remainingTime && remainingTime > 0 && (
            <UserFriendlyWarningAlert
              error="Compte temporairement verrouillé"
              title="🚨 COMPTE VERROUILLÉ"
              className="mb-4"
            />
          )}

          {/* Message d&apos;erreur normal */}
          {error && !remainingTime && (
            <UserFriendlyErrorAlert
              error={error}
              onClose={() => {
                setError('')
                setErrorDetails('')
              }}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="admin"
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
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
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
              disabled={isLoading || (remainingTime !== null && remainingTime > 0)}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Connexion...' : (remainingTime && remainingTime > 0) ? 'Compte verrouillé' : 'Se connecter'}
            </button>
          </form>

          {/* Lien de réinitialisation - affiché seulement après 30 minutes */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Mot de passe oublié ?{' '}
              <Link href="/admin/reset-password" className="text-red-500 hover:text-red-400 font-medium">
                Réinitialiser
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              ← Retour au site public
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
