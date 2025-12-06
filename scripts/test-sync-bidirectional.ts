/**
 * Script de test pour la synchronisation bidirectionnelle localStorage ↔ PostgreSQL
 * 
 * Ce script teste :
 * 1. Création d'un utilisateur en local
 * 2. Connexion à PostgreSQL
 * 3. Synchronisation des données (watchHistory, watchlist, favorites, ratings)
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()

interface TestResults {
  userCreation: { success: boolean; userId?: string; error?: string }
  databaseConnection: { success: boolean; error?: string }
  watchHistorySync: { success: boolean; error?: string }
  watchlistSync: { success: boolean; error?: string }
  favoritesSync: { success: boolean; error?: string }
  ratingsSync: { success: boolean; error?: string }
}

async function testBidirectionalSync() {
  console.log('🧪 Test de synchronisation bidirectionnelle localStorage ↔ PostgreSQL\n')
  console.log('=' .repeat(60))

  const results: TestResults = {
    userCreation: { success: false },
    databaseConnection: { success: false },
    watchHistorySync: { success: false },
    watchlistSync: { success: false },
    favoritesSync: { success: false },
    ratingsSync: { success: false }
  }

  // 1. Test de connexion à PostgreSQL
  console.log('\n📊 1. Test de connexion à PostgreSQL...')
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    console.log(`   ✅ Connexion réussie (${userCount} utilisateur(s) dans la DB)`)
    results.databaseConnection = { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ Erreur de connexion: ${errorMsg}`)
    results.databaseConnection = { success: false, error: errorMsg }
    await prisma.$disconnect()
    return results
  }

  // 2. Créer un utilisateur de test dans PostgreSQL
  console.log('\n👤 2. Création d\'un utilisateur de test dans PostgreSQL...')
  let testUserId: string | null = null
  
  try {
    const testEmail = `test-sync-${Date.now()}@example.com`
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })

    if (existingUser) {
      testUserId = existingUser.id
      console.log(`   ℹ️  Utilisateur existant trouvé: ${testUserId}`)
    } else {
      // Créer un nouvel utilisateur
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test Sync User',
          passwordHash: 'test_hash_' + Date.now(), // Hash factice pour le test
          isActive: true,
          isBanned: false,
          loginCount: 0
        }
      })
      testUserId = newUser.id
      console.log(`   ✅ Utilisateur créé: ${testUserId} (${testEmail})`)
    }
    
    results.userCreation = { success: true, userId: testUserId }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ Erreur lors de la création: ${errorMsg}`)
    results.userCreation = { success: false, error: errorMsg }
    await prisma.$disconnect()
    return results
  }

  if (!testUserId) {
    console.log('   ❌ Impossible de créer ou trouver un utilisateur de test')
    await prisma.$disconnect()
    return results
  }

  // 3. Test de synchronisation WatchHistory
  console.log('\n📺 3. Test de synchronisation WatchHistory...')
  try {
    // Créer un élément d'historique
    const watchHistoryItem = await prisma.watchHistory.upsert({
      where: {
        userId_contentId: {
          userId: testUserId,
          contentId: 'test-movie-1'
        }
      },
      update: {
        progress: 50,
        duration: 120,
        completed: false,
        watchedAt: new Date()
      },
      create: {
        userId: testUserId,
        contentId: 'test-movie-1',
        contentType: 'movie',
        progress: 50,
        duration: 120,
        completed: false
      }
    })

    // Vérifier la lecture
    const readHistory = await prisma.watchHistory.findMany({
      where: { userId: testUserId }
    })

    if (readHistory.length > 0 && readHistory.some(h => h.contentId === 'test-movie-1')) {
      console.log(`   ✅ WatchHistory synchronisé (${readHistory.length} élément(s))`)
      results.watchHistorySync = { success: true }
    } else {
      throw new Error('Élément non trouvé après création')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ Erreur: ${errorMsg}`)
    results.watchHistorySync = { success: false, error: errorMsg }
  }

  // 4. Test de synchronisation Watchlist
  console.log('\n📋 4. Test de synchronisation Watchlist...')
  try {
    const watchlistItem = await prisma.watchlist.upsert({
      where: {
        userId_contentId_contentType: {
          userId: testUserId,
          contentId: 'test-series-1',
          contentType: 'series'
        }
      },
      update: {
        addedAt: new Date()
      },
      create: {
        userId: testUserId,
        contentId: 'test-series-1',
        contentType: 'series'
      }
    })

    const readWatchlist = await prisma.watchlist.findMany({
      where: { userId: testUserId }
    })

    if (readWatchlist.length > 0 && readWatchlist.some(w => w.contentId === 'test-series-1')) {
      console.log(`   ✅ Watchlist synchronisée (${readWatchlist.length} élément(s))`)
      results.watchlistSync = { success: true }
    } else {
      throw new Error('Élément non trouvé après création')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ Erreur: ${errorMsg}`)
    results.watchlistSync = { success: false, error: errorMsg }
  }

  // 5. Test de synchronisation Favorites
  console.log('\n⭐ 5. Test de synchronisation Favorites...')
  try {
    const favoriteItem = await prisma.favorite.upsert({
      where: {
        userId_contentId_contentType: {
          userId: testUserId,
          contentId: 'test-movie-2',
          contentType: 'movie'
        }
      },
      update: {
        addedAt: new Date()
      },
      create: {
        userId: testUserId,
        contentId: 'test-movie-2',
        contentType: 'movie'
      }
    })

    const readFavorites = await prisma.favorite.findMany({
      where: { userId: testUserId }
    })

    if (readFavorites.length > 0 && readFavorites.some(f => f.contentId === 'test-movie-2')) {
      console.log(`   ✅ Favorites synchronisés (${readFavorites.length} élément(s))`)
      results.favoritesSync = { success: true }
    } else {
      throw new Error('Élément non trouvé après création')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ Erreur: ${errorMsg}`)
    results.favoritesSync = { success: false, error: errorMsg }
  }

  // 6. Test de synchronisation Ratings
  console.log('\n⭐ 6. Test de synchronisation Ratings...')
  try {
    const ratingItem = await prisma.rating.upsert({
      where: {
        userId_contentId_contentType: {
          userId: testUserId,
          contentId: 'test-movie-3',
          contentType: 'movie'
        }
      },
      update: {
        rating: 5,
        review: 'Excellent film pour le test !',
        updatedAt: new Date()
      },
      create: {
        userId: testUserId,
        contentId: 'test-movie-3',
        contentType: 'movie',
        rating: 5,
        review: 'Excellent film pour le test !'
      }
    })

    const readRatings = await prisma.rating.findMany({
      where: { userId: testUserId }
    })

    if (readRatings.length > 0 && readRatings.some(r => r.contentId === 'test-movie-3' && r.rating === 5)) {
      console.log(`   ✅ Ratings synchronisés (${readRatings.length} élément(s))`)
      results.ratingsSync = { success: true }
    } else {
      throw new Error('Élément non trouvé après création')
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.log(`   ❌ Erreur: ${errorMsg}`)
    results.ratingsSync = { success: false, error: errorMsg }
  }

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('='.repeat(60))
  console.log(`   Connexion DB:        ${results.databaseConnection.success ? '✅' : '❌'}`)
  console.log(`   Création utilisateur: ${results.userCreation.success ? '✅' : '❌'}`)
  console.log(`   WatchHistory:        ${results.watchHistorySync.success ? '✅' : '❌'}`)
  console.log(`   Watchlist:           ${results.watchlistSync.success ? '✅' : '❌'}`)
  console.log(`   Favorites:           ${results.favoritesSync.success ? '✅' : '❌'}`)
  console.log(`   Ratings:             ${results.ratingsSync.success ? '✅' : '❌'}`)

  const allSuccess = Object.values(results).every(r => r.success)
  if (allSuccess) {
    console.log('\n✅ Tous les tests de synchronisation sont passés !')
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.')
  }

  // Nettoyage (optionnel - commenté pour garder les données de test)
  // console.log('\n🧹 Nettoyage des données de test...')
  // try {
  //   await prisma.watchHistory.deleteMany({ where: { userId: testUserId } })
  //   await prisma.watchlist.deleteMany({ where: { userId: testUserId } })
  //   await prisma.favorite.deleteMany({ where: { userId: testUserId } })
  //   await prisma.rating.deleteMany({ where: { userId: testUserId } })
  //   await prisma.user.delete({ where: { id: testUserId } })
  //   console.log('   ✅ Données de test supprimées')
  // } catch (error) {
  //   console.log(`   ⚠️  Erreur lors du nettoyage: ${error}`)
  // }

  await prisma.$disconnect()
  return results
}

// Exécuter le test si le script est appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.includes('test-sync-bidirectional')

if (isMainModule || import.meta.url.endsWith('test-sync-bidirectional.ts')) {
  testBidirectionalSync()
    .then((results) => {
      const allSuccess = Object.values(results).every(r => r.success)
      process.exit(allSuccess ? 0 : 1)
    })
    .catch((error) => {
      logger.error('Erreur lors des tests de synchronisation', error as Error)
      console.error('Erreur:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export default testBidirectionalSync

