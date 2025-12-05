/**
 * Composant SkipLink pour la navigation au clavier
 * Permet aux utilisateurs de sauter directement au contenu principal
 */

'use client'

import Link from 'next/link'

export default function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-100"
      aria-label="Aller au contenu principal"
    >
      Aller au contenu principal
    </Link>
  )
}

