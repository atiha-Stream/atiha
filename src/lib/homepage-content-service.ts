'use client'

import { logger } from './logger'

export interface HomepageContent {
  appIdentity: {
    name: string
    footer: {
      text: string
      copyright: string
    }
    colors: {
      primary: string
      secondary: string
      accent: string
    }
    socialLinks: {
      telegram: {
        url: string
        isVisible: boolean
        text: string
        description: string
      }
      discord: {
        url: string
        isVisible: boolean
        text: string
        description: string
      }
      twitter: {
        url: string
        isVisible: boolean
        text: string
        description: string
      }
      instagram: {
        url: string
        isVisible: boolean
        text: string
        description: string
      }
      youtube: {
        url: string
        isVisible: boolean
        text: string
        description: string
      }
    }
  }
  hero: {
    title: string
    subtitle: string
    description: string
    primaryButton: {
      text: string
      link: string
    }
    secondaryButton: {
      text: string
      link: string
    }
    downloadButtonText?: string
    downloadButtonLink?: string
    backgroundImageUrl?: string
    showBackground?: boolean
  }
  features: {
    streaming: {
      title: string
      description: string
    }
    premium: {
      title: string
      description: string
    }
    noCommitment: {
      title: string
      description: string
    }
  }
  newReleases: {
    title: string
    subtitle: string
    itemsCount: number
    isVisible?: boolean
    contentTypes: {
      collection: boolean
      movies: boolean
      series: boolean
      jeux: boolean
      sports: boolean
      animes: boolean
      tendances: boolean
      documentaires: boolean
      divertissements: boolean
    }
  }
  homepageSlider: {
    title: string
    title2: string
    subtitle: string
    buttonText: string
    buttonLink: string
    autoplaySpeed: number
    isVisible?: boolean
    slides: {
      id: string
      imageUrl: string
      isActive: boolean
    }[]
  }
  featuredSlider: {
    title: string
    subtitle: string
    autoplaySpeed: number
    isVisible?: boolean
    slides: {
      id: string
      title: string
      subtitle: string
      imageUrl: string
      linkUrl: string
      isActive: boolean
    }[]
  }
  spotlightSlider: {
    title: string
    subtitle: string
    autoplaySpeed: number
    isVisible?: boolean
    slideGroups: {
      id: string
      catalogue: string
      slides: {
        id: string
        title: string
        subtitle: string
        imageUrl: string
        linkUrl: string
        isActive: boolean
      }[]
    }[]
  }
  posterSpotlight: {
    isVisible?: boolean
    posters: {
      id: string
      description: string
      contentTitle: string
      imageUrl: string
      linkUrl: string
      catalogue: string
    }[]
  }
  featuredPoster: {
    isVisible?: boolean
    title?: string
    itemsToShow: number // Pour PC
    itemsToShowMobile?: number // Pour Mobile
    itemsToShowTablet?: number // Pour Tablette
    autoplaySpeed: number
    rows: {
      id: string
      catalogue: string
      rowsCount: number // Nombre de rangées d'affichage (1, 2, ou 3)
      showNumbers?: boolean // Afficher ou masquer les numéros sur les slides
      itemsToShow?: number // Nombre d'éléments à afficher sur PC
      itemsToShowMobile?: number // Nombre d'éléments à afficher sur Mobile
      itemsToShowTablet?: number // Nombre d'éléments à afficher sur Tablette
    slides: {
      id: string
      imageUrl: string
      linkUrl: string
      isActive: boolean
      }[]
    }[]
  }
  media: {
    title: string
    subtitle: string
    trailerUrl: string
    videoUrl?: string
    imageUrl?: string
    watchNowText: string
    contentUrl: string
    isVisibleHomepage: boolean
    isVisibleDashboard: boolean
  }
  faq: {
    title: string
    isVisible?: boolean
    questions: {
      id: string
      question: string
      answer: string
      isActive: boolean
    }[]
  }
  sectionsOrder: string[]
  sectionsVisibility: {
    homepageSlider: boolean
    hero: boolean
    features: boolean
    newReleases: boolean
    spotlightSlider: boolean
    posterSpotlight: boolean
    featuredPoster: boolean
    featuredSlider: boolean
    media: boolean
    faq: boolean
    footer: boolean
  }
  footer: {
    quickLinksTitle: string
    availableOnTitle: string
    quickLinks: {
      downloadApp: {
        text: string
        url: string
        isVisible: boolean
      }
      login: {
        text: string
        url: string
        isVisible: boolean
      }
      register: {
        text: string
        url: string
        isVisible: boolean
      }
    }
    availableOn: {
      title: {
        text: string
        url?: string
        modalContent?: string
        isVisible: boolean
      }
      vrHeadset: {
        text: string
        url?: string
        modalContent?: string
        isVisible: boolean
      }
      tv: {
        text: string
        url?: string
        modalContent?: string
        isVisible: boolean
      }
      vrHeadset2: {
        text: string
        url?: string
        modalContent?: string
        isVisible: boolean
      }
      tv2: {
        text: string
        url?: string
        modalContent?: string
        isVisible: boolean
      }
    }
    isVisible?: boolean
  }
  sharePage: {
    title: string
    description: string
    watchNowButton: {
      text: string
      link: string
    }
    primaryButton: {
      text: string
      link: string
    }
    secondaryButton: {
      text: string
      link: string
    }
    subscriptionButton: {
      text: string
      link: string
    }
    showFilmTrailer?: boolean
    showFilmDetails?: boolean
    showFilmImage?: boolean
    showRecentContent?: boolean
    showFinalCTA?: boolean
    paymentPartners: {
      isVisible: boolean
      title?: string
      items: {
        id: string
        logoUrl: string
        isVisible: boolean
      }[]
    }
  }
  catalogue: {
    isVisible: boolean
    items: {
      id: string
      title: string
      buttonText: string
      isVisible: boolean
      itemsToShow?: number // Pour PC
      itemsToShowMobile?: number // Pour Mobile
      itemsToShowTablet?: number // Pour Tablette
      itemsCount?: number // Déprécié, conservé pour compatibilité
    }[]
  }
  download: {
    hero: {
      title: string
      description: string
    }
    devices: {
      mobile: {
        title: string
        description: string
        subtitle: string
        buttonText: string
      }
      tablet: {
        title: string
        description: string
        subtitle: string
        buttonText: string
      }
      desktop: {
        title: string
        description: string
        subtitle: string
        buttonText: string
      }
    }
    features: {
      title: string
      description: string
      isVisible: boolean
      items: {
        title: string
        description: string
      }[]
    }
    isVisible?: boolean
  }
  lastUpdated: string
}

export class HomepageContentService {
  private static readonly STORAGE_KEY = 'atiha_homepage_content'

  // Générer les URLs par défaut basées sur le nom de l'application
  private static generateDefaultSocialLinks(appName: string): HomepageContent['appIdentity']['socialLinks'] {
    const normalizedName = appName.toLowerCase().replace(/\s+/g, '_')
    return {
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
  private static readonly DEFAULT_CONTENT: HomepageContent = {
    appIdentity: {
      name: 'Atiha',
      footer: {
        text: 'Atiha',
        copyright: '© 2025 Atiha. Tous droits réservés.'
      },
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#F59E0B'
      },
      socialLinks: this.generateDefaultSocialLinks('Atiha')
    },
    hero: {
      title: 'Vos films et séries',
      subtitle: 'préférés',
      description: 'Découvrez une vaste collection de films et séries en streaming haute qualité. Regardez quand vous voulez, où vous voulez.',
      primaryButton: {
        text: 'Commencer maintenant',
        link: '/register'
      },
      secondaryButton: {
        text: 'Se connecter',
        link: '/login'
      },
      downloadButtonText: 'Télécharger notre application',
      downloadButtonLink: '/download',
      backgroundImageUrl: '',
      showBackground: false
    },
    features: {
      streaming: {
        title: 'Streaming HD',
        description: 'Regardez vos contenus préférés en haute définition sur tous vos appareils.'
      },
      premium: {
        title: 'Contenu Premium',
        description: 'Accédez à une bibliothèque exclusive de films et séries de qualité.'
      },
      noCommitment: {
        title: 'Sans Engagement',
        description: 'Annulez quand vous voulez, sans frais cachés ni engagement.'
      },
    },
    newReleases: {
      title: 'Nouveautés',
      subtitle: 'Découvrez nos dernières sorties',
      itemsCount: 6,
      isVisible: true,
      contentTypes: {
        collection: true,
        movies: true,
        series: true,
        jeux: true,
        sports: true,
        animes: true,
        tendances: true,
        documentaires: true,
        divertissements: true
      }
    },
    homepageSlider: {
      title: 'Films et Séries à l\'affiche',
      title2: 'Découvrez nos recommandations',
      subtitle: 'À partir de 7,99 €. Annulable à tout moment.',
      buttonText: 'Découvrir',
      buttonLink: '/register',
      autoplaySpeed: 5,
      isVisible: true,
      slides: []
    },
    featuredSlider: {
      title: 'Films et Séries à l\'affiche',
      subtitle: 'Découvrez nos recommandations',
      autoplaySpeed: 5,
      isVisible: true,
      slides: []
    },
    spotlightSlider: {
      title: 'À la une',
      subtitle: 'Découvrez nos sélections du moment',
      autoplaySpeed: 5,
      isVisible: true,
      slideGroups: []
    },
    posterSpotlight: {
      isVisible: true,
      posters: []
    },
    featuredPoster: {
      isVisible: true,
      title: undefined,
      itemsToShow: 3, // PC
      itemsToShowMobile: 1, // Mobile
      itemsToShowTablet: 3, // Tablette
      autoplaySpeed: 5,
      rows: []
    },
    media: {
      title: 'Bande d\'annonce',
      subtitle: 'Découvrez notre dernière sortie',
      trailerUrl: '',
      videoUrl: '',
      imageUrl: '',
      watchNowText: 'Regarder maintenant',
      contentUrl: '',
      isVisibleHomepage: true,
      isVisibleDashboard: true
    },
    faq: {
      title: 'Foire aux questions',
      isVisible: true,
      questions: [
        {
          id: 'faq-1',
          question: 'Qu\'est-ce que Atiha ?',
          answer: 'Atiha est une plateforme de streaming qui propose une vaste sélection de séries, films, animes, documentaires et autres programmes sur des milliers d\'appareils connectés à Internet.',
          isActive: true
        },
        {
          id: 'faq-2',
          question: 'Combien coûte Atiha ?',
          answer: 'Regardez Atiha sur votre smartphone, tablette, Smart TV, ordinateur portable ou appareil de streaming, le tout pour un tarif mensuel fixe. Les forfaits vont de 7,99 € à 15,99 € par mois. Pas de frais supplémentaires, pas de contrats.',
          isActive: true
        },
        {
          id: 'faq-3',
          question: 'Où puis-je regarder Atiha ?',
          answer: 'Regardez où et quand vous voulez, en illimité. Connectez-vous à votre compte pour regarder Atiha en ligne sur atiha.com depuis votre ordinateur ou tout appareil connecté à Internet et équipé de l\'application Atiha, comme les Smart TV, smartphones, tablettes, lecteurs multimédias et consoles de jeux.',
          isActive: true
        }
      ]
    },
    sectionsOrder: ['homepageSlider', 'hero', 'features', 'newReleases', 'spotlightSlider', 'posterSpotlight', 'featuredSlider', 'media', 'faq', 'footer'],
    sectionsVisibility: {
      homepageSlider: true,
      hero: true,
      features: true,
      newReleases: true,
      spotlightSlider: true,
      posterSpotlight: true,
      featuredPoster: true,
      featuredSlider: true,
      media: true,
      faq: true,
      footer: true
    },
    footer: {
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
          modalContent: 'Contenu à définir pour Mobile (iOS & Android)',
          isVisible: true
        },
        vrHeadset: {
          text: 'Tablette (iPad & Android)',
          modalContent: 'Contenu à définir pour Tablette (iPad & Android)',
          isVisible: true
        },
        tv: {
          text: 'Ordinateur (Tous navigateurs)',
          modalContent: 'Contenu à définir pour Ordinateur (Tous navigateurs)',
          isVisible: true
        },
        vrHeadset2: {
          text: 'Casque virtuel',
          modalContent: 'Contenu à définir pour Casque virtuel',
          isVisible: true
        },
        tv2: {
          text: 'Télévision',
          modalContent: 'Contenu à définir pour Télévision',
          isVisible: true
        }
      },
    },
    catalogue: {
      isVisible: true,
      items: [
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
    },
    download: {
      hero: {
        title: 'Téléchargez',
        description: 'Téléchargez notre application pour profiter de vos contenus préférés partout, même hors ligne.'
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
          description: 'Profitez d\'une expérience optimale sur votre tablette avec notre application dédiée.',
          subtitle: 'Gratuit',
          buttonText: 'Installer'
        },
        desktop: {
          title: 'Ordinateur',
          description: 'Téléchargez notre application pour Windows, macOS ou Linux et profitez d\'une expérience native.',
          subtitle: 'Gratuit',
          buttonText: 'Télécharger'
        }
      },
      features: {
        title: 'Fonctionnalités',
        description: 'Découvrez tous les avantages d\'utiliser notre application native',
        isVisible: true,
        items: [
          {
            title: 'Téléchargement',
            description: 'Téléchargez vos contenus pour les regarder hors ligne'
          },
          {
            title: 'Synchronisation',
            description: 'Votre progression est synchronisée sur tous vos appareils'
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
      },
    },
    sharePage: {
      title: 'Rejoignez {appName} dès aujourd\'hui',
      description: 'Accédez à des milliers de films et séries en streaming haute qualité',
      watchNowButton: {
        text: 'Regarder maintenant',
        link: '/register'
      },
      primaryButton: {
        text: 'S\'inscrire gratuitement',
        link: '/register'
      },
      secondaryButton: {
        text: 'Se connecter',
        link: '/login'
      },
      subscriptionButton: {
        text: 'Activer mon abonnement',
        link: '/subscription'
      },
      showFilmTrailer: true,
      showFilmDetails: true,
      showFilmImage: true,
      showRecentContent: true,
      showFinalCTA: true,
      paymentPartners: {
        isVisible: true,
        title: 'Partenaires de paiement',
        items: [
          {
            id: 'visa',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
            isVisible: true
          },
          {
            id: 'mastercard',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/2560px-Mastercard-logo.svg.png',
            isVisible: true
          },
          {
            id: 'paypal',
            logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png',
            isVisible: true
          }
        ]
      }
    },
    lastUpdated: new Date().toISOString()
  }

  // Obtenir le contenu de la page d'accueil
  static getContent(): HomepageContent {
    if (typeof window === 'undefined') {
      return this.DEFAULT_CONTENT
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const content = { ...this.DEFAULT_CONTENT, ...parsed }
        
        // Migration automatique pour appIdentity
        if (!content.appIdentity) {
          content.appIdentity = this.DEFAULT_CONTENT.appIdentity
        }
        
        // Migration automatique pour les liens sociaux
        if (!content.appIdentity.socialLinks) {
          content.appIdentity.socialLinks = this.DEFAULT_CONTENT.appIdentity.socialLinks
        }
        
        // Migration automatique pour les nouvelles sections
        if (!content.sectionsOrder || content.sectionsOrder.length < 4) {
          content.sectionsOrder = ['hero', 'features', 'newReleases', 'media']
        }
        
        // Migration automatique pour footer (ajout des titres)
        if (content.footer) {
          if (!content.footer.quickLinksTitle) {
            content.footer.quickLinksTitle = this.DEFAULT_CONTENT.footer.quickLinksTitle
          }
          if (!content.footer.availableOnTitle) {
            content.footer.availableOnTitle = this.DEFAULT_CONTENT.footer.availableOnTitle
          }
          
          // Migration automatique pour availableOn (mobile/tablet/desktop -> title/vrHeadset/tv)
          if (content.footer.availableOn) {
            // Si les anciennes propriétés existent, migrer vers les nouvelles
            if (content.footer.availableOn.mobile || content.footer.availableOn.tablet || content.footer.availableOn.desktop) {
              // Migrer mobile vers title si title n'existe pas
              if (!content.footer.availableOn.title && content.footer.availableOn.mobile) {
                content.footer.availableOn.title = {
                  text: content.footer.availableOn.mobile.text || 'Titre',
                  isVisible: content.footer.availableOn.mobile.isVisible !== false
                }
              }
              // Initialiser vrHeadset et tv avec les valeurs par défaut si elles n'existent pas
              if (!content.footer.availableOn.vrHeadset) {
                content.footer.availableOn.vrHeadset = this.DEFAULT_CONTENT.footer.availableOn.vrHeadset
              }
              if (!content.footer.availableOn.tv) {
                content.footer.availableOn.tv = this.DEFAULT_CONTENT.footer.availableOn.tv
              }
              // Supprimer les anciennes propriétés
              delete content.footer.availableOn.mobile
              delete content.footer.availableOn.tablet
              delete content.footer.availableOn.desktop
            } else {
              // Si les nouvelles propriétés n'existent pas, utiliser les valeurs par défaut
              if (!content.footer.availableOn.title) {
                content.footer.availableOn.title = this.DEFAULT_CONTENT.footer.availableOn.title
              }
              if (!content.footer.availableOn.vrHeadset) {
                content.footer.availableOn.vrHeadset = this.DEFAULT_CONTENT.footer.availableOn.vrHeadset
              }
              if (!content.footer.availableOn.tv) {
                content.footer.availableOn.tv = this.DEFAULT_CONTENT.footer.availableOn.tv
              }
            }
            
            // Migration automatique pour les nouvelles options vrHeadset2 et tv2
            if (!content.footer.availableOn.vrHeadset2) {
              content.footer.availableOn.vrHeadset2 = this.DEFAULT_CONTENT.footer.availableOn.vrHeadset2
            }
            if (!content.footer.availableOn.tv2) {
              content.footer.availableOn.tv2 = this.DEFAULT_CONTENT.footer.availableOn.tv2
            }
            
            // Migration automatique pour modalContent (ajout du contenu du modal si il n'existe pas)
            if (content.footer.availableOn.title && !content.footer.availableOn.title.modalContent) {
              content.footer.availableOn.title.modalContent = this.DEFAULT_CONTENT.footer.availableOn.title.modalContent
            }
            if (content.footer.availableOn.vrHeadset && !content.footer.availableOn.vrHeadset.modalContent) {
              content.footer.availableOn.vrHeadset.modalContent = this.DEFAULT_CONTENT.footer.availableOn.vrHeadset.modalContent
            }
            if (content.footer.availableOn.tv && !content.footer.availableOn.tv.modalContent) {
              content.footer.availableOn.tv.modalContent = this.DEFAULT_CONTENT.footer.availableOn.tv.modalContent
            }
            if (content.footer.availableOn.vrHeadset2 && !content.footer.availableOn.vrHeadset2.modalContent) {
              content.footer.availableOn.vrHeadset2.modalContent = this.DEFAULT_CONTENT.footer.availableOn.vrHeadset2.modalContent
            }
            if (content.footer.availableOn.tv2 && !content.footer.availableOn.tv2.modalContent) {
              content.footer.availableOn.tv2.modalContent = this.DEFAULT_CONTENT.footer.availableOn.tv2.modalContent
            }
          }
        }
        
        // Migration automatique pour la section Media (séparation homepage/dashboard)
        if (content.media && typeof content.media.isVisible === 'boolean') {
          content.media.isVisibleHomepage = content.media.isVisible
          content.media.isVisibleDashboard = content.media.isVisible
          delete content.media.isVisible
        }
        
        // Migration automatique pour la section NewReleases (ajout des contentTypes)
        if (content.newReleases && !content.newReleases.contentTypes) {
          content.newReleases.contentTypes = {
            collection: true,
            movies: true,
            series: true,
            jeux: true,
            sports: true,
            animes: true,
            tendances: true,
            documentaires: true,
            divertissements: true
          }
        }
        
        // Migration automatique pour sharePage.watchNowButton
        if (content.sharePage && !content.sharePage.watchNowButton) {
          content.sharePage.watchNowButton = {
            text: 'Regarder maintenant',
            link: '/register'
          }
        }
        
        // Migration automatique pour sharePage.showFilmTrailer
        if (content.sharePage && content.sharePage.showFilmTrailer === undefined) {
          content.sharePage.showFilmTrailer = true
        }
        
        // Migration automatique pour sharePage.showFilmDetails
        if (content.sharePage && content.sharePage.showFilmDetails === undefined) {
          content.sharePage.showFilmDetails = true
        }
        
        // Migration automatique pour sharePage.showFilmImage
        if (content.sharePage && content.sharePage.showFilmImage === undefined) {
          content.sharePage.showFilmImage = true
        }
        
        // Migration automatique pour sharePage.showRecentContent
        if (content.sharePage && content.sharePage.showRecentContent === undefined) {
          content.sharePage.showRecentContent = true
        }
        
        // Migration automatique pour sharePage.showFinalCTA
        if (content.sharePage && content.sharePage.showFinalCTA === undefined) {
          content.sharePage.showFinalCTA = true
        }
        
        if (!content.sectionsVisibility) {
          content.sectionsVisibility = {
            hero: true,
            features: true,
            newReleases: true,
            popularMovies: true,
            popularSeries: true,
            media: true
          } as any
        }
        
        if (!content.footer) {
          content.footer = {
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
              mobile: {
                text: 'Mobile (iOS & Android)',
                isVisible: true
              },
              tablet: {
                text: 'Tablette (iPad & Android)',
                isVisible: true
              },
              desktop: {
                text: 'Ordinateur (Tous navigateurs)',
                isVisible: true
              }
            },
            isVisible: true
          }
        }

        // Migration automatique pour la section sharePage
        if (!content.sharePage) {
          content.sharePage = this.DEFAULT_CONTENT.sharePage
        } else {
          // Migration pour paymentPartners si manquant
          if (!content.sharePage.paymentPartners) {
            content.sharePage.paymentPartners = this.DEFAULT_CONTENT.sharePage.paymentPartners
          }
        }
        
        return content
      }
    } catch (error) {
      logger.error('Error loading homepage content', error)
    }

    return this.DEFAULT_CONTENT
  }

  // Méthode de compatibilité pour loadContent
  static loadContent(): HomepageContent {
    return this.getContent()
  }

  // Sauvegarder le contenu de la page d'accueil
  static saveContent(content: Partial<HomepageContent>): void {
    if (typeof window === 'undefined') return

    try {
      const currentContent = this.getContent()
      logger.debug('saveContent - Contenu actuel', { currentContent })
      logger.debug('saveContent - Contenu à sauvegarder', { content })
      
      const updatedContent = {
        ...currentContent,
        ...content,
        lastUpdated: new Date().toISOString()
      }

      logger.debug('saveContent - Contenu final', { updatedContent })
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedContent))
      logger.info('Homepage content saved successfully')
      
      // Déclencher un événement personnalisé pour notifier les composants
      // Seulement si le contenu a vraiment changé pour éviter les boucles infinies
      if (typeof window !== 'undefined') {
        const hasChanged = JSON.stringify(currentContent) !== JSON.stringify(updatedContent)
        if (hasChanged) {
          window.dispatchEvent(new CustomEvent('homepageContentUpdated', { 
            detail: { updatedContent } 
          }))
        }
      }
    } catch (error) {
      logger.error('Error saving homepage content', error)
      throw new Error('Erreur lors de la sauvegarde du contenu')
    }
  }

  // Réinitialiser le contenu par défaut
  static resetToDefault(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.DEFAULT_CONTENT))
      logger.info('Homepage content reset to default')
    } catch (error) {
      logger.error('Error resetting homepage content', error)
      throw new Error('Erreur lors de la réinitialisation du contenu')
    }
  }

  // Exporter le contenu
  static exportContent(): string {
    const content = this.getContent()
    return JSON.stringify(content, null, 2)
  }

  // Importer le contenu
  static importContent(jsonContent: string): void {
    try {
      const parsed = JSON.parse(jsonContent)
      this.saveContent(parsed)
      logger.info('Homepage content imported successfully')
    } catch (error) {
      logger.error('Error importing homepage content', error)
      throw new Error('Erreur lors de l\'import du contenu')
    }
  }

  // Valider le contenu
  static validateContent(content: Partial<HomepageContent>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Valider le hero
    if (content.hero) {
      if (!content.hero.title || content.hero.title.trim().length === 0) {
        errors.push('Le titre principal est requis')
      }
      if (!content.hero.subtitle || content.hero.subtitle.trim().length === 0) {
        errors.push('Le sous-titre est requis')
      }
      if (!content.hero.description || content.hero.description.trim().length === 0) {
        errors.push('La description est requise')
      }
      if (content.hero.primaryButton && (!content.hero.primaryButton.text || content.hero.primaryButton.text.trim().length === 0)) {
        errors.push('Le texte du bouton principal est requis')
      }
      if (content.hero.secondaryButton && (!content.hero.secondaryButton.text || content.hero.secondaryButton.text.trim().length === 0)) {
        errors.push('Le texte du bouton secondaire est requis')
      }
    }

    // Valider les fonctionnalités
    if (content.features) {
      if (content.features.streaming && (!content.features.streaming.title || content.features.streaming.title.trim().length === 0)) {
        errors.push('Le titre de la fonctionnalité "Streaming HD" est requis')
      }
      if (content.features.premium && (!content.features.premium.title || content.features.premium.title.trim().length === 0)) {
        errors.push('Le titre de la fonctionnalité "Contenu Premium" est requis')
      }
      if (content.features.noCommitment && (!content.features.noCommitment.title || content.features.noCommitment.title.trim().length === 0)) {
        errors.push('Le titre de la fonctionnalité "Sans Engagement" est requis')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Obtenir les statistiques du contenu
  static getContentStats(): {
    totalCharacters: number
    lastUpdated: string
    hasCustomContent: boolean
  } {
    const content = this.getContent()
    const contentString = JSON.stringify(content)
    
    return {
      totalCharacters: contentString.length,
      lastUpdated: content.lastUpdated,
      hasCustomContent: localStorage.getItem(this.STORAGE_KEY) !== null
    }
  }

  // Déplacer une section vers le haut
  static moveSectionUp(sectionId: string): string[] {
    const content = this.getContent()
    const currentOrder = content.sectionsOrder || ['hero', 'features', 'newReleases', 'popularMovies', 'popularSeries']
    const currentIndex = currentOrder.indexOf(sectionId)
    
    if (currentIndex > 0) {
      const newOrder = [...currentOrder]
      newOrder[currentIndex] = newOrder[currentIndex - 1]
      newOrder[currentIndex - 1] = sectionId
      
      this.saveContent({ sectionsOrder: newOrder })
      logger.debug(`Section déplacée vers le haut: ${sectionId}`, { newOrder })
      return newOrder
    }
    return currentOrder
  }

  // Déplacer une section vers le bas
  static moveSectionDown(sectionId: string): string[] {
    const content = this.getContent()
    const currentOrder = content.sectionsOrder || ['hero', 'features', 'newReleases', 'popularMovies', 'popularSeries']
    const currentIndex = currentOrder.indexOf(sectionId)
    
    if (currentIndex < currentOrder.length - 1) {
      const newOrder = [...currentOrder]
      newOrder[currentIndex] = newOrder[currentIndex + 1]
      newOrder[currentIndex + 1] = sectionId
      
      this.saveContent({ sectionsOrder: newOrder })
      logger.debug(`Section déplacée vers le bas: ${sectionId}`, { newOrder })
      return newOrder
    }
    return currentOrder
  }

  // Obtenir l'ordre des sections
  static getSectionsOrder(): string[] {
    const content = this.getContent()
    const order = content.sectionsOrder || ['hero', 'features', 'newReleases', 'media']
    logger.debug('getSectionsOrder', {
      contentSectionsOrder: content.sectionsOrder,
      returnedOrder: order
    })
    return order
  }

  // Réinitialiser l'ordre des sections
  static resetSectionsOrder(): void {
    this.saveContent({ sectionsOrder: ['hero', 'features', 'newReleases', 'media'] })
    logger.info('Ordre des sections réinitialisé')
  }

  // Basculer la visibilité d'une section
  static toggleSectionVisibility(sectionId: string): HomepageContent['sectionsVisibility'] {
    const content = this.getContent()
    const currentVisibilityAny = (content.sectionsVisibility || {
      homepageSlider: true,
      hero: true,
      features: true,
      newReleases: true,
      spotlightSlider: true,
      posterSpotlight: true,
      featuredPoster: true,
      featuredSlider: true,
      media: true,
      faq: true,
      footer: true
    }) as any
    const currentVisibility: HomepageContent['sectionsVisibility'] = {
      homepageSlider: currentVisibilityAny.homepageSlider ?? true,
      hero: currentVisibilityAny.hero ?? true,
      features: currentVisibilityAny.features ?? true,
      newReleases: currentVisibilityAny.newReleases ?? true,
      spotlightSlider: currentVisibilityAny.spotlightSlider ?? true,
      posterSpotlight: currentVisibilityAny.posterSpotlight ?? true,
      featuredPoster: currentVisibilityAny.featuredPoster ?? true,
      featuredSlider: currentVisibilityAny.featuredSlider ?? true,
      media: currentVisibilityAny.media ?? true,
      faq: currentVisibilityAny.faq ?? true,
      footer: currentVisibilityAny.footer ?? true
    }
    
    logger.debug('Service - Toggle pour', { sectionId })
    logger.debug('Service - Visibilité actuelle', { currentVisibility })
    
    const newVisibility: HomepageContent['sectionsVisibility'] = {
      ...currentVisibility,
      [sectionId]: !currentVisibility[sectionId as keyof typeof currentVisibility]
    }
    
    logger.debug('Service - Nouvelle visibilité avant vérification', { newVisibility })
    
    // Vérifier si toutes les sections sont masquées
    const visibleSections = Object.values(newVisibility).filter(Boolean).length
    logger.debug('Service - Sections visibles après toggle', { visibleSections })
    
    if (visibleSections === 0) {
      logger.warn('Toutes les sections sont masquées - page d\'accueil vide')
      // Remettre la section à visible pour éviter une page vide
      newVisibility[sectionId as keyof typeof newVisibility] = true
      logger.info(`Section remise visible pour éviter une page vide: ${sectionId}`)
    }
    
    this.saveContent({ sectionsVisibility: newVisibility as any })
    logger.debug('Service - Visibilité de la section modifiée', { 
      sectionId, 
      visibility: newVisibility[sectionId as keyof typeof newVisibility] 
    })
    logger.debug('Service - État final', { newVisibility })
    return newVisibility
  }

  // Obtenir la visibilité des sections
  static getSectionsVisibility(): {
    hero: boolean
    features: boolean
    newReleases: boolean
    popularMovies: boolean
    popularSeries: boolean
    media: boolean
    faq: boolean
  } {
    const content = this.getContent()
    const sectionsVisibilityAny = (content.sectionsVisibility || {
      homepageSlider: true,
      hero: true,
      features: true,
      newReleases: true,
      spotlightSlider: true,
      posterSpotlight: true,
      featuredPoster: true,
      featuredSlider: true,
      media: true,
      faq: true,
      footer: true
    }) as any
    return {
      hero: sectionsVisibilityAny.hero ?? true,
      features: sectionsVisibilityAny.features ?? true,
      newReleases: sectionsVisibilityAny.newReleases ?? true,
      popularMovies: sectionsVisibilityAny.popularMovies ?? true,
      popularSeries: sectionsVisibilityAny.popularSeries ?? true,
      media: sectionsVisibilityAny.media ?? true,
      faq: sectionsVisibilityAny.faq ?? true
    }
  }

  // Réinitialiser la visibilité des sections
  static resetSectionsVisibility(): void {
    this.saveContent({
          sectionsVisibility: {
            homepageSlider: true,
            hero: true,
            features: true,
            newReleases: true,
            spotlightSlider: true,
            posterSpotlight: true,
            featuredPoster: true,
            featuredSlider: true,
            media: true,
            faq: true,
            footer: true
          }
    })
    logger.info('Visibilité des sections réinitialisée')
  }

  // Forcer la migration des données existantes
  static forceMigration(): void {
    if (typeof window === 'undefined') return
    
    try {
      const currentContent = this.getContent()
      logger.debug('Contenu actuel avant migration', { currentContent })
      
      // Migration intelligente qui préserve les données existantes
      const migratedContent = {
        ...this.DEFAULT_CONTENT,
        ...currentContent,
        // Forcer l'ordre correct
        sectionsOrder: ['hero', 'features', 'newReleases', 'spotlightSlider', 'posterSpotlight', 'featuredPoster', 'featuredSlider', 'media', 'footer'],
        // Forcer la visibilité correcte avec les bons noms de propriétés
        sectionsVisibility: {
          hero: currentContent.sectionsVisibility?.hero ?? true,
          features: currentContent.sectionsVisibility?.features ?? true,
          newReleases: currentContent.sectionsVisibility?.newReleases ?? true,
          popularMovies: (currentContent.sectionsVisibility as any)?.popularMovies ?? true,
          popularSeries: (currentContent.sectionsVisibility as any)?.popularSeries ?? true,
          media: currentContent.sectionsVisibility?.media ?? true
        },
        // Migration des liens sociaux
        appIdentity: {
          ...this.DEFAULT_CONTENT.appIdentity,
          ...currentContent.appIdentity,
          socialLinks: {
            ...this.DEFAULT_CONTENT.appIdentity.socialLinks,
            ...currentContent.appIdentity?.socialLinks
          }
        },
        // Migration de la section Media
        media: {
          ...this.DEFAULT_CONTENT.media,
          ...currentContent.media,
          // Migration de l'ancienne propriété isVisible
          isVisibleHomepage: currentContent.media?.isVisibleHomepage ?? true,
          isVisibleDashboard: currentContent.media?.isVisibleDashboard ?? true
        },
        lastUpdated: new Date().toISOString()
      }
      
      logger.debug('Contenu migré', { migratedContent })
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedContent))
      logger.info('Migration des sections terminée (données corrigées)')
    } catch (error) {
      logger.error('Erreur lors de la migration', error)
    }
  }

  // Nettoyer complètement le localStorage et repartir à zéro
  static resetAllData(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      logger.warn('Toutes les données de la page d\'accueil ont été supprimées')
      logger.info('Rechargez la page pour voir les valeurs par défaut')
    } catch (error) {
      logger.error('Erreur lors de la suppression', error)
    }
  }

  // Gestion des liens sociaux
  static updateSocialLink(platform: keyof HomepageContent['appIdentity']['socialLinks'], updates: Partial<HomepageContent['appIdentity']['socialLinks'][typeof platform]>): void {
    logger.debug('updateSocialLink - Platform', { platform })
    logger.debug('updateSocialLink - Updates', { updates })
    
    const content = this.getContent()
    logger.debug('updateSocialLink - Content avant', { socialLinks: content.appIdentity.socialLinks })
    
    const updatedSocialLinks = {
      ...content.appIdentity.socialLinks,
      [platform]: {
        ...content.appIdentity.socialLinks[platform],
        ...updates
      }
    }
    
    logger.debug('updateSocialLink - SocialLinks après', { updatedSocialLinks })
    
    this.saveContent({
      appIdentity: {
        ...content.appIdentity,
        socialLinks: updatedSocialLinks
      }
    })
    
    logger.info(`Lien social ${platform} mis à jour`, { updates })
  }

  static toggleSocialLinkVisibility(platform: keyof HomepageContent['appIdentity']['socialLinks']): boolean {
    const content = this.getContent()
    const currentVisibility = content.appIdentity.socialLinks[platform].isVisible
    const newVisibility = !currentVisibility
    
    this.updateSocialLink(platform, { isVisible: newVisibility })
    
    logger.info(`Visibilité du lien ${platform} basculée: ${newVisibility}`)
    return newVisibility
  }

  static getVisibleSocialLinks(): Array<{
    platform: keyof HomepageContent['appIdentity']['socialLinks']
    data: HomepageContent['appIdentity']['socialLinks'][keyof HomepageContent['appIdentity']['socialLinks']]
  }> {
    const content = this.getContent()
    const visibleLinks: Array<{
      platform: keyof HomepageContent['appIdentity']['socialLinks']
      data: HomepageContent['appIdentity']['socialLinks'][keyof HomepageContent['appIdentity']['socialLinks']]
    }> = []

    Object.entries(content.appIdentity.socialLinks).forEach(([platform, data]) => {
      if (data.isVisible) {
        visibleLinks.push({
          platform: platform as keyof HomepageContent['appIdentity']['socialLinks'],
          data
        })
      }
    })

    return visibleLinks
  }

  // Méthode de test pour forcer la migration des liens sociaux
  static forceSocialLinksMigration(): void {
    if (typeof window === 'undefined') return
    
    try {
      const currentContent = this.getContent()
      logger.debug('forceSocialLinksMigration - Contenu actuel', { currentContent })
      
      // Forcer la migration des liens sociaux
      const migratedContent = {
        ...currentContent,
        appIdentity: {
          ...currentContent.appIdentity,
          socialLinks: {
            ...this.DEFAULT_CONTENT.appIdentity.socialLinks,
            ...currentContent.appIdentity.socialLinks
          }
        },
        lastUpdated: new Date().toISOString()
      }
      
      logger.debug('forceSocialLinksMigration - Contenu migré', { migratedContent })
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(migratedContent))
      logger.info('Migration des liens sociaux forcée avec succès')
    } catch (error) {
      logger.error('Erreur lors de la migration forcée des liens sociaux', error)
    }
  }

  // Mettre à jour les URLs des réseaux sociaux quand le nom de l'application change
  static updateSocialLinksForAppName(appName: string): void {
    if (typeof window === 'undefined') return

    try {
      const currentContent = this.getContent()
      const newSocialLinks = this.generateDefaultSocialLinks(appName)
      
      // Garder les paramètres de visibilité existants
      const updatedSocialLinks = {
        telegram: {
          ...newSocialLinks.telegram,
          isVisible: currentContent.appIdentity.socialLinks.telegram.isVisible
        },
        discord: {
          ...newSocialLinks.discord,
          isVisible: currentContent.appIdentity.socialLinks.discord.isVisible
        },
        twitter: {
          ...newSocialLinks.twitter,
          isVisible: currentContent.appIdentity.socialLinks.twitter.isVisible
        },
        instagram: {
          ...newSocialLinks.instagram,
          isVisible: currentContent.appIdentity.socialLinks.instagram.isVisible
        },
        youtube: {
          ...newSocialLinks.youtube,
          isVisible: currentContent.appIdentity.socialLinks.youtube.isVisible
        }
      }

      const updatedContent = {
        ...currentContent,
        appIdentity: {
          ...currentContent.appIdentity,
          socialLinks: updatedSocialLinks
        },
        lastUpdated: new Date().toISOString()
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedContent))
      
      // Déclencher un événement personnalisé pour notifier les composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('homepageContentUpdated', { 
          detail: { appName, updatedContent } 
        }))
      }
      
      logger.info(`URLs des réseaux sociaux mises à jour pour: ${appName}`)
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des URLs des réseaux sociaux', error)
    }
  }
}
