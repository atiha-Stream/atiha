'use client'

import React, { useState, useEffect } from 'react'
import type { UserProfile, UserPreferences, UserStats } from '@/types/user-profile'
import { UserProfileService } from '@/lib/user-profile-service'
import { useAuth } from '@/lib/auth-context'
import { 
  UserIcon, 
  CheckIcon, 
  PencilIcon, 
  ClockIcon, 
  PlayIcon, 
  EyeIcon, 
  StarIcon 
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'
interface UserProfileProps {
  className?: string
}

export default function UserProfile({ className = '' }: UserProfileProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'stats'>('profile')

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      let userProfile = await UserProfileService.getUserProfile(user.id)
      
      if (!userProfile) {
        // Créer un nouveau profil si il n&apos;existe pas
        userProfile = await UserProfileService.createUserProfile(user.id, user.name)
      }
      
      setProfile(userProfile)
      
      // Charger les statistiques
      const userStats = await UserProfileService.getUserStats(user.id)
      setStats(userStats)
    } catch (error) {
      logger.error('Error loading user profile', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    try {
      const updatedProfile = await UserProfileService.updateUserProfile(user.id, updates)
      if (updatedProfile) {
        setProfile(updatedProfile)
        setIsEditing(false)
      }
    } catch (error) {
      logger.error('Error updating profile', error as Error)
    }
  }

  const handleUpdatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user || !profile) return

    try {
      const success = await UserProfileService.updatePreferences(user.id, preferences)
      if (success) {
        setProfile(prev => prev ? {
          ...prev,
          preferences: { ...prev.preferences, ...preferences }
        } : null)
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (isLoading) {
    return (
      <div className={`bg-dark-200 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`bg-dark-200 rounded-lg p-6 text-center ${className}`}>
        <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">Profil non trouvé</h3>
        <p className="text-gray-400">Impossible de charger votre profil</p>
      </div>
    )
  }

  return (
    <div className={`bg-dark-200 rounded-lg ${className}`}>
      {/* En-tête du profil */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                  className="bg-dark-300 border border-gray-600 text-white px-3 py-1 rounded text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              )}
              
              <button
                onClick={() => isEditing ? handleUpdateProfile({}) : setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isEditing ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <PencilIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <p className="text-gray-400 mt-1">
              Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Profil
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preferences'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Préférences
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Statistiques
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                À propos de moi
              </label>
              {isEditing ? (
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                  className="w-full px-3 py-2 bg-dark-300 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Parlez-nous de vous..."
                  rows={3}
                />
              ) : (
                <p className="text-gray-300">
                  {profile.bio || "Aucune description pour le moment."}
                </p>
              )}
            </div>

            {/* Préférences de contenu */}
            <div>
              <h3 className="text-white font-semibold mb-3">Mes préférences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Genres favoris
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.favoriteGenres.map((genre, index) => (
                      <span
                        key={index}
                        className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                    {profile.preferences.favoriteGenres.length === 0 && (
                      <span className="text-gray-400 text-sm">Aucun genre favori</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Acteurs favoris
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.favoriteActors.map((actor, index) => (
                      <span
                        key={index}
                        className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm"
                      >
                        {actor}
                      </span>
                    ))}
                    {profile.preferences.favoriteActors.length === 0 && (
                      <span className="text-gray-400 text-sm">Aucun acteur favori</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Préférences de lecture */}
            <div>
              <h3 className="text-white font-semibold mb-4">Préférences de lecture</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 font-medium">Lecture automatique</label>
                    <p className="text-gray-400 text-sm">Passer automatiquement au prochain épisode</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.autoPlay}
                      onChange={(e) => handleUpdatePreferences({ autoPlay: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 font-medium">Sous-titres</label>
                    <p className="text-gray-400 text-sm">Afficher les sous-titres par défaut</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.subtitlesEnabled}
                      onChange={(e) => handleUpdatePreferences({ subtitlesEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">Qualité vidéo</label>
                  <select
                    value={profile.preferences.videoQuality}
                    onChange={(e) => handleUpdatePreferences({ videoQuality: e.target.value as any })}
                    className="w-full px-3 py-2 bg-dark-300 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="auto">Automatique</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Préférences de notification */}
            <div>
              <h3 className="text-white font-semibold mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 font-medium">Notifications email</label>
                    <p className="text-gray-400 text-sm">Recevoir des notifications par email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.emailNotifications}
                      onChange={(e) => handleUpdatePreferences({ emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 font-medium">Nouveaux contenus</label>
                    <p className="text-gray-400 text-sm">Être notifié des nouveaux films et séries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.preferences.newContentNotifications}
                      onChange={(e) => handleUpdatePreferences({ newContentNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <h3 className="text-white font-semibold mb-4">Mes statistiques</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-300 rounded-lg p-4 text-center">
                <ClockIcon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{formatDuration(stats.totalWatchTime)}</p>
                <p className="text-gray-400 text-sm">Temps total</p>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-4 text-center">
                <PlayIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.moviesWatched}</p>
                <p className="text-gray-400 text-sm">Films regardés</p>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-4 text-center">
                <EyeIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.episodesWatched}</p>
                <p className="text-gray-400 text-sm">Épisodes regardés</p>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-4 text-center">
                <StarIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
                <p className="text-gray-400 text-sm">Note moyenne</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Préférences</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Genre favori</span>
                    <span className="text-white">{stats.favoriteGenre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acteur favori</span>
                    <span className="text-white">{stats.mostWatchedActor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Réalisateur favori</span>
                    <span className="text-white">{stats.mostWatchedDirector}</span>
                  </div>
                </div>
              </div>

              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Records</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Série de visionnage</span>
                    <span className="text-white">{stats.watchStreak} jours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Session la plus longue</span>
                    <span className="text-white">{formatDuration(stats.longestWatchSession)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


