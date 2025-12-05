/**
 * Composant qui initialise le stockage sécurisé et migre les données existantes
 */

'use client'

import { useEffect } from 'react'
import { SecureStorage } from '@/lib/secure-storage'
import { envValidator } from '@/lib/env-validator'
import { logger } from '@/lib/logger'

export default function SecureStorageInitializer() {
  useEffect(() => {
    // Valider les variables d'environnement au démarrage
    // Note: En Next.js, les variables sans NEXT_PUBLIC_ ne sont disponibles que côté serveur
    // La validation côté client peut échouer même si les variables sont définies (c'est normal)
    if (typeof window !== 'undefined') {
      // La validation retourne true côté client même si les variables serveur ne sont pas accessibles
      // car c'est le comportement attendu en Next.js
      envValidator.validateAndReport()
      
      // En production, la validation côté serveur sera effectuée lors du build/démarrage
      // Ici on ne fait que logger un avertissement si nécessaire
    }

    // Migrer automatiquement les données existantes vers le format chiffré
    SecureStorage.migrateToEncrypted()
  }, [])

  return null // Ce composant ne rend rien
}

