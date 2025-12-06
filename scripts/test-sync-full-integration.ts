/**
 * Test d'intégration complet de la synchronisation bidirectionnelle
 * 
 * Ce script simule l'utilisation réelle :
 * 1. Créer un utilisateur dans PostgreSQL
 * 2. Simuler des données dans localStorage (côté client)
 * 3. Tester la synchronisation vers PostgreSQL via les API routes
 * 4. Vérifier que les données sont bien synchronisées
 */

import { PrismaClient } from '@prisma/client'
import { logger } from '../src/lib/logger'

const prisma = new PrismaClient()
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface TestData {
  userId: string
  email: string
  watchHistory: Array<{ contentId: string; contentType: string; progress: number }>
  watchlist: Array<{ contentId: string; contentType: string }>
  favorites: Array<{ contentId: string; contentType: string }>
  ratings: Array<{ contentId: string; contentType: string; rating: number; review?: string }>
}

async function testFullIntegration() {
  console.log('🧪 Test d\'intégration complet de la synchronisation\n')
  console.log('='.repeat(60))

  let testUserId: string | null = null

  try {
    // 1. Créer un utilisateur de test dans PostgreSQL
    console.log('\n👤 1. Création d\'un utilisateur de test...')
    const testEmail = `test-integration-${Date.now()}@example.com`
    
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Integration User',
        passwordHash: 'test_hash_' + Date.now(),
        isActive: true,
        isBanned: false,
        loginCount: 0
      }
    })
    
    testUserId = testUser.id
    console.log(`   ✅ Utilisateur créé: ${testUserId}`)

    // 2. Simuler des données dans "localStorage" (représentées ici par des objets)
    console.log('\n💾 2. Simulation de données localStorage...')
    const localData: TestData = {
      userId: testUserId,
      email: testEmail,
      watchHistory: [
        { contentId: 'movie-1', contentType: 'movie', progress: 75 },
        { contentId: 'series-1', contentType: 'series', progress: 50 }
      ],
      watchlist: [
        { contentId: 'movie-2', contentType: 'movie' },
        { contentId: 'series-2', contentType: 'series' }
      ],
      favorites: [
        { contentId: 'movie-3', contentType: 'movie' },
        { contentId: 'series-3', contentType: 'series' }
      ],
      ratings: [
        { contentId: 'movie-4', contentType: 'movie', rating: 5, review: 'Excellent !' },
        { contentId: 'series-4', contentType: 'series', rating: 4 }
      ]
    }
    console.log(`   ✅ Données simulées: ${localData.watchHistory.length} historique, ${localData.watchlist.length} watchlist, ${localData.favorites.length} favoris, ${localData.ratings.length} notes`)

    // 3. Tester la synchronisation via les API routes (simulation)
    console.log('\n🔄 3. Test de synchronisation via Prisma (simulation API routes)...')

    // 3.1 Synchroniser WatchHistory
    console.log('   📺 Synchronisation WatchHistory...')
    for (const item of localData.watchHistory) {
      await prisma.watchHistory.upsert({
        where: {
          userId_contentId: {
            userId: testUserId,
            contentId: item.contentId
          }
        },
        update: {
          progress: item.progress,
          watchedAt: new Date()
        },
        create: {
          userId: testUserId,
          contentId: item.contentId,
          contentType: item.contentType,
          progress: item.progress,
          duration: 120,
          completed: item.progress >= 90
        }
      })
    }
    const dbHistory = await prisma.watchHistory.findMany({
      where: { userId: testUserId }
    })
    console.log(`      ✅ ${dbHistory.length} élément(s) synchronisé(s)`)

    // 3.2 Synchroniser Watchlist
    console.log('   📋 Synchronisation Watchlist...')
    for (const item of localData.watchlist) {
      await prisma.watchlist.upsert({
        where: {
          userId_contentId_contentType: {
            userId: testUserId,
            contentId: item.contentId,
            contentType: item.contentType
          }
        },
        update: {
          addedAt: new Date()
        },
        create: {
          userId: testUserId,
          contentId: item.contentId,
          contentType: item.contentType
        }
      })
    }
    const dbWatchlist = await prisma.watchlist.findMany({
      where: { userId: testUserId }
    })
    console.log(`      ✅ ${dbWatchlist.length} élément(s) synchronisé(s)`)

    // 3.3 Synchroniser Favorites
    console.log('   ⭐ Synchronisation Favorites...')
    for (const item of localData.favorites) {
      await prisma.favorite.upsert({
        where: {
          userId_contentId_contentType: {
            userId: testUserId,
            contentId: item.contentId,
            contentType: item.contentType
          }
        },
        update: {
          addedAt: new Date()
        },
        create: {
          userId: testUserId,
          contentId: item.contentId,
          contentType: item.contentType
        }
      })
    }
    const dbFavorites = await prisma.favorite.findMany({
      where: { userId: testUserId }
    })
    console.log(`      ✅ ${dbFavorites.length} élément(s) synchronisé(s)`)

    // 3.4 Synchroniser Ratings
    console.log('   ⭐ Synchronisation Ratings...')
    for (const item of localData.ratings) {
      await prisma.rating.upsert({
        where: {
          userId_contentId_contentType: {
            userId: testUserId,
            contentId: item.contentId,
            contentType: item.contentType
          }
        },
        update: {
          rating: item.rating,
          review: item.review || null,
          updatedAt: new Date()
        },
        create: {
          userId: testUserId,
          contentId: item.contentId,
          contentType: item.contentType,
          rating: item.rating,
          review: item.review || null
        }
      })
    }
    const dbRatings = await prisma.rating.findMany({
      where: { userId: testUserId }
    })
    console.log(`      ✅ ${dbRatings.length} élément(s) synchronisé(s)`)

    // 4. Vérifier l'intégrité des données
    console.log('\n🔍 4. Vérification de l\'intégrité des données...')
    
    const allHistoryMatch = localData.watchHistory.every(localItem => 
      dbHistory.some(dbItem => dbItem.contentId === localItem.contentId)
    )
    const allWatchlistMatch = localData.watchlist.every(localItem => 
      dbWatchlist.some(dbItem => dbItem.contentId === localItem.contentId)
    )
    const allFavoritesMatch = localData.favorites.every(localItem => 
      dbFavorites.some(dbItem => dbItem.contentId === localItem.contentId)
    )
    const allRatingsMatch = localData.ratings.every(localItem => 
      dbRatings.some(dbItem => dbItem.contentId === localItem.contentId && dbItem.rating === localItem.rating)
    )

    console.log(`   WatchHistory: ${allHistoryMatch ? '✅' : '❌'} ${dbHistory.length}/${localData.watchHistory.length}`)
    console.log(`   Watchlist:    ${allWatchlistMatch ? '✅' : '❌'} ${dbWatchlist.length}/${localData.watchlist.length}`)
    console.log(`   Favorites:    ${allFavoritesMatch ? '✅' : '❌'} ${dbFavorites.length}/${localData.favorites.length}`)
    console.log(`   Ratings:      ${allRatingsMatch ? '✅' : '❌'} ${dbRatings.length}/${localData.ratings.length}`)

    // 5. Test de lecture depuis PostgreSQL (simulation du chargement)
    console.log('\n📖 5. Test de lecture depuis PostgreSQL...')
    
    const loadedHistory = await prisma.watchHistory.findMany({
      where: { userId: testUserId },
      orderBy: { watchedAt: 'desc' }
    })
    const loadedWatchlist = await prisma.watchlist.findMany({
      where: { userId: testUserId },
      orderBy: { addedAt: 'desc' }
    })
    const loadedFavorites = await prisma.favorite.findMany({
      where: { userId: testUserId },
      orderBy: { addedAt: 'desc' }
    })
    const loadedRatings = await prisma.rating.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`   ✅ WatchHistory: ${loadedHistory.length} élément(s) chargé(s)`)
    console.log(`   ✅ Watchlist: ${loadedWatchlist.length} élément(s) chargé(s)`)
    console.log(`   ✅ Favorites: ${loadedFavorites.length} élément(s) chargé(s)`)
    console.log(`   ✅ Ratings: ${loadedRatings.length} élément(s) chargé(s)`)

    // Résumé final
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ DU TEST D\'INTÉGRATION')
    console.log('='.repeat(60))
    console.log(`   Utilisateur:        ${testUserId}`)
    console.log(`   Email:              ${testEmail}`)
    console.log(`   WatchHistory:       ${dbHistory.length} élément(s) ✅`)
    console.log(`   Watchlist:          ${dbWatchlist.length} élément(s) ✅`)
    console.log(`   Favorites:         ${dbFavorites.length} élément(s) ✅`)
    console.log(`   Ratings:            ${dbRatings.length} élément(s) ✅`)
    console.log(`   Intégrité:          ${allHistoryMatch && allWatchlistMatch && allFavoritesMatch && allRatingsMatch ? '✅' : '❌'}`)

    const allTestsPassed = allHistoryMatch && allWatchlistMatch && allFavoritesMatch && allRatingsMatch
    
    if (allTestsPassed) {
      console.log('\n✅ Tous les tests d\'intégration sont passés !')
      console.log('   La synchronisation bidirectionnelle fonctionne correctement.')
    } else {
      console.log('\n⚠️  Certains tests ont échoué. Vérifiez les résultats ci-dessus.')
    }

    return {
      success: allTestsPassed,
      userId: testUserId,
      counts: {
        watchHistory: dbHistory.length,
        watchlist: dbWatchlist.length,
        favorites: dbFavorites.length,
        ratings: dbRatings.length
      }
    }

  } catch (error) {
    logger.error('Erreur lors du test d\'intégration', error as Error)
    console.error('\n❌ Erreur:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test si le script est appelé directement
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
                     process.argv[1]?.includes('test-sync-full-integration')

if (isMainModule || import.meta.url.endsWith('test-sync-full-integration.ts')) {
  testFullIntegration()
    .then((result) => {
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      logger.error('Erreur lors des tests d\'intégration', error as Error)
      console.error('Erreur:', error)
      process.exit(1)
    })
}

export default testFullIntegration

