// Messages d&apos;erreur centralisés et traduits
export const ErrorMessages = {
  // Erreurs d&apos;authentification
  auth: {
    invalidCredentials: 'Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.',
    accountLocked: 'Compte temporairement verrouillé. Veuillez patienter quelques minutes avant de réessayer.',
    sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter pour continuer.',
    accessDenied: 'Accès refusé. Contactez l\'administrateur si vous pensez qu\'il s\'agit d\'une erreur.',
    userNotFound: 'Aucun compte trouvé avec cette adresse email.',
    emailAlreadyExists: 'Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez une autre adresse.',
    weakPassword: 'Le mot de passe doit contenir au moins 8 caractères pour votre sécurité.',
    invalidEmail: 'Veuillez entrer une adresse email valide (ex: nom@exemple.com).',
    passwordMismatch: 'Les mots de passe ne correspondent pas. Vérifiez votre saisie.'
  },

  // Erreurs de réseau
  network: {
    connectionFailed: 'Problème de connexion. Vérifiez votre internet et réessayez.',
    timeout: 'La requête prend trop de temps. Vérifiez votre connexion et réessayez.',
    serverError: 'Service temporairement indisponible. Veuillez réessayer dans quelques minutes.',
    notFound: 'Contenu non trouvé. Il a peut-être été supprimé ou déplacé.',
    forbidden: 'Accès non autorisé. Contactez le support si nécessaire.',
    unauthorized: 'Session expirée. Veuillez vous reconnecter.',
    tooManyRequests: 'Trop de tentatives. Attendez quelques instants avant de réessayer.'
  },

  // Erreurs de validation
  validation: {
    required: 'Ce champ est obligatoire',
    minLength: (min: number) => `Minimum ${min} caractères requis`,
    maxLength: (max: number) => `Maximum ${max} caractères autorisés`,
    invalidFormat: 'Format invalide',
    invalidUrl: 'URL invalide',
    invalidDate: 'Date invalide',
    invalidNumber: 'Nombre invalide',
    fileTooLarge: 'Fichier trop volumineux',
    invalidFileType: 'Type de fichier non supporté'
  },

  // Erreurs de contenu
  content: {
    notFound: 'Contenu non trouvé',
    unavailable: 'Ce contenu n\'est pas disponible',
    loadingFailed: 'Impossible de charger le contenu',
    playbackError: 'Erreur de lecture vidéo',
    subtitleError: 'Impossible de charger les sous-titres',
    qualityError: 'Impossible de changer la qualité vidéo'
  },

  // Erreurs d&apos;import/export
  import: {
    fileNotFound: 'Fichier non trouvé',
    invalidFormat: 'Format de fichier invalide',
    corruptedFile: 'Fichier corrompu',
    importFailed: 'Échec de l\'importation',
    exportFailed: 'Échec de l\'exportation',
    quotaExceeded: 'Quota de stockage dépassé'
  },

  // Erreurs génériques
  generic: {
    unexpected: 'Une erreur inattendue s\'est produite',
    tryAgain: 'Veuillez réessayer',
    contactSupport: 'Contactez le support technique',
    maintenance: 'Maintenance en cours. Veuillez patienter.',
    featureUnavailable: 'Cette fonctionnalité n\'est pas disponible'
  }
}

// Fonction utilitaire pour obtenir un message d&apos;erreur
export function getErrorMessage(error: any, fallback?: string): string {
  // Si c&apos;est déjà un message d&apos;erreur formaté
  if (typeof error === 'string') {
    return error
  }

  // Si c&apos;est une erreur avec un message
  if (error?.message) {
    return error.message
  }

  // Si c&apos;est une erreur avec un code
  if (error?.code) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return ErrorMessages.network.connectionFailed
      case 'TIMEOUT':
        return ErrorMessages.network.timeout
      case 'UNAUTHORIZED':
        return ErrorMessages.network.unauthorized
      case 'FORBIDDEN':
        return ErrorMessages.network.forbidden
      case 'NOT_FOUND':
        return ErrorMessages.network.notFound
      case 'SERVER_ERROR':
        return ErrorMessages.network.serverError
      default:
        return fallback || ErrorMessages.generic.unexpected
    }
  }

  // Message par défaut
  return fallback || ErrorMessages.generic.unexpected
}

// Fonction pour formater les erreurs de validation
export function formatValidationError(field: string, error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.type) {
    switch (error.type) {
      case 'required':
        return ErrorMessages.validation.required
      case 'minLength':
        return ErrorMessages.validation.minLength(error.min)
      case 'maxLength':
        return ErrorMessages.validation.maxLength(error.max)
      case 'pattern':
        return ErrorMessages.validation.invalidFormat
      default:
        return `${field}: ${error.message || 'Erreur de validation'}`
    }
  }

  return `${field}: ${error?.message || 'Erreur de validation'}`
}
