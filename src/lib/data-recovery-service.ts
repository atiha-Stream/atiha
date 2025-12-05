/**
 * Service de récupération des données après restauration
 * Diagnostique et corrige les problèmes courants après import de données
 */

import { logger } from './logger'

export interface DataRecoveryResult {
  success: boolean
  message: string
  issuesFound: string[]
  fixesApplied: string[]
}

class DataRecoveryService {
  
  /**
   * Diagnostiquer les problèmes de données après restauration
   */
  diagnoseDataIssues(): DataRecoveryResult {
    const issuesFound: string[] = []
    const fixesApplied: string[] = []

    try {
      // 1. Vérifier la structure des utilisateurs
      const usersData = localStorage.getItem('atiha_users_database')
      if (usersData) {
        try {
          const users = JSON.parse(usersData)
          if (Array.isArray(users)) {
            users.forEach((user, index) => {
              // Vérifier les champs obligatoires
              if (!user.id) {
                issuesFound.push(`Utilisateur ${index}: ID manquant`)
                user.id = `user_${Date.now()}_${index}`
                fixesApplied.push(`Utilisateur ${index}: ID généré`)
              }
              
              if (!user.email) {
                issuesFound.push(`Utilisateur ${index}: Email manquant`)
              }
              
              if (!user.password) {
                issuesFound.push(`Utilisateur ${index}: Mot de passe manquant`)
              }
              
              if (!user.createdAt) {
                issuesFound.push(`Utilisateur ${index}: Date de création manquante`)
                user.createdAt = new Date().toISOString()
                fixesApplied.push(`Utilisateur ${index}: Date de création ajoutée`)
              }
            })
            
            // Sauvegarder les corrections
            if (fixesApplied.length > 0) {
              localStorage.setItem('atiha_users_database', JSON.stringify(users))
            }
          }
        } catch (error) {
          issuesFound.push('Erreur de parsing des données utilisateurs')
        }
      }

      // 2. Vérifier la cohérence des codes premium
      const premiumCodesData = localStorage.getItem('atiha_premium_codes')
      if (premiumCodesData) {
        try {
          const codes = JSON.parse(premiumCodesData)
          if (Array.isArray(codes)) {
            codes.forEach((code, index) => {
              if (!code.id) {
                issuesFound.push(`Code premium ${index}: ID manquant`)
                code.id = `code_${Date.now()}_${index}`
                fixesApplied.push(`Code premium ${index}: ID généré`)
              }
              
              if (!code.code) {
                issuesFound.push(`Code premium ${index}: Code manquant`)
              }
              
              if (!code.type) {
                issuesFound.push(`Code premium ${index}: Type manquant`)
                code.type = 'individuel'
                fixesApplied.push(`Code premium ${index}: Type par défaut ajouté`)
              }
            })
            
            // Sauvegarder les corrections
            if (fixesApplied.length > 0) {
              localStorage.setItem('atiha_premium_codes', JSON.stringify(codes))
            }
          }
        } catch (error) {
          issuesFound.push('Erreur de parsing des codes premium')
        }
      }

      // 3. Vérifier les sessions utilisateur
      const sessionsData = localStorage.getItem('atiha_user_sessions')
      if (sessionsData) {
        try {
          const sessions = JSON.parse(sessionsData)
          // Nettoyer les sessions orphelines
          const cleanedSessions: { [userId: string]: any[] } = {}
          let sessionsCleaned = 0
          
          Object.keys(sessions).forEach(userId => {
            const userSessions = sessions[userId]
            if (Array.isArray(userSessions)) {
              cleanedSessions[userId] = userSessions.filter(session => {
                if (!session.userId || !session.deviceId) {
                  sessionsCleaned++
                  return false
                }
                return true
              })
            }
          })
          
          if (sessionsCleaned > 0) {
            issuesFound.push(`${sessionsCleaned} sessions orphelines trouvées`)
            fixesApplied.push(`${sessionsCleaned} sessions orphelines supprimées`)
            localStorage.setItem('atiha_user_sessions', JSON.stringify(cleanedSessions))
          }
        } catch (error) {
          issuesFound.push('Erreur de parsing des sessions')
        }
      }

      return {
        success: true,
        message: `Diagnostic terminé. ${issuesFound.length} problème(s) trouvé(s), ${fixesApplied.length} correction(s) appliquée(s).`,
        issuesFound,
        fixesApplied
      }

    } catch (error) {
      return {
        success: false,
        message: `Erreur lors du diagnostic: ${error}`,
        issuesFound: [`Erreur générale: ${error}`],
        fixesApplied: []
      }
    }
  }

  /**
   * Réinitialiser les sessions pour permettre la reconnexion
   */
  resetUserSessions(): void {
    localStorage.removeItem('atiha_user_sessions')
    logger.info('✅ Sessions utilisateur réinitialisées')
  }

  /**
   * Créer un utilisateur de test pour vérifier le système
   */
  createTestUser(): { email: string; password: string } {
    const testEmail = 'test@atiha.com'
    const testPassword = 'test123'
    
    // Vérifier si l'utilisateur existe déjà
    const usersData = localStorage.getItem('atiha_users_database')
    if (usersData) {
      try {
        const users = JSON.parse(usersData)
        const existingUser = users.find((user: any) => user.email === testEmail)
        if (existingUser) {
          logger.info('Utilisateur de test existe déjà')
          return { email: testEmail, password: testPassword }
        }
      } catch (error) {
        logger.error('Erreur lors de la vérification de l\'utilisateur de test', error as Error)
      }
    }

    // Créer l'utilisateur de test
    const testUser = {
      id: `test_user_${Date.now()}`,
      name: 'Utilisateur Test',
      email: testEmail,
      password: testPassword,
      phone: '0123456789',
      country: 'France',
      isActive: true,
      isBanned: false,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      loginCount: 0
    }

    // Ajouter à la base de données
    const users = usersData ? JSON.parse(usersData) : []
    users.push(testUser)
    localStorage.setItem('atiha_users_database', JSON.stringify(users))
    
    if (process.env.NODE_ENV === 'development') {
      logger.info('Utilisateur de test créé')
    }
    return { email: testEmail, password: testPassword }
  }

  /**
   * Vérifier l'intégrité des données après restauration
   */
  checkDataIntegrity(): { isValid: boolean; issues: string[] } {
    const issues: string[] = []

    try {
      // Vérifier les clés essentielles
      const essentialKeys = [
        'atiha_users_database',
        'atiha_premium_codes',
        'atiha_user_premium'
      ]

      essentialKeys.forEach(key => {
        const data = localStorage.getItem(key)
        if (!data) {
          issues.push(`Clé manquante: ${key}`)
        } else {
          try {
            JSON.parse(data)
          } catch (error) {
            issues.push(`Données corrompues: ${key}`)
          }
        }
      })

      return {
        isValid: issues.length === 0,
        issues
      }

    } catch (error) {
      return {
        isValid: false,
        issues: [`Erreur lors de la vérification: ${error}`]
      }
    }
  }
}

export const dataRecoveryService = new DataRecoveryService()
