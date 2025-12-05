'use client'

import { useState, useEffect } from 'react'
import { Admin, AdminPermission, AVAILABLE_PERMISSIONS } from '@/types/admin'
import { adminManagement } from '@/lib/admin-management'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { logger } from '@/lib/logger'

interface AdminManagementProps {
  onCreateAdmin: () => void
  onEditAdmin: (admin: Admin) => void
  onDeleteAdmin: (admin: Admin) => void
}

export default function AdminManagement({ 
  onCreateAdmin, 
  onEditAdmin, 
  onDeleteAdmin 
}: AdminManagementProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = () => {
    try {
      const allAdmins = adminManagement.getAllAdmins()
      setAdmins(allAdmins)
    } catch (error) {
      logger.error('Erreur lors du chargement des administrateurs', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (adminId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [adminId]: !prev[adminId]
    }))
  }

  const handleToggleStatus = async (admin: Admin) => {
    const result = adminManagement.toggleAdminStatus(admin.id)
    
    if (result.success) {
      loadAdmins()
      // Note: Amélioration future - remplacer alert() par un système de notifications toast
    } else {
      alert(result.message)
    }
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Récupérer tous les rôles uniques pour le filtre
  const uniqueRoles = Array.from(new Set(admins.map(admin => admin.role)))

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    // Couleurs par défaut pour les rôles
    const defaultColors: Record<string, string> = {
      'leGenny': 'bg-red-500',
      'Contenu': 'bg-blue-500',
      'Abonnement': 'bg-green-500',
      'Identité visuelle': 'bg-purple-500',
      'Sécurité': 'bg-orange-500'
    }
    return defaultColors[role] || 'bg-gray-500'
  }

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      'leGenny': 'Administrateur principal avec tous les privilèges',
      'Contenu': 'Gestion du contenu multimédia',
      'Abonnement': 'Gestion des abonnements et facturation',
      'Identité visuelle': 'Gestion de l\'apparence et du design',
      'Sécurité': 'Gestion de la sécurité et des accès'
    }
    return descriptions[role] || 'Rôle personnalisé'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Chargement des administrateurs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Administrateurs</h2>
          <p className="text-gray-400 mt-1">
            Gérez les comptes administrateurs et leurs permissions
          </p>
        </div>
        
        <button
          onClick={onCreateAdmin}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Ajouter un Admin</span>
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un administrateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-dark-100 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filtre par rôle */}
          <div className="sm:w-64">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les rôles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Admins</p>
              <p className="text-white text-xl font-bold">{admins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Actifs</p>
              <p className="text-white text-xl font-bold">
                {admins.filter(admin => admin.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Rôles uniques</p>
              <p className="text-white text-xl font-bold">
                {new Set(admins.map(admin => admin.role)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des administrateurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAdmins.map((admin) => (
          <div
            key={admin.id}
            className={`bg-dark-200/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 hover:shadow-lg ${
              admin.isActive 
                ? 'border-gray-700 hover:border-gray-600' 
                : 'border-red-700/50 bg-red-900/10'
            }`}
          >
            {/* Header de la carte */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${getRoleColor(admin.role)} rounded-lg flex items-center justify-center`}>
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{admin.username}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(admin.role)} text-white`}>
                      {admin.role}
                    </span>
                    {admin.isActive ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description du rôle */}
            <p className="text-gray-400 text-sm mb-3">
              {getRoleDescription(admin.role)}
            </p>

            {/* Permissions */}
            <div className="mb-4">
              <p className="text-gray-300 text-xs font-medium mb-2">Permissions :</p>
              <div className="flex flex-wrap gap-1">
                {admin.permissions.slice(0, 3).map((permission, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full"
                  >
                    {permission}
                  </span>
                ))}
                {admin.permissions.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                    +{admin.permissions.length - 3} autres
                  </span>
                )}
              </div>
            </div>

            {/* Mot de passe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showPasswords[admin.id] ? 'text' : 'password'}
                  value={admin.password}
                  readOnly
                  className="flex-1 px-3 py-2 bg-dark-100 border border-gray-600 rounded-lg text-white text-sm"
                />
                {admin.username !== 'leGenny' && (
                  <button
                    onClick={() => togglePasswordVisibility(admin.id)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPasswords[admin.id] ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Informations de dates */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>Créé le {formatDate(admin.createdAt)}</span>
              </div>
              {admin.lastLogin && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Dernière connexion: {formatDate(admin.lastLogin)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleStatus(admin)}
                  disabled={admin.username === 'leGenny'}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    admin.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } ${admin.username === 'leGenny' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {admin.isActive ? 'Désactiver' : 'Activer'}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {admin.username !== 'leGenny' && (
                  <>
                    <button
                      onClick={() => onEditAdmin(admin)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteAdmin(admin)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredAdmins.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            {searchTerm || roleFilter !== 'all' ? 'Aucun administrateur trouvé' : 'Aucun administrateur'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || roleFilter !== 'all' 
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par ajouter votre premier administrateur'
            }
          </p>
        </div>
      )}
    </div>
  )
}
