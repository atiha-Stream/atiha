import { AdminPermission } from '@/types/admin'

// Mapping des permissions vers les routes/actions
export const PERMISSION_ROUTES: Record<AdminPermission, string> = {
  'Ajouter du contenu': '/admin/add-content',
  'Import Excel/CSV': '/admin/import',
  'Gestion des Utilisateurs': '/admin/users',
  'Analytics': '/admin/analytics',
  'Gestion des Données': '/admin/data-management',
  'Éditeur de Page d\'Accueil': '/admin/homepage-editor',
  'Sécurité Admin': '/admin/security',
  'Gestion des Erreurs': '/admin/errors',
  'Abonnement Premium': '/admin/premium',
  'Activité récente': 'activity-section', // Section spéciale
  'Galerie de contenu': 'content-gallery' // Section spéciale
}

// Mapping des routes vers les permissions (pour la vérification inverse)
export const ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  '/admin/add-content': 'Ajouter du contenu',
  '/admin/import': 'Import Excel/CSV',
  '/admin/users': 'Gestion des Utilisateurs',
  '/admin/analytics': 'Analytics',
  '/admin/data-management': 'Gestion des Données',
  '/admin/homepage-editor': 'Éditeur de Page d\'Accueil',
  '/admin/security': 'Sécurité Admin',
  '/admin/errors': 'Gestion des Erreurs',
  '/admin/premium': 'Abonnement Premium'
}

// Fonction pour vérifier si un admin a une permission spécifique
export function hasPermission(adminPermissions: AdminPermission[], requiredPermission: AdminPermission): boolean {
  return adminPermissions.includes(requiredPermission)
}

// Fonction pour vérifier si un admin peut accéder à une route
export function canAccessRoute(adminPermissions: AdminPermission[], route: string): boolean {
  const requiredPermission = ROUTE_PERMISSIONS[route]
  if (!requiredPermission) return true // Route non protégée
  
  return hasPermission(adminPermissions, requiredPermission)
}

// Fonction pour obtenir les permissions manquantes
export function getMissingPermissions(adminPermissions: AdminPermission[], requiredPermissions: AdminPermission[]): AdminPermission[] {
  return requiredPermissions.filter(permission => !adminPermissions.includes(permission))
}

// Fonction pour obtenir le message d'erreur d'accès
export function getAccessDeniedMessage(adminPermissions: AdminPermission[], requiredPermission: AdminPermission): string {
  const permissionNames: Record<AdminPermission, string> = {
    'Ajouter du contenu': 'Ajouter du contenu',
    'Import Excel/CSV': 'Importer des fichiers Excel/CSV',
    'Gestion des Utilisateurs': 'Gérer les utilisateurs',
    'Analytics': 'Accéder aux analytics',
    'Gestion des Données': 'Gérer les données',
    'Éditeur de Page d\'Accueil': 'Éditer la page d\'accueil',
    'Sécurité Admin': 'Accéder à la sécurité admin',
    'Gestion des Erreurs': 'Gérer les erreurs',
    'Abonnement Premium': 'Gérer les abonnements premium',
    'Activité récente': 'Voir l\'activité récente',
    'Galerie de contenu': 'Voir la galerie de contenu'
  }

  return `Vous n'êtes pas autorisé à ${permissionNames[requiredPermission].toLowerCase()}. Contactez votre administrateur pour obtenir les permissions nécessaires.`
}
