#!/bin/bash
# Script d'installation automatique pour VPS
# Ubuntu 22.04 LTS

set -e

echo "🚀 Installation PostgreSQL et Redis sur VPS..."

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer PostgreSQL
echo "📦 Installation de PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Installer Redis
echo "📦 Installation de Redis..."
sudo apt install redis-server -y

# Installer UFW
echo "🔥 Configuration du firewall..."
sudo apt install ufw -y
sudo ufw allow 22/tcp
sudo ufw --force enable

# Configuration PostgreSQL
echo "🔧 Configuration PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE atiha_db;
CREATE USER atiha WITH PASSWORD 'CHANGEZ_CE_MOT_DE_PASSE';
GRANT ALL PRIVILEGES ON DATABASE atiha_db TO atiha;
ALTER DATABASE atiha_db OWNER TO atiha;
\q
EOF

# Configuration Redis
echo "🔧 Configuration Redis..."
sudo sed -i 's/# requirepass foobared/requirepass CHANGEZ_CE_MOT_DE_PASSE_REDIS/' /etc/redis/redis.conf
sudo systemctl restart redis-server

# Configuration PostgreSQL pour connexions distantes
echo "🔧 Configuration PostgreSQL pour connexions distantes..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Ajouter la règle dans pg_hba.conf
echo "host    atiha_db    atiha    0.0.0.0/0    md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

# Redémarrer PostgreSQL
sudo systemctl restart postgresql

echo "✅ Installation terminée!"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. Changez les mots de passe dans PostgreSQL et Redis"
echo "2. Configurez le firewall pour autoriser uniquement Vercel"
echo "3. Configurez SSL pour PostgreSQL"
echo "4. Testez la connexion depuis Vercel"

