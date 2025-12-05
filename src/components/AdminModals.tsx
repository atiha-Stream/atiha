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
  CheckIcon,
  PlusIcon,
  ChevronDownIcon
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
    }
  }, [isOpen])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 border border-gray-700">
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

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rôle
            </label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="editor">Editor</option>
              </select>
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Rôle personnalisé de l&apos;administrateur
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

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        return
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        username: formData.username.trim(),
        role: formData.role
      }

      // Inclure le mot de passe seulement s'il a été modifié
      if (formData.password) {
        updateData.password = formData.password
      }

      // Mettre à jour l&apos;administrateur
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
      <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Modifier l&apos;Administrateur</h3>
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
              Nouveau mot de passe (optionnel)
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Laissez vide pour ne pas changer"
                disabled={isSubmitting}
              />
              <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Confirmation du mot de passe */}
          {formData.password && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirmez le nouveau mot de passe"
                  disabled={isSubmitting}
                />
                <KeyIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rôle
            </label>
            <div className="relative">
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="editor">Editor</option>
              </select>
              <ShieldCheckIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Rôle personnalisé de l&apos;administrateur
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface DeleteAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  admin: Admin | null
}

export function DeleteAdminModal({ isOpen, onClose, onSuccess, admin }: DeleteAdminModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (isOpen) {
      setConfirmText('')
    }
  }, [isOpen])

  const handleDelete = async () => {
    if (!admin) return

    setIsDeleting(true)

    try {
      const result = adminManagement.deleteAdmin(admin.id)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Une erreur inattendue s\'est produite')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !admin) return null

  const isConfirmValid = confirmText === admin.username

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Supprimer l&apos;Administrateur</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avertissement */}
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-bold mb-2">⚠️ Attention</h4>
                <p className="text-red-300 text-sm">
                  Cette action est irréversible. L&apos;administrateur <strong>{admin.username}</strong> sera définitivement supprimé.
                </p>
              </div>
            </div>
          </div>

          {/* Informations sur l'admin */}
          <div className="bg-dark-100 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-10 h-10 ${ROLE_COLORS[0] || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold">{admin.username}</h4>
                <p className="text-gray-400 text-sm">{admin.role}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Créé le {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pour confirmer, tapez le nom d&apos;utilisateur : <strong>{admin.username}</strong>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-dark-100 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={`Tapez "${admin.username}"`}
              disabled={isDeleting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
