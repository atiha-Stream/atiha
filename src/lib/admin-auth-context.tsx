'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AdminUser, AdminAuthState, AdminLoginCredentials } from '@/types/admin'
import { adminSecurity } from './admin-security'
import { adminManagement } from './admin-management'
import { securityLogger } from './security-logger'
import { SecureStorage } from './secure-storage'
import { logger } from './logger'

interface AdminAuthContextType extends AdminAuthState {
  login: (credentials: AdminLoginCredentials) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'admin est connecté au chargement
    const checkAuth = () => {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }
      
      const token = SecureStorage.getItem('atiha_admin_token')
      const adminData = SecureStorage.getItemJSON<AdminUser>('atiha_admin_user')
      
      if (token && adminData) {
        try {
          setAdmin(adminData)
        } catch (error) {
          logger.error('Error parsing admin data', error)
          SecureStorage.removeItem('atiha_admin_token')
          SecureStorage.removeItem('atiha_admin_user')
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (credentials: AdminLoginCredentials) => {
    setIsLoading(true)
    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Utiliser le système de sécurité admin
      const result = await adminSecurity.authenticate(credentials.username, credentials.password)
      
      if (result.success) {
        // Récupérer les vraies données de l&apos;administrateur
        const adminData = adminManagement.getAdminByUsername(credentials.username)
        
        if (!adminData) {
          throw new Error('Données administrateur non trouvées')
        }
        
        const adminUser: AdminUser = {
          id: adminData.id,
          username: adminData.username,
          email: 'admin@user.com', // Email par défaut
          role: adminData.role,
          permissions: adminData.permissions,
          createdAt: adminData.createdAt,
          lastLogin: new Date()
        }
        
        const mockToken = 'admin_jwt_token_' + Date.now()
        
        // Sauvegarder dans localStorage
        if (typeof window !== 'undefined') {
          SecureStorage.setItem('atiha_admin_token', mockToken)
          SecureStorage.setItem('atiha_admin_user', adminUser)
        }
        
        setAdmin(adminUser)
        
        // Log de sécurité - connexion admin réussie
        securityLogger.logAdminAction(
          adminUser.id,
          adminUser.email || adminUser.username,
          'admin_login_success',
          {
            username: adminUser.username,
            role: adminUser.role,
            permissions: adminUser.permissions
          }
        )
      } else {
        // Log de sécurité - connexion admin échouée
        securityLogger.logLoginAttempt(credentials.username, false, {
          reason: 'admin_auth_failed',
          message: result.message,
          userAgent: navigator.userAgent
        })
        
        throw new Error(result.message)
      }
    } catch (error) {
      logger.error('Admin login error', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      SecureStorage.removeItem('atiha_admin_token')
      SecureStorage.removeItem('atiha_admin_user')
    }
    setAdmin(null)
  }

  const value: AdminAuthContextType = {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
