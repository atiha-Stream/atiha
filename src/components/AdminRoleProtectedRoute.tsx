'use client'

import { useAdminAuth } from '@/lib/admin-auth-context'
// import { AdminRole } from '@/types/admin' // Type non exporté
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminRoleProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  allowedRoles?: string[]
  fallback?: React.ReactNode
}

export default function AdminRoleProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  fallback
}: AdminRoleProtectedRouteProps) {
  const { admin, isAuthenticated, isLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login')
      return
    }

    if (!isLoading && isAuthenticated && admin) {
      // Vérifier les permissions
      const hasPermission = checkPermission(admin.role, requiredRole, allowedRoles)
      
      if (!hasPermission) {
        // Rediriger vers le dashboard admin si pas de permissions
        router.push('/admin/dashboard')
        return
      }
    }
  }, [admin, isAuthenticated, isLoading, router, requiredRole, allowedRoles])

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="text-white text-xl">Vérification des permissions...</div>
      </div>
    )
  }

  // Si pas authentifié, ne rien afficher (redirection en cours)
  if (!isAuthenticated) {
    return null
  }

  // Si pas d'admin, ne rien afficher (redirection en cours)
  if (!admin) {
    return null
  }

  // Vérifier les permissions
  const hasPermission = checkPermission(admin.role, requiredRole, allowedRoles)

  if (!hasPermission) {
    // Afficher le fallback ou un message d'erreur
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Accès Refusé</h2>
          <p className="text-gray-400 mb-4">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Afficher le contenu protégé
  return <>{children}</>
}

/**
 * Vérifie si un rôle d'administrateur a les permissions nécessaires
 */
function checkPermission(
  userRole: string,
  requiredRole?: string,
  allowedRoles?: string[]
): boolean {
  // leGenny a tous les accès
  if (userRole === 'leGenny') {
    return true
  }

  // Si un rôle spécifique est requis
  if (requiredRole) {
    return userRole === requiredRole
  }

  // Si des rôles sont autorisés
  if (allowedRoles && allowedRoles.length > 0) {
    return allowedRoles.includes(userRole)
  }

  // Par défaut, autoriser l'accès
  return true
}

/**
 * Hook pour vérifier les permissions d'un rôle
 */
export function useAdminRole(requiredRole?: string, allowedRoles?: string[]) {
  const { admin } = useAdminAuth()

  if (!admin) {
    return { hasPermission: false, role: null }
  }

  const hasPermission = checkPermission(admin.role, requiredRole, allowedRoles)

  return {
    hasPermission,
    role: admin.role
  }
}
