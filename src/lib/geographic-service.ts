import { GeographicRestriction, UserLocation, Continent, CountryMapping, GeographicStats } from '@/types/geographic'
import { SecureStorage } from './secure-storage'
import { logger } from './logger'

export class GeographicService {
  private static readonly STORAGE_KEY = 'atiha_geographic_restrictions'
  private static readonly USER_LOCATION_KEY = 'atiha_user_location'

  // Mapping des codes pays vers les continents
  private static readonly COUNTRY_MAPPING: CountryMapping = {
    // Amérique du Nord
    'US': 'america', 'CA': 'america', 'MX': 'america', 'GT': 'america', 'BZ': 'america',
    'SV': 'america', 'HN': 'america', 'NI': 'america', 'CR': 'america', 'PA': 'america',
    'CU': 'america', 'JM': 'america', 'HT': 'america', 'DO': 'america', 'PR': 'america',
    
    // Amérique du Sud
    'BR': 'america', 'AR': 'america', 'CL': 'america', 'CO': 'america', 'PE': 'america',
    'VE': 'america', 'EC': 'america', 'BO': 'america', 'PY': 'america', 'UY': 'america',
    'GY': 'america', 'SR': 'america', 'GF': 'america', 'FK': 'america',
    
    // Europe
    'FR': 'europe', 'DE': 'europe', 'IT': 'europe', 'ES': 'europe', 'GB': 'europe',
    'NL': 'europe', 'BE': 'europe', 'CH': 'europe', 'AT': 'europe', 'SE': 'europe',
    'NO': 'europe', 'DK': 'europe', 'FI': 'europe', 'PL': 'europe', 'CZ': 'europe',
    'HU': 'europe', 'RO': 'europe', 'BG': 'europe', 'GR': 'europe', 'PT': 'europe',
    'IE': 'europe', 'IS': 'europe', 'LU': 'europe', 'MT': 'europe', 'CY': 'europe',
    'EE': 'europe', 'LV': 'europe', 'LT': 'europe', 'SK': 'europe', 'SI': 'europe',
    'HR': 'europe', 'BA': 'europe', 'RS': 'europe', 'ME': 'europe', 'MK': 'europe',
    'AL': 'europe', 'XK': 'europe', 'MD': 'europe', 'UA': 'europe', 'BY': 'europe',
    'RU': 'europe', 'TR': 'europe',
    
    // Asie
    'CN': 'asia', 'JP': 'asia', 'KR': 'asia', 'IN': 'asia', 'TH': 'asia',
    'VN': 'asia', 'ID': 'asia', 'MY': 'asia', 'SG': 'asia', 'PH': 'asia',
    'TW': 'asia', 'HK': 'asia', 'MO': 'asia', 'MN': 'asia', 'KZ': 'asia',
    'UZ': 'asia', 'KG': 'asia', 'TJ': 'asia', 'TM': 'asia', 'AF': 'asia',
    'PK': 'asia', 'BD': 'asia', 'LK': 'asia', 'MV': 'asia', 'BT': 'asia',
    'NP': 'asia', 'MM': 'asia', 'LA': 'asia', 'KH': 'asia', 'BN': 'asia',
    'TL': 'asia', 'IR': 'asia', 'IQ': 'asia', 'SY': 'asia', 'LB': 'asia',
    'JO': 'asia', 'IL': 'asia', 'PS': 'asia', 'SA': 'asia', 'AE': 'asia',
    'QA': 'asia', 'BH': 'asia', 'KW': 'asia', 'OM': 'asia', 'YE': 'asia',
    
    // Océanie
    'AU': 'oceania', 'NZ': 'oceania', 'FJ': 'oceania', 'PG': 'oceania', 'SB': 'oceania',
    'VU': 'oceania', 'NC': 'oceania', 'PF': 'oceania', 'WS': 'oceania', 'TO': 'oceania',
    'KI': 'oceania', 'TV': 'oceania', 'NR': 'oceania', 'PW': 'oceania', 'FM': 'oceania',
    'MH': 'oceania', 'CK': 'oceania', 'NU': 'oceania', 'TK': 'oceania', 'AS': 'oceania',
    'GU': 'oceania', 'MP': 'oceania', 'VI': 'oceania',
    
    // Afrique
    'ZA': 'africa', 'NG': 'africa', 'EG': 'africa', 'KE': 'africa', 'ET': 'africa',
    'GH': 'africa', 'DZ': 'africa', 'MA': 'africa', 'TN': 'africa', 'LY': 'africa',
    'SD': 'africa', 'SS': 'africa', 'UG': 'africa', 'TZ': 'africa', 'ZM': 'africa',
    'ZW': 'africa', 'BW': 'africa', 'NA': 'africa', 'SZ': 'africa', 'LS': 'africa',
    'MW': 'africa', 'MZ': 'africa', 'MG': 'africa', 'MU': 'africa', 'SC': 'africa',
    'KM': 'africa', 'DJ': 'africa', 'SO': 'africa', 'ER': 'africa', 'TD': 'africa',
    'CF': 'africa', 'CM': 'africa', 'GQ': 'africa', 'GA': 'africa', 'CG': 'africa',
    'CD': 'africa', 'AO': 'africa', 'ST': 'africa', 'CV': 'africa', 'GM': 'africa',
    'GN': 'africa', 'GW': 'africa', 'SL': 'africa', 'LR': 'africa', 'CI': 'africa',
    'BF': 'africa', 'ML': 'africa', 'NE': 'africa', 'SN': 'africa', 'MR': 'africa',
    'BI': 'africa', 'RW': 'africa'
  }

  // Récupère la localisation mise en cache
  private static getCachedUserLocation(): UserLocation | null {
    if (typeof window === 'undefined') return null
    
    try {
      return SecureStorage.getItemJSON<UserLocation>(this.USER_LOCATION_KEY)
    } catch (error) {
      logger.error('Erreur lors de la récupération de la localisation en cache', error as Error)
      return null
    }
  }

  // Vérifie si la localisation en cache est encore valide
  private static isLocationCacheValid(location: UserLocation): boolean {
    if (!location.cachedAt) return false
    
    const cacheAge = Date.now() - new Date(location.cachedAt).getTime()
    const maxCacheAge = 24 * 60 * 60 * 1000 // 24 heures
    
    return cacheAge < maxCacheAge
  }

  // Met en cache la localisation de l'utilisateur
  private static cacheUserLocation(location: UserLocation): void {
    if (typeof window === 'undefined') return
    
    try {
      const locationWithCache = {
        ...location,
        cachedAt: new Date().toISOString()
      }
      SecureStorage.setItem(this.USER_LOCATION_KEY, locationWithCache)
    } catch (error) {
      logger.error('Erreur lors de la mise en cache de la localisation', error as Error)
    }
  }

  // Détecte la localisation de l&apos;utilisateur
  static async detectUserLocation(): Promise<UserLocation> {
    try {
      // Vérifier d&apos;abord le cache local
      const cachedLocation = this.getCachedUserLocation()
      if (cachedLocation && this.isLocationCacheValid(cachedLocation)) {
        return cachedLocation
      }

      // Utiliser une API gratuite pour détecter la localisation
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const userLocation: UserLocation = {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        continent: this.mapCountryToContinent(data.country_code),
        ip: data.ip || 'unknown',
        isBlocked: false,
        region: data.region || undefined,
        city: data.city || undefined
      }

      // Mettre en cache la localisation
      this.cacheUserLocation(userLocation)
      
      return userLocation
    } catch (error) {
      logger.error('Erreur de détection géographique', error as Error)
      
      // Fallback en cas d&apos;erreur
      const fallbackLocation: UserLocation = {
        country: 'Unknown',
        countryCode: 'XX',
        continent: 'america',
        ip: 'unknown',
        isBlocked: false
      }
      
      return fallbackLocation
    }
  }

  // Vérifie si l'utilisateur est autorisé selon les restrictions
  static async isUserAllowed(): Promise<boolean> {
    try {
      const userLocation = await this.detectUserLocation()
      const restrictions = await this.getActiveRestrictions()
      
      if (restrictions.length === 0) {
        return true // Aucune restriction active
      }

      // Vérifier si le continent de l'utilisateur est autorisé
      const isAllowed = restrictions.some(restriction => 
        restriction.continents.includes(userLocation.continent)
      )

      return isAllowed
    } catch (error) {
      logger.error('Erreur de vérification d\'accès', error as Error)
      return true // Autoriser par défaut en cas d&apos;erreur
    }
  }

  // Mappe les codes pays aux continents
  private static mapCountryToContinent(countryCode: string): Continent {
    return this.COUNTRY_MAPPING[countryCode?.toUpperCase()] || 'america'
  }

  // Gestion des restrictions
  static async getActiveRestrictions(): Promise<GeographicRestriction[]> {
    try {
      const restrictions = await this.getAllRestrictions()
      if (!restrictions || restrictions.length === 0) {
        // Aucune restriction stockée, retourner un tableau vide
        return []
      }

      return restrictions.filter(r => r.isActive)
    } catch (error) {
      console.error('Erreur de récupération des restrictions:', error)
      return []
    }
  }

  static async saveRestrictions(restrictions: GeographicRestriction[]): Promise<void> {
    try {
      const restrictionsWithTimestamp = restrictions.map(r => ({
        ...r,
        updatedAt: new Date()
      }))
      
      SecureStorage.setItem(this.STORAGE_KEY, restrictionsWithTimestamp)
    } catch (error) {
      console.error('Erreur de sauvegarde des restrictions:', error)
      throw error
    }
  }

  static async createRestriction(name: string, continents: Continent[]): Promise<GeographicRestriction> {
    const newRestriction: GeographicRestriction = {
      id: `restriction_${Date.now()}`,
      name,
      continents,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const existingRestrictions = await this.getAllRestrictions()
    const updatedRestrictions = [...existingRestrictions, newRestriction]
    
    await this.saveRestrictions(updatedRestrictions)
    return newRestriction
  }

  static async getAllRestrictions(): Promise<GeographicRestriction[]> {
    try {
      const restrictions = SecureStorage.getItemJSON<any[]>(this.STORAGE_KEY)
      if (!restrictions) return []
      
      // Convertir les dates string en objets Date
      return restrictions.map(r => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date()
      }))
    } catch (error) {
      console.error('Erreur de récupération de toutes les restrictions:', error)
      return []
    }
  }

  static async deleteRestriction(id: string): Promise<void> {
    const restrictions = await this.getAllRestrictions()
    const filteredRestrictions = restrictions.filter(r => r.id !== id)
    await this.saveRestrictions(filteredRestrictions)
  }

  // Statistiques géographiques
  static async getGeographicStats(): Promise<GeographicStats> {
    try {
      const userLocation = await this.detectUserLocation()
      const restrictions = await this.getActiveRestrictions()
      const isAllowed = await this.isUserAllowed()

      // Simulation de statistiques (dans une vraie app, ceci viendrait d'une base de données)
      const stats: GeographicStats = {
        totalUsers: 1,
        blockedUsers: isAllowed ? 0 : 1,
        allowedUsers: isAllowed ? 1 : 0,
      usersByContinent: {
        america: userLocation.continent === 'america' ? 1 : 0,
        europe: userLocation.continent === 'europe' ? 1 : 0,
        asia: userLocation.continent === 'asia' ? 1 : 0,
        oceania: userLocation.continent === 'oceania' ? 1 : 0,
        africa: userLocation.continent === 'africa' ? 1 : 0
      },
      lastUpdated: new Date()
    }

    return stats
    } catch (error) {
      console.error('Erreur de récupération des statistiques:', error)
      return {
        totalUsers: 0,
        blockedUsers: 0,
        allowedUsers: 0,
        usersByContinent: {
          america: 0,
          europe: 0,
          asia: 0,
          oceania: 0,
          africa: 0
        },
        lastUpdated: new Date()
      }
    }
  }

  // Utilitaires
  static getContinentDisplayName(continent: Continent): string {
    const names: Record<Continent, string> = {
      america: 'Amérique (Nord & Sud)',
      europe: 'Europe',
      asia: 'Asie',
      oceania: 'Océanie',
      africa: 'Afrique'
    }
    return names[continent]
  }

  static getContinentFlag(continent: Continent): string {
    const flags: Record<Continent, string> = {
      america: '🌎',
      europe: '🇪🇺',
      asia: '🌏',
      oceania: '🌊',
      africa: '🌍'
    }
    return flags[continent]
  }
}
