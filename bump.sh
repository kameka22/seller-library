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
CURRENT_VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json | head -1)
echo -e "Current version: ${CURRENT_VERSION}"
echo -e "New version: ${NEW_VERSION}\n"

# Check if version is the same
if [ "$CURRENT_VERSION" = "$NEW_VERSION" ]; then
    echo -e "${YELLOW}⚠️  Warning: New version is the same as current version${NC}"
    echo -e "${YELLOW}   No changes will be made${NC}\n"
    exit 0
fi

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

# Verify that the three main files were actually modified
echo "Verifying changes..."
PACKAGE_VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' package.json | head -1)
CARGO_VERSION=$(grep -m 1 '^version = ' src-tauri/Cargo.toml | sed 's/version = "\(.*\)"/\1/')
TAURI_VERSION=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' src-tauri/tauri.conf.json | head -1)

if [ "$PACKAGE_VERSION" != "$NEW_VERSION" ] || [ "$CARGO_VERSION" != "$NEW_VERSION" ] || [ "$TAURI_VERSION" != "$NEW_VERSION" ]; then
    echo -e "${RED}✗ Error: Version mismatch detected!${NC}"
    echo "  package.json: $PACKAGE_VERSION"
    echo "  Cargo.toml: $CARGO_VERSION"
    echo "  tauri.conf.json: $TAURI_VERSION"
    echo "  Expected: $NEW_VERSION"
    echo ""
    echo "Please check the files and try again."
    exit 1
fi
echo -e "${GREEN}✓ All files correctly updated to version ${NEW_VERSION}${NC}\n"

# Git commit and push
echo "Committing changes..."
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
if [ -f "src-tauri/Cargo.lock" ]; then
    git add src-tauri/Cargo.lock
fi

git commit -m "Bump version to ${NEW_VERSION}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Changes committed${NC}"

    echo "Pushing to remote..."
    git push

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Changes pushed to remote${NC}"
        echo -e "\n${GREEN}🎉 Version ${NEW_VERSION} has been successfully bumped and pushed!${NC}"
    else
        echo -e "${RED}✗ Failed to push changes${NC}"
        echo "Please push manually: git push"
        exit 1
    fi
else
    echo -e "${RED}✗ Failed to commit changes${NC}"
    exit 1
fi
