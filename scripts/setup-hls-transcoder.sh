#!/bin/bash

# Script de configuration du serveur de transcodage HLS pour Atiha
# Ce script configure et démarre le serveur de transcodage HLS

set -e

echo "🎬 Configuration du serveur de transcodage HLS pour Atiha..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Vérifier si Go est installé
check_go() {
    if ! command -v go &> /dev/null; then
        print_error "Go n'est pas installé. Veuillez installer Go 1.19+ d'abord."
        echo "Instructions d'installation: https://golang.org/doc/install"
        exit 1
    fi
    
    GO_VERSION=$(go version | cut -d' ' -f3 | sed 's/go//')
    print_message "Go version $GO_VERSION détectée"
}

# Vérifier si FFmpeg est installé
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        print_error "FFmpeg n'est pas installé. Veuillez installer FFmpeg d'abord."
        echo ""
        echo "Installation sur Ubuntu/Debian:"
        echo "  sudo apt update && sudo apt install ffmpeg"
        echo ""
        echo "Installation sur macOS:"
        echo "  brew install ffmpeg"
        echo ""
        echo "Installation sur Windows:"
        echo "  Téléchargez depuis https://ffmpeg.org/download.html"
        exit 1
    fi
    
    FFMPEG_VERSION=$(ffmpeg -version | head -n1 | cut -d' ' -f3)
    print_message "FFmpeg version $FFMPEG_VERSION détecté"
}

# Construire le serveur de transcodage
build_transcoder() {
    print_header "Construction du serveur de transcodage HLS"
    
    TRANCODER_DIR="./torrentPlayer/content-transcoder-master"
    
    if [ ! -d "$TRANCODER_DIR" ]; then
        print_error "Répertoire du transcodeur non trouvé: $TRANCODER_DIR"
        exit 1
    fi
    
    cd "$TRANCODER_DIR"
    
    print_message "Téléchargement des dépendances Go..."
    go mod download
    
    print_message "Construction du binaire..."
    go build -ldflags '-w -s' -o hls-transcoder .
    
    if [ -f "hls-transcoder" ]; then
        print_message "Binaire construit avec succès: hls-transcoder"
    else
        print_error "Échec de la construction du binaire"
        exit 1
    fi
    
    cd - > /dev/null
}

# Créer les répertoires nécessaires
create_directories() {
    print_header "Création des répertoires"
    
    mkdir -p ./data/hls
    mkdir -p ./data/tmp
    mkdir -p ./logs
    
    print_message "Répertoires créés:"
    echo "  - ./data/hls (données HLS)"
    echo "  - ./data/tmp (fichiers temporaires)"
    echo "  - ./logs (logs du serveur)"
}

# Créer le fichier de configuration
create_config() {
    print_header "Création de la configuration"
    
    cat > ./hls-transcoder.conf << EOF
# Configuration du serveur de transcodage HLS
HOST=0.0.0.0
PORT=8080
PROBE_PORT=8081
OUTPUT_DIR=./data/hls
TMP_DIR=./data/tmp
PRESET=fast
HLS_AAC_CODEC=libfdk_aac
PLAYER=true
ACCESS_GRACE=600
TRANSCODE_GRACE=5
PROBE_TIMEOUT=600
EOF
    
    print_message "Fichier de configuration créé: ./hls-transcoder.conf"
}

# Créer le script de démarrage
create_startup_script() {
    print_header "Création du script de démarrage"
    
    cat > ./start-hls-transcoder.sh << 'EOF'
#!/bin/bash

# Script de démarrage du serveur de transcodage HLS

set -e

# Charger la configuration
if [ -f "./hls-transcoder.conf" ]; then
    source ./hls-transcoder.conf
else
    echo "Fichier de configuration non trouvé: ./hls-transcoder.conf"
    exit 1
fi

# Vérifier si le binaire existe
if [ ! -f "./torrentPlayer/content-transcoder-master/hls-transcoder" ]; then
    echo "Binaire du transcodeur non trouvé. Exécutez d'abord setup-hls-transcoder.sh"
    exit 1
fi

echo "🎬 Démarrage du serveur de transcodage HLS..."
echo "Configuration:"
echo "  - Host: $HOST"
echo "  - Port: $PORT"
echo "  - Output: $OUTPUT_DIR"
echo "  - Preset: $PRESET"
echo ""

# Démarrer le serveur
./torrentPlayer/content-transcoder-master/hls-transcoder \
    --host="$HOST" \
    --port="$PORT" \
    --probe-port="$PROBE_PORT" \
    --output="$OUTPUT_DIR" \
    --preset="$PRESET" \
    --hls-aac-codec="$HLS_AAC_CODEC" \
    --player \
    --access-grace="$ACCESS_GRACE" \
    --transcode-grace="$TRANSCODE_GRACE" \
    --probe-timeout="$PROBE_TIMEOUT"
EOF
    
    chmod +x ./start-hls-transcoder.sh
    print_message "Script de démarrage créé: ./start-hls-transcoder.sh"
}

# Créer le service systemd (optionnel)
create_systemd_service() {
    print_header "Création du service systemd (optionnel)"
    
    if [ "$EUID" -eq 0 ]; then
        cat > /etc/systemd/system/atiha-hls-transcoder.service << EOF
[Unit]
Description=Atiha HLS Transcoder Server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/start-hls-transcoder.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        print_message "Service systemd créé: atiha-hls-transcoder.service"
        echo ""
        echo "Pour démarrer le service:"
        echo "  sudo systemctl start atiha-hls-transcoder"
        echo "  sudo systemctl enable atiha-hls-transcoder"
    else
        print_warning "Exécution en tant qu'utilisateur non-root. Service systemd non créé."
        echo "Pour créer le service systemd, exécutez ce script en tant que root."
    fi
}

# Fonction principale
main() {
    print_header "Configuration du serveur de transcodage HLS pour Atiha"
    
    # Vérifications préalables
    check_go
    check_ffmpeg
    
    # Configuration
    build_transcoder
    create_directories
    create_config
    create_startup_script
    create_systemd_service
    
    print_header "Configuration terminée avec succès!"
    echo ""
    print_message "Pour démarrer le serveur de transcodage HLS:"
    echo "  ./start-hls-transcoder.sh"
    echo ""
    print_message "Le serveur sera accessible sur:"
    echo "  - Interface principale: http://localhost:8080"
    echo "  - Lecteur intégré: http://localhost:8080/player/"
    echo "  - API de transcodage: http://localhost:8080/index.m3u8?source_url=<URL_VIDEO>"
    echo ""
    print_message "Pour tester le transcodage:"
    echo "  curl 'http://localhost:8080/index.m3u8?source_url=https://example.com/video.mp4'"
    echo ""
    print_warning "Assurez-vous que le port 8080 est ouvert dans votre firewall."
}

# Exécuter le script principal
main "$@"
