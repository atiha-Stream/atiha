'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { userDatabase } from '@/lib/user-database'
import { HomepageContentService } from '@/lib/homepage-content-service'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [step, setStep] = useState<'email' | 'phone' | 'reset'>('email')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  // Rediriger les utilisateurs connectés vers le dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Vérifier si l&apos;email existe
      const user = userDatabase.findUserByEmail(email)
      if (!user) {
        setError('Aucun compte trouvé avec cet email')
        return
      }

      // Passer à l'étape de vérification du numéro
      setStep('phone')
    } catch (error) {
      setError('Erreur lors de la vérification de l\'email')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Vérifier si l&apos;email et le numéro correspondent
      const user = userDatabase.findUserByEmail(email)
      if (!user) {
        setError('Aucun compte trouvé avec cet email')
        return
      }

      // Vérifier le numéro de téléphone
      if (user.phone !== phone) {
        setError('Numéro de téléphone incorrect')
        return
      }

      // Passer à l'étape de réinitialisation
      setStep('reset')
    } catch (error) {
      setError('Erreur lors de la vérification du numéro')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Vérifier que les mots de passe correspondent
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }

      if (newPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        return
      }

      // Mettre à jour le mot de passe
      const user = userDatabase.findUserByEmail(email)
      if (!user) {
        setError('Utilisateur non trouvé')
        return
      }

      // Mettre à jour le mot de passe
      userDatabase.updateUser(user.id, { password: newPassword })

      setSuccess('Mot de passe réinitialisé avec succès !')
      setStep('email')
      setEmail('')
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPassword('')
    } catch (error) {
      setError('Erreur lors de la réinitialisation')
    } finally {
      setIsLoading(false)
    }
  }

  // Afficher un écran de chargement pendant la vérification de l'authentification
  // ou si l'utilisateur est connecté (pendant la redirection)
  if (authLoading || isAuthenticated) {
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
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#EF4444' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <span className="text-3xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
              <p className="text-red-400 text-sm font-medium">Réinitialisation</p>
            </div>
          </Link>
        </div>

        {/* Form */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20 m-4">
          <h1 className="text-2xl font-bold text-white mb-2">Réinitialiser le mot de passe</h1>
          <p className="text-gray-400 mb-6">
            {step === 'email' && 'Entrez votre email pour commencer'}
            {step === 'phone' && 'Entrez votre numéro pour continuer'}
            {step === 'reset' && 'Choisissez un nouveau mot de passe'}
          </p>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Étape 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Vérification...' : 'Continuer'}
              </button>
            </form>
          )}

          {/* Étape 2: Vérification du numéro */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Numéro de téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="+24101254698"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Vérification...' : 'Continuer'}
                </button>
              </div>
            </form>
          )}

          {/* Étape 3: Réinitialisation */}
          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau mot de passe *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Nouveau mot de passe"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Confirmer le nouveau mot de passe"
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
