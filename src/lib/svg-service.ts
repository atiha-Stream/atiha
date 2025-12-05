import { excelService } from './excel-service'

export interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

export interface SVGChartOptions {
  width?: number
  height?: number
  title?: string
  showLegend?: boolean
  showValues?: boolean
}

class SVGService {
  private readonly DEFAULT_COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#6b7280', // gray-500
    '#84cc16'  // lime-500
  ]

  // Générer un graphique en barres
  public generateBarChart(data: ChartData, options: SVGChartOptions = {}): string {
    const {
      width = 800,
      height = 400,
      title = 'Graphique en barres',
      showLegend = true,
      showValues = true
    } = options

    const colors = data.colors || this.DEFAULT_COLORS
    const maxValue = Math.max(...data.values)
    const barWidth = (width - 100) / data.labels.length
    const chartHeight = height - 100

    let svg = `<svg width=&quot;${width}&quot; height="${height}" xmlns="http://www.w3.org/2000/svg">`
    
    // Arrière-plan
    svg += `<rect width=&quot;${width}&quot; height="${height}" fill="#1f2937" rx="8"/>`
    
    // Titre
    svg += `<text x=&quot;${width/2}&quot; y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${title}</text>`
    
    // Axes
    svg += `<line x1=&quot;50&quot; y1="${height-50}" x2="${width-50}" y2="${height-50}" stroke="#6b7280" stroke-width="2"/>`
    svg += `<line x1=&quot;50&quot; y1="50" x2="50" y2="${height-50}" stroke="#6b7280" stroke-width="2"/>`
    
    // Barres
    data.labels.forEach((label, index) => {
      const value = data.values[index]
      const barHeight = (value / maxValue) * chartHeight
      const x = 50 + (index * barWidth) + (barWidth * 0.1)
      const y = height - 50 - barHeight
      const color = colors[index % colors.length]
      
      // Barre
      svg += `<rect x=&quot;${x}&quot; y="${y}" width="${barWidth * 0.8}" height="${barHeight}" fill="${color}" rx="4"/>`
      
      // Valeur au-dessus de la barre
      if (showValues) {
        svg += `<text x=&quot;${x + barWidth * 0.4}&quot; y="${y - 5}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">${value}</text>`
      }
      
      // Label en bas
      svg += `<text x=&quot;${x + barWidth * 0.4}&quot; y="${height - 30}" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="12">${label}</text>`
    })
    
    // Légende
    if (showLegend) {
      const legendY = 60
      data.labels.forEach((label, index) => {
        const color = colors[index % colors.length]
        const legendX = 60 + (index * 120)
        
        svg += `<rect x=&quot;${legendX}&quot; y="${legendY}" width="12" height="12" fill="${color}"/>`
        svg += `<text x=&quot;${legendX + 20}&quot; y="${legendY + 9}" fill="white" font-family="Arial, sans-serif" font-size="12">${label}</text>`
      })
    }
    
    svg += '</svg>'
    return svg
  }

  // Générer un graphique circulaire (camembert)
  public generatePieChart(data: ChartData, options: SVGChartOptions = {}): string {
    const {
      width = 400,
      height = 400,
      title = 'Graphique circulaire',
      showLegend = true,
      showValues = true
    } = options

    const colors = data.colors || this.DEFAULT_COLORS
    const total = data.values.reduce((sum, value) => sum + value, 0)
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 60

    let svg = `<svg width=&quot;${width}&quot; height="${height}" xmlns="http://www.w3.org/2000/svg">`
    
    // Arrière-plan
    svg += `<rect width=&quot;${width}&quot; height="${height}" fill="#1f2937" rx="8"/>`
    
    // Titre
    svg += `<text x=&quot;${centerX}&quot; y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${title}</text>`
    
    // Calculer les angles
    let currentAngle = -90 // Commencer en haut
    data.labels.forEach((label, index) => {
      const value = data.values[index]
      const percentage = value / total
      const angle = percentage * 360
      
      if (angle > 0) {
        const color = colors[index % colors.length]
        
        // Calculer les coordonnées de l&apos;arc
        const startAngle = currentAngle
        const endAngle = currentAngle + angle
        
        const x1 = centerX + radius * Math.cos(startAngle * Math.PI / 180)
        const y1 = centerY + radius * Math.sin(startAngle * Math.PI / 180)
        const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180)
        const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180)
        
        const largeArcFlag = angle > 180 ? 1 : 0
        
        // Créer le chemin de l&apos;arc
        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
        
        svg += `<path d=&quot;${pathData}&quot; fill="${color}" stroke="#1f2937" stroke-width="2"/>`
        
        // Ajouter le pourcentage au centre si l&apos;angle est suffisant
        if (angle > 10 && showValues) {
          const labelAngle = startAngle + angle / 2
          const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle * Math.PI / 180)
          const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle * Math.PI / 180)
          
          svg += `<text x=&quot;${labelX}&quot; y="${labelY}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${Math.round(percentage * 100)}%</text>`
        }
        
        currentAngle += angle
      }
    })
    
    // Légende
    if (showLegend) {
      const legendY = height - 80
      data.labels.forEach((label, index) => {
        const color = colors[index % colors.length]
        const legendX = 20 + (index * 120)
        
        svg += `<rect x=&quot;${legendX}&quot; y="${legendY}" width="12" height="12" fill="${color}"/>`
        svg += `<text x=&quot;${legendX + 20}&quot; y="${legendY + 9}" fill="white" font-family="Arial, sans-serif" font-size="12">${label} (${data.values[index]})</text>`
      })
    }
    
    svg += '</svg>'
    return svg
  }

  // Générer un graphique linéaire
  public generateLineChart(data: ChartData, options: SVGChartOptions = {}): string {
    const {
      width = 800,
      height = 400,
      title = 'Graphique linéaire',
      showLegend = true,
      showValues = true
    } = options

    const colors = data.colors || this.DEFAULT_COLORS
    const maxValue = Math.max(...data.values)
    const minValue = Math.min(...data.values)
    const valueRange = maxValue - minValue || 1
    const chartWidth = width - 100
    const chartHeight = height - 100

    let svg = `<svg width=&quot;${width}&quot; height="${height}" xmlns="http://www.w3.org/2000/svg">`
    
    // Arrière-plan
    svg += `<rect width=&quot;${width}&quot; height="${height}" fill="#1f2937" rx="8"/>`
    
    // Titre
    svg += `<text x=&quot;${width/2}&quot; y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${title}</text>`
    
    // Grille
    for (let i = 0; i <= 5; i++) {
      const y = 50 + (i * chartHeight / 5)
      svg += `<line x1=&quot;50&quot; y1="${y}" x2="${width-50}" y2="${y}" stroke="#374151" stroke-width="1"/>`
      
      const value = maxValue - (i * valueRange / 5)
      svg += `<text x=&quot;40&quot; y="${y + 5}" text-anchor="end" fill="#9ca3af" font-family="Arial, sans-serif" font-size="10">${Math.round(value)}</text>`
    }
    
    // Axes
    svg += `<line x1=&quot;50&quot; y1="${height-50}" x2="${width-50}" y2="${height-50}" stroke="#6b7280" stroke-width="2"/>`
    svg += `<line x1=&quot;50&quot; y1="50" x2="50" y2="${height-50}" stroke="#6b7280" stroke-width="2"/>`
    
    // Ligne
    const points: string[] = []
    data.labels.forEach((label, index) => {
      const value = data.values[index]
      const x = 50 + (index * chartWidth / (data.labels.length - 1))
      const y = height - 50 - ((value - minValue) / valueRange) * chartHeight
      
      points.push(`${x},${y}`)
      
      // Point
      svg += `<circle cx=&quot;${x}&quot; cy="${y}" r="4" fill="${colors[0]}" stroke="white" stroke-width="2"/>`
      
      // Valeur
      if (showValues) {
        svg += `<text x=&quot;${x}&quot; y="${y - 10}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10">${value}</text>`
      }
      
      // Label
      svg += `<text x=&quot;${x}&quot; y="${height - 30}" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="10">${label}</text>`
    })
    
    // Ligne de connexion
    if (points.length > 1) {
      svg += `<polyline points=&quot;${points.join(' ')}&quot; fill="none" stroke="${colors[0]}" stroke-width="3"/>`
    }
    
    svg += '</svg>'
    return svg
  }

  // Générer un dashboard complet
  public generateDashboard(): string {
    const chartData = excelService.getDataForCharts()
    
    // Graphique des inscriptions par mois
    const registrationChart = this.generateLineChart(
      {
        labels: chartData.registrationByMonth.map(d => d.month),
        values: chartData.registrationByMonth.map(d => d.count)
      },
      { width: 600, height: 300, title: 'Inscriptions par mois' }
    )
    
    // Graphique du statut des utilisateurs
    const statusChart = this.generatePieChart(
      {
        labels: chartData.userStatus.map(d => d.status),
        values: chartData.userStatus.map(d => d.count)
      },
      { width: 400, height: 300, title: 'Statut des utilisateurs' }
    )
    
    // Graphique des top pays
    const countriesChart = this.generateBarChart(
      {
        labels: chartData.topCountries.map(d => d.country),
        values: chartData.topCountries.map(d => d.count)
      },
      { width: 600, height: 300, title: 'Top 10 des pays' }
    )
    
    return `
      <div style=&quot;background: #1f2937; padding: 20px; border-radius: 8px;&quot;>
        <h2 style=&quot;color: white; text-align: center; margin-bottom: 30px;&quot;>Dashboard Atiha - Statistiques Utilisateurs</h2>
        
        <div style=&quot;display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;&quot;>
          <div style=&quot;background: #374151; padding: 15px; border-radius: 8px;&quot;>
            ${registrationChart}
          </div>
          
          <div style=&quot;background: #374151; padding: 15px; border-radius: 8px;&quot;>
            ${statusChart}
          </div>
          
          <div style=&quot;background: #374151; padding: 15px; border-radius: 8px; width: 100%;&quot;>
            ${countriesChart}
          </div>
        </div>
      </div>
    `
  }

  // Télécharger un graphique SVG
  public downloadSVG(svgContent: string, filename: string): void {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Convertir SVG en PNG (nécessite canvas)
  public svgToPNG(svgContent: string, width: number, height: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      canvas.width = width
      canvas.height = height
      
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Erreur lors de la conversion'))
          }
        }, 'image/png')
      }
      
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
      img.src = 'data:image/svg+xml;base64,' + btoa(svgContent)
    })
  }
}

// Instance singleton
export const svgService = new SVGService()
