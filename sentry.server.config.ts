/**
 * Configuration Sentry pour le serveur (Node.js)
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ajuster la valeur de sampleRate pour contrôler le pourcentage d'événements envoyés
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Activer le tracing pour les performances
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environnement
  environment: process.env.NODE_ENV || 'development',

  // Filtrer les erreurs sensibles
  beforeSend(event, hint) {
    // Ne pas envoyer d'erreurs en développement (sauf si explicitement activé)
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null
    }

    return event
  },

  // Ignorer certaines erreurs
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],
})

