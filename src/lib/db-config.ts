/**
 * Configuration de la base de données pour Prisma
 * Configure DATABASE_URL à partir de PRISMA_DATABASE_URL ou POSTGRES_URL si elle n'est pas définie
 */

// Configurer DATABASE_URL si elle n'est pas définie
if (!process.env.DATABASE_URL) {
  // Utiliser PRISMA_DATABASE_URL en priorité (spécifique à Prisma)
  if (process.env.PRISMA_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL
  }
  // Sinon utiliser POSTGRES_URL
  else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL
  }
}

// Vérifier que DATABASE_URL est définie
if (!process.env.DATABASE_URL) {
  console.error('❌ Erreur: Aucune variable d\'environnement de base de données trouvée')
  console.error('   Veuillez définir DATABASE_URL, PRISMA_DATABASE_URL ou POSTGRES_URL')
}

