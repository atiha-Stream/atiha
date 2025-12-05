export type Continent = 'america' | 'europe' | 'asia' | 'oceania' | 'africa'

export interface GeographicRestriction {
  id: string
  name: string
  continents: Continent[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserLocation {
  country: string
  countryCode: string
  continent: Continent
  ip: string
  isBlocked: boolean
  region?: string
  city?: string
  cachedAt?: string
}

export interface GeographicStats {
  totalUsers: number
  blockedUsers: number
  allowedUsers: number
  usersByContinent: Record<Continent, number>
  lastUpdated: Date
}

export interface CountryMapping {
  [countryCode: string]: Continent
}
