export interface ErrorLog {
  id: string
  timestamp: Date
  userId?: string
  userEmail?: string
  error: string
  stack?: string
  url: string
  userAgent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'javascript' | 'network' | 'authentication' | 'video' | 'admin' | 'other'
  context?: any
  resolved?: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface ErrorStats {
  total: number
  bySeverity: {
    low: number
    medium: number
    high: number
    critical: number
  }
  byCategory: {
    javascript: number
    network: number
    authentication: number
    video: number
    admin: number
    other: number
  }
  byDay: Array<{
    date: string
    count: number
  }>
  unresolved: number
  recent: ErrorLog[]
}

export interface ErrorFilter {
  severity?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  resolved?: boolean
  search?: string
}
