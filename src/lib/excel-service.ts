import ExcelJS from 'exceljs'
import { userDatabase } from './user-database'
import { logger } from './logger'
export interface ExcelExportOptions {
  includeBanned?: boolean
  includeInactive?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ExcelImportResult {
  success: number
  errors: string[]
  totalRows: number
}

class ExcelService {
  // Exporter les utilisateurs vers Excel
  public async exportUsersToExcel(options: ExcelExportOptions = {}): Promise<Blob> {
    let users = userDatabase.getAllUsers()

    // Filtrer selon les options
    if (!options.includeBanned) {
      users = users.filter(user => !user.isBanned)
    }

    if (!options.includeInactive) {
      users = users.filter(user => user.isActive)
    }

    // Filtrer par date si spécifié
    if (options.dateRange) {
      users = users.filter(user => {
        const regDate = new Date(user.registrationDate)
        return regDate >= options.dateRange!.start && regDate <= options.dateRange!.end
      })
    }

    // Créer le workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Utilisateurs')

    // Définir les colonnes avec une meilleure organisation
    worksheet.columns = [
      { header: 'ID Utilisateur', key: 'id', width: 25 },
      { header: 'Nom Complet', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Téléphone', key: 'phone', width: 20 },
      { header: 'Pays', key: 'country', width: 12 },
      { header: 'Statut', key: 'status', width: 12 },
      { header: 'Banni', key: 'banned', width: 10 },
      { header: 'Raison du bannissement', key: 'bannedReason', width: 30 },
      { header: 'Date d\'inscription', key: 'registrationDate', width: 18 },
      { header: 'Dernière connexion', key: 'lastLogin', width: 18 },
      { header: 'Nombre de connexions', key: 'loginCount', width: 18 },
      { header: 'Mot de passe', key: 'password', width: 20 },
      { header: 'Avatar', key: 'avatar', width: 25 }
    ]

    // Ajouter les données
    users.forEach(user => {
      worksheet.addRow({
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
        country: user.country,
        status: user.isActive ? 'Actif' : 'Inactif',
        banned: user.isBanned ? 'Oui' : 'Non',
        bannedReason: user.bannedReason || '',
        registrationDate: new Date(user.registrationDate).toLocaleDateString('fr-FR'),
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais',
        loginCount: user.loginCount,
        avatar: user.avatar || ''
      })
    })

    // Générer le fichier Excel
    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Exporter les statistiques vers Excel
  public async exportStatsToExcel(): Promise<Blob> {
    const stats = userDatabase.getStats()
    const users = userDatabase.getAllUsers()

    // Créer le workbook
    const workbook = new ExcelJS.Workbook()

    // Feuille des statistiques
    const statsWorksheet = workbook.addWorksheet('Statistiques')
    statsWorksheet.columns = [
      { header: 'Métrique', key: 'metric', width: 35 },
      { header: 'Valeur', key: 'value', width: 15 }
    ]

    const statsData = [
      { metric: 'Total utilisateurs', value: stats.totalUsers },
      { metric: 'Utilisateurs actifs', value: stats.activeUsers },
      { metric: 'Utilisateurs bannis', value: stats.bannedUsers },
      { metric: 'Utilisateurs désactivés', value: stats.inactiveUsers },
      { metric: 'Utilisateurs non bannis', value: stats.unbannedUsers },
      { metric: 'Nouveaux utilisateurs (aujourd\'hui)', value: stats.newUsersToday },
      { metric: 'Nouveaux utilisateurs (cette semaine)', value: stats.newUsersThisWeek },
      { metric: 'Nouveaux utilisateurs (ce mois)', value: stats.newUsersThisMonth }
    ]

    statsData.forEach(data => statsWorksheet.addRow(data))

    // Feuille des utilisateurs récents
    const usersWorksheet = workbook.addWorksheet('Utilisateurs Récents')
    usersWorksheet.columns = [
      { header: 'Nom', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Date d\'inscription', key: 'registrationDate', width: 15 },
      { header: 'Statut', key: 'status', width: 10 },
      { header: 'Banni', key: 'banned', width: 8 }
    ]

    const recentUsers = users
      .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
      .slice(0, 10)

    recentUsers.forEach(user => {
      usersWorksheet.addRow({
        name: user.name,
        email: user.email,
        registrationDate: new Date(user.registrationDate).toLocaleDateString('fr-FR'),
        status: user.isActive ? 'Actif' : 'Inactif',
        banned: user.isBanned ? 'Oui' : 'Non'
      })
    })

    // Générer le fichier Excel
    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Importer des utilisateurs depuis Excel
  public async importUsersFromExcel(file: File): Promise<ExcelImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          logger.debug('📁 Lecture du fichier Excel', { fileName: file.name })
          const data = e.target?.result as ArrayBuffer
          const workbook = new ExcelJS.Workbook()
          await workbook.xlsx.load(data)
          
          // Prendre la première feuille
          const worksheet = workbook.worksheets[0]
          logger.debug('📊 Feuille trouvée', { name: worksheet.name })
          
          // Récupérer les en-têtes
          const headerRow = worksheet.getRow(1)
          const headers: string[] = []
          headerRow.eachCell((cell, colNumber) => {
            const headerValue = cell.value as string
            headers[colNumber] = headerValue
            logger.debug(`En-tête colonne ${colNumber}`, { headerValue })
          })
          
          // Convertir en JSON
          const jsonData: any[] = []
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // Skip header
            
            const rowData: any = {}
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber]
              if (header) {
                rowData[header] = cell.value
              }
            })
            
            // Ne pas ajouter les lignes vides
            if (Object.keys(rowData).length > 0) {
              jsonData.push(rowData)
            }
          })
          
          logger.debug('Données extraites', { count: jsonData.length, example: jsonData[0] })
          
          // Importer les données
          const result = await userDatabase.importFromExcel(jsonData)
          
          resolve({
            success: result.success,
            errors: result.errors,
            totalRows: jsonData.length
          })
          
        } catch (error) {
          console.error('❌ Erreur lecture Excel:', error)
          reject(new Error('Erreur lors de la lecture du fichier Excel: ' + (error instanceof Error ? error.message : 'Erreur inconnue')))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  // Télécharger un fichier Excel
  public downloadExcel(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Créer un template Excel pour l'import
  public async createImportTemplate(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Template Import Utilisateurs')

    // Définir les colonnes avec plus de détails
    worksheet.columns = [
      { header: 'Email *', key: 'email', width: 30 },
      { header: 'Nom *', key: 'name', width: 25 },
      { header: 'Mot de passe', key: 'password', width: 20 },
      { header: 'Téléphone', key: 'phone', width: 20 },
      { header: 'Pays', key: 'country', width: 10 },
      { header: 'Statut (Actif/Inactif)', key: 'status', width: 15 },
      { header: 'Banni (Oui/Non)', key: 'banned', width: 12 },
      { header: 'Raison du bannissement', key: 'bannedReason', width: 25 }
    ]

    // Ajouter des exemples plus réalistes (avec placeholders pour les mots de passe)
    worksheet.addRow({
      email: 'jean.dupont@email.com',
      name: 'Jean Dupont',
      password: '[CHANGER_CE_MOT_DE_PASSE]',
      phone: '+33123456789',
      country: 'FR',
      status: 'Actif',
      banned: 'Non',
      bannedReason: ''
    })

    worksheet.addRow({
      email: 'marie.martin@email.com',
      name: 'Marie Martin',
      password: '[CHANGER_CE_MOT_DE_PASSE]',
      phone: '+33123456790',
      country: 'FR',
      status: 'Actif',
      banned: 'Non',
      bannedReason: ''
    })

    worksheet.addRow({
      email: 'ahmed.hassan@email.com',
      name: 'Ahmed Hassan',
      password: '[CHANGER_CE_MOT_DE_PASSE]',
      phone: '+212123456789',
      country: 'MA',
      status: 'Inactif',
      banned: 'Non',
      bannedReason: ''
    })

    // Ajouter des instructions
    const instructionRow = worksheet.addRow([])
    worksheet.addRow(['Instructions:'])
    worksheet.addRow(['- Les champs marqués avec * sont obligatoires'])
    worksheet.addRow(['- Email: doit être unique et valide'])
    worksheet.addRow(['- Mot de passe: si vide, sera "motdepasse123" par défaut'])
    worksheet.addRow(['- Statut: "Actif" ou "Inactif"'])
    worksheet.addRow(['- Banni: "Oui" ou "Non"'])
    worksheet.addRow(['- Pays: code ISO à 2 lettres (ex: FR, MA, US)'])

    // Générer le fichier Excel
    const buffer = await workbook.xlsx.writeBuffer()
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Obtenir les données pour les graphiques SVG
  public getDataForCharts(): {
    registrationByMonth: { month: string; count: number }[]
    userStatus: { status: string; count: number }[]
    topCountries: { country: string; count: number }[]
  } {
    const users = userDatabase.getAllUsers()
    const now = new Date()
    
    // Inscriptions par mois (6 derniers mois)
    const registrationByMonth: { month: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      const count = users.filter(user => {
        const userDate = new Date(user.registrationDate)
        return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear()
      }).length
      
      registrationByMonth.push({ month: monthName, count })
    }

    // Statut des utilisateurs
    const userStatus = [
      { status: 'Actifs', count: users.filter(u => u.isActive && !u.isBanned).length },
      { status: 'Inactifs', count: users.filter(u => !u.isActive).length },
      { status: 'Désactivés', count: users.filter(u => !u.isActive && !u.isBanned).length },
      { status: 'Non bannis', count: users.filter(u => !u.isBanned).length },
      { status: 'Bannis', count: users.filter(u => u.isBanned).length }
    ]

    // Top pays
    const countryCount: { [key: string]: number } = {}
    users.forEach(user => {
      if (user.country) {
        countryCount[user.country] = (countryCount[user.country] || 0) + 1
      }
    })
    
    const topCountries = Object.entries(countryCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      registrationByMonth,
      userStatus,
      topCountries
    }
  }
}

// Instance singleton
export const excelService = new ExcelService()
