/**
 * Configuration de la base de données pour Prisma
 * Configure DATABASE_URL à partir de différentes sources possibles
 * Supporte les variables préfixées avec le nom du projet (ex: atiha_DATABASE_URL)
 */

// Configurer DATABASE_URL si elle n'est pas définie
if (!process.env.DATABASE_URL) {
  // Ordre de priorité :
  // 1. PRISMA_DATABASE_URL (mais pas prisma+postgres:// qui est pour Accelerate)
  // 2. POSTGRES_URL
  // 3. Variables préfixées avec le nom du projet (atiha_*)
  
  if (process.env.PRISMA_DATABASE_URL && !process.env.PRISMA_DATABASE_URL.startsWith('prisma+postgres://')) {
    process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ DATABASE_URL configurée depuis PRISMA_DATABASE_URL')
    }
  }
  else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ DATABASE_URL configurée depuis POSTGRES_URL')
    }
  }
  // Fallback: variables préfixées avec le nom du projet (pour Vercel)
  else if (process.env['atiha_DATABASE_URL']) {
    process.env.DATABASE_URL = process.env['atiha_DATABASE_URL']
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ DATABASE_URL configurée depuis atiha_DATABASE_URL')
    }
  }
  else if (process.env['atiha_POSTGRES_URL']) {
    process.env.DATABASE_URL = process.env['atiha_POSTGRES_URL']
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ DATABASE_URL configurée depuis atiha_POSTGRES_URL')
    }
  }
  // Note: atiha_PRISMA_DATABASE_URL utilise prisma+postgres:// (Accelerate) donc on ne l'utilise pas
}

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ Erreur: Aucune variable d\'environnement de base de données trouvée')
  console.error('   Veuillez définir DATABASE_URL, PRISMA_DATABASE_URL, POSTGRES_URL')
  console.error('   ou les variables préfixées (ex: atiha_DATABASE_URL)')
}

