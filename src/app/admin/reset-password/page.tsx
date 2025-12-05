'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-context'
import { adminSecurity } from '@/lib/admin-security'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function AdminResetPasswordPage() {
  const [securityCode, setSecurityCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSecurityCode, setShowSecurityCode] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()

  // Rediriger les admins connectés vers le dashboard admin
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!securityCode || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    const settings = adminSecurity.getSecuritySettings()
    if (newPassword.length < settings.passwordMinLength) {
      setError(`Le mot de passe doit contenir au moins ${settings.passwordMinLength} caractères`)
      return
    }

    setIsLoading(true)

    try {
      const result = adminSecurity.resetPasswordWithSecurityCode(securityCode, newPassword)
      
      if (result.success) {
        setSuccess(true)
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/admin/login')
        }, 3000)
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError('Erreur lors de la réinitialisation du mot de passe')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    return {
      score: strength,
      label: strength < 3 ? 'Faible' : strength < 5 ? 'Moyen' : 'Fort',
      color: strength < 3 ? 'text-red-400' : strength < 5 ? 'text-yellow-400' : 'text-green-400'
    }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  // Afficher un écran de chargement pendant la vérification de l'authentification
  // ou si l'admin est connecté (pendant la redirection)
  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 text-center m-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Mot de passe réinitialisé !</h1>
            <p className="text-gray-400 mb-6">
              Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center m-4">
          <Link href="/admin/login" className="inline-flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour à la connexion</span>
          </Link>
        </div>

        {/* Reset Form */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 m-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Réinitialisation du mot de passe</h1>
            <p className="text-gray-400">
              Utilisez votre code de sécurité pour réinitialiser votre mot de passe
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 flex items-center space-x-2">
              <XCircleIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code de sécurité */}
            <div>
              <label htmlFor="securityCode" className="block text-sm font-medium text-gray-300 mb-2">
                Code de sécurité *
              </label>
              <div className="relative">
                <input
                  type={showSecurityCode ? 'text' : 'password'}
                  id="securityCode"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  placeholder="Entrez votre code de sécurité"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecurityCode(!showSecurityCode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSecurityCode ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  placeholder="Nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Force:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score < 3 ? 'bg-red-500' :
                          passwordStrength.score < 5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation du mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                  placeholder="Confirmer le mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Indicateur de correspondance */}
              {confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-400">Les mots de passe correspondent</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-400">Les mots de passe ne correspondent pas</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !securityCode || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Réinitialisation...</span>
                </>
              ) : (
                <>
                  <KeyIcon className="w-5 h-5" />
                  <span>Réinitialiser le mot de passe</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link href="/admin/login" className="text-red-500 hover:text-red-400 font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
