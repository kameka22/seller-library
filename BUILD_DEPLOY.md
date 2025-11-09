# Guide de Build et Déploiement

Ce document explique comment builder et déployer une nouvelle version de Seller Library.

## Prérequis

### Pour le build
- Node.js et npm installés
- Rust et Cargo installés
- Tauri CLI configuré

### Pour le déploiement
- **GitHub CLI (gh)** installé : `brew install gh`
- Authentification GitHub : `gh auth login`
- Droits d'écriture sur le repository `kameka22/seller-library`

## Workflow de Release

### 1. Préparer la nouvelle version

#### a) Mettre à jour la version dans `src-tauri/Cargo.toml`
```toml
[package]
version = "0.1.1"  # Nouvelle version
```

#### b) Mettre à jour `latest.json`
```json
{
  "version": "0.1.1",
  "notes": "Description des changements\n- Nouveau feature 1\n- Correction bug 2\n- Amélioration 3",
  "pub_date": "2024-11-10T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "",
      "url": "https://github.com/kameka22/seller-library/releases/download/0.1.1/seller-library_0.1.1_aarch64.app.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "",
      "url": "https://github.com/kameka22/seller-library/releases/download/0.1.1/seller-library_0.1.1_x64.app.tar.gz"
    }
  }
}
```

**Important :**
- La version dans `latest.json` doit correspondre à celle de `Cargo.toml`
- Les URLs doivent pointer vers le bon tag de release
- Les notes de version utilisent `\n` pour les sauts de ligne

#### c) Committer les changements
```bash
git add src-tauri/Cargo.toml latest.json
git commit -m "Bump version to 0.1.1"
git push
```

### 2. Builder l'application

Lancez le script de build :
```bash
./build.sh
```

**Ce script va :**
1. ✅ Vérifier que `latest.json` existe
2. ✅ Comparer les versions (Cargo.toml vs latest.json)
3. ✅ Nettoyer les anciens builds
4. ✅ Builder l'application avec `npm run tauri build`
5. ✅ Détecter l'architecture (aarch64 ou x64)
6. ✅ Créer l'archive `.tar.gz` dans `src-tauri/target/release/bundle/macos/`

**Sortie :**
```
✅ Build terminé avec succès !
📦 Version: 0.1.1
💻 Architecture: aarch64
📁 Archive: seller-library_0.1.1_aarch64.app.tar.gz
📊 Taille: 15M
📍 Chemin: src-tauri/target/release/bundle/macos/seller-library_0.1.1_aarch64.app.tar.gz
```

### 3. Déployer sur GitHub

Lancez le script de déploiement :
```bash
./deploy.sh
```

**Ce script va :**
1. ✅ Vérifier que `gh` est installé et authentifié
2. ✅ Récupérer la version depuis `Cargo.toml`
3. ✅ Vérifier que l'archive existe
4. ✅ Extraire les notes de version depuis `latest.json`
5. ✅ Demander confirmation
6. ✅ Créer le tag Git (ex: `0.1.1`)
7. ✅ Pousser le tag sur GitHub
8. ✅ Créer la release sur GitHub
9. ✅ Uploader l'archive `.tar.gz`
10. ✅ Uploader `latest.json`

**Sortie :**
```
✅ Déploiement terminé avec succès !
🔗 URL de la release: https://github.com/kameka22/seller-library/releases/tag/0.1.1
📦 Fichiers uploadés:
   - seller-library_0.1.1_aarch64.app.tar.gz
   - latest.json
```

## Exemple complet

```bash
# 1. Modifier la version dans Cargo.toml et latest.json
vim src-tauri/Cargo.toml
vim latest.json

# 2. Committer
git add src-tauri/Cargo.toml latest.json
git commit -m "Bump version to 0.1.1"
git push

# 3. Builder
./build.sh

# 4. Déployer
./deploy.sh
```

## Gestion des erreurs

### Erreur : "GitHub CLI (gh) n'est pas installé"
```bash
brew install gh
gh auth login
```

### Erreur : "Archive non trouvée"
Lancez d'abord `./build.sh` avant `./deploy.sh`

### Erreur : "Le tag existe déjà"
Le script vous demandera si vous souhaitez supprimer et recréer le tag. Répondez `y` pour continuer.

### Erreur : "Version dans latest.json != version Cargo.toml"
Le script vous avertira. Vous pouvez :
- Corriger la version dans `latest.json`
- Ou continuer en répondant `y` (non recommandé)

## Vérification de la mise à jour

Après le déploiement, les utilisateurs verront :
1. Au lancement de l'app ou toutes les 30 minutes : vérification automatique
2. Si mise à jour disponible : badge jaune à côté de la version
3. Clic sur le badge : modal avec détails et bouton de mise à jour
4. Téléchargement, installation et redémarrage automatique

## Notes

- Les archives `.tar.gz` ne sont **pas** versionnées dans Git (`.gitignore`)
- Le fichier `latest.json` **doit** être versionné et mis à jour à chaque release
- Les releases sur GitHub sont **publiques** et accessibles à tous
- Le système de mise à jour fonctionne uniquement pour **macOS** actuellement
