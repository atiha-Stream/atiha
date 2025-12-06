# Script PowerShell pour creer le fichier .env.local avec les variables d'environnement
# Usage: .\scripts\setup-env-local.ps1

Write-Host "[*] Configuration du fichier .env.local..." -ForegroundColor Cyan

# Verifier si .env.local existe deja
if (Test-Path ".env.local") {
    $overwrite = Read-Host "Le fichier .env.local existe deja. Voulez-vous le remplacer ? (o/n)"
    if ($overwrite -ne "o" -and $overwrite -ne "O") {
        Write-Host "[X] Operation annulee." -ForegroundColor Yellow
        exit
    }
}

# Variables d'environnement PostgreSQL Prisma
$DATABASE_URL = "postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require"
$POSTGRES_URL = "postgres://14d4be49ceb2894e84bdd2a15fb3d4307eae00d4bd861c2ebcfc81dfe2b65d76:sk_d01m0ZY_u6wjI119zlpcH@db.prisma.io:5432/postgres?sslmode=require"
$PRISMA_DATABASE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19kMDFtMFpZX3U2d2pJMTE5emxwY0giLCJhcGlfa2V5IjoiMDFLQlBKSE5IOEhQRTM3UFpBMU5RQkJBN1QiLCJ0ZW5hbnRfaWQiOiIxNGQ0YmU0OWNlYjI4OTRlODRiZGQyYTE1ZmIzZDQzMDdlYWUwMGQ0YmQ4NjFjMmViY2ZjODFkZmUyYjY1ZDc2IiwiaW50ZXJuYWxfc2VjcmV0IjoiNzZlYTZiZGMtNzkxMi00NGVjLWIzYzMtODIyOWMxZmYxOWU5In0.azeiGYD80jWbc_WszyB1FVR5pazSg1lGwg67NA3jQHE"

# Creer le contenu du fichier .env.local
$envContent = @"
# Variables d'environnement locales pour le developpement
# Ce fichier est ignore par Git (ne pas committer les secrets)

# ============================================
# BASE DE DONNEES PostgreSQL (Prisma)
# ============================================

# URL de connexion directe PostgreSQL (OBLIGATOIRE pour Prisma)
DATABASE_URL="$DATABASE_URL"

# URL PostgreSQL (identique a DATABASE_URL)
POSTGRES_URL="$POSTGRES_URL"

# URL Prisma avec Accelerate (connection pooling - recommande pour la production)
PRISMA_DATABASE_URL="$PRISMA_DATABASE_URL"
"@

# Ecrire le fichier
$envContent | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host "[OK] Fichier .env.local cree avec succes !" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Prochaines etapes :" -ForegroundColor Cyan
Write-Host "   1. Verifiez que le fichier .env.local contient les bonnes valeurs" -ForegroundColor White
Write-Host "   2. Executez les migrations Prisma : npm run db:migrate:deploy" -ForegroundColor White
Write-Host "   3. Generez le client Prisma : npm run db:generate" -ForegroundColor White
Write-Host ""
