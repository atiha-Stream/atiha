# Script PowerShell pour lancer Prisma Studio avec la base de donnees de production
# Usage: .\scripts\studio-production.ps1

$env:DATABASE_URL = "postgres://df154918b8b6fba23ea3c76025985380723438de0c9d2a7c4790157a7a933f15:sk_-nYcxyrtODRDW6HwkYlFc@db.prisma.io:5432/postgres?sslmode=require"

Write-Host "Lancement de Prisma Studio..." -ForegroundColor Green
Write-Host "Base de donnees: Configuree" -ForegroundColor Cyan
Write-Host ""

npx prisma studio

