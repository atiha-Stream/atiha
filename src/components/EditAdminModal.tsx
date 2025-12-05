'use client'

import { useState, useEffect, useRef } from 'react'
import { Admin, AdminPermission, AVAILABLE_PERMISSIONS } from '@/types/admin'
import { adminManagement } from '@/lib/admin-management'
import {
  XMarkIcon,
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface EditAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  admin: Admin | null
}

export function EditAdminModal({ isOpen, onClose, onSuccess, admin }: EditAdminModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
    permissions: [] as AdminPermission[]
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPermissionsDropdownOpen, setIsPermissionsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && admin) {
      setFormData({
        username: admin.username,
        password: '',
        confirmPassword: '',
        role: admin.role,
        permissions: admin.permissions || []
      })
      setErrors([])
    }
  }, [isOpen, admin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admin) return

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

      if (formData.password && formData.password.length < 6) {
        validationErrors.push('Le mot de passe doit contenir au moins 6 caractères')
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        validationErrors.push('Les mots de passe ne correspondent pas')
      }

      if (!formData.role.trim()) {
        validationErrors.push('Le nom du rôle est requis')
      }

      if (formData.permissions.length === 0) {
        validationErrors.push('Au moins une autorisation doit être sélectionnée')
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setIsSubmitting(false)
        return
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        username: formData.username,
        role: formData.role,
        permissions: formData.permissions
      }

      // Inclure le mot de passe seulement s'il a été modifié
      if (formData.password) {
        updateData.password = formData.password
      }

      const result = adminManagement.updateAdmin(admin.id, updateData)

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

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPermissionsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!isOpen || !admin) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 border border-gray-700 max-h-[85vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Modifier l&apos;Administrateur</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
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
                disabled={isSubmitting}
                placeholder="Nom d&apos;utilisateur"
              />
              <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nouveau mot de passe (optionnel)
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                placeholder="Laisser vide pour ne pas changer"
              />
              <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Confirmer mot de passe */}
          {formData.password && (
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
                  disabled={isSubmitting}
                  placeholder="Confirmer le mot de passe"
                />
                <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          )}

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
                disabled={isSubmitting}
                placeholder="Nom du rôle"
              />
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Nom personnalisé du rôle
            </p>
          </div>

          {/* Autorisations du Rôle */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Autorisations du Rôle
            </label>
            <button
              type="button"
              onClick={() => setIsPermissionsDropdownOpen(!isPermissionsDropdownOpen)}
              className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
              disabled={isSubmitting}
            >
              <span className="text-gray-300">
                {formData.permissions.length === 0 
                  ? 'Sélectionner les autorisations' 
                  : `${formData.permissions.length} autorisation(s) sélectionnée(s)`
                }
              </span>
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </button>
            <ShieldCheckIcon className="w-5 h-5 text-gray-400 absolute left-3 top-8" />

            {/* Dropdown des permissions */}
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
            <p className="text-xs text-gray-400 mt-1">
              Sélectionnez les autorisations pour ce rôle
            </p>
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
          <div className="flex justify-end space-x-4 pt-4">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Modification...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Modifier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
