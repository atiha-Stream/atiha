/**
 * Script de test des routes API
 * Teste /api/homepage-editor et /api/auth/login avec Prisma
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL n\'est pas définie')
  console.error('   Veuillez définir DATABASE_URL avant d\'exécuter ce script')
  process.exit(1)
}

const prisma = new PrismaClient()

async function testHomepageEditorAPI() {
  console.log('\n📄 Test de /api/homepage-editor (GET)...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/homepage-editor`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ GET /api/homepage-editor : Succès')
      if (data.data) {
        console.log(`   - ID: ${data.data.id}`)
        console.log(`   - Version: ${data.data.version}`)
        console.log(`   - Actif: ${data.data.isActive}`)
      } else {
        console.log('   - Aucune donnée trouvée (normal si la base est vide)')
      }
    } else {
      console.log(`❌ GET /api/homepage-editor : Erreur ${response.status}`)
      console.log(`   - Message: ${data.error || 'Erreur inconnue'}`)
    }
  } catch (error) {
    console.error('❌ Erreur lors du test GET /api/homepage-editor:', error)
  }
}

async function testAuthLoginAPI() {
  console.log('\n🔐 Test de /api/auth/login...')
  
  // Créer un utilisateur de test dans la base de données
  const testEmail = 'test@example.com'
  const testPassword = 'test123456'
  
  try {
    // Vérifier si l'utilisateur existe déjà
    let testUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    if (!testUser) {
      // Créer un utilisateur de test
      const passwordHash = await bcrypt.hash(testPassword, 10)
      testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          passwordHash: passwordHash,
          isActive: true,
          isBanned: false,
        }
      })
      console.log(`✅ Utilisateur de test créé: ${testEmail}`)
    } else {
      console.log(`ℹ️  Utilisateur de test existe déjà: ${testEmail}`)
    }

    // Obtenir un token CSRF (nécessaire pour la route login)
    console.log('   - Note: Le test complet nécessite un token CSRF')
    console.log('   - Pour tester manuellement, utilisez le formulaire de connexion dans l\'application')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur de test:', error)
  }
}

async function testDirectPrismaQueries() {
  console.log('\n🔍 Test des requêtes Prisma directes...')
  
  try {
    // Test 1: Vérifier la connexion
    await prisma.$connect()
    console.log('✅ Connexion Prisma réussie')

    // Test 2: Compter les utilisateurs
    const userCount = await prisma.user.count()
    console.log(`✅ Nombre d'utilisateurs: ${userCount}`)

    // Test 3: Vérifier HomepageEditor
    const homepageCount = await prisma.homepageEditor.count()
    console.log(`✅ Nombre d'enregistrements HomepageEditor: ${homepageCount}`)

    // Test 4: Récupérer le premier HomepageEditor actif
    const activeHomepage = await prisma.homepageEditor.findFirst({
      where: { isActive: true }
    })
    
    if (activeHomepage) {
      console.log(`✅ HomepageEditor actif trouvé: ${activeHomepage.id}`)
    } else {
      console.log('ℹ️  Aucun HomepageEditor actif trouvé')
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests Prisma:', error)
  }
}

async function main() {
  console.log('🚀 Test des routes API avec Prisma\n')
  console.log(`📍 URL de base: ${BASE_URL}`)
  console.log(`🗄️  Base de données: ${DATABASE_URL ? 'Configurée' : 'Non configurée'}\n`)

  // Test 1: Requêtes Prisma directes
  await testDirectPrismaQueries()

  // Test 2: API HomepageEditor (nécessite que le serveur Next.js soit en cours d'exécution)
  console.log('\n⚠️  Pour tester les routes API HTTP, assurez-vous que le serveur Next.js est en cours d\'exécution (npm run dev)')
  const serverRunning = await fetch(`${BASE_URL}/api/health`).catch(() => null)
  
  if (serverRunning && serverRunning.ok) {
    await testHomepageEditorAPI()
    await testAuthLoginAPI()
  } else {
    console.log('\n⚠️  Serveur Next.js non accessible')
    console.log('   Démarrez le serveur avec: npm run dev')
    console.log('   Puis réexécutez ce script')
  }

  await prisma.$disconnect()
  console.log('\n✨ Tests terminés')
}

main()
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })

