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
  console.error('❌ Erreur: Aucune variable d\'environnement de base de données trouvée')
  console.error('   Veuillez définir DATABASE_URL, PRISMA_DATABASE_URL, POSTGRES_URL')
  console.error('   ou les variables préfixées (ex: atiha_DATABASE_URL)')
  process.exit(1)
}

// Vérifier le format de l'URL
if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ Erreur: DATABASE_URL doit commencer par postgres:// ou postgresql://')
  console.error('   URL actuelle:', process.env.DATABASE_URL.substring(0, 50) + '...')
  process.exit(1)
}

console.log('✅ DATABASE_URL est configurée et valide')



