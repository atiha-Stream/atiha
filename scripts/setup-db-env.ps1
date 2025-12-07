# Script PowerShell pour configurer DATABASE_URL avant l'execution de Prisma
# Ce script est utilise dans le build pour s'assurer que DATABASE_URL est definie
# avant que Prisma ne valide le schema

# Configurer DATABASE_URL si elle n'est pas definie
if (-not $env:DATABASE_URL) {
    # Ordre de priorite :
    # 1. POSTGRES_URL
    # 2. PRISMA_DATABASE_URL (mais pas prisma+postgres:// qui est pour Accelerate)
    # 3. Variables prefixees avec le nom du projet (atiha_*)
    
    if ($env:POSTGRES_URL) {
        $env:DATABASE_URL = $env:POSTGRES_URL
        Write-Host "✅ DATABASE_URL configuree depuis POSTGRES_URL" -ForegroundColor Green
    }
    elseif ($env:PRISMA_DATABASE_URL -and -not $env:PRISMA_DATABASE_URL.StartsWith('prisma+postgres://')) {
        $env:DATABASE_URL = $env:PRISMA_DATABASE_URL
        Write-Host "✅ DATABASE_URL configuree depuis PRISMA_DATABASE_URL" -ForegroundColor Green
    }
    # Fallback: variables prefixees avec le nom du projet (pour Vercel)
    elseif ($env:atiha_DATABASE_URL) {
        $env:DATABASE_URL = $env:atiha_DATABASE_URL
        Write-Host "✅ DATABASE_URL configuree depuis atiha_DATABASE_URL" -ForegroundColor Green
    }
    elseif ($env:atiha_POSTGRES_URL) {
        $env:DATABASE_URL = $env:atiha_POSTGRES_URL
        Write-Host "✅ DATABASE_URL configuree depuis atiha_POSTGRES_URL" -ForegroundColor Green
    }
}

# Verifier que DATABASE_URL est definie
if (-not $env:DATABASE_URL) {
    Write-Host "❌ Erreur: Aucune variable d'environnement de base de donnees trouvee" -ForegroundColor Red
    Write-Host "   Veuillez definir DATABASE_URL, PRISMA_DATABASE_URL, POSTGRES_URL" -ForegroundColor Red
    Write-Host "   ou les variables prefixees (ex: atiha_DATABASE_URL)" -ForegroundColor Red
    exit 1
}

# Verifier le format de l'URL
if (-not $env:DATABASE_URL.StartsWith('postgres://') -and -not $env:DATABASE_URL.StartsWith('postgresql://')) {
    Write-Host "❌ Erreur: DATABASE_URL doit commencer par postgres:// ou postgresql://" -ForegroundColor Red
    $urlPreview = if ($env:DATABASE_URL.Length -gt 50) { $env:DATABASE_URL.Substring(0, 50) + "..." } else { $env:DATABASE_URL }
    Write-Host "   URL actuelle: $urlPreview" -ForegroundColor Red
    exit 1
}

Write-Host "✅ DATABASE_URL est configuree et valide" -ForegroundColor Green

