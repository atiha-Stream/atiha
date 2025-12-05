/**
 * Configuration Sentry pour le client (browser)
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ajuster la valeur de sampleRate pour contrôler le pourcentage d'événements envoyés
  // 0.0 = 0% des événements, 1.0 = 100% des événements
  // En production, utiliser une valeur plus faible (ex: 0.1 = 10%)
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Activer le tracing pour les performances
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environnement
  environment: process.env.NODE_ENV || 'development',

  // Activer les replays de session (optionnel, pour voir ce qui s'est passé avant l'erreur)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Filtrer les erreurs sensibles
  beforeSend(event, hint) {
    // Ne pas envoyer d'erreurs en développement (sauf si explicitement activé)
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null
    }

    // Filtrer les erreurs de réseau courantes
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof Error) {
        // Ignorer les erreurs de réseau courantes
        if (error.message.includes('NetworkError') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed')) {
          return null
        }
      }
    }

    return event
  },

  // Ignorer certaines erreurs
  ignoreErrors: [
    // Erreurs de navigateur communes
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Erreurs de réseau
    'NetworkError',
    'Failed to fetch',
  ],
})

