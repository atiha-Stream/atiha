/**
 * Script pour lancer Prisma Studio avec la base de données de production
 * Configure automatiquement DATABASE_URL avant de lancer Prisma Studio
 */

// Configuration de DATABASE_URL pour la production
process.env.DATABASE_URL = process.env.DATABASE_URL || 
  'postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require'

// Importer db-config pour s'assurer que la configuration est correcte
import '../src/lib/db-config'

// Lancer Prisma Studio
import { spawn } from 'child_process'

console.log('🚀 Lancement de Prisma Studio...')
console.log(`📊 Base de données: ${process.env.DATABASE_URL ? 'Configurée' : 'Non configurée'}\n`)

const studio = spawn('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL
  }
})

studio.on('error', (error) => {
  console.error('❌ Erreur lors du lancement de Prisma Studio:', error)
  process.exit(1)
})

studio.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Prisma Studio s'est terminé avec le code ${code}`)
  }
  process.exit(code || 0)
})

