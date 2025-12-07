/**
 * Configuration de la base de données pour Prisma
 * Configure DATABASE_URL à partir de différentes sources possibles
 * Supporte les variables préfixées avec le nom du projet (ex: atiha_DATABASE_URL)
 */

// Log des variables disponibles (pour debug)
const logDebug = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'production'

// SUPPRIMER PRISMA_DATABASE_URL si elle commence par prisma+postgres://
// pour forcer l'utilisation de DATABASE_URL
if (process.env.PRISMA_DATABASE_URL && process.env.PRISMA_DATABASE_URL.startsWith('prisma+postgres://')) {
  delete process.env.PRISMA_DATABASE_URL
  if (logDebug) {
    console.log('[db-config] ⚠️ PRISMA_DATABASE_URL supprimée (prisma+postgres://) pour forcer l\'utilisation de DATABASE_URL')
  }
}

if (logDebug) {
  console.log('[db-config] Variables disponibles:', {
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
    hasPRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
    hasAtihaDATABASE_URL: !!process.env['atiha_DATABASE_URL'],
    hasAtihaPOSTGRES_URL: !!process.env['atiha_POSTGRES_URL'],
    DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 30) + '...',
  })
}

// Configurer DATABASE_URL si elle n'est pas définie
if (!process.env.DATABASE_URL) {
  // Ordre de priorité :
  // 1. POSTGRES_URL (URL PostgreSQL directe)
  // 2. Variables préfixées avec le nom du projet (atiha_*)
  // 3. PRISMA_DATABASE_URL (mais pas prisma+postgres:// qui est pour Accelerate)
  
  if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL
    if (logDebug) {
      console.log('[db-config] ✅ DATABASE_URL configurée depuis POSTGRES_URL')
    }
  }
  // Fallback: variables préfixées avec le nom du projet (pour Vercel)
  else if (process.env['atiha_POSTGRES_URL']) {
    process.env.DATABASE_URL = process.env['atiha_POSTGRES_URL']
    if (logDebug) {
      console.log('[db-config] ✅ DATABASE_URL configurée depuis atiha_POSTGRES_URL')
    }
  }
  else if (process.env['atiha_DATABASE_URL']) {
    process.env.DATABASE_URL = process.env['atiha_DATABASE_URL']
    if (logDebug) {
      console.log('[db-config] ✅ DATABASE_URL configurée depuis atiha_DATABASE_URL')
    }
  }
  else if (process.env.PRISMA_DATABASE_URL && !process.env.PRISMA_DATABASE_URL.startsWith('prisma+postgres://')) {
    process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL
    if (logDebug) {
      console.log('[db-config] ✅ DATABASE_URL configurée depuis PRISMA_DATABASE_URL')
    }
  }
  // Note: atiha_PRISMA_DATABASE_URL utilise prisma+postgres:// (Accelerate) donc on ne l'utilise pas
}

// Vérifier que DATABASE_URL est définie et valide
if (!process.env.DATABASE_URL) {
  console.error('[db-config] ❌ Erreur: Aucune variable d\'environnement de base de données trouvée')
  console.error('[db-config]    Veuillez définir DATABASE_URL, PRISMA_DATABASE_URL, POSTGRES_URL')
  console.error('[db-config]    ou les variables préfixées (ex: atiha_DATABASE_URL)')
} else {
  // Vérifier le format de l'URL
  if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.error('[db-config] ❌ Erreur: DATABASE_URL doit commencer par postgres:// ou postgresql://')
    console.error('[db-config]    URL actuelle:', process.env.DATABASE_URL.substring(0, 50) + '...')
  } else if (logDebug) {
    console.log('[db-config] ✅ DATABASE_URL est configurée et valide')
  }
}

