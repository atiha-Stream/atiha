/**
 * Fichier d'instrumentation Next.js
 * S'exécute une fois au démarrage du serveur
 * Utilisé pour initialiser Sentry côté serveur
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialiser Sentry côté serveur si disponible
    try {
      await import('../sentry.server.config')
    } catch (error) {
      // Sentry non configuré, continuer sans
      console.log('Sentry non configuré côté serveur')
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialiser Sentry côté edge si disponible
    try {
      await import('../sentry.edge.config')
    } catch (error) {
      // Sentry non configuré, continuer sans
      console.log('Sentry non configuré côté edge')
    }
  }
}

