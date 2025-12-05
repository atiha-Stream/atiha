'use client'
import React, { useState, useEffect } from 'react'
import { HomepageContentService, type HomepageContent } from '@/lib/homepage-content-service'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { 
  PencilIcon, 
  EyeIcon, 
  StarIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
interface HomepageEditorProps {
  onClose?: () => void
}
export default function HomepageEditor({ onClose }: HomepageEditorProps = {}) {
  const router = useRouter()
  const [content, setContent] = useState<HomepageContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [expandedModals, setExpandedModals] = useState<Record<string, boolean>>({
    title: false,
    vrHeadset: false,
    tv: false,
    vrHeadset2: false,
    tv2: false
  })
  const [sectionsOrder, setSectionsOrder] = useState([
    { id: 'homepageSlider', label: '🏠 Slider Accueil', color: 'blue' },
    { id: 'hero', label: '🏠 Hero', color: 'red' },
    { id: 'features', label: '✨ Fonctionnalités', color: 'green' },
    { id: 'newReleases', label: '🆕 Nouveautés', color: 'yellow' },
    { id: 'media', label: '🎬 Media', color: 'purple' },
    { id: 'faq', label: '❓ FAQ', color: 'indigo' },
    { id: 'footer', label: '📄 Footer', color: 'gray' },
    { id: 'social', label: '🔗 Réseaux', color: 'blue' },
    { id: 'identity', label: '🏢 Identité', color: 'orange' },
    { id: 'colors', label: '🎨 Couleurs', color: 'pink' },
    { id: 'download', label: '📱 Download', color: 'emerald' },
    { id: 'sharePage', label: '🔗 Contenu Partagé', color: 'cyan' },
    { id: 'featuredPoster', label: '⭐ Affiche Mise en Avant', color: 'purple' },
    { id: 'featuredSlider', label: '🎯 Slider Mise en Avant', color: 'indigo' },
    { id: 'spotlightSlider', label: '⭐ Slider À la une', color: 'purple' },
    { id: 'posterSpotlight', label: '🎬 Affiche à la une', color: 'emerald' },
    { id: 'catalogue', label: '📚 Catalogue', color: 'teal' }
  ])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  useEffect(() => {
    loadContent()
  }, [])

  // Sauvegarder automatiquement les changements (avec debounce pour éviter les sauvegardes excessives)
  useEffect(() => {
    if (content) {
      const timeoutId = setTimeout(() => {
        HomepageContentService.saveContent(content)
      }, 100) // Debounce de 100ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [content])

  // Fonction helper pour gérer les types de contenu dans newReleases (indépendant de catalogue)
  const handleNewReleasesToggle = (contentType: keyof HomepageContent['newReleases']['contentTypes'], isChecked: boolean) => {
    if (!content) return
    
    const updatedContent = {
      ...content,
      newReleases: { 
        ...content.newReleases, 
        contentTypes: {
          ...content.newReleases?.contentTypes,
          [contentType]: isChecked
        }
      }
    }
    
    setContent(updatedContent)
  }

  // Fonction helper pour gérer la visibilité des catalogues (indépendant de newReleases)
  const handleCatalogueVisibilityToggle = (catalogueId: string, isChecked: boolean) => {
    if (!content) return
    
    const updatedContent = {
      ...content,
      catalogue: {
        ...content.catalogue,
        items: content.catalogue?.items?.map(item => 
          item.id === catalogueId ? { ...item, isVisible: isChecked } : item
        ) || []
      }
    }
    
    setContent(updatedContent)
  }

  // Écouter les changements du localStorage pour synchroniser les URLs des réseaux sociaux
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedContent = HomepageContentService.getContent()
      setContent(updatedContent)
    }

    const handleContentUpdate = (event: CustomEvent) => {
      // Mettre à jour seulement les URLs des réseaux sociaux, pas le nom de l&apos;application
      setContent((prevContent: HomepageContent | null) => {
        if (!prevContent) return prevContent
        // Vérifier si le contenu a vraiment changé pour éviter les boucles infinies
        const newSocialLinks = event.detail.updatedContent.appIdentity.socialLinks
        if (JSON.stringify(prevContent.appIdentity.socialLinks) === JSON.stringify(newSocialLinks)) {
          return prevContent // Pas de changement, retourner le même objet
        }
        
        return {
          ...prevContent,
          appIdentity: {
            ...prevContent.appIdentity,
            socialLinks: newSocialLinks
          }
        }
      })
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('homepageContentUpdated', handleContentUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('homepageContentUpdated', handleContentUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
  }, [sectionsOrder])

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'newReleases', 'media', 'footer', 'social', 'identity', 'colors', 'download', 'sharePage', 'featuredSlider', 'catalogue']
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i])
        if (section && section.offsetTop <= scrollPosition) {
          // Vérifier si la section active a vraiment changé pour éviter les mises à jour inutiles
          if (activeSection !== sections[i]) {
          setActiveSection(sections[i])
          }
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeSection])
  const loadContent = async () => {
    try {
      setIsLoading(true)
      const data = HomepageContentService.getContent()
      
      // S'assurer que les données du footer sont initialisées
      if (!data.footer) {
        data.footer = {
          quickLinksTitle: 'Liens rapides',
          availableOnTitle: 'Disponible sur',
          quickLinks: {
            downloadApp: {
              text: 'Télécharger l\'app',
              url: '/download',
              isVisible: true
            },
            login: {
              text: 'Connexion',
              url: '/login',
              isVisible: true
            },
            register: {
              text: 'Inscription',
              url: '/register',
              isVisible: true
            }
          },
          availableOn: {
            title: {
              text: 'Mobile (iOS & Android)',
              isVisible: true
            },
            vrHeadset: {
              text: 'VR Headset',
              isVisible: true
            },
            tv: {
              text: 'TV',
              isVisible: true
            },
            vrHeadset2: {
              text: 'VR Headset 2',
              isVisible: true
            },
            tv2: {
              text: 'TV 2',
              isVisible: true
            }
          },
          isVisible: true
        }
      }

      // S'assurer que les données des réseaux sociaux sont initialisées
      if (!data.appIdentity.socialLinks) {
        // Utiliser le nom de l&apos;application pour générer les URLs par défaut
        const appName = data.appIdentity.name || 'Atiha'
        const normalizedName = appName.toLowerCase().replace(/\s+/g, '_')
        
        data.appIdentity.socialLinks = {
          telegram: {
            url: `https://t.me/${normalizedName}_official`,
            isVisible: true,
            text: 'Telegram',
            description: 'Nous suivre sur'
          },
          discord: {
            url: `https://discord.gg/${normalizedName}`,
            isVisible: false,
            text: 'Discord',
            description: 'Rejoindre notre'
          },
          twitter: {
            url: `https://twitter.com/${normalizedName}_official`,
            isVisible: false,
            text: 'Twitter',
            description: 'Suivre sur'
          },
          instagram: {
            url: `https://instagram.com/${normalizedName}_official`,
            isVisible: false,
            text: 'Instagram',
            description: 'Suivre sur'
          },
          youtube: {
            url: `https://youtube.com/@${normalizedName}_official`,
            isVisible: false,
            text: 'YouTube',
            description: 'S\'abonner à'
          }
        }
      }

      // S'assurer que les données de la section download sont initialisées
      if (!data.download) {
        data.download = {
          hero: {
            title: 'Téléchargez',
            description: 'Créer un compte et installez sur tous vos appareils pour une expérience de streaming unique, avec téléchargement hors ligne et notifications push.'
          },
          devices: {
            mobile: {
              title: 'Mobile',
              description: 'Installez sur votre smartphone pour regarder vos films et séries préférés partout, même sans connexion internet.',
              subtitle: 'Gratuit',
              buttonText: 'Installer'
            },
            tablet: {
              title: 'Tablette',
              description: 'Profitez d\'un écran plus grand avec la même qualité de streaming et toutes les fonctionnalités premium sur votre tablette.',
              subtitle: 'Gratuit',
              buttonText: 'Installer'
            },
            desktop: {
              title: 'Ordinateur',
              description: 'Utilisez directement dans votre navigateur ou installez-la comme une application native sur votre ordinateur.',
              subtitle: 'Gratuit',
              buttonText: 'Installer'
            }
          },
          features: {
            title: 'Fonctionnalités de',
            description: 'Découvrez tous les avantages d\'utiliser comme application native',
            isVisible: true,
            items: [
              {
                title: 'Mode hors ligne',
                description: 'Téléchargez vos contenus préférés pour les regarder sans internet'
              },
              {
                title: 'Notifications',
                description: 'Recevez des alertes pour les nouveaux épisodes et films'
              },
              {
                title: 'Performance',
                description: 'Chargement rapide et interface fluide comme une app native'
              },
              {
                title: 'Accès rapide',
                description: 'Lancez directement depuis votre écran d\'accueil'
              }
            ]
          }
        }
      }

      // S'assurer que les données de la section catalogue sont initialisées avec tous les catalogues prédéfinis
      const defaultCatalogueItems = [
        {
          id: 'collection',
          title: 'Notre collection',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'popular-movies',
          title: 'Films Populaires',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'popular-series',
          title: 'Séries Populaires',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'jeux',
          title: 'Jeux',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'sports',
          title: 'Sports',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'animes',
          title: 'Animes',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'tendances',
          title: 'Tendances',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'documentaires',
          title: 'Documentaires',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        },
        {
          id: 'divertissements',
          title: 'Divertissements',
          buttonText: 'Voir tout',
          isVisible: true,
          itemsToShow: 12, // PC
          itemsToShowMobile: 6, // Mobile
          itemsToShowTablet: 9 // Tablette
        }
      ]

      if (!data.catalogue) {
        data.catalogue = {
          isVisible: true,
          items: defaultCatalogueItems
        }
      } else {
        // Préserver les modifications existantes et ajouter seulement les nouveaux catalogues
        const existingItems = data.catalogue.items || []
        const existingIds = existingItems.map(item => item.id)
        
        // S'assurer que tous les items existants ont les champs itemsToShow, itemsToShowMobile, itemsToShowTablet
        // Migration depuis itemsCount si présent
        const updatedExistingItems = existingItems.map(item => {
          // Si l'item a itemsCount mais pas les nouveaux champs, migrer
          if (item.itemsCount && (!item.itemsToShow && !item.itemsToShowMobile && !item.itemsToShowTablet)) {
            return {
              ...item,
              itemsToShow: item.itemsCount, // PC
              itemsToShowMobile: Math.ceil(item.itemsCount / 2), // Mobile (moitié)
              itemsToShowTablet: Math.ceil(item.itemsCount * 0.75), // Tablette (75%)
              itemsCount: undefined // Supprimer l'ancien champ
            }
          }
          // Sinon, s'assurer que les valeurs par défaut sont présentes
          return {
            ...item,
            itemsToShow: item.itemsToShow ?? 12, // PC
            itemsToShowMobile: item.itemsToShowMobile ?? 6, // Mobile
            itemsToShowTablet: item.itemsToShowTablet ?? 9 // Tablette
          }
        })
        
        // Ajouter seulement les nouveaux catalogues qui n'existent pas déjà
        const newItems = defaultCatalogueItems.filter(item => !existingIds.includes(item.id))
        
        data.catalogue = {
          ...data.catalogue,
          items: [...updatedExistingItems, ...newItems]
        }
      }
      
      setContent(data)
      
             // Charger l'ordre des sections depuis le contenu sauvegardé
      const defaultSectionsMap = [
                 { id: 'homepageSlider', label: '🏠 Slider Accueil', color: 'blue' },
                 { id: 'hero', label: '🏠 Hero', color: 'red' },
                 { id: 'features', label: '✨ Fonctionnalités', color: 'green' },
                 { id: 'newReleases', label: '🆕 Nouveautés', color: 'yellow' },
                 { id: 'media', label: '🎬 Media', color: 'purple' },
                 { id: 'faq', label: '❓ FAQ', color: 'indigo' },
                 { id: 'footer', label: '📄 Footer', color: 'gray' },
                 { id: 'social', label: '🔗 Réseaux', color: 'blue' },
                 { id: 'identity', label: '🏢 Identité', color: 'orange' },
                 { id: 'colors', label: '🎨 Couleurs', color: 'pink' },
                 { id: 'download', label: '📱 Download', color: 'emerald' },
                 { id: 'sharePage', label: '🔗 Contenu Partagé', color: 'cyan' },
                 { id: 'featuredPoster', label: '⭐ Affiche Mise en Avant', color: 'purple' },
                 { id: 'featuredSlider', label: '🎯 Slider Mise en Avant', color: 'indigo' },
                 { id: 'spotlightSlider', label: '⭐ Slider À la une', color: 'purple' },
                 { id: 'posterSpotlight', label: '🎬 Affiche à la une', color: 'emerald' },
                 { id: 'catalogue', label: '📚 Catalogue', color: 'teal' }
             ]

      // Utiliser l'ordre sauvegardé s'il existe, sinon utiliser l'ordre par défaut
      let savedOrder = data.sectionsOrder || defaultSectionsMap.map(s => s.id)
      
      // Si sharePage n'est pas dans l'ordre sauvegardé, l'insérer après download
      if (!savedOrder.includes('sharePage')) {
        const downloadIndex = savedOrder.indexOf('download')
        if (downloadIndex !== -1) {
          // Insérer sharePage juste après download
          savedOrder = [
            ...savedOrder.slice(0, downloadIndex + 1),
            'sharePage',
            ...savedOrder.slice(downloadIndex + 1)
          ]
        } else {
          // Si download n'existe pas, ajouter sharePage à la fin
          savedOrder.push('sharePage')
        }
      }
      
      // Créer un map pour accéder rapidement aux métadonnées des sections
      const sectionsMap = new Map(defaultSectionsMap.map(s => [s.id, s]))
      
      // Reconstruire l'ordre des sections en respectant l'ordre sauvegardé
      const orderedSections: Array<{ id: string; label: string; color: string }> = []
      const seenIds = new Set<string>()
      
      // D'abord, ajouter les sections dans l'ordre sauvegardé
      savedOrder.forEach(id => {
        const section = sectionsMap.get(id)
        if (section) {
          orderedSections.push(section)
          seenIds.add(id)
        }
      })
      
      // Ensuite, ajouter les sections manquantes (nouvelles sections non sauvegardées)
      defaultSectionsMap.forEach(section => {
        if (!seenIds.has(section.id)) {
          orderedSections.push(section)
        }
      })
      
      // Mettre à jour l'état avec l'ordre réel (sauvegardé ou par défaut)
      setSectionsOrder(orderedSections)
      
      // Si l'ordre a changé (nouvelles sections ajoutées), sauvegarder
      const currentOrderIds = orderedSections.map(s => s.id)
      if (JSON.stringify(savedOrder) !== JSON.stringify(currentOrderIds)) {
             const updatedData = {
               ...data,
          sectionsOrder: currentOrderIds
             }
             HomepageContentService.saveContent(updatedData)
      }
    } catch (error) {
      logger.error('Erreur de chargement', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const openPreview = () => {
    window.open('/', '_blank')
  }

  // Fonction d'export de toutes les données de la page d'accueil
  const exportHomepageData = () => {
    if (!content) {
      alert('Aucun contenu à exporter')
      return
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: 'homepage-content',
      version: '1.0',
      data: {
        content: content,
        sectionsOrder: sectionsOrder.map(s => s.id),
        sectionsVisibility: HomepageContentService.getSectionsVisibility()
      }
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `homepage_content_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('Contenu de la page d\'accueil exporté avec succès !')
  }

  // Fonction d'import de toutes les données de la page d'accueil
  const importHomepageData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        
        // Vérifier la structure des données
        if (!importData.data || importData.exportType !== 'homepage-content') {
          alert('Format de fichier invalide. Veuillez sélectionner un fichier JSON valide exporté depuis cette page.')
          return
        }

        const data = importData.data

        // Importer le contenu principal
        if (data.content) {
          HomepageContentService.saveContent(data.content)
          setContent(data.content)
        }

        // Importer l'ordre des sections si disponible
        if (data.sectionsOrder && Array.isArray(data.sectionsOrder)) {
          HomepageContentService.saveContent({ sectionsOrder: data.sectionsOrder })
          // Mettre à jour l'ordre local en préservant les sections existantes
          const importedOrder = data.sectionsOrder
          const updatedOrder = sectionsOrder
            .map(section => {
              const index = importedOrder.indexOf(section.id)
              return { ...section, order: index !== -1 ? index : 999 }
            })
            .sort((a, b) => (a.order || 999) - (b.order || 999))
          setSectionsOrder(updatedOrder)
        }

        // Importer la visibilité des sections si disponible
        if (data.sectionsVisibility) {
          HomepageContentService.saveContent({ sectionsVisibility: data.sectionsVisibility })
        }

        alert('Contenu de la page d\'accueil importé avec succès ! La page va se recharger.')
        
        // Recharger la page pour appliquer tous les changements
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
        // Réinitialiser l'input file
        event.target.value = ''
      } catch (error) {
        console.error('Erreur lors de l\'import:', error)
        alert('Erreur lors de la lecture du fichier. Vérifiez que le fichier est un JSON valide.')
      }
    }
    reader.readAsText(file)
  }

  const handleSave = async () => {
    if (!content) return
    try {
      setIsSaving(true)
      HomepageContentService.saveContent(content)
      alert('Contenu sauvegardé avec succès!')
    } catch (error) {
      logger.error('Erreur de sauvegarde', error as Error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const scrollToSaveButton = () => {
    // Chercher le bouton "Sauvegarder" ou le conteneur des boutons d'action
    const saveButtonContainer = document.querySelector('.mt-8.flex.justify-end')
    if (saveButtonContainer) {
      saveButtonContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedItem(sectionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetSectionId) {
      setDraggedItem(null)
      return
    }

    const newOrder = [...sectionsOrder]
    const draggedIndex = newOrder.findIndex(item => item.id === draggedItem)
    const targetIndex = newOrder.findIndex(item => item.id === targetSectionId)

    // Échanger les positions
    const draggedItemData = newOrder[draggedIndex]
    newOrder[draggedIndex] = newOrder[targetIndex]
    newOrder[targetIndex] = draggedItemData

    setSectionsOrder(newOrder)
    setDraggedItem(null)

    // Sauvegarder automatiquement le nouvel ordre
    if (content) {
      const newContent = {
        ...content,
        sectionsOrder: newOrder.map(item => item.id)
      }
      setContent(newContent)
      HomepageContentService.saveContent(newContent)
    }
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  // Fonctions pour déplacer rapidement une section dans l'ordre de la page d'accueil
  const moveSectionToPosition = (sectionId: string, targetPosition: number) => {
    if (!content) return
    
    // Sections de la page d'accueil uniquement
    const homepageSections = ['homepageSlider', 'hero', 'features', 'newReleases', 'media']
    
    // Vérifier que la section est une section de la page d'accueil
    if (!homepageSections.includes(sectionId)) return
    
    // Obtenir l'ordre actuel depuis le contenu
    const currentOrder = content.sectionsOrder || []
    
    // Filtrer pour ne garder que les sections de la page d'accueil
    const homepageOrder = currentOrder.filter(id => homepageSections.includes(id))
    
    // Trouver l'index actuel de la section
    const currentIndex = homepageOrder.indexOf(sectionId)
    if (currentIndex === -1) return
    
    // Ajuster la position cible si nécessaire
    const maxPosition = homepageOrder.length - 1
    const adjustedPosition = Math.max(0, Math.min(targetPosition, maxPosition))
    
    // Si déjà à la position cible, ne rien faire
    if (currentIndex === adjustedPosition) return
    
    // Créer un nouvel ordre
    const newHomepageOrder = [...homepageOrder]
    const [movedSection] = newHomepageOrder.splice(currentIndex, 1)
    newHomepageOrder.splice(adjustedPosition, 0, movedSection)
    
    // Reconstruire l'ordre complet en remplaçant les sections de la page d'accueil
    const otherSections = currentOrder.filter(id => !homepageSections.includes(id))
    
    // Insérer les sections de la page d'accueil à la bonne position
    const newOrder: string[] = []
    let homepageIndex = 0
    
    for (const section of currentOrder) {
      if (homepageSections.includes(section)) {
        // Remplacer par la nouvelle position
        if (homepageIndex < newHomepageOrder.length) {
          newOrder.push(newHomepageOrder[homepageIndex])
          homepageIndex++
        }
      } else {
        newOrder.push(section)
      }
    }
    
    // Ajouter les sections restantes si nécessaire
    while (homepageIndex < newHomepageOrder.length) {
      newOrder.push(newHomepageOrder[homepageIndex])
      homepageIndex++
    }
    
    const newContent = {
      ...content,
      sectionsOrder: newOrder
    }
    
    // Mettre à jour aussi l'état sectionsOrder pour synchroniser l'affichage
    const sectionsMap = new Map(sectionsOrder.map(s => [s.id, s]))
    const updatedSectionsOrder = newOrder.map(id => {
      const section = sectionsMap.get(id)
      return section || { id, label: id, color: 'gray' }
    })
    setSectionsOrder(updatedSectionsOrder)
    
    setContent(newContent)
    HomepageContentService.saveContent(newContent)
  }

  // Fonctions pour déplacer les catalogues
  const moveCatalogueUp = (index: number) => {
    if (index === 0) return // Déjà en première position
    
    if (!content) return
    const items = [...(content.catalogue?.items || [])]
    const temp = items[index]
    items[index] = items[index - 1]
    items[index - 1] = temp
    
    const newContent = {
      ...content,
      catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
    }
    setContent(newContent)
  }

  const moveCatalogueDown = (index: number) => {
    if (!content) return
    const items = [...(content.catalogue?.items || [])]
    if (index === items.length - 1) return // Déjà en dernière position
    
    const temp = items[index]
    items[index] = items[index + 1]
    items[index + 1] = temp
    
    const newContent = {
      ...content,
      catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
    }
    setContent(newContent)
  }
  
  // Obtenir les positions disponibles pour une section
  const getAvailablePositions = (sectionId: string) => {
    const homepageSections = ['homepageSlider', 'hero', 'features', 'newReleases', 'media']
    if (!homepageSections.includes(sectionId)) return []
    
    const currentOrder = content?.sectionsOrder || []
    const homepageOrder = currentOrder.filter(id => homepageSections.includes(id))
    
    return homepageOrder.map((id, index) => ({
      id,
      position: index + 1,
      label: getSectionLabel(id)
    }))
  }
  
  // Obtenir le label d'une section
  const getSectionLabel = (sectionId: string) => {
    const labels: Record<string, string> = {
      'homepageSlider': 'Slider Accueil',
      'hero': 'Hero',
      'features': 'Fonctionnalités',
      'newReleases': 'Nouveautés',
      'media': 'Media'
    }
    return labels[sectionId] || sectionId
  }
  
  // Composant helper pour les boutons de déplacement rapide
  const QuickMoveButtons = ({ sectionId, color = 'blue' }: { sectionId: string, color?: string }) => {
    const currentOrder = content?.sectionsOrder || []
    const homepageSections = ['homepageSlider', 'hero', 'features', 'newReleases', 'media']
    const homepageOrder = currentOrder.filter(id => homepageSections.includes(id))
    const currentIndex = homepageOrder.indexOf(sectionId)
    
    const colorClasses: Record<string, string> = {
      'blue': 'bg-blue-500',
      'red': 'bg-red-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-500',
      'purple': 'bg-purple-500'
    }
    
    return (
      <div className="mb-6 p-4 bg-dark-100 rounded-lg border border-gray-600">
        <p className="text-sm text-gray-300 mb-3">💡 Cliquez sur un bouton pour déplacer rapidement cette section</p>
        <div className="flex flex-wrap gap-2">
          {getAvailablePositions(sectionId).map((pos) => {
            const isActive = currentIndex === pos.position - 1
            
            return (
              <button
                key={pos.id}
                onClick={() => moveSectionToPosition(sectionId, pos.position - 1)}
                disabled={isActive}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  isActive
                    ? `${colorClasses[color] || 'bg-blue-500'} text-white cursor-not-allowed`
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {pos.position}. {pos.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  if (isLoading) {
    return (
        <div className="bg-dark-200 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-white text-center">Chargement...</p>
      </div>
    )
  }
  if (!content) {
    return (
        <div className="bg-dark-200 rounded-lg p-8">
          <p className="text-white text-center">Erreur de chargement du contenu</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
          >
            Fermer
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="bg-gradient-to-br from-dark-200 via-dark-300 to-dark-200 rounded-2xl w-full max-w-6xl mx-auto shadow-2xl border border-gray-700/50">
      <div className="p-8">
        {/* Boutons Aperçu, Export et Import en haut à droite */}
        <div className="flex flex-col mb-8 space-y-3">
          <button
            onClick={exportHomepageData}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:scale-105 w-full"
            title="Exporter toutes les données de la page d'accueil"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Exporter JSON</span>
          </button>
          <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer w-full">
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span>Importer JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={importHomepageData}
              className="hidden"
            />
          </label>
          <button
            onClick={openPreview}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 w-full"
            title="Aperçu de la page d&apos;accueil"
            aria-label="Aperçu de la page d'accueil"
          >
            <EyeIcon className="w-5 h-5" aria-hidden="true" />
            <span>Aperçu</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-105"
              aria-label="Fermer l&apos;éditeur de page d&apos;accueil"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" aria-hidden="true" />
            </button>
          )}
        </div>
        {/* Navigation par sections */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {sectionsOrder.map((section) => {
              return (
              <button
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
                onDragEnd={handleDragEnd}
                onClick={() => scrollToSection(section.id)}
                className={`px-6 py-3 rounded-xl transition-all duration-300 text-sm font-medium transform hover:scale-105 cursor-move ${
                  activeSection === section.id
                    ? `bg-${section.color}-500 text-white shadow-lg shadow-${section.color}-500/25`
                    : 'bg-dark-400/50 hover:bg-dark-400 text-gray-300 hover:text-white'
                } ${
                  draggedItem === section.id ? 'opacity-50 scale-95' : ''
                }`}
                title={`Cliquez pour naviguer ou glissez-déposez pour réorganiser`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-xs opacity-60">⋮⋮</span>
                  <span>{section.label}</span>
                </span>
              </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Cliquez pour naviguer • Glissez-déposez pour réorganiser les sections
          </p>
          </div>

        {/* Sections organisées verticalement */}
        <div className="space-y-12">
          {/* Section Slider de Mise en Avant Accueil */}
          <div id="homepageSlider" className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl p-8 border border-blue-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <StarIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">Slider de Mise en Avant Accueil</h3>
                <p className="text-gray-400">Mettez en avant vos films et séries phares (Page d&apos;accueil uniquement)</p>
              </div>
            </div>
            
            {/* Boutons de déplacement rapide */}
            <QuickMoveButtons sectionId="homepageSlider" color="blue" />
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Titre (Ligne 1)</label>
                  <input
                    type="text"
                    value={content.homepageSlider?.title || ''}
                    onChange={(e) => setContent({
                      ...content,
                      homepageSlider: { 
                        ...content.homepageSlider, 
                        title: e.target.value,
                        isVisible: content.homepageSlider?.isVisible ?? true,
                        title2: content.homepageSlider?.title2 || '',
                        subtitle: content.homepageSlider?.subtitle || '',
                        buttonText: content.homepageSlider?.buttonText || '',
                        buttonLink: content.homepageSlider?.buttonLink || '',
                        autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5,
                        slides: content.homepageSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Films et Séries à l&apos;affiche"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Titre 2 (Ligne 2)</label>
                  <input
                    type="text"
                    value={content.homepageSlider?.title2 || ''}
                    onChange={(e) => setContent({
                      ...content,
                      homepageSlider: { 
                        ...content.homepageSlider, 
                        title2: e.target.value,
                        isVisible: content.homepageSlider?.isVisible ?? true,
                        title: content.homepageSlider?.title || '',
                        subtitle: content.homepageSlider?.subtitle || '',
                        buttonText: content.homepageSlider?.buttonText || '',
                        buttonLink: content.homepageSlider?.buttonLink || '',
                        autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5,
                        slides: content.homepageSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Découvrez nos recommandations"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sous-titre</label>
                  <input
                    type="text"
                    value={content.homepageSlider?.subtitle || ''}
                    onChange={(e) => setContent({
                      ...content,
                      homepageSlider: { 
                        ...content.homepageSlider, 
                        subtitle: e.target.value,
                        isVisible: content.homepageSlider?.isVisible ?? true,
                        title: content.homepageSlider?.title || '',
                        title2: content.homepageSlider?.title2 || '',
                        buttonText: content.homepageSlider?.buttonText || '',
                        buttonLink: content.homepageSlider?.buttonLink || '',
                        autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5,
                        slides: content.homepageSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="À partir de 7,99 €. Annulable à tout moment."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Texte du bouton</label>
                  <input
                    type="text"
                    value={content.homepageSlider?.buttonText || ''}
                    onChange={(e) => setContent({
                      ...content,
                      homepageSlider: { 
                        ...content.homepageSlider, 
                        buttonText: e.target.value,
                        isVisible: content.homepageSlider?.isVisible ?? true,
                        title: content.homepageSlider?.title || '',
                        title2: content.homepageSlider?.title2 || '',
                        subtitle: content.homepageSlider?.subtitle || '',
                        buttonLink: content.homepageSlider?.buttonLink || '',
                        autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5,
                        slides: content.homepageSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Découvrir"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lien du bouton</label>
                <input
                  type="text"
                  value={content.homepageSlider?.buttonLink || ''}
                  onChange={(e) => setContent({
                    ...content,
                    homepageSlider: { 
                      ...content.homepageSlider, 
                      buttonLink: e.target.value,
                      isVisible: content.homepageSlider?.isVisible ?? true,
                      title: content.homepageSlider?.title || '',
                      title2: content.homepageSlider?.title2 || '',
                      subtitle: content.homepageSlider?.subtitle || '',
                      buttonText: content.homepageSlider?.buttonText || '',
                      autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5,
                      slides: content.homepageSlider?.slides || []
                    }
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="/register"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Vitesse de défilement automatique (secondes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={content.homepageSlider?.autoplaySpeed || 5}
                  onChange={(e) => setContent({
                    ...content,
                    homepageSlider: { 
                      ...content.homepageSlider, 
                      autoplaySpeed: parseInt(e.target.value) || 5,
                      isVisible: content.homepageSlider?.isVisible ?? true,
                      title: content.homepageSlider?.title || '',
                      subtitle: content.homepageSlider?.subtitle || '',
                      slides: content.homepageSlider?.slides || []
                    }
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Gestion des slides */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-white">Slides du Slider</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    💡 Le slider affiche une seule image à la fois avec défilement automatique
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newSlides = [...(content.homepageSlider?.slides || [])]
                    newSlides.push({
                      id: `homepage-slide-${Date.now()}`,
                      imageUrl: '',
                      isActive: true
                    })
                    setContent({
                      ...content,
                      homepageSlider: { 
                        ...content.homepageSlider, 
                        slides: newSlides,
                        isVisible: content.homepageSlider?.isVisible ?? true,
                        title: content.homepageSlider?.title || '',
                        subtitle: content.homepageSlider?.subtitle || '',
                        autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5
                      }
                    })
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Ajouter un slide</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {(content.homepageSlider?.slides || []).map((slide: any, index: number) => (
                  <div key={slide.id} className="bg-dark-500/30 rounded-2xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h5 className="text-white font-medium">Slide {index + 1}</h5>
                        <div className={`w-2 h-2 rounded-full ${slide.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-xs text-gray-400">
                          {slide.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const updatedSlides = (content.homepageSlider?.slides || []).filter((s: any) => s.id !== slide.id)
                          setContent({
                            ...content,
                            homepageSlider: {
                              ...content.homepageSlider,
                              slides: updatedSlides,
                              isVisible: content.homepageSlider?.isVisible ?? true,
                              title: content.homepageSlider?.title || '',
                              subtitle: content.homepageSlider?.subtitle || '',
                              autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5
                            }
                          })
                        }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">URL de l&apos;image</label>
                      <input
                        type="url"
                        value={slide.imageUrl}
                        onChange={(e) => {
                          const updatedSlides = (content.homepageSlider?.slides || []).map((s: any) => 
                            s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                          )
                          setContent({
                            ...content,
                            homepageSlider: {
                              ...content.homepageSlider,
                              slides: updatedSlides,
                              isVisible: content.homepageSlider?.isVisible ?? true,
                              title: content.homepageSlider?.title || '',
                              title2: content.homepageSlider?.title2 || '',
                              subtitle: content.homepageSlider?.subtitle || '',
                              buttonText: content.homepageSlider?.buttonText || '',
                              buttonLink: content.homepageSlider?.buttonLink || '',
                              autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5
                            }
                          })
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`homepage-slide-active-${slide.id}`}
                        checked={slide.isActive}
                        onChange={(e) => {
                          const updatedSlides = (content.homepageSlider?.slides || []).map((s: any) => 
                            s.id === slide.id ? { ...s, isActive: e.target.checked } : s
                          )
                          setContent({
                            ...content,
                            homepageSlider: {
                              ...content.homepageSlider,
                              slides: updatedSlides,
                              isVisible: content.homepageSlider?.isVisible ?? true,
                              title: content.homepageSlider?.title || '',
                              subtitle: content.homepageSlider?.subtitle || '',
                              autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5
                            }
                          })
                        }}
                        className="w-4 h-4 text-blue-500 bg-dark-600 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`homepage-slide-active-${slide.id}`} className="text-sm font-medium text-gray-300">
                        Slide actif (affiché dans le slider)
                      </label>
                    </div>
                  </div>
                ))}
                
                {(!content.homepageSlider?.slides || content.homepageSlider.slides.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Aucun slide configuré. Cliquez sur &quot;Ajouter un slide&quot; pour commencer.</p>
                    <p className="text-sm mt-2">💡 Le slider affiche une seule image à la fois avec défilement automatique</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Checkbox de visibilité */}
            <div className="mt-8 flex items-center space-x-3">
              <input
                type="checkbox"
                id="homepageSlider-visible"
                checked={content.homepageSlider?.isVisible ?? true}
                onChange={(e) => setContent({
                  ...content,
                  homepageSlider: { 
                    ...content.homepageSlider, 
                    isVisible: e.target.checked,
                    title: content.homepageSlider?.title || '',
                    subtitle: content.homepageSlider?.subtitle || '',
                    autoplaySpeed: content.homepageSlider?.autoplaySpeed || 5,
                    slides: content.homepageSlider?.slides || []
                  }
                })}
                className="w-5 h-5 text-blue-500 bg-dark-600 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="homepageSlider-visible" className="text-sm font-medium text-gray-300">
                Afficher cette section sur la page d&apos;accueil uniquement
              </label>
            </div>
          </div>

          {/* Section Hero */}
          <div id="hero" className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-3xl p-8 border border-red-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <StarIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">Section Hero</h3>
                <p className="text-gray-400">Contenu principal de votre page d&apos;accueil</p>
              </div>
            </div>
            
            {/* Boutons de déplacement rapide */}
            <QuickMoveButtons sectionId="hero" color="red" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titre Principal
                  </label>
                  <input
                    type="text"
                    value={content.hero.title}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, title: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Votre titre principal..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    value={content.hero.subtitle}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, subtitle: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Votre sous-titre..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={content.hero.description}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, description: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Décrivez votre service..."
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bouton Principal - Texte
                  </label>
                  <input
                    type="text"
                    value={content.hero.primaryButton.text}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { 
                        ...content.hero, 
                        primaryButton: { ...content.hero.primaryButton, text: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Texte du bouton principal..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bouton Principal - Lien
                  </label>
                  <input
                    type="text"
                    value={content.hero.primaryButton.link}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { 
                        ...content.hero, 
                        primaryButton: { ...content.hero.primaryButton, link: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="/register"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bouton Secondaire - Texte
                  </label>
                  <input
                    type="text"
                    value={content.hero.secondaryButton.text}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { 
                        ...content.hero, 
                        secondaryButton: { ...content.hero.secondaryButton, text: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Texte du bouton secondaire..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bouton Secondaire - Lien
                  </label>
                  <input
                    type="text"
                    value={content.hero.secondaryButton.link}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { 
                        ...content.hero, 
                        secondaryButton: { ...content.hero.secondaryButton, link: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="/login"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texte du bouton &quot;Télécharger notre application&quot;
                  </label>
                  <input
                    type="text"
                    value={content.hero.downloadButtonText ?? ''}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { 
                        ...content.hero, 
                        downloadButtonText: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Télécharger notre application"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Texte affiché sur le bouton de téléchargement de l&apos;application
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lien du bouton &quot;Télécharger notre application&quot;
                  </label>
                  <input
                    type="text"
                    value={content.hero.downloadButtonLink ?? ''}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { 
                        ...content.hero, 
                        downloadButtonLink: e.target.value
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="/download"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    URL de destination du bouton de téléchargement
                  </p>
                </div>

                {/* Image de fond */}
                <div className="space-y-4 mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="hero-show-background"
                      checked={content.hero.showBackground ?? false}
                      onChange={(e) => setContent({
                        ...content,
                        hero: { 
                          ...content.hero, 
                          showBackground: e.target.checked
                        }
                      })}
                      className="w-5 h-5 text-red-500 bg-dark-600 border-gray-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="hero-show-background" className="text-sm font-medium text-gray-300">
                      Afficher le fond
                    </label>
                  </div>
                  
                  {content.hero.showBackground && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        URL de l&apos;image de fond (ratio 16:9)
                      </label>
                      <input
                        type="url"
                        value={content.hero.backgroundImageUrl || ''}
                        onChange={(e) => setContent({
                          ...content,
                          hero: { 
                            ...content.hero, 
                            backgroundImageUrl: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="https://example.com/hero-background.jpg"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        L&apos;image doit avoir un ratio de 16:9 pour un affichage optimal
                      </p>
                    </div>
                  )}
                </div>
                     </div>
                   </div>
                   
                   {/* Checkbox de visibilité pour Hero */}
                   <div className="mt-6 flex items-center space-x-3">
                     <input
                       type="checkbox"
                       id="hero-visible"
                       checked={content?.sectionsVisibility?.hero ?? true}
                       onChange={(e) => {
                         if (!content) return
                         const newVisibility = HomepageContentService.toggleSectionVisibility('hero')
                         setContent({
                           ...content,
                           sectionsVisibility: newVisibility
                         })
                       }}
                       className="w-5 h-5 text-red-500 bg-dark-600 border-gray-600 rounded focus:ring-red-500"
                     />
                     <label htmlFor="hero-visible" className="text-sm font-medium text-gray-300">
                       Afficher cette section sur la page d&apos;accueil
                     </label>
                   </div>
                 </div>
                 {/* Section Features */}
          <div id="features" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl p-8 border border-green-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <CheckIcon className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">Fonctionnalités</h3>
                <p className="text-gray-400">Mettez en avant vos points forts</p>
              </div>
            </div>
            
            {/* Boutons de déplacement rapide */}
            <QuickMoveButtons sectionId="features" color="green" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feature 1: Streaming */}
              <div className="bg-dark-500/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <EyeIcon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Streaming HD</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                    <input
                      type="text"
                      value={content.features.streaming.title}
                      onChange={(e) => setContent({
                        ...content,
                        features: { 
                          ...content.features, 
                          streaming: { ...content.features.streaming, title: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Streaming HD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={content.features.streaming.description}
                      onChange={(e) => setContent({
                        ...content,
                        features: { 
                          ...content.features, 
                          streaming: { ...content.features.streaming, description: e.target.value }
                        }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Description du streaming..."
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2: Premium */}
              <div className="bg-dark-500/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <StarIcon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Contenu Premium</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                    <input
                      type="text"
                      value={content.features.premium.title}
                      onChange={(e) => setContent({
                        ...content,
                        features: { 
                          ...content.features, 
                          premium: { ...content.features.premium, title: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Contenu Premium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={content.features.premium.description}
                      onChange={(e) => setContent({
                        ...content,
                        features: { 
                          ...content.features, 
                          premium: { ...content.features.premium, description: e.target.value }
                        }
                    })}
                    rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Description du contenu premium..."
                  />
                </div>
              </div>
            </div>

              {/* Feature 3: No Commitment */}
              <div className="bg-dark-500/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">Sans Engagement</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                    <input
                      type="text"
                      value={content.features.noCommitment.title}
                      onChange={(e) => setContent({
                        ...content,
                        features: { 
                          ...content.features, 
                          noCommitment: { ...content.features.noCommitment, title: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Sans Engagement"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={content.features.noCommitment.description}
                      onChange={(e) => setContent({
                        ...content,
                        features: { 
                          ...content.features, 
                          noCommitment: { ...content.features.noCommitment, description: e.target.value }
                        }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 text-sm"
                      placeholder="Description sans engagement..."
                    />
                  </div>
                </div>
                     </div>
                   </div>
                   
                   {/* Checkbox de visibilité pour Features */}
                   <div className="mt-6 flex items-center space-x-3">
                     <input
                       type="checkbox"
                       id="features-visible"
                       checked={content?.sectionsVisibility?.features ?? true}
                        onChange={(e) => {
                         if (!content) return
                         const newVisibility = HomepageContentService.toggleSectionVisibility('features')
                         setContent({
                           ...content,
                           sectionsVisibility: newVisibility
                         })
                        }}
                       className="w-5 h-5 text-green-500 bg-dark-600 border-gray-600 rounded focus:ring-green-500"
                     />
                     <label htmlFor="features-visible" className="text-sm font-medium text-gray-300">
                       Afficher cette section sur la page d&apos;accueil
                     </label>
                   </div>
                 </div>

                 {/* Section Nouveautés */}
                 <div id="newReleases" className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-3xl p-8 border border-yellow-500/20 shadow-xl">
                   <div className="flex items-center space-x-4 mb-8">
                     <button 
                       onClick={scrollToSaveButton}
                       className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                       title="Cliquer pour aller au bouton Sauvegarder"
                     >
                       <StarIcon className="w-6 h-6 text-white" />
                     </button>
                     <div className="flex-1">
                       <h3 className="text-2xl font-bold text-white">Section Nouveautés</h3>
                       <p className="text-gray-400">Affichez les derniers films et séries ajoutés</p>
                     </div>
                   </div>
                   
                   {/* Boutons de déplacement rapide */}
                   <QuickMoveButtons sectionId="newReleases" color="yellow" />
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Titre de la Section
                         </label>
                         <input
                           type="text"
                           value={content.newReleases?.title || ''}
                           onChange={(e) => setContent({
                             ...content,
                             newReleases: { 
                               ...content.newReleases, 
                               title: e.target.value,
                               isVisible: content.newReleases?.isVisible ?? true
                             }
                           })}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="Nouveautés"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Sous-titre
                         </label>
                         <input
                           type="text"
                           value={content.newReleases?.subtitle || ''}
                           onChange={(e) => setContent({
                             ...content,
                             newReleases: { 
                               ...content.newReleases, 
                               subtitle: e.target.value,
                               isVisible: content.newReleases?.isVisible ?? true
                             }
                           })}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="Découvrez nos dernières sorties"
                         />
                       </div>
                     </div>

                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Nombre d&apos;éléments à afficher
                         </label>
                         <input
                           type="number"
                           min="1"
                           max="50"
                           value={content.newReleases?.itemsCount || 6}
                           onChange={(e) => setContent({
                             ...content,
                             newReleases: { 
                               ...content.newReleases, 
                               itemsCount: parseInt(e.target.value) || 6,
                               isVisible: content.newReleases?.isVisible ?? true
                             }
                           })}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="6"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           💡 Nombre de films/séries à afficher dans cette section
                         </p>
                       </div>
                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-visible"
                           checked={content.newReleases?.isVisible ?? true}
                           onChange={(e) => setContent({
                             ...content,
                             newReleases: { 
                               ...content.newReleases, 
                               isVisible: e.target.checked,
                               title: content.newReleases?.title || '',
                               subtitle: content.newReleases?.subtitle || '',
                               itemsCount: content.newReleases?.itemsCount || 6,
                               contentTypes: content.newReleases?.contentTypes || {
                                 collection: true,
                                 movies: true,
                                 series: true
                               }
                             }
                           })}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-visible" className="text-sm font-medium text-gray-300">
                           Afficher cette section sur la page d&apos;accueil
                         </label>
                       </div>
                     </div>
                   </div>

                   {/* Types de catalogue à afficher */}
                   <div className="mt-6 pt-6 border-t border-gray-600">
                     <h4 className="text-lg font-semibold text-white mb-4">Types de catalogue à afficher</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-collection"
                           checked={content.newReleases?.contentTypes?.collection ?? true}
                           onChange={(e) => handleNewReleasesToggle('collection', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-collection" className="text-sm font-medium text-gray-300">
                           Notre collection
                         </label>
                 </div>
                       
                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-movies"
                           checked={content.newReleases?.contentTypes?.movies ?? true}
                           onChange={(e) => handleNewReleasesToggle('movies', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-movies" className="text-sm font-medium text-gray-300">
                           Films Populaires
                         </label>
                       </div>
                       
                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-series"
                           checked={content.newReleases?.contentTypes?.series ?? true}
                           onChange={(e) => handleNewReleasesToggle('series', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-series" className="text-sm font-medium text-gray-300">
                           Séries Populaires
                         </label>
                       </div>

                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-jeux"
                           checked={content.newReleases?.contentTypes?.jeux ?? true}
                           onChange={(e) => handleNewReleasesToggle('jeux', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-jeux" className="text-sm font-medium text-gray-300">
                           Jeux
                         </label>
                       </div>

                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-sports"
                           checked={content.newReleases?.contentTypes?.sports ?? true}
                           onChange={(e) => handleNewReleasesToggle('sports', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-sports" className="text-sm font-medium text-gray-300">
                           Sports
                         </label>
                       </div>

                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-animes"
                           checked={content.newReleases?.contentTypes?.animes ?? true}
                           onChange={(e) => handleNewReleasesToggle('animes', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-animes" className="text-sm font-medium text-gray-300">
                           Animes
                         </label>
                       </div>

                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-tendances"
                           checked={content.newReleases?.contentTypes?.tendances ?? true}
                           onChange={(e) => handleNewReleasesToggle('tendances', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-tendances" className="text-sm font-medium text-gray-300">
                           Tendances
                         </label>
                       </div>

                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-documentaires"
                           checked={content.newReleases?.contentTypes?.documentaires ?? true}
                           onChange={(e) => handleNewReleasesToggle('documentaires', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-documentaires" className="text-sm font-medium text-gray-300">
                           Documentaires
                         </label>
                       </div>

                       <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                           id="newReleases-divertissements"
                           checked={content.newReleases?.contentTypes?.divertissements ?? true}
                           onChange={(e) => handleNewReleasesToggle('divertissements', e.target.checked)}
                           className="w-5 h-5 text-yellow-500 bg-dark-600 border-gray-600 rounded focus:ring-yellow-500"
                         />
                         <label htmlFor="newReleases-divertissements" className="text-sm font-medium text-gray-300">
                           Divertissements
                         </label>
                       </div>
                     </div>
                     <p className="text-xs text-gray-500 mt-2">
                       💡 Sélectionnez les types de contenu à afficher dans la section Nouveautés
                     </p>
                   </div>
                 </div>


                 {/* Section Media */}
                 <div id="media" className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-3xl p-8 border border-purple-500/20 shadow-xl">
                   <div className="flex items-center space-x-4 mb-8">
                     <button 
                       onClick={scrollToSaveButton}
                       className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                       title="Cliquer pour aller au bouton Sauvegarder"
                     >
                       <EyeIcon className="w-6 h-6 text-white" />
                     </button>
                     <div className="flex-1">
                       <h3 className="text-2xl font-bold text-white">Section Media</h3>
                       <p className="text-gray-400">Bande d&apos;annonce et contenu vidéo (Page d&apos;accueil uniquement)</p>
                     </div>
                   </div>
                   
                   {/* Boutons de déplacement rapide */}
                   <QuickMoveButtons sectionId="media" color="purple" />
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Titre
                         </label>
                         <input
                           type="text"
                           value={content.media.title}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { ...content.media, title: e.target.value }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="Bande d&apos;annonce"
                         />
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Sous-titre
                         </label>
                         <input
                           type="text"
                           value={content.media.subtitle}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { ...content.media, subtitle: e.target.value }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="Découvrez notre dernière sortie"
                         />
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Lien vidéo bande d&apos;annonce
                         </label>
                         <input
                           type="text"
                           value={content.media.trailerUrl}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { ...content.media, trailerUrl: e.target.value }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="https://www.youtube.com/watch?v=..."
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           💡 Supporte les liens YouTube uniquement
                         </p>
                       </div>
                     </div>
                     
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Regarder maintenant
                         </label>
                         <input
                           type="text"
                           value={content.media.watchNowText}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { ...content.media, watchNowText: e.target.value }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="Regarder maintenant"
                         />
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           URL film/série
                         </label>
                         <input
                           type="text"
                           value={content.media.contentUrl}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { ...content.media, contentUrl: e.target.value }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="/content/1760277982054 ou /content/1760277982055"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           💡 Lien vers la page du film ou de la série
                         </p>
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Lien vidéo .mp4
                         </label>
                         <input
                           type="text"
                           value={content.media.videoUrl || ''}
                           onChange={(e) => {
                             const isMp4 = e.target.value.toLowerCase().endsWith('.mp4')
                             const newContent = {
                               ...content,
                               media: { 
                                 ...content.media, 
                                 videoUrl: e.target.value,
                                 autoAudio: isMp4 // Active automatiquement l'audio pour les fichiers .mp4
                               }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="https://example.com/video.mp4 ou code embed"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           💡 Lien direct vers un fichier vidéo .mp4 ou code embed (iframe) (son activé automatiquement pour .mp4)
                         </p>
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           URL de l&apos;image (ratio 16:9)
                         </label>
                         <input
                           type="text"
                           value={content.media.imageUrl || ''}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { 
                                 ...content.media, 
                                 imageUrl: e.target.value
                               }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                           placeholder="https://example.com/image.jpg"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           💡 Image de fallback affichée si la vidéo ne peut pas être lue (ratio 16:9 recommandé)
                         </p>
                       </div>
                       
                        <div className="mt-6 space-y-4">
                          <div className="flex items-center space-x-3">
                         <input
                           type="checkbox"
                              id="media-visible-homepage"
                              checked={content.media?.isVisibleHomepage ?? true}
                           onChange={(e) => {
                             const newContent = {
                               ...content,
                               media: { 
                                 ...content.media, 
                                    isVisibleHomepage: e.target.checked
                               }
                             }
                             setContent(newContent)
                             HomepageContentService.saveContent(newContent)
                           }}
                           className="w-5 h-5 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                         />
                            <label htmlFor="media-visible-homepage" className="text-sm font-medium text-gray-300">
                           Afficher cette section sur la page d&apos;accueil
                         </label>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="media-visible-dashboard"
                              checked={content.media?.isVisibleDashboard ?? true}
                              onChange={(e) => {
                                const newContent = {
                                  ...content,
                                  media: { 
                                    ...content.media, 
                                    isVisibleDashboard: e.target.checked
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="w-5 h-5 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="media-visible-dashboard" className="text-sm font-medium text-gray-300">
                              Afficher cette section sur la page d&apos;utilisateur
                            </label>
                          </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Section FAQ */}
                 <div id="faq" className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-3xl p-8 border border-indigo-500/20 shadow-xl">
                   <div className="flex items-center space-x-4 mb-8">
                     <button 
                       onClick={scrollToSaveButton}
                       className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                       title="Cliquer pour aller au bouton Sauvegarder"
                     >
                       <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                     </button>
                     <div>
                       <h3 className="text-2xl font-bold text-white">Section FAQ</h3>
                       <p className="text-gray-400">Foire aux questions avec système d&apos;accordéon</p>
                     </div>
                   </div>
                   
                   <div className="space-y-6">
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">Titre de la section</label>
                       <input
                         type="text"
                         value={content.faq?.title || ''}
                         onChange={(e) => setContent({
                           ...content,
                           faq: { 
                             ...content.faq, 
                             title: e.target.value,
                             isVisible: content.faq?.isVisible ?? true,
                             questions: content.faq?.questions || []
                           }
                         })}
                         className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
                         placeholder="Foire aux questions"
                       />
                     </div>
                     
                     {/* Gestion des questions */}
                     <div className="mt-8">
                       <div className="flex items-center justify-between mb-6">
                         <div>
                           <h4 className="text-lg font-semibold text-white">Questions FAQ</h4>
                           <p className="text-sm text-gray-400 mt-1">
                             💡 Ajoutez des questions et réponses pour votre FAQ
                           </p>
                         </div>
                         <button
                           onClick={() => {
                             const newQuestions = [...(content.faq?.questions || [])]
                             newQuestions.push({
                               id: `faq-${Date.now()}`,
                               question: '',
                               answer: '',
                               isActive: true
                             })
                             setContent({
                               ...content,
                               faq: { 
                                 ...content.faq, 
                                 questions: newQuestions,
                                 isVisible: content.faq?.isVisible ?? true,
                                 title: content.faq?.title || ''
                               }
                             })
                           }}
                           className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                         >
                           <PlusIcon className="w-4 h-4" />
                           <span>Ajouter une question</span>
                         </button>
                       </div>
                       
                       <div className="space-y-4">
                         {(content.faq?.questions || []).map((question: any, index: number) => (
                           <div key={question.id} className="bg-dark-500/30 rounded-2xl p-6 border border-indigo-500/20">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center space-x-3">
                                 <h5 className="text-white font-medium">Question {index + 1}</h5>
                                 <div className={`w-2 h-2 rounded-full ${question.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                                 <span className="text-xs text-gray-400">
                                   {question.isActive ? 'Active' : 'Inactive'}
                                 </span>
                               </div>
                               <button
                                 onClick={() => {
                                   const updatedQuestions = (content.faq?.questions || []).filter((q: any) => q.id !== question.id)
                                   setContent({
                                     ...content,
                                     faq: {
                                       ...content.faq,
                                       questions: updatedQuestions,
                                       isVisible: content.faq?.isVisible ?? true,
                                       title: content.faq?.title || ''
                                     }
                                   })
                                 }}
                                 className="text-red-500 hover:text-red-400 transition-colors"
                               >
                                 <TrashIcon className="w-5 h-5" />
                               </button>
                             </div>
                             
                             <div className="space-y-4">
                               <div>
                                 <label className="block text-sm font-medium text-gray-300 mb-2">Question</label>
                                 <input
                                   type="text"
                                   value={question.question}
                                   onChange={(e) => {
                                     const updatedQuestions = (content.faq?.questions || []).map((q: any) => 
                                       q.id === question.id ? { ...q, question: e.target.value } : q
                                     )
                                     setContent({
                                       ...content,
                                       faq: {
                                         ...content.faq,
                                         questions: updatedQuestions,
                                         isVisible: content.faq?.isVisible ?? true,
                                         title: content.faq?.title || ''
                                       }
                                     })
                                   }}
                                   className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 text-sm"
                                   placeholder="Votre question ici..."
                                 />
                               </div>
                               
                               <div>
                                 <label className="block text-sm font-medium text-gray-300 mb-2">Réponse</label>
                                 <textarea
                                   value={question.answer}
                                   onChange={(e) => {
                                     const updatedQuestions = (content.faq?.questions || []).map((q: any) => 
                                       q.id === question.id ? { ...q, answer: e.target.value } : q
                                     )
                                     setContent({
                                       ...content,
                                       faq: {
                                         ...content.faq,
                                         questions: updatedQuestions,
                                         isVisible: content.faq?.isVisible ?? true,
                                         title: content.faq?.title || ''
                                       }
                                     })
                                   }}
                                   rows={4}
                                   className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 text-sm resize-none"
                                   placeholder="Votre réponse ici..."
                                 />
                               </div>
                               
                               <div className="flex items-center space-x-3">
                                 <input
                                   type="checkbox"
                                   id={`faq-question-active-${question.id}`}
                                   checked={question.isActive}
                                   onChange={(e) => {
                                     const updatedQuestions = (content.faq?.questions || []).map((q: any) => 
                                       q.id === question.id ? { ...q, isActive: e.target.checked } : q
                                     )
                                     setContent({
                                       ...content,
                                       faq: {
                                         ...content.faq,
                                         questions: updatedQuestions,
                                         isVisible: content.faq?.isVisible ?? true,
                                         title: content.faq?.title || ''
                                       }
                                     })
                                   }}
                                   className="w-4 h-4 text-indigo-500 bg-dark-600 border-gray-600 rounded focus:ring-indigo-500"
                                 />
                                 <label htmlFor={`faq-question-active-${question.id}`} className="text-sm font-medium text-gray-300">
                                   Question active (affichée dans la FAQ)
                                 </label>
                               </div>
                             </div>
                           </div>
                         ))}
                         
                         {(!content.faq?.questions || content.faq.questions.length === 0) && (
                           <div className="text-center py-8 text-gray-400">
                             <p>Aucune question configurée. Cliquez sur &quot;Ajouter une question&quot; pour commencer.</p>
                             <p className="text-sm mt-2">💡 Les questions s&apos;affichent avec un système d&apos;accordéon</p>
                           </div>
                         )}
                       </div>
                     </div>
                     
                     {/* Checkbox de visibilité */}
                     <div className="mt-8 flex items-center space-x-3">
                       <input
                         type="checkbox"
                         id="faq-visible"
                         checked={content?.sectionsVisibility?.faq ?? true}
                         onChange={(e) => {
                           if (!content) return
                           const newVisibility = HomepageContentService.toggleSectionVisibility('faq')
                           setContent({
                           ...content,
                             sectionsVisibility: newVisibility
                           })
                         }}
                         className="w-5 h-5 text-indigo-500 bg-dark-600 border-gray-600 rounded focus:ring-indigo-500"
                       />
                       <label htmlFor="faq-visible" className="text-sm font-medium text-gray-300">
                         Afficher cette section sur la page d&apos;accueil
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Section Footer */}
                 <div id="footer" className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-3xl p-8 border border-gray-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
                     <button 
                       onClick={scrollToSaveButton}
                       className="w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                       title="Cliquer pour aller au bouton Sauvegarder"
                     >
                       <PencilIcon className="w-6 h-6 text-white" />
                     </button>
                     <div>
                       <h3 className="text-2xl font-bold text-white">Section Footer</h3>
                       <p className="text-gray-400">Liens rapides et informations de disponibilité</p>
              </div>
                   </div>
                   
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Liens rapides */}
                     <div className="space-y-6">
                       <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Titre de la section
                         </label>
                         <input
                           type="text"
                           value={content.footer.quickLinksTitle}
                           onChange={(e) => {
                             setContent({
                               ...content,
                               footer: {
                                 ...content.footer,
                                 quickLinksTitle: e.target.value
                               }
                             })
                           }}
                           className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Liens rapides"
                         />
                       </div>
                       
                       <div className="space-y-4">
              <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">
                             Télécharger l&apos;app
                           </label>
                           <div className="grid grid-cols-1 gap-3">
                             <input
                               type="text"
                               value={content.footer.quickLinks.downloadApp.text}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     quickLinks: {
                                       ...content.footer.quickLinks,
                                       downloadApp: {
                                         ...content.footer.quickLinks.downloadApp,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Télécharger l&apos;app"
                             />
                             <input
                               type="text"
                               value={content.footer.quickLinks.downloadApp.url}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     quickLinks: {
                                       ...content.footer.quickLinks,
                                       downloadApp: {
                                         ...content.footer.quickLinks.downloadApp,
                                         url: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="/download"
                             />
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.quickLinks.downloadApp.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       quickLinks: {
                                         ...content.footer.quickLinks,
                                         downloadApp: {
                                           ...content.footer.quickLinks.downloadApp,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher ce lien</span>
                             </label>
              </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                             Connexion
                </label>
                           <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                               value={content.footer.quickLinks.login.text}
                               onChange={(e) => {
                                 setContent({
                    ...content,
                                   footer: {
                                     ...content.footer,
                                     quickLinks: {
                                       ...content.footer.quickLinks,
                                       login: {
                                         ...content.footer.quickLinks.login,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Connexion"
                             />
                             <input
                               type="text"
                               value={content.footer.quickLinks.login.url}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     quickLinks: {
                                       ...content.footer.quickLinks,
                                       login: {
                                         ...content.footer.quickLinks.login,
                                         url: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="/login"
                             />
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.quickLinks.login.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       quickLinks: {
                                         ...content.footer.quickLinks,
                                         login: {
                                           ...content.footer.quickLinks.login,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher ce lien</span>
                             </label>
              </div>
                         </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                             Inscription
                </label>
                           <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                               value={content.footer.quickLinks.register.text}
                               onChange={(e) => {
                                 setContent({
                    ...content,
                                   footer: {
                                     ...content.footer,
                                     quickLinks: {
                                       ...content.footer.quickLinks,
                                       register: {
                                         ...content.footer.quickLinks.register,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Inscription"
                             />
                             <input
                               type="text"
                               value={content.footer.quickLinks.register.url}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     quickLinks: {
                                       ...content.footer.quickLinks,
                                       register: {
                                         ...content.footer.quickLinks.register,
                                         url: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="/register"
                             />
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.quickLinks.register.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       quickLinks: {
                                         ...content.footer.quickLinks,
                                         register: {
                                           ...content.footer.quickLinks.register,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher ce lien</span>
                             </label>
              </div>
                         </div>
                       </div>
                     </div>

                     {/* Disponible sur */}
                     <div className="space-y-6">
                       <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-300 mb-2">
                           Titre de la section
                         </label>
                         <input
                           type="text"
                           value={content.footer.availableOnTitle}
                           onChange={(e) => {
                             setContent({
                               ...content,
                               footer: {
                                 ...content.footer,
                                 availableOnTitle: e.target.value
                               }
                             })
                           }}
                           className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Disponible sur"
                         />
                       </div>
                       
                       <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                             Titre
                </label>
                           <div className="space-y-3">
                <input
                  type="text"
                               value={content.footer.availableOn.title.text}
                               onChange={(e) => {
                                 setContent({
                    ...content,
                                   footer: {
                                     ...content.footer,
                                     availableOn: {
                                       ...content.footer.availableOn,
                                       title: {
                                         ...content.footer.availableOn.title,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Mobile (iOS & Android)"
                             />
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <label className="block text-sm font-medium text-gray-300">
                                   Contenu du modal
                                 </label>
                                 <button
                                   type="button"
                                   onClick={() => setExpandedModals(prev => ({ ...prev, title: !prev.title }))}
                                   className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                                 >
                                   <span>{expandedModals.title ? 'Réduire' : 'Développer'}</span>
                                   {expandedModals.title ? (
                                     <ChevronUpIcon className="w-4 h-4" />
                                   ) : (
                                     <ChevronDownIcon className="w-4 h-4" />
                                   )}
                                 </button>
                               </div>
                               <textarea
                                 value={content.footer.availableOn.title.modalContent || ''}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         title: {
                                           ...content.footer.availableOn.title,
                                           modalContent: e.target.value
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 rows={expandedModals.title ? 8 : 1}
                                 className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                                 placeholder="Contenu à définir pour Mobile (iOS & Android)"
                               />
                             </div>
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.availableOn.title.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         title: {
                                           ...content.footer.availableOn.title,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher cette option</span>
                             </label>
              </div>
            </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">
                             Titre
                           </label>
                           <div className="space-y-3">
                             <input
                               type="text"
                               value={content.footer.availableOn.vrHeadset.text}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     availableOn: {
                                       ...content.footer.availableOn,
                                       vrHeadset: {
                                         ...content.footer.availableOn.vrHeadset,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Tablette (iPad & Android)"
                             />
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <label className="block text-sm font-medium text-gray-300">
                                   Contenu du modal
                                 </label>
                                 <button
                                   type="button"
                                   onClick={() => setExpandedModals(prev => ({ ...prev, vrHeadset: !prev.vrHeadset }))}
                                   className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                                 >
                                   <span>{expandedModals.vrHeadset ? 'Réduire' : 'Développer'}</span>
                                   {expandedModals.vrHeadset ? (
                                     <ChevronUpIcon className="w-4 h-4" />
                                   ) : (
                                     <ChevronDownIcon className="w-4 h-4" />
                                   )}
                                 </button>
                               </div>
                               <textarea
                                 value={content.footer.availableOn.vrHeadset.modalContent || ''}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         vrHeadset: {
                                           ...content.footer.availableOn.vrHeadset,
                                           modalContent: e.target.value
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 rows={expandedModals.vrHeadset ? 8 : 1}
                                 className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                                 placeholder="Contenu à définir pour Tablette (iPad & Android)"
                               />
                             </div>
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.availableOn.vrHeadset.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         vrHeadset: {
                                           ...content.footer.availableOn.vrHeadset,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher cette option</span>
                             </label>
          </div>
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">
                             Titre
                           </label>
                           <div className="space-y-3">
                             <input
                               type="text"
                               value={content.footer.availableOn.tv.text}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     availableOn: {
                                       ...content.footer.availableOn,
                                       tv: {
                                         ...content.footer.availableOn.tv,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Ordinateur (Tous navigateurs)"
                             />
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <label className="block text-sm font-medium text-gray-300">
                                   Contenu du modal
                                 </label>
                                 <button
                                   type="button"
                                   onClick={() => setExpandedModals(prev => ({ ...prev, tv: !prev.tv }))}
                                   className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                                 >
                                   <span>{expandedModals.tv ? 'Réduire' : 'Développer'}</span>
                                   {expandedModals.tv ? (
                                     <ChevronUpIcon className="w-4 h-4" />
                                   ) : (
                                     <ChevronDownIcon className="w-4 h-4" />
                                   )}
                                 </button>
                               </div>
                               <textarea
                                 value={content.footer.availableOn.tv.modalContent || ''}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         tv: {
                                           ...content.footer.availableOn.tv,
                                           modalContent: e.target.value
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 rows={expandedModals.tv ? 8 : 1}
                                 className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                                 placeholder="Contenu à définir pour Ordinateur (Tous navigateurs)"
                               />
                             </div>
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.availableOn.tv.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         tv: {
                                           ...content.footer.availableOn.tv,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher cette option</span>
                             </label>
          </div>
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">
                             Titre
                           </label>
                           <div className="space-y-3">
                             <input
                               type="text"
                               value={content.footer.availableOn.vrHeadset2.text}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     availableOn: {
                                       ...content.footer.availableOn,
                                       vrHeadset2: {
                                         ...content.footer.availableOn.vrHeadset2,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Casque virtuel"
                             />
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <label className="block text-sm font-medium text-gray-300">
                                   Contenu du modal
                                 </label>
                                 <button
                                   type="button"
                                   onClick={() => setExpandedModals(prev => ({ ...prev, vrHeadset2: !prev.vrHeadset2 }))}
                                   className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                                 >
                                   <span>{expandedModals.vrHeadset2 ? 'Réduire' : 'Développer'}</span>
                                   {expandedModals.vrHeadset2 ? (
                                     <ChevronUpIcon className="w-4 h-4" />
                                   ) : (
                                     <ChevronDownIcon className="w-4 h-4" />
                                   )}
                                 </button>
                               </div>
                               <textarea
                                 value={content.footer.availableOn.vrHeadset2.modalContent || ''}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         vrHeadset2: {
                                           ...content.footer.availableOn.vrHeadset2,
                                           modalContent: e.target.value
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 rows={expandedModals.vrHeadset2 ? 8 : 1}
                                 className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                                 placeholder="Contenu à définir pour Casque virtuel"
                               />
                             </div>
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.availableOn.vrHeadset2.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         vrHeadset2: {
                                           ...content.footer.availableOn.vrHeadset2,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher cette option</span>
                             </label>
          </div>
                         </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">
                             Titre
                           </label>
                           <div className="space-y-3">
                             <input
                               type="text"
                               value={content.footer.availableOn.tv2.text}
                               onChange={(e) => {
                                 setContent({
                                   ...content,
                                   footer: {
                                     ...content.footer,
                                     availableOn: {
                                       ...content.footer.availableOn,
                                       tv2: {
                                         ...content.footer.availableOn.tv2,
                                         text: e.target.value
                                       }
                                     }
                                   }
                                 })
                               }}
                               className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Télévision"
                             />
                             <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                 <label className="block text-sm font-medium text-gray-300">
                                   Contenu du modal
                                 </label>
                                 <button
                                   type="button"
                                   onClick={() => setExpandedModals(prev => ({ ...prev, tv2: !prev.tv2 }))}
                                   className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                                 >
                                   <span>{expandedModals.tv2 ? 'Réduire' : 'Développer'}</span>
                                   {expandedModals.tv2 ? (
                                     <ChevronUpIcon className="w-4 h-4" />
                                   ) : (
                                     <ChevronDownIcon className="w-4 h-4" />
                                   )}
                                 </button>
                               </div>
                               <textarea
                                 value={content.footer.availableOn.tv2.modalContent || ''}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         tv2: {
                                           ...content.footer.availableOn.tv2,
                                           modalContent: e.target.value
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 rows={expandedModals.tv2 ? 8 : 1}
                                 className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm"
                                 placeholder="Contenu à définir pour Télévision"
                               />
                             </div>
                             <label className="flex items-center space-x-2">
                               <input
                                 type="checkbox"
                                 checked={content.footer.availableOn.tv2.isVisible}
                                 onChange={(e) => {
                                   setContent({
                                     ...content,
                                     footer: {
                                       ...content.footer,
                                       availableOn: {
                                         ...content.footer.availableOn,
                                         tv2: {
                                           ...content.footer.availableOn.tv2,
                                           isVisible: e.target.checked
                                         }
                                       }
                                     }
                                   })
                                 }}
                                 className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                               />
                               <span className="text-sm text-gray-300">Afficher cette option</span>
                             </label>
          </div>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Visibilité globale du footer */}
                   <div className="mt-8 pt-6 border-t border-gray-600">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={content.footer.isVisible ?? true}
                        onChange={(e) => {
                          setContent({
                            ...content,
                            footer: {
                              ...content.footer,
                              isVisible: e.target.checked
                            }
                          })
                        }}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-lg font-semibold text-white">Afficher le footer sur la page d&apos;accueil</span>
                    </label>
                   </div>
                 </div>

                 {/* Section Réseaux Sociaux */}
          <div id="social" className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl p-8 border border-blue-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <PlusIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Réseaux Sociaux</h3>
                <p className="text-gray-400">Gérez vos liens sociaux et leur visibilité</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(content.appIdentity.socialLinks).map(([platform, data]: [string, any]) => (
                <div key={platform} className="bg-dark-500/30 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white capitalize flex items-center space-x-2">
                      <span className="text-2xl">
                        {platform === 'telegram' && '📱'}
                        {platform === 'discord' && '💬'}
                        {platform === 'twitter' && '🐦'}
                        {platform === 'instagram' && '📸'}
                        {platform === 'youtube' && '📺'}
                      </span>
                      <span>{platform}</span>
                    </h4>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={data.isVisible}
                        onChange={(e) => setContent({
                          ...content,
                          appIdentity: {
                            ...content.appIdentity,
                            socialLinks: {
                              ...content.appIdentity.socialLinks,
                              [platform]: { ...data, isVisible: e.target.checked }
                            }
                          }
                        })}
                        className="w-5 h-5 text-blue-500 bg-dark-600 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Visible</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
                      <input
                        type="text"
                        value={data.url}
                        onChange={(e) => setContent({
                          ...content,
                          appIdentity: {
                            ...content.appIdentity,
                            socialLinks: {
                              ...content.appIdentity.socialLinks,
                              [platform]: { ...data, url: e.target.value }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder={`https://${platform}.com/...`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Texte</label>
                      <input
                        type="text"
                        value={data.text}
                        onChange={(e) => setContent({
                          ...content,
                          appIdentity: {
                            ...content.appIdentity,
                            socialLinks: {
                              ...content.appIdentity.socialLinks,
                              [platform]: { ...data, text: e.target.value }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder={platform}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <input
                        type="text"
                        value={data.description}
                        onChange={(e) => setContent({
                          ...content,
                          appIdentity: {
                            ...content.appIdentity,
                            socialLinks: {
                              ...content.appIdentity.socialLinks,
                              [platform]: { ...data, description: e.target.value }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Description du lien..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

                 {/* Section App Identity */}
          <div id="identity" className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl p-8 border border-orange-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <StarIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Identité de l&apos;Application</h3>
                <p className="text-gray-400">Personnalisez l&apos;identité de votre marque</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom de l&apos;Application
                </label>
                <input
                  type="text"
                  value={content.appIdentity.name}
                  onChange={(e) => {
                    const newName = e.target.value
                    setContent({
                      ...content,
                      appIdentity: { ...content.appIdentity, name: newName }
                    })
                    // Mettre à jour les URLs des réseaux sociaux avec le nouveau nom
                    HomepageContentService.updateSocialLinksForAppName(newName)
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Atiha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Texte du Footer
                </label>
                <input
                  type="text"
                  value={content.appIdentity.footer.text}
                  onChange={(e) => setContent({
                    ...content,
                    appIdentity: { 
                      ...content.appIdentity, 
                      footer: { ...content.appIdentity.footer, text: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Atiha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Copyright
                </label>
                <input
                  type="text"
                  value={content.appIdentity.footer.copyright}
                  onChange={(e) => setContent({
                    ...content,
                    appIdentity: { 
                      ...content.appIdentity, 
                      footer: { ...content.appIdentity.footer, copyright: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="© 2025 Atiha. Tous droits réservés."
                />
              </div>
            </div>
          </div>
          {/* Section Liens Sociaux */}
          {/* Section Couleurs */}
          <div id="colors" className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-3xl p-8 border border-pink-500/20 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <div className="w-6 h-6 rounded-full bg-white"></div>
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Palette de Couleurs</h3>
                <p className="text-gray-400">Personnalisez les couleurs de votre marque</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Couleur Primaire
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={content.appIdentity.colors.primary}
                      onChange={(e) => setContent({
                        ...content,
                        appIdentity: {
                          ...content.appIdentity,
                          colors: { ...content.appIdentity.colors, primary: e.target.value }
                        }
                      })}
                      className="w-16 h-12 rounded-xl border border-gray-600/50 shadow-lg"
                    />
                    <input
                      type="text"
                      value={content.appIdentity.colors.primary}
                      onChange={(e) => setContent({
                        ...content,
                        appIdentity: {
                          ...content.appIdentity,
                          colors: { ...content.appIdentity.colors, primary: e.target.value }
                        }
                      })}
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Couleur Secondaire
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={content.appIdentity.colors.secondary}
                      onChange={(e) => setContent({
                        ...content,
                        appIdentity: {
                          ...content.appIdentity,
                          colors: { ...content.appIdentity.colors, secondary: e.target.value }
                        }
                      })}
                      className="w-16 h-12 rounded-xl border border-gray-600/50 shadow-lg"
                    />
                    <input
                      type="text"
                      value={content.appIdentity.colors.secondary}
                      onChange={(e) => setContent({
                        ...content,
                        appIdentity: {
                          ...content.appIdentity,
                          colors: { ...content.appIdentity.colors, secondary: e.target.value }
                        }
                      })}
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Couleur d&apos;Accent
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={content.appIdentity.colors.accent}
                      onChange={(e) => setContent({
                        ...content,
                        appIdentity: {
                          ...content.appIdentity,
                          colors: { ...content.appIdentity.colors, accent: e.target.value }
                        }
                      })}
                      className="w-16 h-12 rounded-xl border border-gray-600/50 shadow-lg"
                    />
                    <input
                      type="text"
                      value={content.appIdentity.colors.accent}
                      onChange={(e) => setContent({
                        ...content,
                        appIdentity: {
                          ...content.appIdentity,
                          colors: { ...content.appIdentity.colors, accent: e.target.value }
                        }
                      })}
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="#F59E0B"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Section Download */}
          <div id="download" className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl p-8 border border-emerald-500/20 shadow-xl mt-8">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <ArrowDownTrayIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Section Download</h3>
                <p className="text-gray-400">Contenu de la page de téléchargement</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="bg-dark-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Section Hero</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={content.download?.hero?.title || 'Téléchargez'}
                      onChange={(e) => {
                        const newContent = {
                          ...content,
                          download: {
                            ...content.download,
                            hero: { ...content.download?.hero, title: e.target.value }
                          }
                        }
                        setContent(newContent)
                        HomepageContentService.saveContent(newContent)
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Téléchargez"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le nom de l&apos;application sera ajouté automatiquement après ce texte
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={content.download?.hero?.description || ''}
                      onChange={(e) => {
                        const newContent = {
                          ...content,
                          download: {
                            ...content.download,
                            hero: { ...content.download?.hero, description: e.target.value }
                          }
                        }
                        setContent(newContent)
                        HomepageContentService.saveContent(newContent)
                      }}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Créer un compte et installez sur tous vos appareils pour une expérience de streaming unique, avec téléchargement hors ligne et notifications push."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Le nom de l&apos;application sera remplacé automatiquement dans le texte
                    </p>
                  </div>
                </div>
              </div>

              {/* Devices Section */}
              <div className="bg-dark-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Sections Appareils</h4>
                <div className="space-y-6">
                  {/* Mobile */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h5 className="text-md font-semibold text-white mb-4">Mobile</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={content.download?.devices?.mobile?.title || 'Mobile'}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              download: {
                                ...content.download,
                                devices: {
                                  ...content.download?.devices,
                                  mobile: { ...content.download?.devices?.mobile, title: e.target.value }
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Mobile"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sous-titre
                        </label>
                        <input
                          type="text"
                          value={content.download?.devices?.mobile?.subtitle || 'Gratuit'}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              download: {
                                ...content.download,
                                devices: {
                                  ...content.download?.devices,
                                  mobile: { ...content.download?.devices?.mobile, subtitle: e.target.value }
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Gratuit"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={content.download?.devices?.mobile?.description || ''}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              devices: {
                                ...content.download?.devices,
                                mobile: { ...content.download?.devices?.mobile, description: e.target.value }
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Installez sur votre smartphone pour regarder vos films et séries préférés partout, même sans connexion internet."
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Le nom de l&apos;application sera remplacé automatiquement dans le texte
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Texte du bouton
                      </label>
                      <input
                        type="text"
                        value={content.download?.devices?.mobile?.buttonText || 'Installer'}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              devices: {
                                ...content.download?.devices,
                                mobile: { ...content.download?.devices?.mobile, buttonText: e.target.value }
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Installer"
                      />
                    </div>
                  </div>

                  {/* Tablette */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h5 className="text-md font-semibold text-white mb-4">Tablette</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={content.download?.devices?.tablet?.title || 'Tablette'}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              download: {
                                ...content.download,
                                devices: {
                                  ...content.download?.devices,
                                  tablet: { ...content.download?.devices?.tablet, title: e.target.value }
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Tablette"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sous-titre
                        </label>
                        <input
                          type="text"
                          value={content.download?.devices?.tablet?.subtitle || 'Gratuit'}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              download: {
                                ...content.download,
                                devices: {
                                  ...content.download?.devices,
                                  tablet: { ...content.download?.devices?.tablet, subtitle: e.target.value }
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Gratuit"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={content.download?.devices?.tablet?.description || ''}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              devices: {
                                ...content.download?.devices,
                                tablet: { ...content.download?.devices?.tablet, description: e.target.value }
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Profitez d&apos;un écran plus grand avec la même qualité de streaming et toutes les fonctionnalités premium sur votre tablette."
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Le nom de l&apos;application sera remplacé automatiquement dans le texte
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Texte du bouton
                      </label>
                      <input
                        type="text"
                        value={content.download?.devices?.tablet?.buttonText || 'Installer'}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              devices: {
                                ...content.download?.devices,
                                tablet: { ...content.download?.devices?.tablet, buttonText: e.target.value }
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Installer"
                      />
                    </div>
                  </div>

                  {/* Ordinateur */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h5 className="text-md font-semibold text-white mb-4">Ordinateur</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={content.download?.devices?.desktop?.title || 'Ordinateur'}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              download: {
                                ...content.download,
                                devices: {
                                  ...content.download?.devices,
                                  desktop: { ...content.download?.devices?.desktop, title: e.target.value }
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Ordinateur"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Sous-titre
                        </label>
                        <input
                          type="text"
                          value={content.download?.devices?.desktop?.subtitle || 'Gratuit'}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              download: {
                                ...content.download,
                                devices: {
                                  ...content.download?.devices,
                                  desktop: { ...content.download?.devices?.desktop, subtitle: e.target.value }
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Gratuit"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={content.download?.devices?.desktop?.description || ''}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              devices: {
                                ...content.download?.devices,
                                desktop: { ...content.download?.devices?.desktop, description: e.target.value }
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Utilisez directement dans votre navigateur ou installez-la comme une application native sur votre ordinateur."
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Le nom de l&apos;application sera remplacé automatiquement dans le texte
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Texte du bouton
                      </label>
                      <input
                        type="text"
                        value={content.download?.devices?.desktop?.buttonText || 'Installer'}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              devices: {
                                ...content.download?.devices,
                                desktop: { ...content.download?.devices?.desktop, buttonText: e.target.value }
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Installer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="bg-dark-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Section Fonctionnalités</h4>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={content.download?.features?.title || 'Fonctionnalités de'}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              features: { ...content.download?.features, title: e.target.value }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="Fonctionnalités de"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Le nom de l&apos;application sera ajouté automatiquement après ce texte
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={content.download?.features?.description || ''}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            download: {
                              ...content.download,
                              features: { ...content.download?.features, description: e.target.value }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                        placeholder="Découvrez tous les avantages d&apos;utiliser comme application native"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Le nom de l&apos;application sera remplacé automatiquement dans le texte
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="download-features-visible"
                      checked={content.download?.features?.isVisible ?? true}
                      onChange={(e) => {
                        const newContent = {
                          ...content,
                          download: {
                            ...content.download,
                            features: { ...content.download?.features, isVisible: e.target.checked }
                          }
                        }
                        setContent(newContent)
                        HomepageContentService.saveContent(newContent)
                      }}
                      className="w-5 h-5 text-emerald-500 bg-dark-600 border-gray-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="download-features-visible" className="text-sm font-medium text-gray-300">
                      Afficher la section &quot;Fonctionnalités&quot;
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-white">Fonctionnalités</h5>
                    
                    {/* Mode hors ligne */}
                    <div className="border border-gray-600 rounded-lg p-4">
                      <h6 className="text-sm font-semibold text-white mb-3">Mode hors ligne</h6>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Titre
                          </label>
                          <input
                            type="text"
                            value={content.download?.features?.items?.[0]?.title || 'Mode hors ligne'}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[0] = { ...items[0], title: e.target.value, description: items[0]?.description || 'Téléchargez vos contenus préférés pour les regarder sans internet' }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Mode hors ligne"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={content.download?.features?.items?.[0]?.description || ''}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[0] = { ...items[0], title: items[0]?.title || 'Mode hors ligne', description: e.target.value }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Téléchargez vos contenus préférés pour les regarder sans internet"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="border border-gray-600 rounded-lg p-4">
                      <h6 className="text-sm font-semibold text-white mb-3">Notifications</h6>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Titre
                          </label>
                          <input
                            type="text"
                            value={content.download?.features?.items?.[1]?.title || 'Notifications'}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[1] = { ...items[1], title: e.target.value, description: items[1]?.description || 'Recevez des alertes pour les nouveaux épisodes et films' }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Notifications"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={content.download?.features?.items?.[1]?.description || ''}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[1] = { ...items[1], title: items[1]?.title || 'Notifications', description: e.target.value }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Recevez des alertes pour les nouveaux épisodes et films"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="border border-gray-600 rounded-lg p-4">
                      <h6 className="text-sm font-semibold text-white mb-3">Performance</h6>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Titre
                          </label>
                          <input
                            type="text"
                            value={content.download?.features?.items?.[2]?.title || 'Performance'}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[2] = { ...items[2], title: e.target.value, description: items[2]?.description || 'Chargement rapide et interface fluide comme une app native' }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Performance"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={content.download?.features?.items?.[2]?.description || ''}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[2] = { ...items[2], title: items[2]?.title || 'Performance', description: e.target.value }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Chargement rapide et interface fluide comme une app native"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Accès rapide */}
                    <div className="border border-gray-600 rounded-lg p-4">
                      <h6 className="text-sm font-semibold text-white mb-3">Accès rapide</h6>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Titre
                          </label>
                          <input
                            type="text"
                            value={content.download?.features?.items?.[3]?.title || 'Accès rapide'}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[3] = { ...items[3], title: e.target.value, description: items[3]?.description || 'Lancez directement depuis votre écran d\'accueil' }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Accès rapide"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            value={content.download?.features?.items?.[3]?.description || ''}
                            onChange={(e) => {
                              const items = [...(content.download?.features?.items || [])]
                              items[3] = { ...items[3], title: items[3]?.title || 'Accès rapide', description: e.target.value }
                              const newContent = {
                                ...content,
                                download: {
                                  ...content.download,
                                  features: { ...content.download?.features, items }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Lancez directement depuis votre écran d&apos;accueil"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Contenu Partagé */}
          <div id="sharePage" className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl p-8 border border-cyan-500/20 shadow-xl mt-8">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Section Contenu Partagé</h3>
                <p className="text-gray-400">Contenu de la page de partage</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Titre et Description */}
              <div className="bg-dark-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Titre et Description</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre
                    </label>
                    <input
                      type="text"
                      value={content.sharePage?.title || 'Rejoignez {appName} dès aujourd\'hui'}
                      onChange={(e) => {
                        const newContent = {
                          ...content,
                          sharePage: {
                            ...content.sharePage,
                            title: e.target.value
                          }
                        }
                        setContent(newContent)
                        HomepageContentService.saveContent(newContent)
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Rejoignez {appName} dès aujourd&apos;hui"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Utilisez {"{appName}"} pour insérer automatiquement le nom de l&apos;application
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={content.sharePage?.description || ''}
                      onChange={(e) => {
                        const newContent = {
                          ...content,
                          sharePage: {
                            ...content.sharePage,
                            description: e.target.value
                          }
                        }
                        setContent(newContent)
                        HomepageContentService.saveContent(newContent)
                      }}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Accédez à des milliers de films et séries en streaming haute qualité"
                    />
                  </div>
                </div>
              </div>

              {/* Bouton Regarder maintenant */}
              <div className="bg-dark-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Bouton Regarder maintenant</h4>
                <div className="border border-gray-600 rounded-lg p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Texte du bouton
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={content.sharePage?.watchNowButton?.text ?? ''}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              sharePage: {
                                ...content.sharePage,
                                watchNowButton: {
                                  ...content.sharePage?.watchNowButton,
                                  text: e.target.value
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Regarder maintenant"
                        />
                        {content.sharePage?.watchNowButton?.text && (
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  watchNowButton: {
                                    ...content.sharePage?.watchNowButton,
                                    text: ''
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Effacer le texte"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Lien
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={content.sharePage?.watchNowButton?.link ?? ''}
                          onChange={(e) => {
                            const newContent = {
                              ...content,
                              sharePage: {
                                ...content.sharePage,
                                watchNowButton: {
                                  ...content.sharePage?.watchNowButton,
                                  link: e.target.value
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="/register"
                        />
                        {content.sharePage?.watchNowButton?.link && (
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  watchNowButton: {
                                    ...content.sharePage?.watchNowButton,
                                    link: ''
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Effacer le lien"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Toggle pour afficher/masquer la bande d'annonce */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Bande d&apos;annonce
                      </label>
                      <p className="text-xs text-gray-400">
                        Afficher ou masquer la bande d&apos;annonce du contenu
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="sharePage-showFilmTrailer"
                        checked={content.sharePage?.showFilmTrailer ?? true}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            sharePage: {
                              ...content.sharePage,
                              showFilmTrailer: e.target.checked
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-5 h-5 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="sharePage-showFilmTrailer" className="text-sm font-medium text-gray-300">
                        {content.sharePage?.showFilmTrailer ?? true ? 'Visible' : 'Masquée'}
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Toggle pour afficher/masquer la fiche du contenu */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Fiche du contenu
                      </label>
                      <p className="text-xs text-gray-400">
                        Afficher ou masquer les détails du contenu (titre, description, réalisateur, acteurs, etc.)
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="sharePage-showFilmDetails"
                        checked={content.sharePage?.showFilmDetails ?? true}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            sharePage: {
                              ...content.sharePage,
                              showFilmDetails: e.target.checked
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-5 h-5 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="sharePage-showFilmDetails" className="text-sm font-medium text-gray-300">
                        {content.sharePage?.showFilmDetails ?? true ? 'Visible' : 'Masquée'}
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Toggle pour afficher/masquer l'image */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Image (Affiche)
                      </label>
                      <p className="text-xs text-gray-400">
                        Afficher ou masquer l&apos;affiche du contenu
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="sharePage-showFilmImage"
                        checked={content.sharePage?.showFilmImage ?? true}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            sharePage: {
                              ...content.sharePage,
                              showFilmImage: e.target.checked
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-5 h-5 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="sharePage-showFilmImage" className="text-sm font-medium text-gray-300">
                        {content.sharePage?.showFilmImage ?? true ? 'Visible' : 'Masquée'}
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Toggle pour afficher/masquer la section "Ajoutés récemment" */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Section &quot;Ajoutés récemment&quot;
                      </label>
                      <p className="text-xs text-gray-400">
                        Afficher ou masquer la section des contenus récemment ajoutés
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="sharePage-showRecentContent"
                        checked={content.sharePage?.showRecentContent ?? true}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            sharePage: {
                              ...content.sharePage,
                              showRecentContent: e.target.checked
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-5 h-5 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="sharePage-showRecentContent" className="text-sm font-medium text-gray-300">
                        {content.sharePage?.showRecentContent ?? true ? 'Visible' : 'Masquée'}
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Toggle pour afficher/masquer le Call to Action final */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Call to Action final
                      </label>
                      <p className="text-xs text-gray-400">
                        Afficher ou masquer la section finale avec les boutons d&apos;inscription
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="sharePage-showFinalCTA"
                        checked={content.sharePage?.showFinalCTA ?? true}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            sharePage: {
                              ...content.sharePage,
                              showFinalCTA: e.target.checked
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-5 h-5 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="sharePage-showFinalCTA" className="text-sm font-medium text-gray-300">
                        {content.sharePage?.showFinalCTA ?? true ? 'Visible' : 'Masquée'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="bg-dark-300 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Boutons</h4>
                <div className="space-y-6">
                  {/* Bouton Principal */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h5 className="text-md font-semibold text-white mb-4">Bouton Principal</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Texte du bouton
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={content.sharePage?.primaryButton?.text ?? ''}
                            onChange={(e) => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  primaryButton: {
                                    ...content.sharePage?.primaryButton,
                                    text: e.target.value
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="S'inscrire gratuitement"
                          />
                          {content.sharePage?.primaryButton?.text && (
                            <button
                              type="button"
                              onClick={() => {
                                const newContent = {
                                  ...content,
                                  sharePage: {
                                    ...content.sharePage,
                                    primaryButton: {
                                      ...content.sharePage?.primaryButton,
                                      text: ''
                                    }
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Effacer le texte"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Lien
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={content.sharePage?.primaryButton?.link ?? ''}
                            onChange={(e) => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  primaryButton: {
                                    ...content.sharePage?.primaryButton,
                                    link: e.target.value
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="/register"
                          />
                          {content.sharePage?.primaryButton?.link && (
                            <button
                              type="button"
                              onClick={() => {
                                const newContent = {
                                  ...content,
                                  sharePage: {
                                    ...content.sharePage,
                                    primaryButton: {
                                      ...content.sharePage?.primaryButton,
                                      link: ''
                                    }
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Effacer le lien"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton Secondaire */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h5 className="text-md font-semibold text-white mb-4">Bouton Secondaire</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Texte du bouton
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={content.sharePage?.secondaryButton?.text ?? ''}
                            onChange={(e) => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  secondaryButton: {
                                    ...content.sharePage?.secondaryButton,
                                    text: e.target.value
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Se connecter"
                          />
                          {content.sharePage?.secondaryButton?.text && (
                            <button
                              type="button"
                              onClick={() => {
                                const newContent = {
                                  ...content,
                                  sharePage: {
                                    ...content.sharePage,
                                    secondaryButton: {
                                      ...content.sharePage?.secondaryButton,
                                      text: ''
                                    }
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Effacer le texte"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Lien
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={content.sharePage?.secondaryButton?.link ?? ''}
                            onChange={(e) => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  secondaryButton: {
                                    ...content.sharePage?.secondaryButton,
                                    link: e.target.value
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="/login"
                          />
                          {content.sharePage?.secondaryButton?.link && (
                            <button
                              type="button"
                              onClick={() => {
                                const newContent = {
                                  ...content,
                                  sharePage: {
                                    ...content.sharePage,
                                    secondaryButton: {
                                      ...content.sharePage?.secondaryButton,
                                      link: ''
                                    }
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Effacer le lien"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton Abonnement */}
                  <div className="border border-gray-600 rounded-lg p-4">
                    <h5 className="text-md font-semibold text-white mb-4">Bouton Abonnement</h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Texte du bouton
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={content.sharePage?.subscriptionButton?.text ?? ''}
                            onChange={(e) => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  subscriptionButton: {
                                    ...content.sharePage?.subscriptionButton,
                                    text: e.target.value
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Activer mon abonnement"
                          />
                          {content.sharePage?.subscriptionButton?.text && (
                            <button
                              type="button"
                              onClick={() => {
                                const newContent = {
                                  ...content,
                                  sharePage: {
                                    ...content.sharePage,
                                    subscriptionButton: {
                                      ...content.sharePage?.subscriptionButton,
                                      text: ''
                                    }
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Effacer le texte"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Lien
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={content.sharePage?.subscriptionButton?.link ?? ''}
                            onChange={(e) => {
                              const newContent = {
                                ...content,
                                sharePage: {
                                  ...content.sharePage,
                                  subscriptionButton: {
                                    ...content.sharePage?.subscriptionButton,
                                    link: e.target.value
                                  }
                                }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="/subscription"
                          />
                          {content.sharePage?.subscriptionButton?.link && (
                            <button
                              type="button"
                              onClick={() => {
                                const newContent = {
                                  ...content,
                                  sharePage: {
                                    ...content.sharePage,
                                    subscriptionButton: {
                                      ...content.sharePage?.subscriptionButton,
                                      link: ''
                                    }
                                  }
                                }
                                setContent(newContent)
                                HomepageContentService.saveContent(newContent)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Effacer le lien"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partenaires de Paiement */}
              <div className="bg-dark-300 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Partenaires de Paiement</h4>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="sharePage-paymentPartners-visible"
                      checked={content.sharePage?.paymentPartners?.isVisible ?? true}
                      onChange={(e) => {
                        const newContent = {
                          ...content,
                          sharePage: {
                            ...content.sharePage,
                            paymentPartners: {
                              ...content.sharePage?.paymentPartners,
                              isVisible: e.target.checked,
                              items: content.sharePage?.paymentPartners?.items || []
                            }
                          }
                        }
                        setContent(newContent)
                        HomepageContentService.saveContent(newContent)
                      }}
                      className="w-5 h-5 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="sharePage-paymentPartners-visible" className="text-sm font-medium text-gray-300">
                      Afficher les partenaires de paiement
                    </label>
                  </div>
                </div>

                {content.sharePage?.paymentPartners?.isVisible && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titre (optionnel)
                      </label>
                      <input
                        type="text"
                        value={content.sharePage?.paymentPartners?.title || ''}
                        onChange={(e) => {
                          const newContent = {
                            ...content,
                            sharePage: {
                              ...content.sharePage,
                              paymentPartners: {
                                ...content.sharePage?.paymentPartners,
                                title: e.target.value,
                                items: content.sharePage?.paymentPartners?.items || []
                              }
                            }
                          }
                          setContent(newContent)
                          HomepageContentService.saveContent(newContent)
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Partenaires de paiement"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-300">
                          Logos des passerelles de paiement
                        </label>
                        <button
                          onClick={() => {
                            const items = [...(content.sharePage?.paymentPartners?.items || [])]
                            const newId = `partner-${Date.now()}`
                            items.push({
                              id: newId,
                              logoUrl: '',
                              isVisible: true
                            })
                            const newContent = {
                              ...content,
                              sharePage: {
                                ...content.sharePage,
                                paymentPartners: {
                                  ...content.sharePage?.paymentPartners,
                                  items
                                }
                              }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Ajouter un partenaire</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(content.sharePage?.paymentPartners?.items || []).map((partner, index) => (
                          <div key={partner.id} className="border border-gray-600 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h5 className="text-sm font-semibold text-white">Partenaire #{index + 1}</h5>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={`sharePage-paymentPartner-${partner.id}-visible`}
                                  checked={partner.isVisible}
                                  onChange={(e) => {
                                    const items = [...(content.sharePage?.paymentPartners?.items || [])]
                                    const itemIndex = items.findIndex(item => item.id === partner.id)
                                    if (itemIndex !== -1) {
                                      items[itemIndex] = { ...items[itemIndex], isVisible: e.target.checked }
                                      const newContent = {
                                        ...content,
                                        sharePage: {
                                          ...content.sharePage,
                                          paymentPartners: {
                                            ...content.sharePage?.paymentPartners,
                                            items
                                          }
                                        }
                                      }
                                      setContent(newContent)
                                      HomepageContentService.saveContent(newContent)
                                    }
                                  }}
                                  className="w-4 h-4 text-cyan-500 bg-dark-600 border-gray-600 rounded focus:ring-cyan-500"
                                />
                                <label htmlFor={`sharePage-paymentPartner-${partner.id}-visible`} className="text-xs text-gray-400">
                                  Visible
                                </label>
                                <button
                                  onClick={() => {
                                    const items = (content.sharePage?.paymentPartners?.items || []).filter(item => item.id !== partner.id)
                                    const newContent = {
                                      ...content,
                                      sharePage: {
                                        ...content.sharePage,
                                        paymentPartners: {
                                          ...content.sharePage?.paymentPartners,
                                          items
                                        }
                                      }
                                    }
                                    setContent(newContent)
                                    HomepageContentService.saveContent(newContent)
                                  }}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                  aria-label="Supprimer le partenaire"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                URL du logo
                              </label>
                              <input
                                type="text"
                                value={partner.logoUrl}
                                onChange={(e) => {
                                  const items = [...(content.sharePage?.paymentPartners?.items || [])]
                                  const itemIndex = items.findIndex(item => item.id === partner.id)
                                  if (itemIndex !== -1) {
                                    items[itemIndex] = { ...items[itemIndex], logoUrl: e.target.value }
                                    const newContent = {
                                      ...content,
                                      sharePage: {
                                        ...content.sharePage,
                                        paymentPartners: {
                                          ...content.sharePage?.paymentPartners,
                                          items
                                        }
                                      }
                                    }
                                    setContent(newContent)
                                    HomepageContentService.saveContent(newContent)
                                  }
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 text-sm"
                                placeholder="https://example.com/logo.png"
                              />
                              {partner.logoUrl && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-400 mb-1">Aperçu :</p>
                                  <div className="inline-block p-2 bg-white rounded border border-gray-300">
                                    <img
                                      src={partner.logoUrl}
                                      alt="Logo partenaire"
                                      className="h-8 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Slider de Mise en Avant */}
          <div id="featuredSlider" className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-3xl p-8 border border-indigo-500/20 shadow-xl mt-8">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <StarIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Slider de Mise en Avant</h3>
                <p className="text-gray-400">Mettez en avant vos films et séries phares (Dashboard utilisateur uniquement)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titre de la Section
                  </label>
                  <input
                    type="text"
                    value={content.featuredSlider?.title || ''}
                    onChange={(e) => setContent({
                      ...content,
                      featuredSlider: { 
                        ...content.featuredSlider, 
                        title: e.target.value,
                        isVisible: content.featuredSlider?.isVisible ?? true,
                        slides: content.featuredSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Films et Séries à l&apos;affiche"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    value={content.featuredSlider?.subtitle || ''}
                    onChange={(e) => setContent({
                      ...content,
                      featuredSlider: { 
                        ...content.featuredSlider, 
                        subtitle: e.target.value,
                        isVisible: content.featuredSlider?.isVisible ?? true,
                        slides: content.featuredSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Découvrez nos recommandations"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vitesse de défilement (secondes)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={content.featuredSlider?.autoplaySpeed || 5}
                    onChange={(e) => setContent({
                      ...content,
                      featuredSlider: { 
                        ...content.featuredSlider, 
                        autoplaySpeed: parseInt(e.target.value) || 5,
                        isVisible: content.featuredSlider?.isVisible ?? true,
                        slides: content.featuredSlider?.slides || []
                      }
                    })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Temps d&apos;affichage de chaque slide (2-10 secondes)
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="featuredSlider-visible"
                    checked={content.featuredSlider?.isVisible ?? true}
                    onChange={(e) => setContent({
                      ...content,
                      featuredSlider: { 
                        ...content.featuredSlider, 
                        isVisible: e.target.checked,
                        title: content.featuredSlider?.title || '',
                        subtitle: content.featuredSlider?.subtitle || '',
                        autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5,
                        slides: content.featuredSlider?.slides || []
                      }
                    })}
                    className="w-5 h-5 text-indigo-500 bg-dark-600 border-gray-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="featuredSlider-visible" className="text-sm font-medium text-gray-300">
                    Afficher cette section sur le dashboard utilisateur
                  </label>
                </div>
              </div>
            </div>
            
            {/* Gestion des slides */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-white">Slides du Slider</h4>
                <button
                  onClick={() => {
                    const newSlide = {
                      id: Date.now().toString(),
                      title: '',
                      subtitle: '',
                      imageUrl: '',
                      linkUrl: '',
                      isActive: true
                    }
                    setContent({
                      ...content,
                      featuredSlider: {
                        ...content.featuredSlider,
                        slides: [...(content.featuredSlider?.slides || []), newSlide],
                        isVisible: content.featuredSlider?.isVisible ?? true,
                        title: content.featuredSlider?.title || '',
                        subtitle: content.featuredSlider?.subtitle || '',
                        autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5
                      }
                    })
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Ajouter un slide</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {(content.featuredSlider?.slides || []).map((slide: any, index: number) => (
                  <div key={slide.id} className="bg-dark-500/30 rounded-2xl p-6 border border-indigo-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-white font-medium">Slide {index + 1}</h5>
                      <button
                        onClick={() => {
                          const updatedSlides = (content.featuredSlider?.slides || []).filter((s: any) => s.id !== slide.id)
                          setContent({
                            ...content,
                            featuredSlider: {
                              ...content.featuredSlider,
                              slides: updatedSlides,
                              isVisible: content.featuredSlider?.isVisible ?? true,
                              title: content.featuredSlider?.title || '',
                              subtitle: content.featuredSlider?.subtitle || '',
                              autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5
                            }
                          })
                        }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const updatedSlides = (content.featuredSlider?.slides || []).map((s: any) => 
                              s.id === slide.id ? { ...s, title: e.target.value } : s
                            )
                            setContent({
                              ...content,
                              featuredSlider: {
                                ...content.featuredSlider,
                                slides: updatedSlides,
                                isVisible: content.featuredSlider?.isVisible ?? true,
                                title: content.featuredSlider?.title || '',
                                subtitle: content.featuredSlider?.subtitle || '',
                                autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Titre du film/série"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Sous-titre</label>
                        <input
                          type="text"
                          value={slide.subtitle}
                          onChange={(e) => {
                            const updatedSlides = (content.featuredSlider?.slides || []).map((s: any) => 
                              s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                            )
                            setContent({
                              ...content,
                              featuredSlider: {
                                ...content.featuredSlider,
                                slides: updatedSlides,
                                isVisible: content.featuredSlider?.isVisible ?? true,
                                title: content.featuredSlider?.title || '',
                                subtitle: content.featuredSlider?.subtitle || '',
                                autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Description courte"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">URL de l&apos;image</label>
                        <input
                          type="url"
                          value={slide.imageUrl}
                          onChange={(e) => {
                            const updatedSlides = (content.featuredSlider?.slides || []).map((s: any) => 
                              s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                            )
                            setContent({
                              ...content,
                              featuredSlider: {
                                ...content.featuredSlider,
                                slides: updatedSlides,
                                isVisible: content.featuredSlider?.isVisible ?? true,
                                title: content.featuredSlider?.title || '',
                                subtitle: content.featuredSlider?.subtitle || '',
                                autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lien de destination</label>
                        <input
                          type="text"
                          value={slide.linkUrl}
                          onChange={(e) => {
                            const updatedSlides = (content.featuredSlider?.slides || []).map((s: any) => 
                              s.id === slide.id ? { ...s, linkUrl: e.target.value } : s
                            )
                            setContent({
                              ...content,
                              featuredSlider: {
                                ...content.featuredSlider,
                                slides: updatedSlides,
                                isVisible: content.featuredSlider?.isVisible ?? true,
                                title: content.featuredSlider?.title || '',
                                subtitle: content.featuredSlider?.subtitle || '',
                                autoplaySpeed: content.featuredSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="/content/movie-123 ou /content/series-456"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!content.featuredSlider?.slides || content.featuredSlider.slides.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Aucun slide configuré. Cliquez sur &quot;Ajouter un slide&quot; pour commencer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Slider À la une */}
          <div id="spotlightSlider" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-purple-500/20 shadow-xl mt-8">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <StarIcon className="w-6 h-6 text-white" />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Slider À la une</h3>
                <p className="text-gray-400">Affichez les contenus simultanément pour maximiser l&apos;impact visuel</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titre de la Section
                  </label>
                  <input
                    type="text"
                    value={content.spotlightSlider?.title || ''}
                onChange={(e) => setContent({
                  ...content,
                  spotlightSlider: { 
                    ...content.spotlightSlider, 
                    title: e.target.value,
                    isVisible: content.spotlightSlider?.isVisible ?? true,
                    slideGroups: content.spotlightSlider?.slideGroups || []
                  }
                })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="À la une"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    value={content.spotlightSlider?.subtitle || ''}
                onChange={(e) => setContent({
                  ...content,
                  spotlightSlider: { 
                    ...content.spotlightSlider, 
                    subtitle: e.target.value,
                    isVisible: content.spotlightSlider?.isVisible ?? true,
                    slideGroups: content.spotlightSlider?.slideGroups || []
                  }
                })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    placeholder="Découvrez nos sélections du moment"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vitesse de défilement (secondes)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={content.spotlightSlider?.autoplaySpeed || 5}
                onChange={(e) => setContent({
                  ...content,
                  spotlightSlider: { 
                    ...content.spotlightSlider, 
                    autoplaySpeed: parseInt(e.target.value) || 5,
                    isVisible: content.spotlightSlider?.isVisible ?? true,
                    slideGroups: content.spotlightSlider?.slideGroups || []
                  }
                })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                placeholder="5"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Temps d&apos;affichage de chaque groupe de 3 slides (2-10 secondes)
              </p>
            </div>
            
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="spotlightSlider-visible"
                    checked={content.spotlightSlider?.isVisible ?? true}
                onChange={(e) => setContent({
                  ...content,
                  spotlightSlider: { 
                    ...content.spotlightSlider, 
                    isVisible: e.target.checked,
                    title: content.spotlightSlider?.title || '',
                    subtitle: content.spotlightSlider?.subtitle || '',
                    autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5,
                    slideGroups: content.spotlightSlider?.slideGroups || []
                  }
                })}
                    className="w-5 h-5 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="spotlightSlider-visible" className="text-sm font-medium text-gray-300">
                    Afficher cette section sur le dashboard utilisateur
                  </label>
                </div>
              </div>
            </div>
            
            {/* Gestion des groupes de slides */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-white">Groupes de Slides du Slider À la une</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    💡 Créez un groupe et ajoutez autant de slides que vous souhaitez
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newGroups = [...(content.spotlightSlider?.slideGroups || [])]
                    // Ajouter un nouveau groupe vide avec seulement le catalogue
                    const newGroup = {
                      id: `spotlight-group-${Date.now()}`,
                      catalogue: 'collection',
                      slides: []
                    }
                    
                    newGroups.push(newGroup)
                    setContent({
                      ...content,
                      spotlightSlider: { 
                        ...content.spotlightSlider, 
                        slideGroups: newGroups,
                        isVisible: content.spotlightSlider?.isVisible ?? true,
                        title: content.spotlightSlider?.title || '',
                        subtitle: content.spotlightSlider?.subtitle || '',
                        autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                      }
                    })
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Ajouter les slides</span>
                </button>
              </div>
              
              <div className="space-y-6">
                {(content.spotlightSlider?.slideGroups || []).map((group: any, groupIndex: number) => (
                  <div key={group.id} className="bg-dark-500/30 rounded-2xl p-6 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-6">
                      <h5 className="text-white font-medium text-lg">Groupe {groupIndex + 1}</h5>
                      <button
                        onClick={() => {
                          const updatedGroups = (content.spotlightSlider?.slideGroups || []).filter((g: any) => g.id !== group.id)
                          setContent({
                            ...content,
                            spotlightSlider: {
                              ...content.spotlightSlider,
                              slideGroups: updatedGroups,
                              isVisible: content.spotlightSlider?.isVisible ?? true,
                              title: content.spotlightSlider?.title || '',
                              subtitle: content.spotlightSlider?.subtitle || '',
                              autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                            }
                          })
                        }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Catalogue d'affichage pour ce groupe */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Catalogue d&apos;affichage</label>
                      <div className="space-y-3">
                        <select
                          value={group.catalogue || 'collection'}
                          onChange={(e) => {
                            const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                              g.id === group.id ? { ...g, catalogue: e.target.value } : g
                            )
                            setContent({
                              ...content,
                              spotlightSlider: {
                                ...content.spotlightSlider,
                                slideGroups: updatedGroups,
                                isVisible: content.spotlightSlider?.isVisible ?? true,
                                title: content.spotlightSlider?.title || '',
                                subtitle: content.spotlightSlider?.subtitle || '',
                                autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                        >
                          <option value="collection">Notre collection</option>
                          <option value="popular-movies">Films Populaires</option>
                          <option value="popular-series">Séries Populaires</option>
                          <option value="jeux">Jeux</option>
                          <option value="sports">Sports</option>
                          <option value="animes">Animes</option>
                          <option value="tendances">Tendances</option>
                          <option value="documentaires">Documentaires</option>
                          <option value="divertissements">Divertissements</option>
                        </select>
                        
                        {/* Boutons de déplacement rapide */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                                g.id === group.id ? { ...g, catalogue: 'collection' } : g
                              )
                              setContent({
                                ...content,
                                spotlightSlider: {
                                  ...content.spotlightSlider,
                                  slideGroups: updatedGroups,
                                  isVisible: content.spotlightSlider?.isVisible ?? true,
                                  title: content.spotlightSlider?.title || '',
                                  subtitle: content.spotlightSlider?.subtitle || '',
                                  autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                                }
                              })
                            }}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              group.catalogue === 'collection' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Collection
                          </button>
                          <button
                            onClick={() => {
                              const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                                g.id === group.id ? { ...g, catalogue: 'popular-movies' } : g
                              )
                              setContent({
                                ...content,
                                spotlightSlider: {
                                  ...content.spotlightSlider,
                                  slideGroups: updatedGroups,
                                  isVisible: content.spotlightSlider?.isVisible ?? true,
                                  title: content.spotlightSlider?.title || '',
                                  subtitle: content.spotlightSlider?.subtitle || '',
                                  autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                                }
                              })
                            }}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              group.catalogue === 'popular-movies' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Films
                          </button>
                          <button
                            onClick={() => {
                              const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                                g.id === group.id ? { ...g, catalogue: 'popular-series' } : g
                              )
                              setContent({
                                ...content,
                                spotlightSlider: {
                                  ...content.spotlightSlider,
                                  slideGroups: updatedGroups,
                                  isVisible: content.spotlightSlider?.isVisible ?? true,
                                  title: content.spotlightSlider?.title || '',
                                  subtitle: content.spotlightSlider?.subtitle || '',
                                  autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                                }
                              })
                            }}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              group.catalogue === 'popular-series' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Séries
                          </button>
                          <button
                            onClick={() => {
                              const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                                g.id === group.id ? { ...g, catalogue: 'jeux' } : g
                              )
                              setContent({
                                ...content,
                                spotlightSlider: {
                                  ...content.spotlightSlider,
                                  slideGroups: updatedGroups,
                                  isVisible: content.spotlightSlider?.isVisible ?? true,
                                  title: content.spotlightSlider?.title || '',
                                  subtitle: content.spotlightSlider?.subtitle || '',
                                  autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                                }
                              })
                            }}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              group.catalogue === 'jeux' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Jeux
                          </button>
                          <button
                            onClick={() => {
                              const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                                g.id === group.id ? { ...g, catalogue: 'animes' } : g
                              )
                              setContent({
                                ...content,
                                spotlightSlider: {
                                  ...content.spotlightSlider,
                                  slideGroups: updatedGroups,
                                  isVisible: content.spotlightSlider?.isVisible ?? true,
                                  title: content.spotlightSlider?.title || '',
                                  subtitle: content.spotlightSlider?.subtitle || '',
                                  autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                                }
                              })
                            }}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              group.catalogue === 'animes' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            Animes
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-400">
                          💡 Cliquez sur un bouton pour déplacer rapidement ce groupe vers ce catalogue
                        </p>
                      </div>
                    </div>
                    
                    {/* Bouton pour ajouter un slide */}
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                            g.id === group.id 
                              ? { 
                                  ...g, 
                                  slides: [
                                    ...(g.slides || []),
                                    {
                                      id: `slide-${Date.now()}-${(g.slides || []).length + 1}`,
                                      title: '',
                                      subtitle: '',
                                      imageUrl: '',
                                      linkUrl: '',
                                      isActive: true
                                    }
                                  ]
                                }
                              : g
                          )
                          setContent({
                            ...content,
                            spotlightSlider: {
                              ...content.spotlightSlider,
                              slideGroups: updatedGroups,
                              isVisible: content.spotlightSlider?.isVisible ?? true,
                              title: content.spotlightSlider?.title || '',
                              subtitle: content.spotlightSlider?.subtitle || '',
                              autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                            }
                          })
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Ajouter un slide</span>
                      </button>
                    </div>
                    
                    {/* Slides de ce groupe */}
                    <div className="space-y-4">
                      {(group.slides || []).length > 0 ? (
                        (group.slides || []).map((slide: any, slideIndex: number) => (
                        <div key={slide.id} className="bg-dark-500/30 rounded-2xl p-6 border border-purple-500/20">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <h5 className="text-white font-medium">Slide {slideIndex + 1}</h5>
                            </div>
                            <button
                              onClick={() => {
                                const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                                  g.id === group.id 
                                    ? { ...g, slides: g.slides.filter((s: any) => s.id !== slide.id) }
                                    : g
                                )
                                setContent({
                                  ...content,
                                  spotlightSlider: {
                                    ...content.spotlightSlider,
                                    slideGroups: updatedGroups,
                                    isVisible: content.spotlightSlider?.isVisible ?? true,
                                    title: content.spotlightSlider?.title || '',
                                    subtitle: content.spotlightSlider?.subtitle || '',
                                    autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                                  }
                                })
                              }}
                              className="text-red-500 hover:text-red-400 transition-colors"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Titre</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                              g.id === group.id 
                                ? { ...g, slides: g.slides.map((s: any) => 
                                    s.id === slide.id ? { ...s, title: e.target.value } : s
                                  )}
                                : g
                            )
                            setContent({
                              ...content,
                              spotlightSlider: {
                                ...content.spotlightSlider,
                                slideGroups: updatedGroups,
                                isVisible: content.spotlightSlider?.isVisible ?? true,
                                title: content.spotlightSlider?.title || '',
                                subtitle: content.spotlightSlider?.subtitle || '',
                                autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Titre du film/série"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Sous-titre</label>
                        <input
                          type="text"
                          value={slide.subtitle}
                          onChange={(e) => {
                            const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                              g.id === group.id 
                                ? { ...g, slides: g.slides.map((s: any) => 
                                    s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                                  )}
                                : g
                            )
                            setContent({
                              ...content,
                              spotlightSlider: {
                                ...content.spotlightSlider,
                                slideGroups: updatedGroups,
                                isVisible: content.spotlightSlider?.isVisible ?? true,
                                title: content.spotlightSlider?.title || '',
                                subtitle: content.spotlightSlider?.subtitle || '',
                                autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Description courte"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">URL de l&apos;image</label>
                        <input
                          type="url"
                          value={slide.imageUrl}
                          onChange={(e) => {
                            const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                              g.id === group.id 
                                ? { ...g, slides: g.slides.map((s: any) => 
                                    s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                                  )}
                                : g
                            )
                            setContent({
                              ...content,
                              spotlightSlider: {
                                ...content.spotlightSlider,
                                slideGroups: updatedGroups,
                                isVisible: content.spotlightSlider?.isVisible ?? true,
                                title: content.spotlightSlider?.title || '',
                                subtitle: content.spotlightSlider?.subtitle || '',
                                autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lien de destination</label>
                        <input
                          type="text"
                          value={slide.linkUrl}
                          onChange={(e) => {
                            const updatedGroups = (content.spotlightSlider?.slideGroups || []).map((g: any) => 
                              g.id === group.id 
                                ? { ...g, slides: g.slides.map((s: any) => 
                                    s.id === slide.id ? { ...s, linkUrl: e.target.value } : s
                                  )}
                                : g
                            )
                            setContent({
                              ...content,
                              spotlightSlider: {
                                ...content.spotlightSlider,
                                slideGroups: updatedGroups,
                                isVisible: content.spotlightSlider?.isVisible ?? true,
                                title: content.spotlightSlider?.title || '',
                                subtitle: content.spotlightSlider?.subtitle || '',
                                autoplaySpeed: content.spotlightSlider?.autoplaySpeed || 5
                              }
                            })
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="/content/movie-123 ou /content/series-456"
                        />
                      </div>
                        </div>
                      </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">Aucun slide dans ce groupe. Cliquez sur &quot;Ajouter un slide&quot; pour commencer.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!content.spotlightSlider?.slideGroups || content.spotlightSlider.slideGroups.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Aucun groupe configuré. Cliquez sur &quot;Ajouter les slides&quot; pour commencer.</p>
                    <p className="text-sm mt-2">💡 Créez un groupe et ajoutez autant de slides que vous souhaitez</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Affiche à la une */}
          <div id="posterSpotlight" className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl p-8 border border-emerald-500/20 shadow-xl mt-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={scrollToSaveButton}
                  className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                  title="Cliquer pour aller au bouton Sauvegarder"
                >
                  <StarIcon className="w-6 h-6 text-white" />
                </button>
                <div>
                  <h3 className="text-2xl font-bold text-white">Affiche à la une</h3>
                  <p className="text-gray-400">Mettez en avant plusieurs affiches phares</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  const newPosters = [...(content.posterSpotlight?.posters || [])]
                  newPosters.push({
                    id: `poster-${Date.now()}`,
                    description: '',
                    contentTitle: '',
                    imageUrl: '',
                    linkUrl: '',
                    catalogue: 'collection'
                  })
                  setContent({
                    ...content,
                    posterSpotlight: { 
                      ...content.posterSpotlight, 
                      posters: newPosters,
                      isVisible: content.posterSpotlight?.isVisible ?? true
                    }
                  })
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Ajouter une affiche</span>
              </button>
            </div>
            
            {/* Visibilité globale */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="posterSpotlight-visible"
                  checked={content.posterSpotlight?.isVisible ?? true}
                  onChange={(e) => setContent({
                    ...content,
                    posterSpotlight: { 
                      ...content.posterSpotlight, 
                      isVisible: e.target.checked,
                      posters: content.posterSpotlight?.posters || []
                    }
                  })}
                  className="w-5 h-5 text-emerald-500 bg-dark-600 border-gray-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="posterSpotlight-visible" className="text-sm font-medium text-gray-300">
                  Afficher cette section sur le dashboard utilisateur
                </label>
              </div>
            </div>
            
            {/* Liste des affiches */}
            <div className="space-y-6">

              {(content.posterSpotlight?.posters || []).map((poster: any, index: number) => (
                <div key={poster.id} className="bg-dark-500/30 rounded-2xl p-6 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-white">Affiche {index + 1}</h4>
                    <button
                      onClick={() => {
                        const updatedPosters = (content.posterSpotlight?.posters || []).filter((p: any) => p.id !== poster.id)
                        setContent({
                          ...content,
                          posterSpotlight: {
                            ...content.posterSpotlight,
                            posters: updatedPosters,
                            isVisible: content.posterSpotlight?.isVisible ?? true
                          }
                        })
                      }}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Description - Pleine largeur */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={poster.description || ''}
                        onChange={(e) => {
                          const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                            p.id === poster.id ? { ...p, description: e.target.value } : p
                          )
                          setContent({
                            ...content,
                            posterSpotlight: { 
                              ...content.posterSpotlight, 
                              posters: updatedPosters,
                              isVisible: content.posterSpotlight?.isVisible ?? true
                            }
                          })
                        }}
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Description du contenu mis en avant..."
                      />
                    </div>

                    {/* Groupe 1: Titre du contenu + URL de l'image */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Titre du contenu</label>
                        <input
                          type="text"
                          value={poster.contentTitle || ''}
                          onChange={(e) => {
                            const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                              p.id === poster.id ? { ...p, contentTitle: e.target.value } : p
                            )
                            setContent({
                              ...content,
                              posterSpotlight: { 
                                ...content.posterSpotlight, 
                                posters: updatedPosters,
                                isVisible: content.posterSpotlight?.isVisible ?? true
                              }
                            })
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                          placeholder="Titre du film/série"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">URL de l&apos;image</label>
                        <input
                          type="url"
                          value={poster.imageUrl || ''}
                          onChange={(e) => {
                            const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                              p.id === poster.id ? { ...p, imageUrl: e.target.value } : p
                            )
                            setContent({
                              ...content,
                              posterSpotlight: { 
                                ...content.posterSpotlight, 
                                posters: updatedPosters,
                                isVisible: content.posterSpotlight?.isVisible ?? true
                              }
                            })
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                          placeholder="https://example.com/poster.jpg"
                        />
                      </div>
                    </div>

                    {/* Groupe 2: Lien de destination + Catalogue */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Lien de destination</label>
                        <input
                          type="text"
                          value={poster.linkUrl || ''}
                          onChange={(e) => {
                            const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                              p.id === poster.id ? { ...p, linkUrl: e.target.value } : p
                            )
                            setContent({
                              ...content,
                              posterSpotlight: { 
                                ...content.posterSpotlight, 
                                posters: updatedPosters,
                                isVisible: content.posterSpotlight?.isVisible ?? true
                              }
                            })
                          }}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                          placeholder="/content/movie-123 ou /content/series-456"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Catalogue d&apos;affichage</label>
                        <div className="space-y-3">
                          <select
                            value={poster.catalogue || 'collection'}
                            onChange={(e) => {
                              const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                                p.id === poster.id ? { ...p, catalogue: e.target.value } : p
                              )
                              setContent({
                                ...content,
                                posterSpotlight: { 
                                  ...content.posterSpotlight, 
                                  posters: updatedPosters,
                                  isVisible: content.posterSpotlight?.isVisible ?? true
                                }
                              })
                            }}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-200"
                          >
                            <option value="collection">Notre collection</option>
                            <option value="popular-movies">Films Populaires</option>
                            <option value="popular-series">Séries Populaires</option>
                            <option value="jeux">Jeux</option>
                            <option value="sports">Sports</option>
                            <option value="animes">Animes</option>
                            <option value="tendances">Tendances</option>
                            <option value="documentaires">Documentaires</option>
                            <option value="divertissements">Divertissements</option>
                          </select>
                          
                          {/* Boutons de déplacement rapide */}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                                  p.id === poster.id ? { ...p, catalogue: 'collection' } : p
                                )
                                setContent({
                                  ...content,
                                  posterSpotlight: { 
                                    ...content.posterSpotlight, 
                                    posters: updatedPosters,
                                    isVisible: content.posterSpotlight?.isVisible ?? true
                                  }
                                })
                              }}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                poster.catalogue === 'collection' 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            >
                              Collection
                            </button>
                            <button
                              onClick={() => {
                                const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                                  p.id === poster.id ? { ...p, catalogue: 'popular-movies' } : p
                                )
                                setContent({
                                  ...content,
                                  posterSpotlight: { 
                                    ...content.posterSpotlight, 
                                    posters: updatedPosters,
                                    isVisible: content.posterSpotlight?.isVisible ?? true
                                  }
                                })
                              }}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                poster.catalogue === 'popular-movies' 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            >
                              Films
                            </button>
                            <button
                              onClick={() => {
                                const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                                  p.id === poster.id ? { ...p, catalogue: 'popular-series' } : p
                                )
                                setContent({
                                  ...content,
                                  posterSpotlight: { 
                                    ...content.posterSpotlight, 
                                    posters: updatedPosters,
                                    isVisible: content.posterSpotlight?.isVisible ?? true
                                  }
                                })
                              }}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                poster.catalogue === 'popular-series' 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            >
                              Séries
                            </button>
                            <button
                              onClick={() => {
                                const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                                  p.id === poster.id ? { ...p, catalogue: 'jeux' } : p
                                )
                                setContent({
                                  ...content,
                                  posterSpotlight: { 
                                    ...content.posterSpotlight, 
                                    posters: updatedPosters,
                                    isVisible: content.posterSpotlight?.isVisible ?? true
                                  }
                                })
                              }}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                poster.catalogue === 'jeux' 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            >
                              Jeux
                            </button>
                            <button
                              onClick={() => {
                                const updatedPosters = (content.posterSpotlight?.posters || []).map((p: any) => 
                                  p.id === poster.id ? { ...p, catalogue: 'animes' } : p
                                )
                                setContent({
                                  ...content,
                                  posterSpotlight: { 
                                    ...content.posterSpotlight, 
                                    posters: updatedPosters,
                                    isVisible: content.posterSpotlight?.isVisible ?? true
                                  }
                                })
                              }}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                poster.catalogue === 'animes' 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                              }`}
                            >
                              Animes
                            </button>
                          </div>
                          
                          <p className="text-xs text-gray-400">
                            💡 Cliquez sur un bouton pour déplacer rapidement cette affiche vers ce catalogue
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!content.posterSpotlight?.posters || content.posterSpotlight.posters.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p>Aucune affiche configurée. Cliquez sur &quot;Ajouter une affiche&quot; pour commencer.</p>
                  <p className="text-sm mt-2">💡 Chaque affiche peut être assignée à un catalogue différent</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Affiche Mise en Avant */}
          <div id="featuredPoster" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl p-8 border border-purple-500/20 shadow-xl mt-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={scrollToSaveButton}
                  className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                  title="Cliquer pour aller au bouton Sauvegarder"
                >
                  <StarIcon className="w-6 h-6 text-white" />
                </button>
                <div>
                  <h3 className="text-2xl font-bold text-white">Affiche Mise en Avant</h3>
                  <p className="text-gray-400">Mettez en avant les top films et séries phares dans le Dashboard utilisateur</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  const newRows = [...(content.featuredPoster?.rows || [])]
                  newRows.push({
                    id: `row-${Date.now()}`,
                    catalogue: 'collection',
                    rowsCount: 1,
                    showNumbers: true,
                    itemsToShow: 3,
                    itemsToShowMobile: 1,
                    itemsToShowTablet: 3,
                    slides: []
                  })
                  setContent({
                    ...content,
                    featuredPoster: { 
                      ...content.featuredPoster, 
                      title: content.featuredPoster?.title,
                      rows: newRows,
                      isVisible: content.featuredPoster?.isVisible ?? true,
                      autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                    }
                  })
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Ajouter une rangée</span>
              </button>
            </div>
            
            {/* Visibilité globale */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="featuredPoster-visible"
                  checked={content.featuredPoster?.isVisible ?? true}
                  onChange={(e) => setContent({
                    ...content,
                    featuredPoster: { 
                      ...content.featuredPoster, 
                      isVisible: e.target.checked,
                      title: content.featuredPoster?.title,
                      autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5,
                      rows: content.featuredPoster?.rows || []
                    }
                  })}
                  className="w-5 h-5 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="featuredPoster-visible" className="text-sm font-medium text-gray-300">
                  Afficher cette section sur la page d&apos;utilisateur
                </label>
              </div>
            </div>

            {/* Paramètres généraux */}
            <div className="space-y-4 mb-6">
              {/* Titre de la section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre de la section
                </label>
                <input
                  type="text"
                  value={content.featuredPoster?.title ?? ''}
                  onChange={(e) => setContent({
                    ...content,
                    featuredPoster: {
                      ...content.featuredPoster,
                      title: e.target.value || undefined,
                      isVisible: content.featuredPoster?.isVisible ?? true,
                      autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5,
                      rows: content.featuredPoster?.rows || []
                    }
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: Mise en Avant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vitesse de défilement (secondes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={content.featuredPoster?.autoplaySpeed ?? 5}
                  onChange={(e) => setContent({
                    ...content,
                    featuredPoster: {
                      ...content.featuredPoster,
                      title: content.featuredPoster?.title,
                      autoplaySpeed: parseInt(e.target.value) || 5,
                      isVisible: content.featuredPoster?.isVisible ?? true,
                      rows: content.featuredPoster?.rows || []
                    }
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                />
              </div>

            </div>
            
            {/* Liste des rangées */}
            <div className="space-y-6">
              {(content.featuredPoster?.rows || []).map((row: any, rowIndex: number) => (
                <div key={row.id} className="bg-dark-500/30 rounded-2xl p-6 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-white">Rangée {rowIndex + 1}</h4>
                    <button
                      onClick={() => {
                        const updatedRows = (content.featuredPoster?.rows || []).filter((r: any) => r.id !== row.id)
                        setContent({
                        ...content,
                      featuredPoster: {
                        ...content.featuredPoster,
                        title: content.featuredPoster?.title,
                            rows: updatedRows,
                        isVisible: content.featuredPoster?.isVisible ?? true,
                            autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                      }
                        })
                      }}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Catalogue d'affichage */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Catalogue d&apos;affichage
                    </label>
                    <select
                      value={row.catalogue || 'collection'}
                      onChange={(e) => {
                        const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => 
                          r.id === row.id ? { ...r, catalogue: e.target.value } : r
                        )
                        setContent({
                        ...content,
                        featuredPoster: {
                          ...content.featuredPoster,
                            rows: updatedRows,
                          isVisible: content.featuredPoster?.isVisible ?? true,
                            autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                        }
                        })
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                    >
                      <option value="collection">Notre collection</option>
                      <option value="popular-movies">Films Populaires</option>
                      <option value="popular-series">Séries Populaires</option>
                      <option value="jeux">Jeux</option>
                      <option value="sports">Sports</option>
                      <option value="animes">Animes</option>
                      <option value="tendances">Tendances</option>
                      <option value="documentaires">Documentaires</option>
                      <option value="divertissements">Divertissements</option>
                    </select>
                  </div>

                  {/* Nombre de rangées */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de rangées
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={row.rowsCount || 1}
                      onChange={(e) => {
                        const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => 
                          r.id === row.id ? { ...r, rowsCount: parseInt(e.target.value) || 1 } : r
                        )
                        setContent({
                        ...content,
                        featuredPoster: {
                          ...content.featuredPoster,
                            rows: updatedRows,
                          isVisible: content.featuredPoster?.isVisible ?? true,
                            autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                        }
                        })
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                      placeholder="Nombre de rangées"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Indiquez le nombre de rangées pour afficher les slides (minimum 1)
                    </p>
            </div>

                  {/* Afficher les numéros */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`row-${row.id}-show-numbers`}
                        checked={row.showNumbers ?? true}
                  onChange={(e) => {
                          const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => 
                            r.id === row.id ? { ...r, showNumbers: e.target.checked } : r
                          )
                    setContent({
                      ...content,
                      featuredPoster: {
                        ...content.featuredPoster,
                              rows: updatedRows,
                        isVisible: content.featuredPoster?.isVisible ?? true,
                        itemsToShow: content.featuredPoster?.itemsToShow ?? 3,
                        itemsToShowMobile: content.featuredPoster?.itemsToShowMobile ?? 1,
                        itemsToShowTablet: content.featuredPoster?.itemsToShowTablet ?? 3,
                              autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                      }
                    })
                  }}
                        className="w-5 h-5 text-purple-500 bg-dark-600 border-gray-600 rounded focus:ring-purple-500"
                      />
                      <label htmlFor={`row-${row.id}-show-numbers`} className="text-sm font-medium text-gray-300">
                        Afficher les numéros sur les slides
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-8">
                      💡 Activez cette option pour afficher les numéros sur chaque slide de cette rangée
                    </p>
                  </div>
                
                  {/* Bouton pour ajouter un slide */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => {
                          if (r.id === row.id) {
                            return {
                              ...r,
                              slides: [...(r.slides || []), {
                                id: `slide-${Date.now()}`,
                                imageUrl: '',
                                linkUrl: '',
                                isActive: true
                              }]
                            }
                          }
                          return r
                        })
                        setContent({
                          ...content,
                          featuredPoster: {
                            ...content.featuredPoster,
                            rows: updatedRows,
                            isVisible: content.featuredPoster?.isVisible ?? true,
                            autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                          }
                        })
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Ajouter un slide</span>
                    </button>
                </div>
                
                  {/* Liste des slides de cette rangée */}
                  <div className="space-y-4 mt-4">
                    {(row.slides || []).map((slide: any, slideIndex: number) => (
                      <div key={slide.id} className="bg-dark-600/50 rounded-xl p-4 border border-purple-500/10">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-semibold text-white">Slide {slideIndex + 1}</h5>
                    <button
                      onClick={() => {
                              const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => {
                                if (r.id === row.id) {
                                  return {
                                    ...r,
                                    slides: (r.slides || []).filter((s: any) => s.id !== slide.id)
                                  }
                                }
                                return r
                              })
                        setContent({
                          ...content,
                          featuredPoster: {
                            ...content.featuredPoster,
                                  rows: updatedRows,
                            isVisible: content.featuredPoster?.isVisible ?? true,
                            itemsToShow: content.featuredPoster?.itemsToShow ?? 3,
                            itemsToShowMobile: content.featuredPoster?.itemsToShowMobile ?? 1,
                            itemsToShowTablet: content.featuredPoster?.itemsToShowTablet ?? 3,
                            autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                          }
                        })
                      }}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                            <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">URL de l&apos;image</label>
                      <input
                        type="url"
                        value={slide.imageUrl || ''}
                        onChange={(e) => {
                                const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => {
                                  if (r.id === row.id) {
                                    return {
                                      ...r,
                                      slides: (r.slides || []).map((s: any) => 
                            s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                          )
                                    }
                                  }
                                  return r
                                })
                          setContent({
                            ...content,
                            featuredPoster: { 
                              ...content.featuredPoster, 
                                    rows: updatedRows,
                              isVisible: content.featuredPoster?.isVisible ?? true,
                              itemsToShow: content.featuredPoster?.itemsToShow ?? 3,
                                    itemsToShowMobile: content.featuredPoster?.itemsToShowMobile ?? 1,
                                    itemsToShowTablet: content.featuredPoster?.itemsToShowTablet ?? 3,
                              autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                            }
                          })
                        }}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="https://example.com/poster.jpg"
                      />
                    </div>
                    
                    <div>
                            <label className="block text-xs font-medium text-gray-300 mb-2">Lien de destination</label>
                      <input
                        type="text"
                        value={slide.linkUrl || ''}
                        onChange={(e) => {
                                const updatedRows = (content.featuredPoster?.rows || []).map((r: any) => {
                                  if (r.id === row.id) {
                                    return {
                                      ...r,
                                      slides: (r.slides || []).map((s: any) => 
                            s.id === slide.id ? { ...s, linkUrl: e.target.value } : s
                          )
                                    }
                                  }
                                  return r
                                })
                          setContent({
                            ...content,
                            featuredPoster: { 
                              ...content.featuredPoster, 
                                    rows: updatedRows,
                              isVisible: content.featuredPoster?.isVisible ?? true,
                              itemsToShow: content.featuredPoster?.itemsToShow ?? 3,
                                    itemsToShowMobile: content.featuredPoster?.itemsToShowMobile ?? 1,
                                    itemsToShowTablet: content.featuredPoster?.itemsToShowTablet ?? 3,
                              autoplaySpeed: content.featuredPoster?.autoplaySpeed ?? 5
                            }
                          })
                        }}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="/content/movie-123"
                      />
                    </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {(!content.featuredPoster?.rows || content.featuredPoster.rows.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p>Aucune rangée configurée. Cliquez sur &quot;Ajouter une rangée&quot; pour commencer.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Catalogue */}
          <div id="catalogue" className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-3xl p-8 border border-teal-500/20 shadow-xl mt-8">
            <div className="flex items-center space-x-4 mb-8">
              <button 
                onClick={scrollToSaveButton}
                className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                title="Cliquer pour aller au bouton Sauvegarder"
              >
                <div className="w-6 h-6 text-white">📚</div>
              </button>
              <div>
                <h3 className="text-2xl font-bold text-white">Section Catalogue</h3>
                <p className="text-gray-400">Gérez les catalogues prédéfinis de l&apos;interface utilisateur</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">Catalogues Disponibles</h4>
                </div>
                
                <div className="space-y-3">
                {(content.catalogue?.items || []).map((item: any, index: number) => (
                  <div key={item.id} className="bg-dark-500/30 rounded-2xl p-4 border border-teal-500/20">
                    
                    {/* En-tête avec boutons de déplacement */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-white">#{index + 1}</span>
                        <span className="text-base font-bold text-white">{item.title}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveCatalogueUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0 
                              ? 'text-gray-600 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                          title="Déplacer vers le haut"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCatalogueDown(index)}
                          disabled={index === (content.catalogue?.items || []).length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === (content.catalogue?.items || []).length - 1 
                              ? 'text-gray-600 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                          title="Déplacer vers le bas"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            if (!content) return
    const items = [...(content.catalogue?.items || [])]
                            items[index] = { ...items[index], title: e.target.value }
                            const newContent = {
                              ...content,
                              catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Titre de la fonctionnalité"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Texte du bouton
                        </label>
                        <input
                          type="text"
                          value={item.buttonText}
                          onChange={(e) => {
                            if (!content) return
    const items = [...(content.catalogue?.items || [])]
                            items[index] = { ...items[index], buttonText: e.target.value }
                            const newContent = {
                              ...content,
                              catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
                            }
                            setContent(newContent)
                            HomepageContentService.saveContent(newContent)
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Texte du bouton"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Nombre de contenus à afficher
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Mobile */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Mobile</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={item.itemsToShowMobile ?? 6}
                            onChange={(e) => {
                              if (!content) return
                              const items = [...(content.catalogue?.items || [])]
                              items[index] = { 
                                ...items[index], 
                                itemsToShowMobile: parseInt(e.target.value) || 6 
                              }
                              const newContent = {
                                ...content,
                                catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Mobile"
                          />
                        </div>
                        {/* Tablette */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Tablette</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={item.itemsToShowTablet ?? 9}
                            onChange={(e) => {
                              if (!content) return
                              const items = [...(content.catalogue?.items || [])]
                              items[index] = { 
                                ...items[index], 
                                itemsToShowTablet: parseInt(e.target.value) || 9 
                              }
                              const newContent = {
                                ...content,
                                catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Tablette"
                          />
                        </div>
                        {/* PC */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">PC</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={item.itemsToShow ?? 12}
                            onChange={(e) => {
                              if (!content) return
                              const items = [...(content.catalogue?.items || [])]
                              items[index] = { 
                                ...items[index], 
                                itemsToShow: parseInt(e.target.value) || 12 
                              }
                              const newContent = {
                                ...content,
                                catalogue: { ...(content?.catalogue || { isVisible: true, items: [] }), items }
                              }
                              setContent(newContent)
                              HomepageContentService.saveContent(newContent)
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="PC"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`catalogue-item-${index}-visible`}
                          checked={item.isVisible ?? true}
                          onChange={(e) => handleCatalogueVisibilityToggle(item.id, e.target.checked)}
                          className="w-4 h-4 text-teal-500 bg-dark-600 border-gray-600 rounded focus:ring-teal-500"
                        />
                        <label htmlFor={`catalogue-item-${index}-visible`} className="text-sm text-gray-300">
                          Afficher le &quot;Catalogue&quot;
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                
                {(!content.catalogue?.items || content.catalogue.items.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Les catalogues prédéfinis sont automatiquement chargés. Vous pouvez modifier leur titre, bouton et visibilité.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Section Raccourcis */}
          <div className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 rounded-3xl p-6 border border-slate-500/20 shadow-xl mt-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
                <InformationCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Raccourcis</h3>
                <p className="text-gray-400">Cliquez pour naviguer • Glissez-déposez pour réorganiser les sections</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Slider Accueil */}
              <button
                onClick={() => scrollToSection('homepageSlider')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Slider Accueil"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Accueil</span>
              </button>
              
              {/* Hero */}
              <button
                onClick={() => scrollToSection('hero')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Hero"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Hero</span>
              </button>
              
              {/* Fonctionnalités */}
              <button
                onClick={() => scrollToSection('features')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Fonctionnalités"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Fonctionnalités</span>
              </button>
              
              {/* Nouveautés */}
              <button
                onClick={() => scrollToSection('newReleases')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 rounded-xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Nouveautés"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Nouveautés</span>
              </button>
              
              {/* Media */}
              <button
                onClick={() => scrollToSection('media')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Media"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <EyeIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Media</span>
              </button>
              
              {/* FAQ */}
              <button
                onClick={() => scrollToSection('faq')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section FAQ"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">FAQ</span>
              </button>
              
              {/* Footer */}
              <button
                onClick={() => scrollToSection('footer')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-gray-500/20 to-slate-500/20 hover:from-gray-500/30 hover:to-slate-500/30 rounded-xl border border-gray-500/20 hover:border-gray-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Footer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
                  <PencilIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Footer</span>
              </button>
              
              {/* Réseaux */}
              <button
                onClick={() => scrollToSection('social')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Réseaux Sociaux"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Réseaux</span>
              </button>
              
              {/* Identité */}
              <button
                onClick={() => scrollToSection('identity')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Identité"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Identité</span>
              </button>
              
              {/* Couleurs */}
              <button
                onClick={() => scrollToSection('colors')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 rounded-xl border border-pink-500/20 hover:border-pink-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Palette de Couleurs"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-white text-sm font-medium">Couleurs</span>
              </button>
              
              {/* Download */}
              <button
                onClick={() => scrollToSection('download')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Download"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <ArrowDownTrayIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Download</span>
              </button>
              
              {/* Contenu Partagé */}
              <button
                onClick={() => scrollToSection('sharePage')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Contenu Partagé"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Contenu Partagé</span>
              </button>
              
              {/* Slider Mise en Avant */}
              <button
                onClick={() => scrollToSection('featuredSlider')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Slider Mise en Avant"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Slider</span>
              </button>
              
              {/* Slider À la une */}
              <button
                onClick={() => scrollToSection('spotlightSlider')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Slider À la une"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">À la une</span>
              </button>
              
              {/* Affiche à la une */}
              <button
                onClick={() => scrollToSection('posterSpotlight')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Affiche à la une"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <EyeIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Affiche</span>
              </button>
              
              {/* Affiche Mise en Avant */}
              <button
                onClick={() => scrollToSection('featuredPoster')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Affiche Mise en Avant"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Affiche Mise en Avant</span>
              </button>
              
              {/* Catalogue */}
              <button
                onClick={() => scrollToSection('catalogue')}
                className="flex flex-col items-center space-y-2 p-4 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 rounded-xl border border-teal-500/20 hover:border-teal-500/40 transition-all duration-200 hover:scale-105"
                title="Aller à la section Catalogue"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 text-white">📚</div>
                </div>
                <span className="text-white text-sm font-medium">Catalogue</span>
              </button>
            </div>
          </div>
        </div>
        {/* Boutons d'action */}
        <div className="mt-8 flex flex-col space-y-3 p-4">
          {onClose && (
              <button
                onClick={onClose}
              className="flex items-center justify-center px-6 py-3 bg-gray-600/50 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium w-full"
              >
                Annuler
              </button>
          )}
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium w-full"
            title="Retour au dashboard admin"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Retour</span>
          </button>
          <button
            onClick={openPreview}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium w-full"
            title="Aperçu de la page d&apos;accueil"
          >
            <EyeIcon className="w-5 h-5" />
            <span>Aperçu</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
            className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-200 hover:scale-105 font-medium shadow-lg hover:shadow-xl disabled:scale-100 w-full"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sauvegarde...</span>
            </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckIcon className="w-4 h-4" />
                <span>Sauvegarder</span>
          </div>
            )}
              </button>
      </div>
    </div>
  )
}
