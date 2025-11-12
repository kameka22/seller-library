#!/bin/bash

# Script to bump version across all app files
# Usage: ./bump.sh <version>
# Example: ./bump.sh 0.3.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version argument required${NC}"
    echo "Usage: ./bump.sh <version>"
    echo "Example: ./bump.sh 0.3.0"
    exit 1
fi

NEW_VERSION=$1

# Validate semantic versioning format (X.Y.Z)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format${NC}"
    echo "Version must be in semantic versioning format: X.Y.Z (e.g., 0.3.0)"
    exit 1
fi

echo -e "${YELLOW}Bumping version to ${NEW_VERSION}...${NC}\n"

# Get current version from package.json
CURRENT_VERSION=$(grep -oP '"version":\s*"\K[^"]+' package.json | head -1)
echo -e "Current version: ${CURRENT_VERSION}"
echo -e "New version: ${NEW_VERSION}\n"

# Update package.json
echo "Updating package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
else
    # Linux
    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
fi
echo -e "${GREEN}✓ package.json updated${NC}"

# Update src-tauri/Cargo.toml
echo "Updating src-tauri/Cargo.toml..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
else
    # Linux
    sed -i "s/^version = \"$CURRENT_VERSION\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
fi
echo -e "${GREEN}✓ src-tauri/Cargo.toml updated${NC}"

# Update src-tauri/tauri.conf.json
echo "Updating src-tauri/tauri.conf.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json
else
    # Linux
    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json
fi
echo -e "${GREEN}✓ src-tauri/tauri.conf.json updated${NC}"

# Update Cargo.lock if it exists
if [ -f "src-tauri/Cargo.lock" ]; then
    echo "Updating src-tauri/Cargo.lock..."
    cd src-tauri
    cargo update -p seller-library --quiet 2>/dev/null || true
    cd ..
    echo -e "${GREEN}✓ src-tauri/Cargo.lock updated${NC}"
fi

echo -e "\n${GREEN}✨ Version successfully bumped to ${NEW_VERSION}!${NC}\n"
echo "Files updated:"
echo "  • package.json"
echo "  • src-tauri/Cargo.toml"
echo "  • src-tauri/tauri.conf.json"
if [ -f "src-tauri/Cargo.lock" ]; then
    echo "  • src-tauri/Cargo.lock"
fi
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: git diff"
echo "  2. Commit changes: git add -A && git commit -m \"Bump version to ${NEW_VERSION}\""
echo "  3. Create tag: git tag v${NEW_VERSION}"
echo "  4. Push: git push && git push --tags"
