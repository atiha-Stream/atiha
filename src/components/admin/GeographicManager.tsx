'use client'

import React, { useState, useEffect } from 'react'
import { GeographicRestriction, Continent, GeographicStats } from '@/types/geographic'
import { GeographicService } from '@/lib/geographic-service'
import { logger } from '@/lib/logger'

export default function GeographicManager() {
  const [restrictions, setRestrictions] = useState<GeographicRestriction[]>([])
  const [stats, setStats] = useState<GeographicStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRestrictionName, setNewRestrictionName] = useState('')
  const [selectedContinents, setSelectedContinents] = useState<Continent[]>([])
  const [error, setError] = useState<string | null>(null)

  const continents: { value: Continent; label: string; flag: string }[] = [
    { value: 'america', label: 'Amérique (Nord & Sud)', flag: '🌎' },
    { value: 'europe', label: 'Europe', flag: '🇪🇺' },
    { value: 'asia', label: 'Asie', flag: '🌏' },
    { value: 'oceania', label: 'Océanie', flag: '🌊' },
    { value: 'africa', label: 'Afrique', flag: '🌍' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [restrictionsData, statsData] = await Promise.all([
        GeographicService.getAllRestrictions(),
        GeographicService.getGeographicStats()
      ])
      setRestrictions(restrictionsData)
      setStats(statsData)
    } catch (error) {
      logger.error('Erreur de chargement des données', error as Error)
      setError('Erreur lors du chargement des données. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleContinent = (continent: Continent) => {
    if (selectedContinents.includes(continent)) {
      setSelectedContinents(selectedContinents.filter(c => c !== continent))
    } else {
      setSelectedContinents([...selectedContinents, continent])
    }
  }

  const handleCreateRestriction = async () => {
    if (!newRestrictionName.trim() || selectedContinents.length === 0) {
      alert('Veuillez saisir un nom et sélectionner au moins un continent')
      return
    }

    setIsSaving(true)
    try {
      await GeographicService.createRestriction(newRestrictionName, selectedContinents)
      setNewRestrictionName('')
      setSelectedContinents([])
      setShowCreateForm(false)
      await loadData()
      
      // Vider le cache de vérification géographique pour forcer une nouvelle vérification
      localStorage.removeItem('atiha_geographic_check_cache')
      
      alert('Restriction créée avec succès !')
    } catch (error) {
      logger.error('Erreur de création', error as Error)
      alert('Erreur lors de la création de la restriction')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleRestriction = async (id: string) => {
    setIsSaving(true)
    try {
      const updatedRestrictions = restrictions.map(restriction => 
        restriction.id === id 
          ? { ...restriction, isActive: !restriction.isActive }
          : restriction
      )
      await GeographicService.saveRestrictions(updatedRestrictions)
      setRestrictions(updatedRestrictions)
      
      // Vider le cache de vérification géographique pour forcer une nouvelle vérification
      localStorage.removeItem('atiha_geographic_check_cache')
      
    } catch (error) {
      logger.error('Erreur de mise à jour', error as Error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRestriction = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette restriction ?')) {
      return
    }

    setIsSaving(true)
    try {
      await GeographicService.deleteRestriction(id)
      await loadData()
      
      // Vider le cache de vérification géographique pour forcer une nouvelle vérification
      localStorage.removeItem('atiha_geographic_check_cache')
      
      alert('Restriction supprimée avec succès !')
    } catch (error) {
      logger.error('Erreur de suppression', error as Error)
      alert('Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="ml-4 text-gray-400">Chargement des données géographiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-dark-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            🌍 Gestionnaire de Zones Géographiques
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            {showCreateForm ? 'Annuler' : '+ Nouvelle Restriction'}
          </button>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-sm text-gray-400">Utilisateurs Total</div>
            </div>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.allowedUsers}</div>
              <div className="text-sm text-green-300">Autorisés</div>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.blockedUsers}</div>
              <div className="text-sm text-red-300">Bloqués</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Object.values(stats.usersByContinent).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-blue-300">Par Continent</div>
            </div>
          </div>
        )}

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-dark-300 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Créer une Nouvelle Restriction</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de la restriction
              </label>
              <input
                type="text"
                value={newRestrictionName}
                onChange={(e) => setNewRestrictionName(e.target.value)}
                placeholder="Ex: Restriction Europe uniquement"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Continents autorisés
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {continents.map(continent => (
                  <label key={continent.value} className="flex items-center space-x-3 p-3 bg-dark-400 rounded-lg cursor-pointer hover:bg-dark-500 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedContinents.includes(continent.value)}
                      onChange={() => handleToggleContinent(continent.value)}
                      className="w-4 h-4 text-primary-600 bg-dark-500 border-gray-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-2xl">{continent.flag}</span>
                    <span className="text-white text-sm">{continent.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRestriction}
                disabled={isSaving || !newRestrictionName.trim() || selectedContinents.length === 0}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSaving ? 'Création...' : 'Créer la Restriction'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des restrictions */}
      <div className="bg-dark-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Restrictions Actives</h3>
        
        {restrictions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌍</div>
            <p className="text-gray-400 mb-2">Aucune restriction géographique configurée</p>
            <p className="text-sm text-gray-500">Tous les utilisateurs peuvent accéder à l&apos;application</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restrictions.map(restriction => (
              <div key={restriction.id} className="bg-dark-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-white font-medium">{restriction.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      restriction.isActive 
                        ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-900/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {restriction.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleRestriction(restriction.id)}
                      disabled={isSaving}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        restriction.isActive
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {restriction.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteRestriction(restriction.id)}
                      disabled={isSaving}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {restriction.continents.map(continent => (
                    <span key={continent} className="flex items-center space-x-1 px-3 py-1 bg-primary-900/20 text-primary-400 rounded-full text-sm">
                      <span>{GeographicService.getContinentFlag(continent)}</span>
                      <span>{GeographicService.getContinentDisplayName(continent)}</span>
                    </span>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Créé le {new Date(restriction.createdAt).toLocaleDateString('fr-FR')} • 
                  Modifié le {new Date(restriction.updatedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
          ℹ️ Comment ça fonctionne
        </h3>
        <div className="text-blue-300 text-sm space-y-2">
          <p>• <strong>Restrictions actives :</strong> Seuls les utilisateurs des continents sélectionnés peuvent accéder à l&apos;application</p>
          <p>• <strong>Aucune restriction :</strong> Tous les utilisateurs peuvent accéder à l&apos;application</p>
          <p>• <strong>Détection automatique :</strong> La localisation de l&apos;utilisateur est détectée via son adresse IP</p>
          <p>• <strong>Cache :</strong> La localisation est mise en cache pendant 24h pour améliorer les performances</p>
        </div>
      </div>
    </div>
  )
}
