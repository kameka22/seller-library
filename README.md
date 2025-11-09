# Seller Library

Application multi-plateforme pour gérer des objets mis en vente sur des plateformes type eBay, Leboncoin.

## Fonctionnalités

- Gestion d'une collection d'objets (nom, description, année, poids)
- Gestion de photos avec arborescence en temps réel
- Association de photos aux objets
- Éditeur d'images léger (resize, luminosité, contraste)
- Suivi des plateformes de vente

## Architecture

- **Backend**: Rust (Actix-web, SQLx)
- **Frontend**: React + Tailwind CSS + Vite
- **Base de données**: SQLite

## Installation

### Backend (Rust)

```bash
cd src/backend
cargo build
cargo run
```

Le serveur démarre sur `http://127.0.0.1:8080`

### Frontend (React)

```bash
cd src/frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:3000`

## Structure du projet

```
seller-library/
├── src/
│   ├── backend/          # API Rust
│   │   ├── src/
│   │   └── Cargo.toml
│   └── frontend/         # Interface React
│       ├── src/
│       ├── public/
│       └── package.json
├── CLAUDE.md
└── README.md
```

## Développement

Le projet est en cours de développement initial.
