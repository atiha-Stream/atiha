/**
 * Tests pour user-database.ts
 * Tests critiques pour l'authentification et la gestion des utilisateurs
 */

import { userDatabase } from '@/lib/user-database'
import { EncryptionService } from '@/lib/encryption-service'

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

describe('UserDatabase - Authentification et Inscription', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear()
  })

  describe('registerUser', () => {
    it('devrait créer un nouvel utilisateur avec un mot de passe haché', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        phone: '+33123456789',
        country: 'FR'
      }

      const newUser = await userDatabase.registerUser(userData)

      expect(newUser).toBeDefined()
      expect(newUser.email).toBe('test@example.com')
      expect(newUser.name).toBe('Test User')
      expect(newUser.password).not.toBe('password123') // Le mot de passe doit être haché
      expect(newUser.password).toMatch(/^\$2[abxy]\$/) // Format bcrypt
      expect(newUser.isActive).toBe(true)
      expect(newUser.isBanned).toBe(false)
    })

    it('devrait rejeter un email invalide', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123',
        phone: '',
        country: ''
      }

      await expect(userDatabase.registerUser(userData)).rejects.toThrow('Adresse email invalide')
    })

    it('devrait rejeter un nom invalide', async () => {
      const userData = {
        email: 'test@example.com',
        name: '', // Nom vide
        password: 'password123',
        phone: '',
        country: ''
      }

      await expect(userDatabase.registerUser(userData)).rejects.toThrow()
    })

    it('devrait rejeter un email déjà utilisé', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        phone: '',
        country: ''
      }

      // Créer le premier utilisateur
      await userDatabase.registerUser(userData)

      // Essayer de créer un deuxième utilisateur avec le même email
      await expect(userDatabase.registerUser(userData)).rejects.toThrow('Cet email est déjà utilisé')
    })

    it('devrait sanitizer les données utilisateur', async () => {
      const userData = {
        email: '  TEST@EXAMPLE.COM  ',
        name: 'Test User Valid', // Nom valide (sans caractères spéciaux)
        password: 'password123',
        phone: '+33123456789',
        country: 'FR'
      }

      const newUser = await userDatabase.registerUser(userData)

      expect(newUser.email).toBe('test@example.com') // Lowercase et trim
      expect(newUser.name).toBe('Test User Valid')
    })
  })

  describe('loginUser', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      await userDatabase.registerUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        phone: '+33123456789',
        country: 'FR'
      })
    })

    it('devrait connecter un utilisateur avec les bonnes credentials', async () => {
      const user = await userDatabase.loginUser('test@example.com', 'password123')

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.lastLogin).toBeDefined()
      expect(user?.loginCount).toBeGreaterThan(0)
    })

    it('devrait rejeter un email incorrect', async () => {
      await expect(userDatabase.loginUser('wrong@example.com', 'password123')).resolves.toBeNull()
    })

    it('devrait rejeter un mot de passe incorrect', async () => {
      await expect(userDatabase.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Mot de passe incorrect')
    })

    it('devrait rejeter un utilisateur banni', async () => {
      // Bannir l'utilisateur
      const users = userDatabase.getAllUsers()
      const user = users.find(u => u.email === 'test@example.com')
      if (user) {
        userDatabase.banUser(user.id, 'Test ban')
      }

      await expect(userDatabase.loginUser('test@example.com', 'password123')).rejects.toThrow('Votre compte a été suspendu')
    })

    it('devrait rejeter un utilisateur inactif', async () => {
      // Désactiver l'utilisateur
      const users = userDatabase.getAllUsers()
      const user = users.find(u => u.email === 'test@example.com')
      if (user) {
        userDatabase.deactivateUser(user.id)
      }

      await expect(userDatabase.loginUser('test@example.com', 'password123')).rejects.toThrow('Votre compte est désactivé')
    })

    it('devrait mettre à jour lastLogin et loginCount après connexion', async () => {
      const userBefore = userDatabase.findUserByEmail('test@example.com')
      const initialLoginCount = userBefore?.loginCount || 0

      await userDatabase.loginUser('test@example.com', 'password123')

      const userAfter = userDatabase.findUserByEmail('test@example.com')
      expect(userAfter?.loginCount).toBe(initialLoginCount + 1)
      expect(userAfter?.lastLogin).toBeDefined()
    })
  })
})

