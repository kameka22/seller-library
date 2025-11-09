#!/bin/bash

# Script de déploiement de Seller Library sur GitHub
# Ce script crée une release GitHub et upload les fichiers

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement de Seller Library sur GitHub..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que gh (GitHub CLI) est installé
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Erreur: GitHub CLI (gh) n'est pas installé${NC}"
    echo -e "${YELLOW}Installez-le avec: brew install gh${NC}"
    exit 1
fi

# Vérifier l'authentification GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Erreur: Vous n'êtes pas authentifié avec GitHub CLI${NC}"
    echo -e "${YELLOW}Authentifiez-vous avec: gh auth login${NC}"
    exit 1
fi

# Récupérer la version depuis Cargo.toml
VERSION=$(grep '^version = ' src-tauri/Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')
echo -e "${BLUE}📦 Version: ${VERSION}${NC}"

# Vérifier si latest.json existe
if [ ! -f "latest.json" ]; then
    echo -e "${RED}❌ Erreur: latest.json introuvable${NC}"
    exit 1
fi

# Déterminer l'architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    ARCH_NAME="aarch64"
else
    ARCH_NAME="x64"
fi

# Vérifier que l'archive existe
ARCHIVE_NAME="seller-library_${VERSION}_${ARCH_NAME}.app.tar.gz"
ARCHIVE_PATH="src-tauri/target/release/bundle/macos/${ARCHIVE_NAME}"

if [ ! -f "$ARCHIVE_PATH" ]; then
    echo -e "${RED}❌ Erreur: Archive non trouvée à ${ARCHIVE_PATH}${NC}"
    echo -e "${YELLOW}Lancez d'abord: ./build.sh${NC}"
    exit 1
fi

# Récupérer les notes de version depuis latest.json
RELEASE_NOTES=$(grep '"notes"' latest.json | sed 's/.*"notes": "\(.*\)".*/\1/' | sed 's/\\n/\n/g')

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Informations de la release${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Version:${NC} ${VERSION}"
echo -e "${BLUE}Tag:${NC} ${VERSION}"
echo -e "${BLUE}Archive:${NC} ${ARCHIVE_NAME}"
echo -e "${BLUE}Fichiers à uploader:${NC}"
echo -e "  - ${ARCHIVE_PATH}"
echo -e "  - latest.json"
echo ""
echo -e "${BLUE}Notes de version:${NC}"
echo -e "${RELEASE_NOTES}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════${NC}"
echo ""

# Demander confirmation
echo -e "${YELLOW}⚠️  Voulez-vous créer la release ${VERSION} sur GitHub ? (y/n)${NC}"
read -r response
if [ "$response" != "y" ]; then
    echo -e "${RED}Déploiement annulé${NC}"
    exit 1
fi

# Vérifier si le tag existe déjà
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Le tag ${VERSION} existe déjà localement${NC}"
    echo -e "${YELLOW}Voulez-vous le supprimer et le recréer ? (y/n)${NC}"
    read -r response
    if [ "$response" = "y" ]; then
        git tag -d "$VERSION"
        git push origin ":refs/tags/$VERSION" 2>/dev/null || true
    else
        echo -e "${RED}Déploiement annulé${NC}"
        exit 1
    fi
fi

# Créer le tag
echo -e "${BLUE}🏷️  Création du tag ${VERSION}...${NC}"
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"

echo -e "${GREEN}✓ Tag créé et poussé${NC}"

# Créer la release sur GitHub
echo -e "${BLUE}📤 Création de la release sur GitHub...${NC}"

# Créer un fichier temporaire pour les notes de version
TEMP_NOTES=$(mktemp)
echo "$RELEASE_NOTES" > "$TEMP_NOTES"

# Créer la release avec gh
gh release create "$VERSION" \
    --title "Version $VERSION" \
    --notes-file "$TEMP_NOTES" \
    "$ARCHIVE_PATH" \
    "latest.json"

# Supprimer le fichier temporaire
rm "$TEMP_NOTES"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Release créée avec succès${NC}"

    # Récupérer l'URL de la release
    RELEASE_URL=$(gh release view "$VERSION" --json url -q .url)

    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🔗 URL de la release:${NC}"
    echo -e "   ${RELEASE_URL}"
    echo ""
    echo -e "${BLUE}📦 Fichiers uploadés:${NC}"
    echo -e "   - ${ARCHIVE_NAME}"
    echo -e "   - latest.json"
    echo ""
    echo -e "${GREEN}Les utilisateurs recevront la notification de mise à jour !${NC}"
else
    echo -e "${RED}❌ Erreur lors de la création de la release${NC}"
    exit 1
fi
