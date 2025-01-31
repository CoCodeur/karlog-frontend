# Karlog Frontend

Application de gestion pour garages automobiles développée avec Electron et Vue.js.

## Structure du Projet

```
src/
├── main/           # Configuration Electron et point d'entrée de l'application
├── preload/        # Scripts de préchargement Electron pour la sécurité
└── renderer/       # Application Vue.js
    └── src/
        ├── assets/       # Ressources statiques (images, fonts, etc.)
        ├── components/   # Composants Vue réutilisables
        ├── composables/  # Hooks Vue composables (logique réutilisable)
        ├── router/       # Configuration des routes de l'application
        ├── services/     # Services pour la logique métier et les appels API
        ├── stores/       # Gestion de l'état global (Pinia)
        ├── styles/       # Styles globaux et variables CSS
        ├── types/        # Types TypeScript et interfaces
        └── views/        # Composants de pages/vues
```

## Description des Dossiers

### Niveau Racine
- `main/`: Contient la configuration Electron et le point d'entrée principal de l'application desktop
- `preload/`: Scripts de préchargement Electron pour la communication sécurisée entre les processus
- `renderer/`: Application Vue.js principale

### Application Vue.js (renderer/src)
- `assets/`: Contient les ressources statiques comme les images, les polices et autres fichiers médias
- `components/`: Composants Vue réutilisables (boutons, cartes, formulaires, etc.)
- `composables/`: Hooks Vue personnalisés pour la réutilisation de la logique (ex: useToast)
- `router/`: Configuration du routeur Vue avec les définitions des routes
- `services/`: Services pour la logique métier, les appels API et l'authentification
- `stores/`: Gestion de l'état global de l'application avec Pinia
- `styles/`: Fichiers CSS globaux, variables et thèmes
- `types/`: Définitions des types TypeScript et interfaces
- `views/`: Composants de niveau page/vue pour chaque route

## Conventions de Développement

- Les composants sont organisés par fonctionnalité dans le dossier `components/`
- Les styles globaux sont dans `styles/` tandis que les styles spécifiques aux composants sont scoped
- Les types TypeScript sont centralisés dans `types/` pour une meilleure maintenabilité
- Les services sont séparés par domaine fonctionnel dans `services/`

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
