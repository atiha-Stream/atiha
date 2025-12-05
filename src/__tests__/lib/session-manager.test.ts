/**
 * Tests pour session-manager.ts
 * Tests critiques pour la gestion des sessions et limites d'appareils
 */

import { sessionManager } from '@/lib/session-manager'
import { premiumCodesService } from '@/lib/premium-codes-service'

// Mock SecureStorage pour les tests
jest.mock('@/lib/secure-storage', () => ({
  SecureStorage: {
    getItemJSON: jest.fn((key: string) => {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    }),
    setItem: jest.fn((key: string, value: any) => {
      localStorage.setItem(key, JSON.stringify(value))
    }),
    removeItem: jest.fn((key: string) => {
      localStorage.removeItem(key)
    }),
    hasItem: jest.fn((key: string) => {
      return localStorage.getItem(key) !== null
    })
  }
}))

// Mock getCurrentDeviceId pour avoir des deviceId prévisibles
const originalGetCurrentDeviceId = sessionManager.getCurrentDeviceId.bind(sessionManager)
let deviceIdCounter = 0

describe('SessionManager - Gestion des Sessions', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear()
    deviceIdCounter = 0
    
    // Mock getCurrentDeviceId pour retourner des IDs prévisibles
    jest.spyOn(sessionManager, 'getCurrentDeviceId').mockImplementation(() => {
      deviceIdCounter++
      return `device_${deviceIdCounter}`
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('validateLogin', () => {
    const userId = 'test_user_1'
    const codeTypeIndividuel = 'individuel'
    const codeTypeFamille = 'famille'

    it('devrait autoriser la connexion pour un type de code non géré', () => {
      const result = sessionManager.validateLogin(userId, 'autre_type')
      expect(result.canLogin).toBe(true)
      expect(result.message).toContain('non géré')
    })

    it('devrait autoriser la première connexion (individuel)', () => {
      const result = sessionManager.validateLogin(userId, codeTypeIndividuel)
      expect(result.canLogin).toBe(true)
      expect(result.message).toBe('Connexion autorisée')
    })

    it('devrait autoriser la connexion depuis le même appareil', () => {
      // Créer une session avec device_1
      deviceIdCounter = 1
      sessionManager.addSession(userId, codeTypeIndividuel)
      
      // Valider la connexion (même appareil - device_1)
      deviceIdCounter = 1 // Réinitialiser pour simuler le même appareil
      const result = sessionManager.validateLogin(userId, codeTypeIndividuel)
      expect(result.canLogin).toBe(true)
      expect(result.message).toContain('même appareil')
    })

    it('devrait bloquer la connexion si la limite d\'appareils est atteinte (individuel)', () => {
      // Créer une session active (1 appareil pour individu) avec device_1
      jest.spyOn(sessionManager, 'getCurrentDeviceId').mockReturnValue('device_1')
      sessionManager.addSession(userId, codeTypeIndividuel)
      
      // Vérifier qu'on a bien 1 session active
      const activeSessionsBefore = sessionManager.getUserActiveSessions(userId)
      expect(activeSessionsBefore.length).toBe(1)
      
      // Simuler un autre appareil en changeant le deviceId pour device_2
      jest.spyOn(sessionManager, 'getCurrentDeviceId').mockReturnValue('device_2')
      
      // Tenter une nouvelle connexion depuis device_2 (devrait être bloquée car limite = 1)
      const result = sessionManager.validateLogin(userId, codeTypeIndividuel)
      expect(result.canLogin).toBe(false)
      expect(result.message).toContain('Limite d\'appareils atteinte')
      expect(result.needsDisconnection).toBe(true)
    })

    it('devrait autoriser jusqu\'à 5 appareils pour famille', () => {
      // Créer 5 sessions (limite pour famille)
      // Note: Chaque session doit être créée avec un deviceId différent
      const deviceIds = []
      for (let i = 1; i <= 5; i++) {
        const deviceId = `device_${i}`
        deviceIds.push(deviceId)
        jest.spyOn(sessionManager, 'getCurrentDeviceId').mockReturnValue(deviceId)
        sessionManager.addSession(userId, codeTypeFamille)
      }
      
      // Vérifier qu'on a bien 5 sessions actives
      const activeSessions = sessionManager.getUserActiveSessions(userId)
      expect(activeSessions.length).toBe(5)
      
      // La 6ème connexion devrait être bloquée
      jest.spyOn(sessionManager, 'getCurrentDeviceId').mockReturnValue('device_6')
      const result = sessionManager.validateLogin(userId, codeTypeFamille)
      expect(result.canLogin).toBe(false) // La 6ème devrait être bloquée
      expect(result.message).toContain('Limite d\'appareils')
    })
  })

  describe('addSession', () => {
    const userId = 'test_user_2'
    const codeType = 'individuel'

    it('devrait créer une nouvelle session', () => {
      const session = sessionManager.addSession(userId, codeType)
      
      expect(session).toBeDefined()
      expect(session.userId).toBe(userId)
      expect(session.deviceId).toBeDefined()
      expect(session.isActive).toBe(true)
      expect(session.lastActivity).toBeDefined()
    })

    it('devrait réactiver une session existante sur le même appareil', () => {
      // Créer une session avec device_1
      deviceIdCounter = 1
      const firstSession = sessionManager.addSession(userId, codeType)
      const deviceId = firstSession.deviceId
      
      // Désactiver la session
      sessionManager.removeSession(userId, deviceId)
      
      // Réessayer d'ajouter une session (même appareil - device_1)
      deviceIdCounter = 1 // Réinitialiser pour avoir le même deviceId
      jest.spyOn(sessionManager, 'getCurrentDeviceId').mockReturnValue(deviceId)
      const secondSession = sessionManager.addSession(userId, codeType)
      
      // Vérifier que c'est la même session réactivée
      expect(secondSession.deviceId).toBe(deviceId)
      expect(secondSession.isActive).toBe(true)
    })

    it('devrait rejeter l\'ajout de session pour un type non géré', () => {
      expect(() => {
        sessionManager.addSession(userId, 'autre_type')
      }).toThrow('Ce type de code ne gère pas les sessions')
    })
  })

  describe('removeSession', () => {
    const userId = 'test_user_3'
    const codeType = 'individuel'

    it('devrait supprimer une session existante', () => {
      // Créer une session
      const session = sessionManager.addSession(userId, codeType)
      const deviceId = session.deviceId
      
      // Vérifier que la session existe
      const sessionsBefore = sessionManager.getUserActiveSessions(userId)
      expect(sessionsBefore.length).toBe(1)
      
      // Supprimer la session
      const removed = sessionManager.removeSession(userId, deviceId)
      expect(removed).toBe(true)
      
      // Vérifier que la session n'existe plus
      const sessionsAfter = sessionManager.getUserActiveSessions(userId)
      expect(sessionsAfter.length).toBe(0)
    })

    it('devrait retourner false si la session n\'existe pas', () => {
      const removed = sessionManager.removeSession(userId, 'nonexistent_device')
      expect(removed).toBe(false)
    })
  })

  describe('getUserActiveSessions', () => {
    const userId = 'test_user_4'
    const codeType = 'individuel'

    it('devrait retourner les sessions actives', () => {
      // Créer quelques sessions
      sessionManager.addSession(userId, codeType)
      deviceIdCounter = 2
      sessionManager.addSession(userId, codeType)
      
      const activeSessions = sessionManager.getUserActiveSessions(userId)
      expect(activeSessions.length).toBeGreaterThan(0)
      expect(activeSessions.every(s => s.isActive)).toBe(true)
    })

    it('devrait retourner un tableau vide si aucune session active', () => {
      const activeSessions = sessionManager.getUserActiveSessions('user_without_sessions')
      expect(activeSessions).toEqual([])
    })
  })

  describe('Limite d\'appareils - Scénario complet', () => {
    const userId = 'test_user_5'
    const codeTypeIndividuel = 'individuel'

    it('devrait permettre la connexion après déconnexion d\'un appareil', () => {
      // Créer une session (limite atteinte pour individuel = 1)
      const session = sessionManager.addSession(userId, codeTypeIndividuel)
      const deviceId = session.deviceId
      
      // Simuler un nouvel appareil
      deviceIdCounter = 2
      
      // La connexion devrait être bloquée
      let result = sessionManager.validateLogin(userId, codeTypeIndividuel)
      expect(result.canLogin).toBe(false)
      
      // Supprimer la session existante
      sessionManager.removeSession(userId, deviceId)
      
      // La connexion devrait maintenant être autorisée
      result = sessionManager.validateLogin(userId, codeTypeIndividuel)
      expect(result.canLogin).toBe(true)
    })
  })
})

