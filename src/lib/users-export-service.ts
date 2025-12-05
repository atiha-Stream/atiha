import { userDatabase, UserRecord } from './user-database'
import { logger } from './logger'

export interface UserExportData {
  utilisateur: string
  contact: string
  motdepasse: string
  statut: string
  inscription: string
  derniereconnexion: string
}

export interface UserImportResult {
  success: number
  errors: string[]
  totalRows: number
}

class UsersExportService {
  // Exporter les utilisateurs vers CSV
  public exportUsersToCSV(users: UserRecord[]): string {
    const headers = ['Utilisateur', 'Contact', 'Mot de passe', 'Statut', 'Inscription', 'Dernière connexion']
    
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        `"${user.password || ''}"`,
        `"${this.getStatusText(user)}"`,
        `"${this.formatDate(user.registrationDate)}"`,
        `"${this.formatDate(user.lastLogin)}"`
      ].join(','))
    ].join('\n')

    return csvContent
  }

  // Télécharger le fichier CSV
  public downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Importer les utilisateurs depuis CSV
  public async importUsersFromCSV(csvContent: string): Promise<UserImportResult> {
    const lines = csvContent.split('\n').filter(line => line.trim())
    const errors: string[] = []
    let success = 0

    // Ignorer la première ligne (en-têtes)
    const dataLines = lines.slice(1)

    logger.debug('📥 Import CSV - Lignes à traiter', { count: dataLines.length })

    // Utiliser for...of pour pouvoir utiliser await
    for (let index = 0; index < dataLines.length; index++) {
      const line = dataLines[index]
      try {
        const row = this.parseCSVLine(line)
        logger.debug(`📋 Ligne ${index + 1}`, { row })

        // Validation des données requises
        if (!row.utilisateur || !row.contact) {
          errors.push(`Ligne ${index + 1}: Utilisateur et Contact requis (trouvé: utilisateur="${row.utilisateur}", contact="${row.contact}")`)
          continue
        }

        // Vérifier si l'email existe déjà
        const existingUser = userDatabase.findUserByEmail(row.contact)
        if (existingUser) {
          errors.push(`Ligne ${index + 1}: Email "${row.contact}" déjà utilisé`)
          continue
        }

        // Créer l'utilisateur
        const userData = {
          email: row.contact,
          name: row.utilisateur,
          phone: '',
          country: '',
          password: row.motdepasse || 'motdepasse123',
          avatar: undefined
        }

        if (process.env.NODE_ENV === 'development') {
          logger.debug('Création utilisateur', { email: userData.email, name: userData.name })
        }
        const newUser = await userDatabase.registerUser(userData)
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Utilisateur créé avec ID', { userId: newUser.id })
        }

        // Gérer le statut si spécifié
        if (row.statut === 'Inactif' || row.statut === 'inactif') {
          userDatabase.deactivateUser(newUser.id)
          console.log(`🔴 Utilisateur ${newUser.id} désactivé`)
        }

        success++
        console.log(`✅ Ligne ${index + 1} importée avec succès`)

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error(`❌ Erreur ligne ${index + 1}:`, error)
        errors.push(`Ligne ${index + 1}: ${errorMsg}`)
      }
    }

    console.log(`📊 Import terminé: ${success} succès, ${errors.length} erreurs`)
    return { success, errors, totalRows: dataLines.length }
  }

  // Parser une ligne CSV
  private parseCSVLine(line: string): UserExportData {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    values.push(current.trim())

    return {
      utilisateur: values[0] || '',
      contact: values[1] || '',
      motdepasse: values[2] || '',
      statut: values[3] || 'Actif',
      inscription: values[4] || '',
      derniereconnexion: values[5] || ''
    }
  }

  // Obtenir le texte du statut
  private getStatusText(user: UserRecord): string {
    if (user.isBanned) return 'Banni'
    if (!user.isActive) return 'Inactif'
    return 'Actif'
  }

  // Formater une date
  private formatDate(date: string | undefined): string {
    if (!date) return 'Jamais'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  // Créer un template CSV
  public createCSVTemplate(): string {
    const headers = ['Utilisateur', 'Contact', 'Mot de passe', 'Statut', 'Inscription', 'Dernière connexion']
    const example = ['Jean Dupont', 'jean@example.com', 'motdepasse123', 'Actif', '01/01/2024', '15/01/2024']
    
    return [
      headers.join(','),
      example.map(field => `"${field}"`).join(',')
    ].join('\n')
  }
}

export const usersExportService = new UsersExportService()
