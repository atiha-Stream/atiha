'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { PlayIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import PhoneInput from '@/components/PhoneInput'
import { Country, PhoneValidation } from '@/types/phone'
import { HomepageContentService } from '@/lib/homepage-content-service'
import { premiumCodesService } from '@/lib/premium-codes-service'
import { subscriptionNotificationsService } from '@/lib/subscription-notifications-service'
import { validateUsername, isValidEmail, validatePhone } from '@/lib/input-validation'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidation | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const { register, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const [hasInscriptionCode, setHasInscriptionCode] = useState(false)
  const [essaiGratuitNotification, setEssaiGratuitNotification] = useState(subscriptionNotificationsService.getEssaiGratuitNotification())

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    // Vérifier s'il y a un code d'inscription actif
    const inscriptionCode = premiumCodesService.getActiveInscriptionCode()
    setHasInscriptionCode(!!inscriptionCode)
    
    // Charger les notifications d&apos;abonnement
    setEssaiGratuitNotification(subscriptionNotificationsService.getEssaiGratuitNotification())
  }, [])

  // Rediriger les utilisateurs connectés vers le dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Écouter les mises à jour des notifications
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      setEssaiGratuitNotification(subscriptionNotificationsService.getEssaiGratuitNotification())
    }

    window.addEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
    return () => window.removeEventListener('subscriptionNotificationsUpdated', handleNotificationsUpdate)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 🔒 VALIDATION DES DONNÉES
    if (!name || !email || !password || !confirmPassword || !phone) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Valider le nom
    const nameValidation = validateUsername(name)
    if (!nameValidation.isValid) {
      setError(nameValidation.error || 'Nom invalide')
      return
    }

    // Valider l'email
    if (!isValidEmail(email)) {
      setError('Adresse email invalide')
      return
    }

    // Valider le téléphone
    const phoneValidationResult = validatePhone(phone)
    if (!phoneValidationResult.isValid) {
      setError(phoneValidationResult.error || 'Numéro de téléphone invalide')
      return
    }

    // Vérifier la validation du téléphone (maintenant obligatoire)
    if (!phoneValidation || !phoneValidation.isValid) {
      setError('Veuillez saisir un numéro de téléphone WhatsApp valide')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      const result = await register({ 
        name, 
        email, 
        password, 
        confirmPassword,
        phone: phone,
        country: selectedCountry?.code || undefined
      })
      
      // Marquer dans localStorage qu'une notification de bienvenue doit être affichée
      localStorage.setItem('show_welcome_notification', JSON.stringify({
        hasPremiumTrial: result.hasPremiumTrial,
        trialDays: result.trialDays,
        timestamp: Date.now()
      }))
      
      // Rediriger vers le dashboard (la notification sera affichée là-bas)
      setTimeout(() => {
        router.push('/dashboard?from=registration')
      }, 500)
      
    } catch (error) {
      setError('Erreur lors de l\'inscription')
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

        {/* Register Form */}
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 m-4">
          <h1 className="text-2xl font-bold text-white mb-2">Inscription</h1>
          <p className="text-gray-400 mb-6">Créez votre compte {isClient ? content.appIdentity.name : 'Atiha'}</p>

          {/* Notification d'essai gratuit */}
          {hasInscriptionCode && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">🎉</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-green-400 font-semibold text-sm sm:text-base">{essaiGratuitNotification.title}</h3>
                  <p className="text-green-300 text-xs sm:text-sm">
                    {essaiGratuitNotification.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nom et prénom *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nom et prénom"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email *
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

            {/* Champ téléphone WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Numéro WhatsApp *
              </label>
              <PhoneInput
                value={phone}
                onChange={(value, country) => {
                  setPhone(value)
                  setSelectedCountry(country)
                }}
                onValidationChange={setPhoneValidation}
                placeholder="Numéro de téléphone"
                required={true}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe *
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
                  className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
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
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <Link 
                href="/login" 
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
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
