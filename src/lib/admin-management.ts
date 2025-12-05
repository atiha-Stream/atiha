'use client'

import { Admin, AdminPermission } from '@/types/admin'
import { userDatabase } from './user-database'
import { logger } from './logger'

class AdminManagementService {
  private readonly LEGENNY_USERNAME = 'leGenny'

  constructor() {
    this.initializeDefaultAdmin()
  }

  /**
   * Initialise l'administrateur par défaut leGenny s'il n'existe pas
   */
  private initializeDefaultAdmin(): void {
    userDatabase.initializeDefaultAdmin()
  }

  /**
   * Récupère tous les administrateurs
   */
  getAllAdmins(): Admin[] {
    const adminUsers = userDatabase.getAllAdmins()
    return adminUsers.map(user => ({
      id: user.id,
      username: user.email || user.name,
      password: user.password,
      role: user.adminRole || 'admin',
      permissions: user.adminPermissions || [],
      createdAt: user.createdAt,
      isActive: user.isActive
    }))
  }

  /**
   * Récupère un administrateur par son ID
   */
  getAdminById(id: string): Admin | null {
    const admins = this.getAllAdmins()
    return admins.find(admin => admin.id === id) || null
  }

  /**
   * Récupère un administrateur par son nom d'utilisateur
   */
  getAdminByUsername(username: string): Admin | null {
    const adminUser = userDatabase.getAdminByUsername(username)
    if (!adminUser) return null
    
    return {
      id: adminUser.id,
      username: adminUser.email || adminUser.name,
      password: adminUser.password,
      role: adminUser.adminRole || 'admin',
      permissions: adminUser.adminPermissions || [],
      createdAt: adminUser.createdAt,
      isActive: adminUser.isActive
    }
  }

  /**
   * Crée un nouvel administrateur
   */
  async createAdmin(adminData: Omit<Admin, 'id' | 'createdAt' | 'isActive'>): Promise<{ success: boolean; message: string; admin?: Admin }> {
    const result = await userDatabase.createAdmin({
      username: adminData.username,
      password: adminData.password,
      role: adminData.role,
      permissions: adminData.permissions
    })

    if (result.success && result.admin) {
      return {
        success: true,
        message: result.message,
        admin: {
          id: result.admin.id,
          username: result.admin.email || result.admin.name,
          password: result.admin.password,
          role: result.admin.adminRole || 'admin',
          permissions: result.admin.adminPermissions || [],
          createdAt: result.admin.createdAt,
          isActive: result.admin.isActive
        }
      }
    }

    return {
      success: false,
      message: result.message
    }
  }

  /**
   * Met à jour un administrateur
   */
  updateAdmin(id: string, updates: Partial<Omit<Admin, 'id' | 'createdAt'>>): { success: boolean; message: string; admin?: Admin } {
    // Trouver l'admin par ID pour récupérer le username
    const admin = this.getAdminById(id)
    if (!admin) {
      return {
        success: false,
        message: 'Administrateur non trouvé'
      }
    }

    // Utiliser la nouvelle base de données unifiée
    const result = userDatabase.updateAdmin(admin.username, {
      email: updates.username || admin.username,
      name: updates.username || admin.username,
      password: updates.password || undefined,
      adminRole: updates.role || admin.role,
      adminPermissions: updates.permissions || admin.permissions
    })

    if (result.success) {
      // Récupérer l'admin mis à jour
      const updatedAdmin = this.getAdminById(id)
      return {
        success: true,
        message: result.message,
        admin: updatedAdmin || undefined
      }
    }

    return {
      success: false,
      message: result.message
    }
  }

  /**
   * Supprime un administrateur
   */
  deleteAdmin(id: string): { success: boolean; message: string } {
    // Trouver l'admin par ID pour récupérer le username
    const admin = this.getAdminById(id)
    if (!admin) {
      return {
        success: false,
        message: 'Administrateur non trouvé'
      }
    }

    // Utiliser la nouvelle base de données unifiée
    const result = userDatabase.deleteAdmin(admin.username)
    return result
  }

  /**
   * Active/désactive un administrateur
   */
  toggleAdminStatus(id: string): { success: boolean; message: string; admin?: Admin } {
    try {
      const admins = this.getAllAdmins()
      const adminIndex = admins.findIndex(admin => admin.id === id)
      
      if (adminIndex === -1) {
        return {
          success: false,
          message: 'Administrateur non trouvé'
        }
      }

      const admin = admins[adminIndex]

      // Protection spéciale pour leGenny
      if (admin.username === this.LEGENNY_USERNAME) {
        return {
          success: false,
          message: 'L\'administrateur leGenny ne peut pas être désactivé'
        }
      }

      // Vérifier qu'il reste au moins un administrateur actif
      const activeAdmins = admins.filter(a => a.isActive && a.id !== id)
      if (admin.isActive && activeAdmins.length === 0) {
        return {
          success: false,
          message: 'Impossible de désactiver le dernier administrateur actif'
        }
      }

      admin.isActive = !admin.isActive
      
      // Mettre à jour via userDatabase
      const result = userDatabase.updateAdmin(admin.username, {
        email: admin.username,
        name: admin.username,
        isActive: admin.isActive
      })

      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Erreur lors du changement de statut'
        }
      }

      return {
        success: true,
        message: `Administrateur ${admin.isActive ? 'activé' : 'désactivé'} avec succès`,
        admin
      }
    } catch (error) {
      logger.error('Erreur lors du changement de statut', error as Error)
      return {
        success: false,
        message: 'Erreur lors du changement de statut'
      }
    }
  }

  /**
   * Met à jour la dernière connexion d'un administrateur
   */
  updateLastLogin(username: string): void {
    // Cette fonctionnalité est maintenant gérée par userDatabase
    // Pas besoin d'implémentation spécifique pour les admins
  }

  /**
   * Valide les données d'un administrateur
   */
  validateAdminData(data: Partial<Admin>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.username) {
      if (data.username.length < 3) {
        errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères')
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
        errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores')
      }
    }

    if (data.password) {
      if (data.password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères')
      }
    }

    if (data.role && !['leGenny', 'Abonnement', 'Contenu', 'Identité visuelle', 'Sécurité'].includes(data.role)) {
      errors.push('Rôle invalide')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Exporte les administrateurs (sans les mots de passe)
   */
  exportAdmins(): string {
    const admins = this.getAllAdmins()
    const exportData = admins.map(admin => ({
      id: admin.id,
      username: admin.username,
      role: admin.role,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin,
      isActive: admin.isActive
    }))
    
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Importe des administrateurs
   */
  async importAdmins(jsonData: string): Promise<{ success: boolean; message: string; importedCount: number }> {
    try {
      const importData = JSON.parse(jsonData)
      
      if (!Array.isArray(importData)) {
        return {
          success: false,
          message: 'Format de données invalide',
          importedCount: 0
        }
      }

      let importedCount = 0
      const errors: string[] = []

      for (const adminData of importData) {
        // Vérifier les champs requis
        if (!adminData.username || !adminData.role) {
          errors.push(`Administrateur invalide: ${adminData.username || 'Sans nom'}`)
          continue
        }

        // Vérifier si l'administrateur existe déjà
        if (this.getAdminByUsername(adminData.username)) {
          errors.push(`Administrateur déjà existant: ${adminData.username}`)
          continue
        }

        // Créer l'administrateur avec un mot de passe généré ou depuis l'environnement
        // ⚠️ SÉCURITÉ: Ne pas utiliser de mot de passe hardcodé
        const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 
          `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        const result = await this.createAdmin({
          username: adminData.username,
          password: defaultPassword, // Mot de passe temporaire (sera haché automatiquement)
          role: adminData.role,
          permissions: adminData.permissions || [],
          lastLogin: adminData.lastLogin ? new Date(adminData.lastLogin) : undefined
        })

        if (result.success) {
          importedCount++
        } else {
          errors.push(result.message)
        }
      }

      return {
        success: true,
        message: `Import terminé. ${importedCount} administrateur(s) importé(s). ${errors.length > 0 ? 'Erreurs: ' + errors.join(', ') : ''}`,
        importedCount
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'import des données',
        importedCount: 0
      }
    }
  }
}

// Instance singleton
export const adminManagement = new AdminManagementService()
