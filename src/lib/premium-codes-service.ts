import { SecureStorage } from './secure-storage'
import { logger } from './logger'

export type PremiumCodeType = 'inscription' | 'inscription-flexible' | 'individuel' | 'famille' | 'individuel-annuel' | 'famille-annuel' | 'plan-premium' | 'post-payment-individuel' | 'post-payment-famille' | 'post-payment-individuel-annuel' | 'post-payment-famille-annuel' | 'post-payment-individuel-flexible' | 'post-payment-famille-flexible'

export interface PremiumCode {
  id: string
  code: string
  type: PremiumCodeType
  generatedAt: string
  startsAt: string // Date de début du code
  expiresAt: string // Date de fin du code (vide si flexibleExpiration = true)
  isActive: boolean
  generatedBy: string
  usedBy: string[] // Array d'utilisateurs qui ont utilisé ce code
  usedAt: string[] // Array des dates d'utilisation correspondantes
  flexibleExpiration?: boolean // Si true, expiration calculée au moment de l'activation (date activation + 30 jours)
  customExpirationDays?: number // Nombre de jours personnalisé pour les codes inscription-flexible
}

export interface UserPremiumStatus {
  isPremium: boolean
  codeId?: string
  activatedAt?: string
  expiresAt?: string
  codeType?: PremiumCodeType
}

class PremiumCodesService {
  private readonly STORAGE_KEY = 'atiha_premium_codes'
  private readonly USER_PREMIUM_KEY = 'atiha_user_premium'

  // Générer un nouveau code premium
  generatePremiumCode(
    generatedBy: string, 
    type: PremiumCodeType = 'individuel',
    startsAt?: string,
    expiresAt?: string,
    flexibleExpiration?: boolean,
    customExpirationDays?: number
  ): PremiumCode {
    const code = this.generateRandomCode()
    const now = new Date()
    
    // Dates par défaut selon le type
    let defaultStartsAt: Date
    let defaultExpiresAt: Date
    
    if (type === 'inscription') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 jours
    } else if (type === 'individuel') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    } else if (type === 'famille') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    } else if (type === 'individuel-annuel') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 jours (1 an)
    } else if (type === 'famille-annuel') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 jours (1 an)
    } else if (type === 'plan-premium') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    } else if (type === 'post-payment-individuel') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    } else if (type === 'post-payment-famille') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    } else if (type === 'post-payment-individuel-annuel') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 an
    } else if (type === 'post-payment-famille-annuel') {
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 an
    } else if (type === 'post-payment-individuel-flexible' || type === 'post-payment-famille-flexible') {
      // Codes flexibles : pas de date d'expiration fixe, calculée à l'activation
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours (mais sera ignoré si flexibleExpiration = true)
    } else if (type === 'inscription-flexible') {
      // Code d'inscription flexible : pas de date d'expiration fixe, calculée à l'activation avec durée personnalisée
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + (customExpirationDays || 5) * 24 * 60 * 60 * 1000) // Durée personnalisée ou 5 jours par défaut
    } else {
      // Type par défaut
      defaultStartsAt = now
      defaultExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }

    const premiumCode: PremiumCode = {
      id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      type,
      generatedAt: now.toISOString(),
      startsAt: startsAt || defaultStartsAt.toISOString(),
      expiresAt: expiresAt || defaultExpiresAt.toISOString(),
      isActive: true,
      generatedBy,
      usedBy: [],
      usedAt: [],
      ...(type === 'inscription-flexible' && { flexibleExpiration: true, customExpirationDays: customExpirationDays || 5 })
    }

    const codes = this.getAllCodes()
    codes.push(premiumCode)
    SecureStorage.setItem(this.STORAGE_KEY, codes)

    return premiumCode
  }

  // Obtenir tous les codes
  getAllCodes(): PremiumCode[] {
    try {
      const codes = SecureStorage.getItemJSON<PremiumCode[]>(this.STORAGE_KEY)
      return codes || []
    } catch {
      return []
    }
  }

  // Obtenir les codes actifs
  getActiveCodes(): PremiumCode[] {
    const now = new Date()
    return this.getAllCodes().filter(code => 
      code.isActive && 
      new Date(code.startsAt) <= now && 
      (code.flexibleExpiration || code.type === 'inscription' || code.type === 'inscription-flexible' || new Date(code.expiresAt) > now) // Codes flexibles et d'inscription toujours actifs
    )
  }

  // Obtenir le code d'inscription actif
  getActiveInscriptionCode(): PremiumCode | null {
    const now = new Date()
    const inscriptionCodes = this.getAllCodes().filter(code => 
      (code.type === 'inscription' || code.type === 'inscription-flexible') && 
      code.isActive && 
      new Date(code.startsAt) <= now
      // Les codes d'inscription n'ont pas de date d'expiration fixe, elle est calculée à l'activation
    )
    
    // Retourner le plus récent
    return inscriptionCodes.length > 0 
      ? inscriptionCodes.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0]
      : null
  }

  // Activer automatiquement le code d'inscription pour un nouvel utilisateur
  activateInscriptionCodeForNewUser(userId: string): { success: boolean; message: string } {
    const inscriptionCode = this.getActiveInscriptionCode()
    
    if (!inscriptionCode) {
      return { success: false, message: 'Aucun code d\'inscription actif disponible' }
    }

    // Vérifier si l'utilisateur a déjà un statut premium
    const existingStatus = this.getUserPremiumStatus(userId)
    if (existingStatus.isPremium) {
      return { success: false, message: 'L\'utilisateur a déjà un accès premium' }
    }

    // Activer le code d'inscription
    return this.activateCode(inscriptionCode.code, userId)
  }

  // Activer un code pour un utilisateur
  activateCode(code: string, userId: string): { success: boolean; message: string } {
    const codes = this.getAllCodes()
    const premiumCode = codes.find(c => c.code === code && c.isActive)

    if (!premiumCode) {
      return { success: false, message: 'Code invalide ou expiré' }
    }

    const now = new Date()
    
    // Vérifier si le code a commencé
    if (new Date(premiumCode.startsAt) > now) {
      return { success: false, message: 'Ce code n\'est pas encore actif' }
    }
    
    // Vérifier si le code a expiré (seulement si ce n'est pas un code flexible ou d'inscription)
    // Les codes d'inscription, inscription-flexible et flexibles calculent l'expiration à l'activation
    if (!premiumCode.flexibleExpiration && premiumCode.type !== 'inscription' && premiumCode.type !== 'inscription-flexible') {
      if (new Date(premiumCode.expiresAt) <= now) {
        return { success: false, message: 'Ce code a expiré' }
      }
    }

    // Vérifier si l'utilisateur a déjà utilisé ce code
    if (premiumCode.usedBy.includes(userId)) {
      return { success: false, message: 'Vous avez déjà utilisé ce code' }
    }

    // Ajouter l'utilisateur à la liste des utilisateurs du code
    premiumCode.usedBy.push(userId)
    premiumCode.usedAt.push(now.toISOString())
    SecureStorage.setItem(this.STORAGE_KEY, codes)

    // Calculer la date d'expiration selon le type
    let userExpiresAt: string
    if (premiumCode.type === 'inscription-flexible' && premiumCode.customExpirationDays) {
      // Pour les codes d'inscription flexibles : expiration = date d'activation + nombre de jours personnalisé
      const expirationDate = new Date(now.getTime() + premiumCode.customExpirationDays * 24 * 60 * 60 * 1000)
      userExpiresAt = expirationDate.toISOString()
    } else if (premiumCode.flexibleExpiration) {
      // Pour les codes flexibles : expiration = date d'activation + 30 jours
      const expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      userExpiresAt = expirationDate.toISOString()
    } else if (premiumCode.type === 'inscription') {
      // Pour les codes d'inscription : expiration = date d'activation + 5 jours
      const expirationDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      userExpiresAt = expirationDate.toISOString()
    } else {
      // Pour les autres codes : utiliser la date d'expiration fixe du code
      userExpiresAt = premiumCode.expiresAt
    }

    // Activer le premium pour l'utilisateur
    const userPremium: UserPremiumStatus = {
      isPremium: true,
      codeId: premiumCode.id,
      activatedAt: now.toISOString(),
      expiresAt: userExpiresAt,
      codeType: premiumCode.type // Inclure le type de code
    }
    SecureStorage.setItem(`${this.USER_PREMIUM_KEY}_${userId}`, userPremium)

    return { 
      success: true, 
      message: `Code premium activé avec succès !` 
    }
  }

  // Vérifier le statut premium d'un utilisateur
  getUserPremiumStatus(userId: string): UserPremiumStatus {
    try {
      // Méthode 1: Vérifier le statut premium actuel dans localStorage
      const status = SecureStorage.getItemJSON<UserPremiumStatus>(`${this.USER_PREMIUM_KEY}_${userId}`)
      if (status) {
        const now = new Date()

        // Vérifier si le premium a expiré
        if (status.expiresAt && new Date(status.expiresAt) <= now) {
          this.deactivateUserPremium(userId)
          return { isPremium: false }
        }

        return status
      }

      // Méthode 2: Vérifier dans les données exportées (atiha_user_premium)
      const exportedPremiumData = SecureStorage.getItemJSON<{ [userId: string]: UserPremiumStatus }>('atiha_user_premium')
      if (exportedPremiumData) {
        try {
          const userPremiumData = exportedPremiumData[userId]
          
          if (userPremiumData && userPremiumData.isPremium && userPremiumData.expiresAt) {
            // Vérifier si le code est encore valide
            const now = new Date()
            const expiresAt = new Date(userPremiumData.expiresAt)
            
            if (expiresAt > now) {
              // Le code est valide, le réactiver automatiquement
              SecureStorage.setItem(`${this.USER_PREMIUM_KEY}_${userId}`, userPremiumData)
              logger.info(`✅ Code premium réactivé automatiquement pour l'utilisateur ${userId}`)
              return userPremiumData
            }
          }
        } catch (error) {
          logger.error('Erreur lors de la lecture des données exportées', error as Error)
        }
      }

      // Méthode 3: Vérifier dans tous les codes premium si l'utilisateur a un code actif
      const allCodes = this.getAllCodes()
      const now = new Date()
      
      for (const code of allCodes) {
        if (code.usedBy.includes(userId) && code.isActive) {
          // Vérifier si le code n'est pas expiré
          const expiresAt = new Date(code.expiresAt)
          if (expiresAt > now) {
            // L'utilisateur a un code actif, créer le statut premium
            const userPremiumStatus: UserPremiumStatus = {
              isPremium: true,
              codeId: code.id,
              activatedAt: code.usedAt[code.usedBy.indexOf(userId)],
              expiresAt: code.expiresAt,
              codeType: code.type
            }
            
            // Sauvegarder le statut
            SecureStorage.setItem(`${this.USER_PREMIUM_KEY}_${userId}`, userPremiumStatus)
            logger.info(`Code premium détecté et réactivé pour l'utilisateur ${userId}`)
            return userPremiumStatus
          }
        }
      }

      return { isPremium: false }
    } catch {
      return { isPremium: false }
    }
  }

  // Désactiver le premium d'un utilisateur
  deactivateUserPremium(userId: string): void {
    SecureStorage.removeItem(`${this.USER_PREMIUM_KEY}_${userId}`)
  }

  // Désactiver l'utilisateur sur tous les codes qu'il a utilisés (nettoyage complet)
  deactivateAllCodesForUser(userId: string): number {
    try {
      const allCodes = this.getAllCodes()
      let updated = false
      let removedCount = 0

      allCodes.forEach(code => {
        const idx = code.usedBy.indexOf(userId)
        if (idx !== -1) {
          code.usedBy.splice(idx, 1)
          code.usedAt.splice(idx, 1)
          updated = true
          removedCount++
        }
      })

      if (updated) {
        SecureStorage.setItem(this.STORAGE_KEY, allCodes)
      }

      // Retirer le statut premium si présent
      this.deactivateUserPremium(userId)

      return removedCount
    } catch (e) {
      logger.error('Erreur lors de la désactivation de tous les codes pour utilisateur', e as Error)
      return 0
    }
  }

  // Activer un code pour un utilisateur (pour l'admin)
  activateCodeForUser(code: string, userId: string): boolean {
    try {
      const result = this.activateCode(code, userId)
      return result.success
    } catch (error) {
      console.error('Erreur lors de l\'activation du code pour l\'utilisateur:', error)
      return false
    }
  }

  // Désactiver un code spécifique pour un utilisateur
  deactivateCodeForUser(code: string, userId: string): boolean {
    try {
      const allCodes = this.getAllCodes()
      const codeToDeactivate = allCodes.find(c => c.code === code)
      
      if (!codeToDeactivate) {
        return false
      }

      // Retirer l'utilisateur de la liste des utilisateurs du code
      const userIndex = codeToDeactivate.usedBy.indexOf(userId)
      if (userIndex === -1) {
        return false // L'utilisateur n'utilise pas ce code
      }

      // Supprimer l'utilisateur et sa date d'utilisation
      codeToDeactivate.usedBy.splice(userIndex, 1)
      codeToDeactivate.usedAt.splice(userIndex, 1)

      // Sauvegarder les modifications
      const updatedCodes = allCodes.map(c => 
        c.id === codeToDeactivate.id ? codeToDeactivate : c
      )
      SecureStorage.setItem(this.STORAGE_KEY, updatedCodes)

      // Désactiver le premium de l'utilisateur si c'était son code actuel
      const userPremiumStatus = this.getUserPremiumStatus(userId)
      if (userPremiumStatus.isPremium && userPremiumStatus.codeId === codeToDeactivate.id) {
        this.deactivateUserPremium(userId)
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la désactivation du code:', error)
      return false
    }
  }

  // Récupérer l'historique des codes premium d'un utilisateur (mois en cours uniquement)
  getUserPremiumHistory(userId: string): Array<{
    code: PremiumCode
    usedAt: string
    index: number
  }> {
    const allCodes = this.getAllCodes()
    const userHistory: Array<{
      code: PremiumCode
      usedAt: string
      index: number
    }> = []

    // Date du début du mois en cours
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    allCodes.forEach(code => {
      const userIndex = code.usedBy.indexOf(userId)
      if (userIndex !== -1) {
        const usedAt = new Date(code.usedAt[userIndex])
        
        // Ne garder que les codes utilisés dans le mois en cours
        if (usedAt >= startOfMonth) {
          userHistory.push({
            code,
            usedAt: code.usedAt[userIndex],
            index: userIndex
          })
        }
      }
    })

    // Trier par date d'utilisation (plus récent en premier)
    return userHistory.sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
  }

  // Récupérer l'historique complet des codes premium d'un utilisateur (tous les mois)
  getUserCompletePremiumHistory(userId: string): Array<{
    code: PremiumCode
    usedAt: string
    index: number
  }> {
    const allCodes = this.getAllCodes()
    const userHistory: Array<{
      code: PremiumCode
      usedAt: string
      index: number
    }> = []

    allCodes.forEach(code => {
      const userIndex = code.usedBy.indexOf(userId)
      if (userIndex !== -1) {
        userHistory.push({
          code,
          usedAt: code.usedAt[userIndex],
          index: userIndex
        })
      }
    })

    // Trier par date d'utilisation (plus récent en premier)
    return userHistory.sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
  }

  // Nettoyer automatiquement l'historique (supprimer les codes utilisés avant le mois en cours)
  cleanupOldHistory(): { success: boolean; message: string; cleanedCodes: number } {
    try {
      const allCodes = this.getAllCodes()
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      let cleanedCodes = 0
      const updatedCodes = allCodes.map(code => {
        const updatedCode = { ...code }
        
        // Nettoyer les utilisateurs et dates d'utilisation
        const validIndices: number[] = []
        const validUsedBy: string[] = []
        const validUsedAt: string[] = []
        
        code.usedAt.forEach((usedAt, index) => {
          const usedDate = new Date(usedAt)
          if (usedDate >= startOfMonth) {
            validIndices.push(index)
            validUsedBy.push(code.usedBy[index])
            validUsedAt.push(usedAt)
          } else {
            cleanedCodes++
          }
        })
        
        updatedCode.usedBy = validUsedBy
        updatedCode.usedAt = validUsedAt
        
        return updatedCode
      })
      
      // Sauvegarder les codes nettoyés
      SecureStorage.setItem(this.STORAGE_KEY, updatedCodes)
      
      return {
        success: true,
        message: `Nettoyage terminé. ${cleanedCodes} entrée(s) d'historique supprimée(s).`,
        cleanedCodes
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage de l\'historique:', error)
      return {
        success: false,
        message: 'Erreur lors du nettoyage de l\'historique',
        cleanedCodes: 0
      }
    }
  }

  // Générer un code aléatoire
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Supprimer des codes et désactiver le premium des utilisateurs concernés
  deleteCodes(codeIds: string[]): { success: boolean; message: string; affectedUsers: number } {
    try {
      const codes = this.getAllCodes()
      const codesToDelete = codes.filter(code => codeIds.includes(code.id))
      
      if (codesToDelete.length === 0) {
        return { success: false, message: 'Aucun code trouvé', affectedUsers: 0 }
      }

      // Collecter tous les utilisateurs affectés
      const affectedUserIds = new Set<string>()
      codesToDelete.forEach(code => {
        code.usedBy.forEach(userId => affectedUserIds.add(userId))
      })

      // Désactiver le premium pour tous les utilisateurs affectés
      affectedUserIds.forEach(userId => {
        this.deactivateUserPremium(userId)
      })

      // Supprimer les codes
      const remainingCodes = codes.filter(code => !codeIds.includes(code.id))
      SecureStorage.setItem(this.STORAGE_KEY, remainingCodes)

      return {
        success: true,
        message: `${codesToDelete.length} code(s) supprimé(s) avec succès`,
        affectedUsers: affectedUserIds.size
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des codes:', error)
      return { success: false, message: 'Erreur lors de la suppression', affectedUsers: 0 }
    }
  }

  // Nettoyer les codes expirés
  cleanExpiredCodes(): void {
    const now = new Date()
    const codes = this.getAllCodes().filter(code => 
      new Date(code.expiresAt) > now
    )
    SecureStorage.setItem(this.STORAGE_KEY, codes)
  }

  // Obtenir les statistiques
  getStats(): {
    totalCodes: number
    activeCodes: number
    usedCodes: number
    expiredCodes: number
    totalUsers: number
  } {
    const codes = this.getAllCodes()
    const now = new Date()

    return {
      totalCodes: codes.length,
      activeCodes: codes.filter(c => c.isActive && new Date(c.expiresAt) > now).length,
      usedCodes: codes.filter(c => c.usedBy.length > 0).length,
      expiredCodes: codes.filter(c => new Date(c.expiresAt) <= now).length,
      totalUsers: codes.reduce((total, code) => total + code.usedBy.length, 0)
    }
  }
}

export const premiumCodesService = new PremiumCodesService()
