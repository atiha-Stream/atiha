/**
 * Configuration de Redis
 * Configure REDIS_URL à partir de différentes sources possibles
 * Supporte les variables préfixées avec le nom du projet (ex: atiha_REDIS_URL)
 */

// Configurer REDIS_URL si elle n'est pas définie
if (!process.env.REDIS_URL) {
  // Ordre de priorité :
  // 1. REDIS_URL (variable standard)
  // 2. Variables préfixées avec le nom du projet (atiha_*)
  // 3. Construction depuis REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
  
  // Fallback: variables préfixées avec le nom du projet (pour Vercel)
  if (process.env['atiha_REDIS_URL']) {
    process.env.REDIS_URL = process.env['atiha_REDIS_URL']
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ REDIS_URL configurée depuis atiha_REDIS_URL')
    }
  }
  // Construction depuis les variables individuelles si disponibles
  else if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    const host = process.env.REDIS_HOST
    const port = process.env.REDIS_PORT
    const password = process.env.REDIS_PASSWORD
    const protocol = process.env.REDIS_TLS === 'true' ? 'rediss' : 'redis'
    
    if (password) {
      process.env.REDIS_URL = `${protocol}://:${password}@${host}:${port}`
    } else {
      process.env.REDIS_URL = `${protocol}://${host}:${port}`
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ REDIS_URL configurée depuis REDIS_HOST, REDIS_PORT, REDIS_PASSWORD')
    }
  }
}

// Note: REDIS_URL est optionnelle - l'application fonctionne sans Redis
// mais certaines fonctionnalités (rate limiting distribué, cache) ne seront pas disponibles

