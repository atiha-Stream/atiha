/**
 * Route API pour gérer les données HomepageEditor
 * GET /api/homepage-editor - Récupérer les données de la page d'accueil (publique)
 * POST /api/homepage-editor - Mettre à jour les données (admin uniquement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/homepage-editor - Récupérer les données de la page d'accueil
 * Cette route est publique et retourne l'enregistrement actif
 */
export async function GET() {
  try {
    // Récupérer l'enregistrement actif
    const homepageEditor = await prisma.homepageEditor.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!homepageEditor) {
      // Retourner un objet vide si aucun enregistrement n'est trouvé
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Aucune configuration de page d\'accueil trouvée'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: homepageEditor.id,
        content: homepageEditor.content,
        version: homepageEditor.version,
        isActive: homepageEditor.isActive,
        createdAt: homepageEditor.createdAt,
        updatedAt: homepageEditor.updatedAt
      }
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération des données HomepageEditor', error as Error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des données de la page d\'accueil' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/homepage-editor - Mettre à jour les données de la page d'accueil
 * Cette route nécessite une authentification admin
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const cookieStore = await cookies()
    const adminCookie = cookieStore.get('atiha_admin_user')

    if (!adminCookie) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const admin = JSON.parse(adminCookie.value)

    // Vérifier les permissions admin
    const hasPermission = admin.permissions?.includes('Éditeur de Page d\'Accueil') || 
                         admin.role === 'super_admin'

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, isActive } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Le contenu est requis' },
        { status: 400 }
      )
    }

    // Vérifier si un enregistrement actif existe
    const existingRecord = await prisma.homepageEditor.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    let result

    if (existingRecord) {
      // Mettre à jour l'enregistrement existant
      result = await prisma.homepageEditor.update({
        where: { id: existingRecord.id },
        data: {
          content: content as any,
          version: existingRecord.version + 1,
          isActive: isActive !== undefined ? isActive : existingRecord.isActive,
          updatedBy: admin.username || admin.id,
          updatedAt: new Date()
        }
      })
    } else {
      // Créer un nouvel enregistrement
      result = await prisma.homepageEditor.create({
        data: {
          id: `homepage_${Date.now()}`,
          content: content as any,
          version: 1,
          isActive: isActive !== undefined ? isActive : true,
          createdBy: admin.username || admin.id,
          updatedBy: admin.username || admin.id
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        content: result.content,
        version: result.version,
        isActive: result.isActive,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      },
      message: existingRecord ? 'Configuration mise à jour avec succès' : 'Configuration créée avec succès'
    })
  } catch (error) {
    logger.error('Erreur lors de la mise à jour des données HomepageEditor', error as Error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour des données de la page d\'accueil' 
      },
      { status: 500 }
    )
  }
}

