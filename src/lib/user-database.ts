import { User } from '@/types/auth'
import { AdminPermission } from '@/types/admin'
import { EncryptionService } from './encryption-service'
import { sanitizeForStorage, validateUsername, isValidEmail, validatePhone } from './input-validation'
import { logger } from './logger'

// Helper pour détecter si un mot de passe est haché (commence par $2a$, $2b$, ou $2y$ pour bcrypt)
const isPasswordHashed = (password: string): boolean => {
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$')
}

// Interface pour les données utilisateur étendues
export interface UserRecord extends User {
  isActive: boolean
  isBanned: boolean
  lastLogin?: string
  loginCount: number
  registrationDate: string
  bannedReason?: string
  bannedDate?: string
  // Propriétés pour les administrateurs
  isAdmin?: boolean
  adminRole?: string
  adminPermissions?: AdminPermission[]
}

// Interface pour les statistiques
export interface UserStats {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  inactiveUsers: number
  unbannedUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
}

/**
 * Classe gérant la base de données des utilisateurs
 * @class UserDatabase
 * @description Gère l'inscription, la connexion, le bannissement, la désactivation et les statistiques utilisateurs
 */
class UserDatabase {
  private readonly STORAGE_KEY = 'atiha_users_database'
  private readonly BANNED_KEY = 'atiha_banned_users'
  private readonly STATS_KEY = 'atiha_user_stats'

  /**
   * Initialise la base de données utilisateurs
   * @returns {UserRecord[]} Liste des utilisateurs
   * @private
   */
  private initializeDatabase(): UserRecord[] {
    if (typeof window === 'undefined') return []
    
    const existing = localStorage.getItem(this.STORAGE_KEY)
    if (existing) {
      const users = JSON.parse(existing)
      // Vérifier si l&apos;utilisateur admin a l&apos;ancien mot de passe et le corriger
      const adminUser = users.find((u: UserRecord) => u.email === 'admin@user.com')
      if (adminUser && adminUser.password === 'admin123') {
        // ⚠️ SÉCURITÉ: Générer un mot de passe temporaire unique ou utiliser une variable d'environnement
        const tempPassword = process.env.ADMIN_DEFAULT_PASSWORD || `admin_temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
        adminUser.password = tempPassword
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))
        logger.warn('Mot de passe admin mis à jour automatiquement (utiliser une variable d\'environnement en production)')
      }
      return users
    }
    
    // Créer quelques utilisateurs de test
    const defaultUsers: UserRecord[] = [
      {
        id: 'admin_demo',
        email: 'admin@user.com',
        name: 'Admin user',
        phone: '+000000000001',
        country: 'MA',
        password: process.env.ADMIN_DEFAULT_PASSWORD || `admin_temp_${Date.now()}`, // Mot de passe temporaire (changer en production)
        isActive: true,
        isBanned: false,
        loginCount: 0,
        registrationDate: new Date().toISOString(),
        createdAt: new Date()
      }
    ]
    
    this.saveUsers(defaultUsers)
    return defaultUsers
  }

  // Sauvegarder les utilisateurs
  private saveUsers(users: UserRecord[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))
    this.updateStats()
  }

  // Charger tous les utilisateurs
  public getAllUsers(): UserRecord[] {
    return this.initializeDatabase()
  }

  // Charger seulement les utilisateurs normaux (sans les administrateurs)
  public getNormalUsers(): UserRecord[] {
    const users = this.getAllUsers()
    return users.filter(user => !user.isAdmin)
  }

  // Trouver un utilisateur par email
  public findUserByEmail(email: string): UserRecord | null {
    const users = this.getAllUsers()
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null
  }

  // Trouver un utilisateur par ID
  public findUserById(id: string): UserRecord | null {
    const users = this.getAllUsers()
    return users.find(user => user.id === id) || null
  }

  /**
   * Inscrit un nouvel utilisateur avec validation et chiffrement du mot de passe
   * @param {Omit<User, 'id' | 'createdAt'>} userData - Données utilisateur (email, name, password, phone, country)
   * @returns {Promise<UserRecord>} Enregistrement utilisateur créé avec mot de passe haché
   * @throws {Error} Si l'email est invalide, déjà utilisé, ou si les données ne passent pas la validation
   * 
   * @example
   * ```ts
   * const user = await userDatabase.registerUser({
   *   email: 'user@example.com',
   *   name: 'John Doe',
   *   password: 'securePassword123',
   *   phone: '+33123456789',
   *   country: 'FR'
   * })
   * console.log(user.id) // ID unique généré
   * ```
   */
  public async registerUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<UserRecord> {
    const users = this.getAllUsers()
    
    // 🔒 VALIDATION ET SANITISATION DES DONNÉES
    // Valider l'email
    if (!isValidEmail(userData.email)) {
      throw new Error('Adresse email invalide')
    }
    const sanitizedEmail = sanitizeForStorage(userData.email.toLowerCase().trim(), { maxLen: 254 })
    
    // Valider le nom
    const nameValidation = validateUsername(userData.name)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error || 'Nom invalide')
    }
    const sanitizedName = nameValidation.sanitized || sanitizeForStorage(userData.name, { maxLen: 50 })
    
    // Valider le téléphone si fourni
    let sanitizedPhone = userData.phone || ''
    if (sanitizedPhone) {
      const phoneValidation = validatePhone(sanitizedPhone)
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Numéro de téléphone invalide')
      }
      sanitizedPhone = phoneValidation.sanitized || sanitizedPhone
    }
    
    // Sanitiser le pays
    const sanitizedCountry = userData.country ? sanitizeForStorage(userData.country, { maxLen: 2 }) : ''
    
    // Vérifier si l'email existe déjà
    const existingUser = this.findUserByEmail(sanitizedEmail)
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé')
    }

    // 🔐 Hacher le mot de passe avec bcrypt
    const hashedPassword = await EncryptionService.hashPassword(userData.password)

    // Créer le nouvel utilisateur avec les données sanitizées
    const newUser: UserRecord = {
      ...userData,
      email: sanitizedEmail,
      name: sanitizedName,
      phone: sanitizedPhone,
      country: sanitizedCountry,
      password: hashedPassword, // Stocker le mot de passe haché
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: true,
      isBanned: false,
      loginCount: 0,
      registrationDate: new Date().toISOString(),
      createdAt: new Date()
    }

    // Ajouter à la liste
    users.push(newUser)
    this.saveUsers(users)

    return newUser
  }

  /**
   * Connecte un utilisateur avec vérification du mot de passe (bcrypt)
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe en clair
   * @returns {Promise<UserRecord | null>} Enregistrement utilisateur ou null si non trouvé
   * @throws {Error} Si le mot de passe est incorrect, l'utilisateur est banni ou inactif
   * 
   * @example
   * ```ts
   * try {
   *   const user = await userDatabase.loginUser('user@example.com', 'password123')
   *   if (user) {
   *     console.log('Connexion réussie')
   *   }
   * } catch (error) {
   *   console.error('Erreur de connexion:', error.message)
   * }
   * ```
   */
  public async loginUser(email: string, password: string): Promise<UserRecord | null> {
    const user = this.findUserByEmail(email)
    
    if (!user) {
      return null
    }

    // 🔐 VÉRIFIER LE MOT DE PASSE
    let passwordValid = false

    if (isPasswordHashed(user.password)) {
      // Mot de passe haché avec bcrypt - utiliser la vérification bcrypt
      passwordValid = await EncryptionService.verifyPassword(password, user.password)
    } else {
      // Ancien mot de passe en clair (compatibilité pendant la migration)
      // Si le mot de passe correspond, on le hache automatiquement
      if (user.password === password) {
        passwordValid = true
        // Migrer automatiquement vers bcrypt
        try {
          const hashedPassword = await EncryptionService.hashPassword(password)
          const users = this.getAllUsers()
          const userIndex = users.findIndex(u => u.id === user.id)
          if (userIndex !== -1) {
            users[userIndex].password = hashedPassword
            this.saveUsers(users)
            user.password = hashedPassword // Mettre à jour l'objet user local
            if (process.env.NODE_ENV === 'development') {
              logger.info(`Mot de passe migré automatiquement vers bcrypt pour: ${email}`)
            }
          }
        } catch (error) {
          logger.error('Erreur lors de la migration du mot de passe', error)
          // Continuer avec la connexion même si la migration échoue
        }
      }
    }

    if (!passwordValid) {
      logger.warn('Échec de connexion', {
        email,
        reason: 'Mot de passe incorrect'
      })
      throw new Error('Mot de passe incorrect')
    }

    // Vérifier si l'utilisateur est banni
    if (user.isBanned) {
      throw new Error('Votre compte a été suspendu. Contactez l\'administrateur.')
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      throw new Error('Votre compte est désactivé. Contactez l\'administrateur.')
    }

    // Mettre à jour les informations de connexion
    user.lastLogin = new Date().toISOString()
    user.loginCount += 1

    // Sauvegarder les modifications
    const users = this.getAllUsers()
    const userIndex = users.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = user
      this.saveUsers(users)
    }

    return user
  }

  // Bannir un utilisateur
  public banUser(userId: string, reason: string): boolean {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      return false
    }

    users[userIndex].isBanned = true
    users[userIndex].bannedReason = reason
    users[userIndex].bannedDate = new Date().toISOString()
    
    this.saveUsers(users)
    return true
  }

  // Débannir un utilisateur
  public unbanUser(userId: string): boolean {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      return false
    }

    users[userIndex].isBanned = false
    users[userIndex].bannedReason = undefined
    users[userIndex].bannedDate = undefined
    
    this.saveUsers(users)
    return true
  }

  // Désactiver un utilisateur
  public deactivateUser(userId: string): boolean {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      return false
    }

    users[userIndex].isActive = false
    this.saveUsers(users)
    return true
  }

  // Activer un utilisateur
  public activateUser(userId: string): boolean {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      return false
    }

    users[userIndex].isActive = true
    this.saveUsers(users)
    return true
  }

  // Mettre à jour un utilisateur
  public updateUser(userId: string, updates: Partial<UserRecord>): boolean {
    const users = this.getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      return false // Utilisateur non trouvé
    }

    // Mettre à jour les champs fournis
    users[userIndex] = { ...users[userIndex], ...updates }
    this.saveUsers(users)
    return true
  }

  // Supprimer un utilisateur
  public deleteUser(userId: string): boolean {
    const users = this.getAllUsers()
    const filteredUsers = users.filter(user => user.id !== userId)
    
    if (filteredUsers.length === users.length) {
      return false // Utilisateur non trouvé
    }

    this.saveUsers(filteredUsers)
    return true
  }

  // Obtenir les statistiques
  public getStats(): UserStats {
    // Utiliser uniquement les utilisateurs normaux (sans les admins)
    const users = this.getNormalUsers()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive && !u.isBanned).length,
      bannedUsers: users.filter(u => u.isBanned).length,
      inactiveUsers: users.filter(u => !u.isActive && !u.isBanned).length,
      unbannedUsers: users.filter(u => !u.isBanned).length,
      newUsersToday: users.filter(u => new Date(u.registrationDate) >= today).length,
      newUsersThisWeek: users.filter(u => new Date(u.registrationDate) >= weekAgo).length,
      newUsersThisMonth: users.filter(u => new Date(u.registrationDate) >= monthAgo).length
    }
  }

  // Exporter les données en format pour Excel
  public exportToExcelFormat(): any[] {
    const users = this.getAllUsers()
    return users.map(user => ({
      'ID': user.id,
      'Nom': user.name,
      'Email': user.email,
      'Téléphone': user.phone,
      'Pays': user.country,
      'Statut': user.isActive ? 'Actif' : 'Inactif',
      'Banni': user.isBanned ? 'Oui' : 'Non',
      'Raison du bannissement': user.bannedReason || '',
      'Date d\'inscription': new Date(user.registrationDate).toLocaleDateString('fr-FR'),
      'Dernière connexion': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais',
      'Nombre de connexions': user.loginCount
    }))
  }

  // Importer des données depuis Excel
  public async importFromExcel(data: any[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = []
    let success = 0

    console.log('📥 Import Excel - Données reçues:', data)

    // Utiliser for...of pour pouvoir utiliser await
    for (let index = 0; index < data.length; index++) {
      const row = data[index]
      try {
        logger.debug(`Ligne ${index + 1}`, { row })
        
        // Normaliser les clés (supprimer les espaces et caractères spéciaux)
        const normalizedRow: any = {}
        Object.keys(row).forEach(key => {
          const normalizedKey = key.trim().toLowerCase()
            .replace(/[éèêë]/g, 'e')
            .replace(/[àâä]/g, 'a')
            .replace(/[ùûü]/g, 'u')
            .replace(/[ôö]/g, 'o')
            .replace(/[îï]/g, 'i')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]/g, '')
          
          normalizedRow[normalizedKey] = row[key]
        })

        logger.debug(`Ligne ${index + 1} normalisée`, { normalizedRow })

        // Rechercher les champs avec différentes variantes
        const email = normalizedRow.email || normalizedRow.mail || row.Email || row.email
        const name = normalizedRow.nom || normalizedRow.name || row.Nom || row.name
        const phone = normalizedRow.telephone || normalizedRow.phone || row.Téléphone || row.phone
        const country = normalizedRow.pays || normalizedRow.country || row.Pays || row.country
        const password = normalizedRow.motdepasse || normalizedRow.password || row['Mot de passe'] || row.password
        const status = normalizedRow.statut || normalizedRow.status || row.Statut || row.status
        const banned = normalizedRow.banni || normalizedRow.banned || row.Banni || row.banned
        const bannedReason = normalizedRow.raisondubannissement || normalizedRow.bannedreason || row['Raison du bannissement'] || row.bannedReason

        // Validation des données requises
        if (!email || !name) {
          errors.push(`Ligne ${index + 1}: Email et Nom requis (trouvé: email="${email}", nom="${name}")`)
          continue
        }

        // Vérifier si l'email existe déjà
        const existingUser = this.findUserByEmail(email)
        if (existingUser) {
          errors.push(`Ligne ${index + 1}: Email "${email}" déjà utilisé`)
          continue
        }

        // Créer l'utilisateur
        const userData = {
          email: email,
          name: name,
          phone: phone || '',
          country: country || '',
          password: password || 'motdepasse123', // 🔑 Mot de passe par défaut si non fourni
          avatar: undefined
        }

        if (process.env.NODE_ENV === 'development') {
          logger.debug('Création utilisateur', { email: userData.email, name: userData.name })
        }
        const newUser = await this.registerUser(userData)
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`Utilisateur créé avec ID: ${newUser.id}`)
        }
        
        // Gérer le statut et le bannissement si spécifiés
        if (status === 'Inactif' || status === 'inactif' || status === 'Inactive' || status === 'inactive') {
          this.deactivateUser(newUser.id)
          logger.info(`Utilisateur ${newUser.id} désactivé`)
        }
        
        if (banned === 'Oui' || banned === 'oui' || banned === 'Yes' || banned === 'yes' || banned === true) {
          this.banUser(newUser.id, bannedReason || 'Importé comme banni')
          logger.warn(`Utilisateur ${newUser.id} banni`, { reason: bannedReason })
        }
        
        success++
        logger.debug(`Ligne ${index + 1} importée avec succès`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
        logger.error(`Erreur ligne ${index + 1}`, error, { lineNumber: index + 1 })
        errors.push(`Ligne ${index + 1}: ${errorMsg}`)
      }
    }

    logger.info(`Import terminé: ${success} succès, ${errors.length} erreurs`)
    return { success, errors }
  }

  // Mettre à jour les statistiques
  private updateStats(): void {
    if (typeof window === 'undefined') return
    
    const stats = this.getStats()
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats))
  }

  // Obtenir les statistiques mises en cache
  public getCachedStats(): UserStats | null {
    if (typeof window === 'undefined') return null
    
    const cached = localStorage.getItem(this.STATS_KEY)
    return cached ? JSON.parse(cached) : null
  }

  // 🔄 Forcer la réinitialisation de la base de données (pour corriger les mots de passe)
  public forceResetDatabase(): { success: boolean; message: string } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Fonction non disponible côté serveur' }
    }

    try {
      // Supprimer la base existante
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.BANNED_KEY)
      localStorage.removeItem(this.STATS_KEY)
      
      // Réinitialiser avec les nouveaux mots de passe
      this.initializeDatabase()
      
      logger.info('Base de données utilisateurs réinitialisée avec les nouveaux mots de passe')
      return { success: true, message: 'Base de données réinitialisée avec succès' }
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation', error)
      return { success: false, message: 'Erreur lors de la réinitialisation' }
    }
  }

  // 🧹 Supprimer TOUS les utilisateurs (pour nettoyer la base)
  public clearAllUsers(): { success: boolean; message: string } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Fonction non disponible côté serveur' }
    }

    try {
      // Supprimer tous les utilisateurs
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.BANNED_KEY)
      localStorage.removeItem(this.STATS_KEY)
      
      logger.warn('Base de données utilisateurs complètement vidée')
      return { success: true, message: 'Base de données utilisateurs vidée avec succès' }
    } catch (error) {
      logger.error('Erreur lors du vidage de la base', error)
      return { success: false, message: 'Erreur lors du vidage de la base' }
    }
  }

  // === MÉTHODES POUR LES ADMINISTRATEURS ===

  // Récupérer tous les administrateurs
  public getAllAdmins(): UserRecord[] {
    const users = this.getAllUsers()
    return users.filter(user => user.isAdmin === true)
  }

  // Récupérer un administrateur par nom d'utilisateur
  public getAdminByUsername(username: string): UserRecord | null {
    const admins = this.getAllAdmins()
    return admins.find(admin => admin.email === username || admin.name === username) || null
  }

  // Créer un nouvel administrateur
  public async createAdmin(adminData: {
    username: string
    password: string
    role: string
    permissions: AdminPermission[]
  }): Promise<{ success: boolean; message: string; admin?: UserRecord }> {
    try {
      // Vérifier si l'administrateur existe déjà
      if (this.getAdminByUsername(adminData.username)) {
        return {
          success: false,
          message: 'Ce nom d\'utilisateur est déjà utilisé'
        }
      }

      // 🔒 VALIDATION ET SANITISATION
      const usernameValidation = validateUsername(adminData.username)
      if (!usernameValidation.isValid) {
        return {
          success: false,
          message: usernameValidation.error || 'Nom d\'utilisateur invalide'
        }
      }
      const sanitizedUsername = usernameValidation.sanitized || sanitizeForStorage(adminData.username, { maxLen: 50 })
      
      const roleValidation = validateUsername(adminData.role)
      if (!roleValidation.isValid) {
        return {
          success: false,
          message: 'Rôle invalide'
        }
      }
      const sanitizedRole = roleValidation.sanitized || sanitizeForStorage(adminData.role, { maxLen: 50 })
      
      // Vérifier que le nom d'utilisateur n'est pas "leGenny"
      if (sanitizedUsername.toLowerCase() === 'legenny') {
        return {
          success: false,
          message: 'Le nom d\'utilisateur "leGenny" est réservé'
        }
      }

      // Vérifier que le rôle n'est pas "leGenny"
      if (sanitizedRole.toLowerCase() === 'legenny') {
        return {
          success: false,
          message: 'Le rôle "leGenny" est réservé'
        }
      }

      // 🔐 Hacher le mot de passe avec bcrypt
      const hashedPassword = await EncryptionService.hashPassword(adminData.password)

      const newAdmin: UserRecord = {
        id: `admin-${Date.now()}`,
        email: sanitizedUsername,
        name: sanitizedUsername,
        phone: '+000000000000',
        country: 'MA',
        password: hashedPassword, // Stocker le mot de passe haché
        isActive: true,
        isBanned: false,
        loginCount: 0,
        registrationDate: new Date().toISOString(),
        createdAt: new Date(),
        isAdmin: true,
        adminRole: sanitizedRole,
        adminPermissions: adminData.permissions
      }

      const users = this.getAllUsers()
      users.push(newAdmin)
      this.saveUsers(users)

      return {
        success: true,
        message: 'Administrateur créé avec succès',
        admin: newAdmin
      }
    } catch (error) {
      logger.error('Erreur lors de la création de l\'administrateur', error)
      return {
        success: false,
        message: 'Erreur lors de la création de l\'administrateur'
      }
    }
  }

  // Mettre à jour un administrateur
  public updateAdmin(username: string, updates: Partial<UserRecord>): { success: boolean; message: string } {
    try {
      const users = this.getAllUsers()
      const adminIndex = users.findIndex(user => 
        user.isAdmin && (user.email === username || user.name === username)
      )

      if (adminIndex === -1) {
        return {
          success: false,
          message: 'Administrateur non trouvé'
        }
      }

      // Empêcher la modification de leGenny
      if (users[adminIndex].email === 'leGenny' || users[adminIndex].name === 'leGenny') {
        return {
          success: false,
          message: 'Impossible de modifier l\'administrateur leGenny'
        }
      }

      users[adminIndex] = { ...users[adminIndex], ...updates }
      this.saveUsers(users)

      return {
        success: true,
        message: 'Administrateur mis à jour avec succès'
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'administrateur', error)
      return {
        success: false,
        message: 'Erreur lors de la mise à jour de l\'administrateur'
      }
    }
  }

  // Supprimer un administrateur
  public deleteAdmin(username: string): { success: boolean; message: string } {
    try {
      const users = this.getAllUsers()
      const adminIndex = users.findIndex(user => 
        user.isAdmin && (user.email === username || user.name === username)
      )

      if (adminIndex === -1) {
        return {
          success: false,
          message: 'Administrateur non trouvé'
        }
      }

      // Empêcher la suppression de leGenny
      if (users[adminIndex].email === 'leGenny' || users[adminIndex].name === 'leGenny') {
        return {
          success: false,
          message: 'Impossible de supprimer l\'administrateur leGenny'
        }
      }

      users.splice(adminIndex, 1)
      this.saveUsers(users)

      return {
        success: true,
        message: 'Administrateur supprimé avec succès'
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'administrateur', error)
      return {
        success: false,
        message: 'Erreur lors de la suppression de l\'administrateur'
      }
    }
  }

  // Initialiser l'administrateur leGenny par défaut
  // ⚠️ SÉCURITÉ: Cette méthode utilise des valeurs par défaut uniquement en développement
  // En production, l'admin doit être créé via les variables d'environnement
  public initializeDefaultAdmin(): void {
    // En production, ne pas créer d'admin par défaut
    if (process.env.NODE_ENV === 'production') {
      return
    }

    const admins = this.getAllAdmins()
    const leGennyExists = admins.some(admin => admin.email === 'leGenny' || admin.name === 'leGenny')

    if (!leGennyExists) {
      // ⚠️ Valeurs par défaut uniquement pour le développement
      // En production, utiliser les variables d'environnement via admin-security.ts
      const defaultPassword = process.env.ADMIN_PASSWORD || 'Atiasekbaby@89#2025!'
      
      const defaultAdmin: UserRecord = {
        id: 'admin-legenny',
        email: 'leGenny',
        name: 'leGenny',
        phone: '+000000000001',
        country: 'MA',
        password: defaultPassword,
        isActive: true,
        isBanned: false,
        loginCount: 0,
        registrationDate: new Date().toISOString(),
        createdAt: new Date('2024-01-01'),
        isAdmin: true,
        adminRole: 'leGenny',
        adminPermissions: [
          'Ajouter du contenu',
          'Import Excel/CSV',
          'Gestion des Utilisateurs',
          'Analytics',
          'Gestion des Données',
          'Éditeur de Page d\'Accueil',
          'Sécurité Admin',
          'Gestion des Erreurs',
          'Abonnement Premium',
          'Activité récente',
          'Galerie de contenu'
        ]
      }

      const users = this.getAllUsers()
      users.push(defaultAdmin)
      this.saveUsers(users)
    }
  }

}

// Instance singleton
export const userDatabase = new UserDatabase()
