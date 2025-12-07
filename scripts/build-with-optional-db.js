/**
 * Script de build qui gère optionnellement la connexion DB
 */

const { execSync } = require('child_process')

console.log('🔨 Démarrage du build...\n')

// 1. Configurer DATABASE_URL
console.log('1️⃣ Configuration DATABASE_URL...')
require('./setup-db-env.js')

// 2. Tenter db push si DATABASE_URL est définie
if (process.env.DATABASE_URL) {
  console.log('\n2️⃣ Application du schéma Prisma...')
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: process.env
    })
    console.log('✅ Schéma Prisma appliqué\n')
  } catch (error) {
    console.warn('⚠️  Erreur lors de l\'application du schéma (non bloquant)')
    console.warn('   Le build continuera avec les identifiants codés en dur\n')
  }
} else {
  console.log('\n2️⃣ DATABASE_URL non définie, skip db push')
  console.log('   Le build utilisera les identifiants codés en dur\n')
}

// 3. Générer le client Prisma
console.log('3️⃣ Génération du client Prisma...')
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env
  })
  console.log('✅ Client Prisma généré\n')
} catch (error) {
  console.error('❌ Erreur lors de la génération du client Prisma')
  process.exit(1)
}

// 4. Build Next.js
console.log('4️⃣ Build Next.js...')
try {
  execSync('next build', {
    stdio: 'inherit',
    env: process.env
  })
  console.log('\n✅ Build terminé avec succès!')
} catch (error) {
  console.error('\n❌ Erreur lors du build Next.js')
  process.exit(1)
}

