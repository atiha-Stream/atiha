/**
 * Route API pour migrer les données depuis localStorage vers PostgreSQL
 * POST /api/migration/localStorage - Migrer toutes les données
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { EncryptionService } from '@/lib/encryption-service'
import { logger } from '@/lib/logger'

/**
 * POST /api/migration/localStorage - Migrer les données
 * 
 * Cette route accepte les données localStorage en JSON et les migre vers PostgreSQL
 */
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!adminCookie) {
      return NextResponse.json(
        { error: 'Non autorisé - Admin uniquement' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { users, watchlist, watchHistory, favorites, ratings } = body

    const results = {
      users: { migrated: 0, skipped: 0, errors: 0 },
      watchlist: { migrated: 0, errors: 0 },
      watchHistory: { migrated: 0, errors: 0 },
      favorites: { migrated: 0, errors: 0 },
      ratings: { migrated: 0, errors: 0 },
    }

    // Migrer les utilisateurs
    if (users && Array.isArray(users)) {
      for (const user of users) {
        try {
          // Vérifier si l'utilisateur existe déjà
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (existing) {
            results.users.skipped++
            continue
          }

          // Hacher le mot de passe si nécessaire
          let passwordHash = user.password
          if (!passwordHash.startsWith('$2')) {
            // Le mot de passe n'est pas haché, le hacher
            passwordHash = await EncryptionService.hashPassword(user.password)
          }

          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              phone: user.phone,
              country: user.country,
              passwordHash,
              isActive: user.isActive ?? true,
              isBanned: user.isBanned ?? false,
              loginCount: user.loginCount ?? 0,
              registrationDate: user.registrationDate 
                ? new Date(user.registrationDate) 
                : new Date(),
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
            },
          })

          results.users.migrated++
        } catch (error) {
          logger.error(`Erreur migration utilisateur ${user.email}`, error as Error)
          results.users.errors++
        }
      }
    }

    // Migrer la watchlist
    if (watchlist && Array.isArray(watchlist)) {
      for (const item of watchlist) {
        try {
          // Vérifier que l'utilisateur existe
          const user = await prisma.user.findUnique({
            where: { id: item.userId },
          })

          if (!user) {
            results.watchlist.errors++
            continue
          }

          await prisma.watchlist.upsert({
            where: {
              userId_contentId_contentType: {
                userId: item.userId,
                contentId: item.contentId,
                contentType: item.contentType,
              },
            },
            update: {},
            create: {
              userId: item.userId,
              contentId: item.contentId,
              contentType: item.contentType,
              addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
            },
          })

          results.watchlist.migrated++
        } catch (error) {
          logger.error('Erreur migration watchlist', error as Error)
          results.watchlist.errors++
        }
      }
    }

    // Migrer l'historique de visionnage
    if (watchHistory && Array.isArray(watchHistory)) {
      for (const item of watchHistory) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: item.userId },
          })

          if (!user) {
            results.watchHistory.errors++
            continue
          }

          await prisma.watchHistory.upsert({
            where: {
              userId_contentId: {
                userId: item.userId,
                contentId: item.contentId,
              },
            },
            update: {
              progress: item.progress ?? 0,
              duration: item.duration ?? null,
              completed: item.completed ?? false,
            },
            create: {
              userId: item.userId,
              contentId: item.contentId,
              contentType: item.contentType,
              progress: item.progress ?? 0,
              duration: item.duration ?? null,
              completed: item.completed ?? false,
              watchedAt: item.watchedAt ? new Date(item.watchedAt) : new Date(),
            },
          })

          results.watchHistory.migrated++
        } catch (error) {
          logger.error('Erreur migration historique', error as Error)
          results.watchHistory.errors++
        }
      }
    }

    // Migrer les favoris
    if (favorites && Array.isArray(favorites)) {
      for (const item of favorites) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: item.userId },
          })

          if (!user) {
            results.favorites.errors++
            continue
          }

          await prisma.favorite.upsert({
            where: {
              userId_contentId_contentType: {
                userId: item.userId,
                contentId: item.contentId,
                contentType: item.contentType,
              },
            },
            update: {},
            create: {
              userId: item.userId,
              contentId: item.contentId,
              contentType: item.contentType,
              addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
            },
          })

          results.favorites.migrated++
        } catch (error) {
          logger.error('Erreur migration favoris', error as Error)
          results.favorites.errors++
        }
      }
    }

    // Migrer les notes
    if (ratings && Array.isArray(ratings)) {
      for (const item of ratings) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: item.userId },
          })

          if (!user) {
            results.ratings.errors++
            continue
          }

          await prisma.rating.upsert({
            where: {
              userId_contentId_contentType: {
                userId: item.userId,
                contentId: item.contentId,
                contentType: item.contentType,
              },
            },
            update: {
              rating: item.rating,
              review: item.review ?? null,
            },
            create: {
              userId: item.userId,
              contentId: item.contentId,
              contentType: item.contentType,
              rating: item.rating,
              review: item.review ?? null,
            },
          })

          results.ratings.migrated++
        } catch (error) {
          logger.error('Erreur migration notes', error as Error)
          results.ratings.errors++
        }
      }
    }

    logger.info('Migration localStorage terminée', results)

    return NextResponse.json({
      success: true,
      message: 'Migration terminée',
      results,
    })
  } catch (error) {
    logger.error('Erreur lors de la migration', error as Error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la migration' },
      { status: 500 }
    )
  }
}

