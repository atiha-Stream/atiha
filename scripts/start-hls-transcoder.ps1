# Script PowerShell pour démarrer le serveur HLS Transcoder
# Ce script démarre le serveur de transcodage HLS pour Atiha

param(
    [string]$Host = "0.0.0.0",
    [int]$Port = 8080,
    [string]$OutputDir = ".\data\hls",
    [string]$Preset = "fast",
    [switch]$Help
)

# Fonction d'aide
function Show-Help {
    Write-Host @"
Script de démarrage du serveur HLS Transcoder pour Atiha

Usage: .\start-hls-transcoder.ps1 [OPTIONS]

Options:
  -Host <string>     Adresse d'écoute (défaut: 0.0.0.0)
  -Port <int>        Port d'écoute (défaut: 8080)
  -OutputDir <path>  Répertoire de sortie (défaut: .\data\hls)
  -Preset <string>   Preset FFmpeg (défaut: fast)
  -Help              Afficher cette aide

Exemples:
  .\start-hls-transcoder.ps1
  .\start-hls-transcoder.ps1 -Port 8081 -Preset medium
  .\start-hls-transcoder.ps1 -OutputDir "C:\hls\output"

"@
}

# Afficher l'aide si demandé
if ($Help) {
    Show-Help
    exit 0
}

# Couleurs pour les messages
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# En-tête
Write-ColorMessage "`n================================" $Colors.Info
Write-ColorMessage "   Atiha HLS Transcoder Server" $Colors.Info
Write-ColorMessage "================================`n" $Colors.Info

# Vérifier si Go est installé
try {
    $goVersion = go version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "[INFO] Go détecté: $goVersion" $Colors.Success
    } else {
        throw "Go non trouvé"
    }
} catch {
    Write-ColorMessage "[ERREUR] Go n'est pas installé ou n'est pas dans le PATH" $Colors.Error
    Write-ColorMessage "Veuillez installer Go depuis https://golang.org/dl/" $Colors.Warning
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Vérifier si FFmpeg est installé
try {
    $ffmpegVersion = ffmpeg -version 2>$null | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "[INFO] FFmpeg détecté: $ffmpegVersion" $Colors.Success
    } else {
        throw "FFmpeg non trouvé"
    }
} catch {
    Write-ColorMessage "[ERREUR] FFmpeg n'est pas installé ou n'est pas dans le PATH" $Colors.Error
    Write-ColorMessage "Veuillez installer FFmpeg depuis https://ffmpeg.org/download.html" $Colors.Warning
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Aller dans le répertoire du transcodeur
$transcoderDir = Join-Path $PSScriptRoot "..\torrentPlayer\content-transcoder-master"
if (-not (Test-Path $transcoderDir)) {
    Write-ColorMessage "[ERREUR] Répertoire du transcodeur non trouvé: $transcoderDir" $Colors.Error
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Set-Location $transcoderDir
Write-ColorMessage "[INFO] Répertoire de travail: $(Get-Location)" $Colors.Info

# Vérifier si le binaire existe
$binaryPath = "hls-transcoder.exe"
if (-not (Test-Path $binaryPath)) {
    Write-ColorMessage "[INFO] Compilation du serveur HLS..." $Colors.Info
    go build -o $binaryPath .
    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "[ERREUR] Échec de la compilation" $Colors.Error
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
    Write-ColorMessage "[SUCCESS] Binaire compilé avec succès" $Colors.Success
}

# Créer les répertoires nécessaires
$dataDir = Join-Path $PSScriptRoot "..\data"
$hlsDir = Join-Path $dataDir "hls"
$tmpDir = Join-Path $dataDir "tmp"

@($hlsDir, $tmpDir) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-ColorMessage "[INFO] Répertoire créé: $_" $Colors.Info
    }
}

# Afficher la configuration
Write-ColorMessage "`nConfiguration du serveur:" $Colors.Info
Write-ColorMessage "  - Host: $Host" $Colors.Info
Write-ColorMessage "  - Port: $Port" $Colors.Info
Write-ColorMessage "  - Output: $OutputDir" $Colors.Info
Write-ColorMessage "  - Preset: $Preset" $Colors.Info

Write-ColorMessage "`nURLs d'accès:" $Colors.Info
Write-ColorMessage "  - Serveur: http://$Host`:$Port" $Colors.Success
Write-ColorMessage "  - Lecteur: http://$Host`:$Port/player/" $Colors.Success
Write-ColorMessage "  - API: http://$Host`:$Port/index.m3u8?source_url=<URL_VIDEO>" $Colors.Success

Write-ColorMessage "`n[INFO] Démarrage du serveur HLS Transcoder..." $Colors.Info
Write-ColorMessage "[INFO] Appuyez sur Ctrl+C pour arrêter le serveur`n" $Colors.Warning

# Démarrer le serveur
try {
    & ".\$binaryPath" --host=$Host --port=$Port --output=$OutputDir --preset=$Preset --player
} catch {
    Write-ColorMessage "`n[ERREUR] Erreur lors du démarrage du serveur: $_" $Colors.Error
} finally {
    Write-ColorMessage "`n[INFO] Serveur arrêté" $Colors.Info
    Read-Host "Appuyez sur Entrée pour quitter"
}
