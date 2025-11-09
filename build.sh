#!/bin/bash

# Script de build de l'application Seller Library
# Ce script vérifie le latest.json, build l'app et crée l'archive tar.gz

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du build de Seller Library..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Récupérer la version depuis Cargo.toml
VERSION=$(grep '^version = ' src-tauri/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')
echo -e "${BLUE}📦 Version détectée: ${VERSION}${NC}"

# Vérifier si latest.json existe
if [ ! -f "latest.json" ]; then
    echo -e "${RED}❌ Erreur: latest.json introuvable à la racine du projet${NC}"
    exit 1
fi

# Vérifier que la version dans latest.json correspond à la version du projet
JSON_VERSION=$(grep '"version"' latest.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
if [ "$JSON_VERSION" != "$VERSION" ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Version dans latest.json ($JSON_VERSION) != version Cargo.toml ($VERSION)${NC}"
    echo -e "${YELLOW}Voulez-vous continuer ? (y/n)${NC}"
    read -r response
    if [ "$response" != "y" ]; then
        echo -e "${RED}Build annulé${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ latest.json vérifié${NC}"

# Nettoyer les anciens builds
echo -e "${BLUE}🧹 Nettoyage des anciens builds...${NC}"
rm -rf src-tauri/target/release/bundle

# Lancer le build
echo -e "${BLUE}🔨 Build de l'application...${NC}"
npm run tauri build

# Vérifier que le build a réussi
if [ ! -d "src-tauri/target/release/bundle/macos" ]; then
    echo -e "${RED}❌ Erreur: Le build a échoué, le dossier bundle/macos n'existe pas${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build réussi${NC}"

# Déterminer l'architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    ARCH_NAME="aarch64"
else
    ARCH_NAME="x64"
fi

echo -e "${BLUE}💻 Architecture détectée: ${ARCH_NAME}${NC}"

# Trouver le .app
APP_PATH="src-tauri/target/release/bundle/macos/Seller Library.app"
if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ Erreur: Application non trouvée à ${APP_PATH}${NC}"
    exit 1
fi

# Créer l'archive tar.gz
ARCHIVE_NAME="seller-library_${VERSION}_${ARCH_NAME}.app.tar.gz"
ARCHIVE_PATH="src-tauri/target/release/bundle/macos/${ARCHIVE_NAME}"

echo -e "${BLUE}📦 Création de l'archive ${ARCHIVE_NAME}...${NC}"

cd "src-tauri/target/release/bundle/macos"
tar -czf "${ARCHIVE_NAME}" "Seller Library.app"
cd - > /dev/null

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo -e "${RED}❌ Erreur: L'archive n'a pas été créée${NC}"
    exit 1
fi

# Calculer la taille de l'archive
ARCHIVE_SIZE=$(ls -lh "$ARCHIVE_PATH" | awk '{print $5}')

echo -e "${GREEN}✓ Archive créée avec succès${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Build terminé avec succès !${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}📦 Version:${NC} ${VERSION}"
echo -e "${BLUE}💻 Architecture:${NC} ${ARCH_NAME}"
echo -e "${BLUE}📁 Archive:${NC} ${ARCHIVE_NAME}"
echo -e "${BLUE}📊 Taille:${NC} ${ARCHIVE_SIZE}"
echo -e "${BLUE}📍 Chemin:${NC} ${ARCHIVE_PATH}"
echo ""
echo -e "${YELLOW}Pour déployer cette release, utilisez:${NC}"
echo -e "${YELLOW}  ./deploy.sh${NC}"
