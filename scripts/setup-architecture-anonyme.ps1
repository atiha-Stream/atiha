# Script PowerShell : Configuration Architecture Anonyme Atiha
# Usage: .\setup-architecture-anonyme.ps1

param(
    [string]$Mode = "help",
    [string]$Domain1 = "",
    [string]$Domain2 = "",
    [string]$FrontendIP = "",
    [string]$BackendIP = "",
    [string]$ConfigPath = ".\config\architecture.json"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Architecture Anonyme   " -ForegroundColor Cyan
Write-Host "           Application Atiha           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Créer le dossier de configuration
$configDir = Split-Path -Parent $ConfigPath
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Fonction d'aide
function Show-Help {
    Write-Host "=== MODES DISPONIBLES ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. check-dns      : Vérifier la résolution DNS des domaines"
    Write-Host "2. check-whois    : Vérifier le masquage WHOIS"
    Write-Host "3. generate-config: Générer la configuration"
    Write-Host "4. test-connectivity: Tester la connectivité"
    Write-Host "5. setup-dns      : Générer les configurations DNS"
    Write-Host "6. setup-nginx    : Générer les configurations Nginx"
    Write-Host ""
    Write-Host "=== EXEMPLES ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Générer la config :"
    Write-Host "  .\setup-architecture-anonyme.ps1 -Mode generate-config -Domain1 'atiha-redir-1.com' -Domain2 'atiha-redir-2.com' -FrontendIP '98.96.218.35' -BackendIP '107.151.135.63'"
    Write-Host ""
    Write-Host "Vérifier DNS :"
    Write-Host "  .\setup-architecture-anonyme.ps1 -Mode check-dns -Domain1 'atiha-redir-1.com'"
    Write-Host ""
    Write-Host "Vérifier WHOIS :"
    Write-Host "  .\setup-architecture-anonyme.ps1 -Mode check-whois -Domain1 'atiha-redir-1.com'"
    Write-Host ""
}

# Fonction : Générer la configuration
function Generate-Config {
    param(
        [string]$Domain1,
        [string]$Domain2,
        [string]$FrontendIP,
        [string]$BackendIP
    )
    
    Write-Host "=== Génération de la Configuration ===" -ForegroundColor Green
    
    $config = @{
        domains = @{
            frontend_1 = $Domain1
            frontend_2 = $Domain2
            api_gateway_1 = "api-gateway.$Domain1"
            api_gateway_2 = "api-gateway.$Domain2"
        }
        ips = @{
            frontend_1 = $FrontendIP
            backend = $BackendIP
        }
        cdn = @{
            domain = "atiha-cdn.anonymous-site.site"
        }
        created = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    
    $config | ConvertTo-Json -Depth 10 | Out-File -FilePath $ConfigPath -Encoding UTF8
    
    Write-Host "✅ Configuration sauvegardée : $ConfigPath" -ForegroundColor Green
    
    # Générer aussi la config pour l'application
    $appConfigPath = ".\config\sdk_config.json"
    $appConfig = @{
        host_list = @(
            "https://api-gateway.$Domain1",
            "https://api-gateway.$Domain2"
        )
        cdn_url = "https://atiha-cdn.anonymous-site.site"
        backup_hosts = @(
            "https://backup-api.$Domain1"
        )
    }
    
    $appConfigDir = Split-Path -Parent $appConfigPath
    if (-not (Test-Path $appConfigDir)) {
        New-Item -ItemType Directory -Path $appConfigDir -Force | Out-Null
    }
    
    $appConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $appConfigPath -Encoding UTF8
    Write-Host "✅ Configuration SDK sauvegardée : $appConfigPath" -ForegroundColor Green
}

# Fonction : Vérifier DNS
function Check-DNS {
    param([string]$Domain)
    
    Write-Host "=== Vérification DNS pour $Domain ===" -ForegroundColor Green
    
    try {
        $results = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
        foreach ($result in $results) {
            Write-Host "  ✅ $Domain → $($result.IPAddress)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ Erreur DNS : $_" -ForegroundColor Red
    }
    
    # Vérifier aussi le sous-domaine API
    $apiDomain = "api-gateway.$Domain"
    Write-Host ""
    Write-Host "Vérification : $apiDomain" -ForegroundColor Yellow
    try {
        $apiResults = Resolve-DnsName -Name $apiDomain -Type A -ErrorAction Stop
        foreach ($result in $apiResults) {
            Write-Host "  ✅ $apiDomain → $($result.IPAddress)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ⚠️  $apiDomain non résolu (normal si pas encore configuré)" -ForegroundColor Yellow
    }
}

# Fonction : Vérifier WHOIS
function Check-WHOIS {
    param([string]$Domain)
    
    Write-Host "=== Vérification WHOIS pour $Domain ===" -ForegroundColor Green
    
    # Vérifier si whois est disponible
    $whoisAvailable = $false
    try {
        $null = Get-Command whois -ErrorAction Stop
        $whoisAvailable = $true
    }
    catch {
        Write-Host "  ⚠️  'whois' non disponible, utilisation de nslookup..." -ForegroundColor Yellow
    }
    
    if ($whoisAvailable) {
        try {
            $whoisResult = whois $Domain
            Write-Host ""
            Write-Host "Résultats WHOIS :" -ForegroundColor Yellow
            Write-Host $whoisResult
            
            # Vérifier la présence de protection
            if ($whoisResult -match "WhoisGuard|Privacy|REDACTED|Data Protected") {
                Write-Host ""
                Write-Host "  ✅ Protection WHOIS détectée" -ForegroundColor Green
            }
            else {
                Write-Host ""
                Write-Host "  ⚠️  Protection WHOIS non détectée - Recommandé d'activer" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "  ❌ Erreur WHOIS : $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host ""
        Write-Host "  💡 Pour vérifier WHOIS, utilisez un service en ligne :" -ForegroundColor Cyan
        Write-Host "     https://whois.net/$Domain" -ForegroundColor Cyan
        Write-Host "     https://www.whois.com/whois/$Domain" -ForegroundColor Cyan
    }
}

# Fonction : Tester la connectivité
function Test-Connectivity {
    param(
        [string]$Domain,
        [string]$IP
    )
    
    Write-Host "=== Test de Connectivité ===" -ForegroundColor Green
    
    # Test ping IP
    if ($IP) {
        Write-Host ""
        Write-Host "Test ping $IP..." -ForegroundColor Yellow
        try {
            $ping = Test-Connection -ComputerName $IP -Count 2 -ErrorAction Stop
            Write-Host "  ✅ IP $IP accessible" -ForegroundColor Green
        }
        catch {
            Write-Host "  ❌ IP $IP non accessible" -ForegroundColor Red
        }
    }
    
    # Test HTTP/HTTPS
    if ($Domain) {
        Write-Host ""
        Write-Host "Test HTTPS https://$Domain..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "https://$Domain" -Method Head -TimeoutSec 10 -ErrorAction Stop
            Write-Host "  ✅ HTTPS accessible (Status: $($response.StatusCode))" -ForegroundColor Green
        }
        catch {
            Write-Host "  ⚠️  HTTPS non accessible : $_" -ForegroundColor Yellow
        }
    }
}

# Fonction : Générer configuration DNS
function Generate-DNS-Config {
    param(
        [string]$Domain1,
        [string]$Domain2,
        [string]$FrontendIP,
        [string]$BackendIP
    )
    
    Write-Host "=== Génération Configuration DNS ===" -ForegroundColor Green
    
    $dnsConfig = @"
# Configuration DNS pour $Domain1
# À copier dans votre panneau DNS

# Enregistrements A (Frontend)
@                    A    $FrontendIP
www                  A    $FrontendIP

# Enregistrements CNAME (Backend API)
api-gateway          CNAME $BackendIP
api                  CNAME $BackendIP

# Enregistrements CNAME (Backup)
backup-api           CNAME $BackendIP

---

# Configuration DNS pour $Domain2 (Miroir)
# À copier dans votre panneau DNS

# Enregistrements A (Frontend)
@                    A    $FrontendIP
www                  A    $FrontendIP

# Enregistrements CNAME (Backend API)
api-gateway          CNAME $BackendIP
api                  CNAME $BackendIP

# Enregistrements CNAME (Backup)
backup-api           CNAME $BackendIP
"@
    
    $dnsConfigPath = ".\config\dns-config.txt"
    $dnsConfig | Out-File -FilePath $dnsConfigPath -Encoding UTF8
    Write-Host "✅ Configuration DNS sauvegardée : $dnsConfigPath" -ForegroundColor Green
    Write-Host ""
    Write-Host $dnsConfig
}

# Fonction : Générer configuration Nginx
function Generate-Nginx-Config {
    param(
        [string]$Domain1,
        [string]$Domain2,
        [string]$FrontendIP,
        [string]$BackendIP
    )
    
    Write-Host "=== Génération Configuration Nginx ===" -ForegroundColor Green
    
    $nginxFrontend = @"
# Configuration Nginx - Serveur Frontend
# Fichier : /etc/nginx/sites-available/atiha-frontend

server {
    listen 80;
    listen 443 ssl http2;
    
    server_name $Domain1 www.$Domain1;
    
    # Certificat SSL (à générer avec certbot)
    # ssl_certificate /etc/letsencrypt/live/$Domain1/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$Domain1/privkey.pem;
    
    # Désactiver les logs
    access_log off;
    error_log /dev/null crit;
    
    # Masquer les headers serveur
    server_tokens off;
    more_set_headers 'Server: nginx/1.0.0';
    
    # Redirection API vers backend
    location /api/ {
        proxy_pass https://$BackendIP;
        proxy_set_header Host api-gateway.$Domain1;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        
        # Masquer l'IP backend
        proxy_hide_header Server;
    }
    
    # Redirection CDN
    location /cdn/ {
        return 301 https://atiha-cdn.anonymous-site.site`$request_uri;
    }
    
    # Health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
    
    # Page d'accueil
    location / {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
"@
    
    $nginxBackend = @"
# Configuration Nginx - Serveur Backend
# Fichier : /etc/nginx/sites-available/atiha-backend

upstream backend_app {
    server 127.0.0.1:3000;  # Votre application backend
}

server {
    listen 443 ssl http2;
    listen $BackendIP:443 ssl http2;
    
    server_name api-gateway.$Domain1 api-gateway.$Domain2;
    
    # Certificat SSL
    # ssl_certificate /etc/letsencrypt/live/api-gateway.$Domain1/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api-gateway.$Domain1/privkey.pem;
    
    # Désactiver les logs
    access_log off;
    error_log /dev/null crit;
    
    # Firewall via Nginx (autoriser uniquement IPs frontend)
    allow $FrontendIP;
    # allow IP_FRONTEND_2;  # Ajouter si plusieurs frontends
    deny all;
    
    # Proxy vers application backend
    location / {
        proxy_pass http://backend_app;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
}
"@
    
    $nginxFrontendPath = ".\config\nginx-frontend.conf"
    $nginxBackendPath = ".\config\nginx-backend.conf"
    
    $nginxFrontend | Out-File -FilePath $nginxFrontendPath -Encoding UTF8
    $nginxBackend | Out-File -FilePath $nginxBackendPath -Encoding UTF8
    
    Write-Host "✅ Configuration Nginx Frontend : $nginxFrontendPath" -ForegroundColor Green
    Write-Host "✅ Configuration Nginx Backend : $nginxBackendPath" -ForegroundColor Green
}

# Exécution selon le mode
switch ($Mode.ToLower()) {
    "help" {
        Show-Help
    }
    "generate-config" {
        if (-not $Domain1 -or -not $Domain2 -or -not $FrontendIP -or -not $BackendIP) {
            Write-Host "❌ Erreur : Tous les paramètres sont requis (Domain1, Domain2, FrontendIP, BackendIP)" -ForegroundColor Red
            Show-Help
        }
        else {
            Generate-Config -Domain1 $Domain1 -Domain2 $Domain2 -FrontendIP $FrontendIP -BackendIP $BackendIP
        }
    }
    "check-dns" {
        if (-not $Domain1) {
            Write-Host "❌ Erreur : Domain1 requis" -ForegroundColor Red
            Show-Help
        }
        else {
            Check-DNS -Domain $Domain1
            if ($Domain2) {
                Write-Host ""
                Check-DNS -Domain $Domain2
            }
        }
    }
    "check-whois" {
        if (-not $Domain1) {
            Write-Host "❌ Erreur : Domain1 requis" -ForegroundColor Red
            Show-Help
        }
        else {
            Check-WHOIS -Domain $Domain1
            if ($Domain2) {
                Write-Host ""
                Check-WHOIS -Domain $Domain2
            }
        }
    }
    "test-connectivity" {
        if (-not $Domain1 -or -not $FrontendIP) {
            Write-Host "❌ Erreur : Domain1 et FrontendIP requis" -ForegroundColor Red
            Show-Help
        }
        else {
            Test-Connectivity -Domain $Domain1 -IP $FrontendIP
        }
    }
    "setup-dns" {
        if (-not $Domain1 -or -not $Domain2 -or -not $FrontendIP -or -not $BackendIP) {
            Write-Host "❌ Erreur : Tous les paramètres sont requis" -ForegroundColor Red
            Show-Help
        }
        else {
            Generate-DNS-Config -Domain1 $Domain1 -Domain2 $Domain2 -FrontendIP $FrontendIP -BackendIP $BackendIP
        }
    }
    "setup-nginx" {
        if (-not $Domain1 -or -not $Domain2 -or -not $FrontendIP -or -not $BackendIP) {
            Write-Host "❌ Erreur : Tous les paramètres sont requis" -ForegroundColor Red
            Show-Help
        }
        else {
            Generate-Nginx-Config -Domain1 $Domain1 -Domain2 $Domain2 -FrontendIP $FrontendIP -BackendIP $BackendIP
        }
    }
    default {
        Write-Host "❌ Mode inconnu : $Mode" -ForegroundColor Red
        Show-Help
    }
}

Write-Host ""

