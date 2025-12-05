/**
 * Endpoint API pour initialiser les credentials admin côté serveur
 * Cet endpoint s'exécute uniquement côté serveur où les variables d'environnement sont accessibles
 */

import { NextResponse } from 'next/server'
import { adminSecurity } from '@/lib/admin-security'

export async function POST() {
  try {
    // Initialiser les credentials côté serveur
    // Note: adminSecurity.initialize() ne fonctionne que côté client (utilise localStorage)
    // Ici, on doit initialiser directement depuis les variables d'environnement
    
    const username = process.env.ADMIN_USERNAME
    const password = process.env.ADMIN_PASSWORD
    const securityCode = process.env.ADMIN_SECURITY_CODE
    
    if (!username || !password || !securityCode) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Variables d\'environnement manquantes. Vérifiez votre fichier .env.local' 
        },
        { status: 500 }
      )
    }
    
    // Les credentials seront initialisés automatiquement lors du prochain appel à initialize()
    // Pour l'instant, on retourne juste un succès
    return NextResponse.json({ 
      success: true, 
      message: 'Credentials admin disponibles. L\'initialisation se fera automatiquement côté client.' 
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de l\'initialisation des credentials',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

