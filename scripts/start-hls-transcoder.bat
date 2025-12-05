@echo off
REM Script de démarrage du serveur HLS Transcoder pour Windows
REM Ce script démarre le serveur de transcodage HLS pour Atiha

echo.
echo ================================
echo   Atiha HLS Transcoder Server
echo ================================
echo.

REM Vérifier si Go est installé
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Go n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Go depuis https://golang.org/dl/
    pause
    exit /b 1
)

REM Vérifier si FFmpeg est installé
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] FFmpeg n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer FFmpeg depuis https://ffmpeg.org/download.html
    pause
    exit /b 1
)

REM Aller dans le répertoire du transcodeur
cd /d "%~dp0..\torrentPlayer\content-transcoder-master"

REM Vérifier si le binaire existe
if not exist "hls-transcoder.exe" (
    echo [INFO] Compilation du serveur HLS...
    go build -o hls-transcoder.exe .
    if %errorlevel% neq 0 (
        echo [ERREUR] Échec de la compilation
        pause
        exit /b 1
    )
)

REM Créer les répertoires nécessaires
if not exist "..\..\data\hls" mkdir "..\..\data\hls"
if not exist "..\..\data\tmp" mkdir "..\..\data\tmp"

echo [INFO] Démarrage du serveur HLS Transcoder...
echo [INFO] Serveur accessible sur: http://localhost:8080
echo [INFO] Lecteur intégré: http://localhost:8080/player/
echo [INFO] Appuyez sur Ctrl+C pour arrêter le serveur
echo.

REM Démarrer le serveur
hls-transcoder.exe --host=0.0.0.0 --port=8080 --output=..\..\data\hls --preset=fast --player

pause
