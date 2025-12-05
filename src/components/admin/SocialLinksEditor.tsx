'use client'

import React, { useState, useEffect } from 'react'
import { HomepageContentService, HomepageContent } from '@/lib/homepage-content-service'
import { 
  LinkIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

export default function SocialLinksEditor() {
  const [content, setContent] = useState<HomepageContent | null>(null)
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    url: '',
    text: '',
    description: ''
  })

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = () => {
    logger.debug('SocialLinksEditor - Chargement du contenu')
    const homepageContent = HomepageContentService.getContent()
    logger.debug('SocialLinksEditor - Contenu chargé', { homepageContent })
    setContent(homepageContent)
  }

  const handleToggleVisibility = (platform: keyof HomepageContent['appIdentity']['socialLinks']) => {
    HomepageContentService.toggleSocialLinkVisibility(platform)
    loadContent()
  }

  const handleEditStart = (platform: keyof HomepageContent['appIdentity']['socialLinks']) => {
    if (!content) return
    
    const linkData = content.appIdentity.socialLinks[platform]
    setEditForm({
      url: linkData.url,
      text: linkData.text,
      description: linkData.description
    })
    setEditingPlatform(platform)
  }

  const handleEditSave = () => {
    if (!editingPlatform) return

    logger.debug('SocialLinksEditor - Sauvegarde du lien', { editingPlatform, editForm })

    HomepageContentService.updateSocialLink(editingPlatform as keyof HomepageContent['appIdentity']['socialLinks'], {
      url: editForm.url,
      text: editForm.text,
      description: editForm.description
    })

    console.log('🔍 SocialLinksEditor - Lien sauvegardé, rechargement du contenu')
    setEditingPlatform(null)
    setEditForm({ url: '', text: '', description: '' })
    loadContent()
  }

  const handleEditCancel = () => {
    setEditingPlatform(null)
    setEditForm({ url: '', text: '', description: '' })
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'telegram':
        return '📱'
      case 'discord':
        return '💬'
      case 'twitter':
        return '🐦'
      case 'instagram':
        return '📸'
      case 'youtube':
        return '📺'
      default:
        return '🔗'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'telegram':
        return 'bg-blue-500'
      case 'discord':
        return 'bg-indigo-500'
      case 'twitter':
        return 'bg-blue-400'
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'youtube':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (!content) {
    return (
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-gray-400 text-center mt-4">Chargement des liens sociaux...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <LinkIcon className="w-6 h-6 mr-2" />
            Gestion des Liens Sociaux
          </h2>
          <button
            onClick={() => {
              HomepageContentService.forceSocialLinksMigration()
              loadContent()
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            🔄 Forcer Migration
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Gérez les liens vers vos réseaux sociaux. Vous pouvez modifier l&apos;URL, le texte affiché et activer/désactiver chaque plateforme.
        </p>
      </div>

      {/* Liste des plateformes */}
      <div className="bg-dark-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Plateformes Disponibles</h3>
        
        <div className="space-y-4">
          {Object.entries(content.appIdentity.socialLinks).map(([platform, linkData]) => (
            <div key={platform} className="bg-dark-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Icône de la plateforme */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${getPlatformColor(platform)}`}>
                    {getPlatformIcon(platform)}
                  </div>

                  {/* Informations de la plateforme */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-white font-medium capitalize">{platform}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        linkData.isVisible 
                          ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                          : 'bg-gray-900/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {linkData.isVisible ? 'Visible' : 'Masqué'}
                      </span>
                    </div>
                    
                    {editingPlatform === platform ? (
                      /* Formulaire d'édition */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            URL
                          </label>
                          <input
                            type="url"
                            value={editForm.url}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="https://..."
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Texte affiché
                            </label>
                            <input
                              type="text"
                              value={editForm.text}
                              onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Ex: Telegram"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Ex: Nous suivre sur"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleEditSave}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>Sauvegarder</span>
                          </button>
                          
                          <button
                            onClick={handleEditCancel}
                            className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            <span>Annuler</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Affichage normal */
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">
                          <span className="font-medium">URL:</span> {linkData.url}
                        </p>
                        <p className="text-gray-400 text-sm">
                          <span className="font-medium">Texte:</span> {linkData.text}
                        </p>
                        <p className="text-gray-400 text-sm">
                          <span className="font-medium">Description:</span> {linkData.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {editingPlatform !== platform && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleVisibility(platform as keyof HomepageContent['appIdentity']['socialLinks'])}
                      className={`p-2 rounded-lg transition-colors ${
                        linkData.isVisible
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={linkData.isVisible ? 'Masquer' : 'Afficher'}
                    >
                      {linkData.isVisible ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEditStart(platform as keyof HomepageContent['appIdentity']['socialLinks'])}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aperçu */}
      <div className="bg-dark-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Aperçu du Footer</h3>
        
        <div className="bg-dark-300 rounded-lg p-4">
          <div className="flex flex-wrap gap-4">
            {Object.entries(content.appIdentity.socialLinks)
              .filter(([_, linkData]) => linkData.isVisible)
              .map(([platform, linkData]) => (
                <div
                  key={platform}
                  className={`flex items-center space-x-3 px-4 py-2 bg-gradient-to-r ${
                    platform === 'telegram' ? 'from-blue-600 to-blue-500' :
                    platform === 'discord' ? 'from-indigo-600 to-indigo-500' :
                    platform === 'twitter' ? 'from-blue-400 to-blue-300' :
                    platform === 'instagram' ? 'from-purple-600 to-pink-500' :
                    platform === 'youtube' ? 'from-red-600 to-red-500' :
                    'from-gray-600 to-gray-500'
                  } text-white rounded-lg border-2 shadow-lg`}
                >
                  <div className="text-lg">
                    {getPlatformIcon(platform)}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{linkData.description}</div>
                    <div className="font-bold">{linkData.text}</div>
                  </div>
                </div>
              ))}
          </div>
          
          {Object.values(content.appIdentity.socialLinks).filter(link => link.isVisible).length === 0 && (
            <p className="text-gray-400 text-center py-4">
              Aucun lien social visible. Activez au moins une plateforme pour l&apos;afficher.
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
          💡 Comment ça fonctionne
        </h3>
        <div className="text-blue-300 text-sm space-y-2">
          <p>• <strong>Modifier :</strong> Cliquez sur l&apos;icône crayon pour modifier l&apos;URL, le texte et la description</p>
          <p>• <strong>Activer/Désactiver :</strong> Cliquez sur l&apos;icône œil pour afficher ou masquer le lien</p>
          <p>• <strong>URL :</strong> L&apos;URL complète vers votre profil (ex: https://t.me/votre_channel)</p>
          <p>• <strong>Texte :</strong> Le nom affiché sur le bouton (ex: &quot;Telegram&quot;)</p>
          <p>• <strong>Description :</strong> Le texte descriptif (ex: &quot;Nous suivre sur&quot;)</p>
          <p>• <strong>Prévisualisation :</strong> L&apos;aperçu montre comment les liens apparaîtront sur votre site</p>
        </div>
      </div>
    </div>
  )
}
