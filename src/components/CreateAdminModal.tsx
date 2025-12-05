'use client'

import { useState, useEffect, useRef } from 'react'
import { Admin, AdminPermission, AVAILABLE_PERMISSIONS, ROLE_COLORS } from '@/types/admin'
import { adminManagement } from '@/lib/admin-management'
import {
  XMarkIcon,
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface CreateAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
    permissions: [] as AdminPermission[],
    color: 'bg-blue-500'
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPermissionsDropdownOpen, setIsPermissionsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        role: '',
        permissions: [],
        color: 'bg-blue-500'
      })
      setErrors([])
      setIsPermissionsDropdownOpen(false)
    }
  }, [isOpen])

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPermissionsDropdownOpen(false)
      }
    }

    if (isPermissionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPermissionsDropdownOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setIsSubmitting(true)

    try {
      // Validation côté client
      const validationErrors: string[] = []

      if (!formData.username.trim()) {
        validationErrors.push('Le nom d\'utilisateur est requis')
      } else if (formData.username.length < 3) {
        validationErrors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères')
      }

      if (!formData.password) {
        validationErrors.push('Le mot de passe est requis')
      } else if (formData.password.length < 6) {
        validationErrors.push('Le mot de passe doit contenir au moins 6 caractères')
      }

      if (formData.password !== formData.confirmPassword) {
        validationErrors.push('Les mots de passe ne correspondent pas')
      }

      if (!formData.role.trim()) {
        validationErrors.push('Le nom du rôle est requis')
      } else if (formData.role.length < 2) {
        validationErrors.push('Le nom du rôle doit contenir au moins 2 caractères')
      }

      if (formData.permissions.length === 0) {
        validationErrors.push('Au moins une autorisation doit être sélectionnée')
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }

      // Créer l'administrateur (le mot de passe sera haché automatiquement)
      const result = await adminManagement.createAdmin({
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role.trim(),
        permissions: formData.permissions
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setErrors([result.message])
      }
    } catch (error) {
      setErrors(['Une erreur inattendue s\'est produite'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer les erreurs quand l&apos;utilisateur tape
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handlePermissionToggle = (permission: AdminPermission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: AVAILABLE_PERMISSIONS
    }))
  }

  const handleDeselectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }))
  }

  const getDisplayText = () => {
    if (formData.permissions.length === 0) {
      return 'Sélectionner les autorisations'
    } else if (formData.permissions.length === 1) {
      return formData.permissions[0]
    } else {
      return `${formData.permissions.length} autorisations sélectionnées`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-lg w-full p-5 border border-gray-700 max-h-[85vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Créer un Administrateur</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom d&apos;utilisateur */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom d&apos;utilisateur
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le nom d&apos;utilisateur"
                disabled={isSubmitting}
              />
              <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le mot de passe"
                disabled={isSubmitting}
              />
              <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Confirmation du mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirmez le mot de passe"
                disabled={isSubmitting}
              />
              <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Nom du Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du Rôle
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Gestionnaire Contenu"
                disabled={isSubmitting}
              />
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Couleur du Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Couleur du Rôle
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  className={`w-8 h-8 rounded-full ${color} border-2 ${
                    formData.color === color ? 'border-white' : 'border-gray-600'
                  } hover:scale-110 transition-transform`}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          {/* Autorisations */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Autorisations du Rôle
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsPermissionsDropdownOpen(!isPermissionsDropdownOpen)}
                className="w-full px-4 py-3 pl-10 pr-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                disabled={isSubmitting}
              >
                <span className={formData.permissions.length === 0 ? 'text-gray-400' : 'text-white'}>
                  {getDisplayText()}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isPermissionsDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              
              {/* Dropdown Menu */}
              {isPermissionsDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-100 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto scrollbar-hide">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div
                      key={permission}
                      onClick={() => handlePermissionToggle(permission)}
                      className={`px-4 py-3 cursor-pointer hover:bg-dark-200 transition-colors flex items-center space-x-3 ${
                        formData.permissions.includes(permission) ? 'bg-blue-900/30' : ''
                      }`}
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        formData.permissions.includes(permission) 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-400'
                      }`}>
                        {formData.permissions.includes(permission) && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-white text-sm">{permission}</span>
                    </div>
                  ))}
                  
                  {/* Actions en bas du dropdown */}
                  <div className="border-t border-gray-600 p-2">
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1"
                        disabled={isSubmitting}
                      >
                        Tout sélectionner
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllPermissions}
                        className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1"
                        disabled={isSubmitting}
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Permissions sélectionnées affichées */}
            {formData.permissions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full"
                  >
                    {permission}
                    <button
                      type="button"
                      onClick={() => handlePermissionToggle(permission)}
                      className="ml-1 text-blue-400 hover:text-blue-200"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium text-sm">Erreurs:</p>
                  <ul className="text-red-300 text-sm mt-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
