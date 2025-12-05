'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { HomepageContentService } from '@/lib/homepage-content-service'

export default function DynamicTitle() {
  const [content, setContent] = useState(HomepageContentService.getContent())
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
    const loadedContent = HomepageContentService.getContent()
    setContent(loadedContent)
  }, [])

  useEffect(() => {
    if (isClient) {
      const appName = content.appIdentity.name
      
      // Définir le titre selon la page actuelle
      let pageTitle = ''
      
      switch (pathname) {
        case '/':
          pageTitle = `${appName} - Streaming de Films et Séries`
          break
        case '/dashboard':
          pageTitle = `Dashboard - ${appName}`
          break
        case '/login':
          pageTitle = `Connexion - ${appName}`
          break
        case '/register':
          pageTitle = `Inscription - ${appName}`
          break
        case '/profile':
          pageTitle = `Profil - ${appName}`
          break
        case '/settings':
          pageTitle = `Paramètres - ${appName}`
          break
        case '/subscription':
          pageTitle = `Abonnement - ${appName}`
          break
        case '/download':
          pageTitle = `Télécharger - ${appName}`
          break
        case '/reset-password':
          pageTitle = `Réinitialiser le mot de passe - ${appName}`
          break
        case '/films':
          pageTitle = `Films - ${appName}`
          break
        case '/series':
          pageTitle = `Séries - ${appName}`
          break
        case '/collection':
          pageTitle = `Collection - ${appName}`
          break
        default:
          if (pathname.startsWith('/admin')) {
            pageTitle = `Administration - ${appName}`
          } else if (pathname.startsWith('/content/')) {
            pageTitle = `Contenu - ${appName}`
          } else if (pathname.startsWith('/watch/')) {
            pageTitle = `Regarder - ${appName}`
          } else {
            pageTitle = `${appName} - Streaming de Films et Séries`
          }
      }
      
      // Mettre à jour le titre de la page
      document.title = pageTitle
      
      // Mettre à jour les métadonnées Open Graph
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) {
        ogTitle.setAttribute('content', pageTitle)
      }
      
      const ogSiteName = document.querySelector('meta[property="og:site_name"]')
      if (ogSiteName) {
        ogSiteName.setAttribute('content', appName)
      }
      
      // Mettre à jour les métadonnées Twitter
      const twitterTitle = document.querySelector('meta[name="twitter:title"]')
      if (twitterTitle) {
        twitterTitle.setAttribute('content', pageTitle)
      }
      
      // Mettre à jour le titre Apple Web App
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
      if (appleTitle) {
        appleTitle.setAttribute('content', appName)
      }
    }
  }, [isClient, content.appIdentity.name, pathname])

  // Ce composant ne rend rien visuellement
  return null
}
