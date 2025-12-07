/**
 * Script pour configurer DATABASE_URL avant l'exécution de Prisma
 * Ce script est utilisé dans le build pour s'assurer que DATABASE_URL est définie
 * avant que Prisma ne valide le schéma
 */

// Configurer DATABASE_URL si elle n'est pas définie
if (!process.env.DATABASE_URL) {
  // Ordre de priorité :
  // 1. POSTGRES_URL
  // 2. PRISMA_DATABASE_URL (mais pas prisma+postgres:// qui est pour Accelerate)
  // 3. Variables préfixées avec le nom du projet (atiha_*)
  
  if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL
    console.log('✅ DATABASE_URL configurée depuis POSTGRES_URL')
  }
  else if (process.env.PRISMA_DATABASE_URL && !process.env.PRISMA_DATABASE_URL.startsWith('prisma+postgres://')) {
    process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL
    console.log('✅ DATABASE_URL configurée depuis PRISMA_DATABASE_URL')
  }
  // Fallback: variables préfixées avec le nom du projet (pour Vercel)
  else if (process.env['atiha_DATABASE_URL']) {
    process.env.DATABASE_URL = process.env['atiha_DATABASE_URL']
    console.log('✅ DATABASE_URL configurée depuis atiha_DATABASE_URL')
  }
  else if (process.env['atiha_POSTGRES_URL']) {
    process.env.DATABASE_URL = process.env['atiha_POSTGRES_URL']
    console.log('✅ DATABASE_URL configurée depuis atiha_POSTGRES_URL')
  }
}

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  Aucune variable d\'environnement de base de données trouvée')
  console.warn('   Le build continuera sans connexion DB (identifiants codés en dur disponibles)')
  console.warn('   Pour utiliser Prisma, définissez DATABASE_URL, PRISMA_DATABASE_URL, POSTGRES_URL')
  console.warn('   ou les variables préfixées (ex: atiha_DATABASE_URL)')
  // Ne pas faire échouer le build - on utilise des identifiants codés en dur
  process.exit(0)
}

// Vérifier le format de l'URL
if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.warn('⚠️  DATABASE_URL ne commence pas par postgres:// ou postgresql://')
  console.warn('   URL actuelle:', process.env.DATABASE_URL.substring(0, 50) + '...')
  console.warn('   Le build continuera sans connexion DB (identifiants codés en dur disponibles)')
  // Ne pas faire échouer le build
  process.exit(0)
}

console.log('✅ DATABASE_URL est configurée et valide')



