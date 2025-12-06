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
    isVisible?: boolean
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
    isVisible?: boolean
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
  media: {
    title: string
    subtitle: string
    trailerUrl: string
    watchNowText: string
    contentUrl: string
    videoUrl?: string
    autoAudio?: boolean
    isVisibleHomepage: boolean
    isVisibleDashboard: boolean
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
    quickLinksTitle?: string
    availableOnTitle?: string
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
    }[]
  }
  lastUpdated: string
}
