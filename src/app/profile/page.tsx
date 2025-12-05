'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import PushNotifications from '@/components/PushNotifications'
import { PlayIcon, UserIcon, ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { HomepageContentService } from '@/lib/homepage-content-service'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
    
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Validation
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
        return
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
        return
      }

      // Mise à jour des données utilisateur
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }

      // Si un nouveau mot de passe est fourni, l&apos;ajouter
      if (formData.newPassword) {
        updatedUser.password = formData.newPassword
      }

      await updateUser(updatedUser)
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
      
      // Réinitialiser les champs de mot de passe
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
        {/* Header */}
        <header className="bg-dark-400/50 backdrop-blur-sm border-b border-gray-700">
          <div className="px-6 py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Retour</span>
                </Link>
              </div>
              
              <Link href="/" className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={isClient ? { backgroundColor: content.appIdentity.colors.primary } : { backgroundColor: '#3B82F6' }}
                >
                  <PlayIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{isClient ? content.appIdentity.name : 'Atiha'}</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Mon Profil</h1>
              <p className="text-sm sm:text-base text-gray-400">
                Gérez vos informations personnelles et votre mot de passe
              </p>
            </div>

            {/* Profile Form */}
            <div className="bg-dark-400/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message de statut */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-900/50 border border-green-700 text-green-300' 
                      : 'bg-red-900/50 border border-red-700 text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Informations personnelles</span>
                  </h3>

                  {/* Nom du profil */}
                  <div>
                    <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Nom du profil *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-dark-300 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent"
                      style={isClient ? {
                        '--tw-ring-color': content.appIdentity.colors.primary
                      } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                      onFocus={(e) => {
                        if (isClient) {
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                      }}
                      placeholder="Votre nom complet"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-dark-300 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent"
                      style={isClient ? {
                        '--tw-ring-color': content.appIdentity.colors.primary
                      } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                      onFocus={(e) => {
                        if (isClient) {
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                      }}
                      placeholder="votre@email.com"
                    />
                  </div>

                  {/* Numéro de téléphone */}
                  <div>
                    <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-dark-300 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent"
                      style={isClient ? {
                        '--tw-ring-color': content.appIdentity.colors.primary
                      } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                      onFocus={(e) => {
                        if (isClient) {
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                      }}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-700 my-6"></div>

                {/* Mot de passe */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Changer le mot de passe</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Laissez vide si vous ne souhaitez pas changer votre mot de passe
                  </p>

                  {/* Mot de passe actuel */}
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-dark-300 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent pr-12"
                        style={isClient ? {
                          '--tw-ring-color': content.appIdentity.colors.primary
                        } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                        onFocus={(e) => {
                          if (isClient) {
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                          }
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                        }}
                        placeholder="Votre mot de passe actuel"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div>
                    <label htmlFor="newPassword" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-dark-300 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent pr-12"
                        style={isClient ? {
                          '--tw-ring-color': content.appIdentity.colors.primary
                        } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                        onFocus={(e) => {
                          if (isClient) {
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                          }
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                        }}
                        placeholder="Nouveau mot de passe (min. 6 caractères)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer le mot de passe */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-dark-300 border border-gray-600 rounded-lg text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-transparent"
                      style={isClient ? {
                        '--tw-ring-color': content.appIdentity.colors.primary
                      } as React.CSSProperties & { '--tw-ring-color': string } : {}}
                      onFocus={(e) => {
                        if (isClient) {
                          e.currentTarget.style.boxShadow = `0 0 0 2px ${content.appIdentity.colors.primary}`
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                      }}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                  </div>
                </div>

                {/* Boutons d&apos;action */}
                <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-gray-400 hover:text-white transition-colors text-center"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    style={isClient ? { 
                      backgroundColor: content.appIdentity.colors.primary,
                      '--hover-color': content.appIdentity.colors.secondary
                    } as React.CSSProperties : { backgroundColor: '#3B82F6' }}
                    onMouseEnter={(e) => {
                      if (isClient && !e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = content.appIdentity.colors.secondary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClient && !e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = content.appIdentity.colors.primary
                      }
                    }}
                  >
                    {isLoading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                  </button>
                </div>
              </form>
            </div>

            {/* Section Notifications */}
            <div className="bg-dark-200 rounded-lg p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-6 flex items-center">
                <UserIcon 
                  className="w-5 h-5 sm:w-6 sm:h-6 mr-3" 
                  style={isClient ? { color: content.appIdentity.colors.primary } : { color: '#3B82F6' }}
                />
                Notifications et Préférences
              </h2>
              <PushNotifications />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}