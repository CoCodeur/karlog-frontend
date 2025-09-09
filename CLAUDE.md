# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm run start        # Start Electron app in preview mode
```

### Building
```bash
npm run build        # Type check and build for production
npm run build:win    # Build Windows executable
npm run build:mac    # Build macOS executable  
npm run build:linux  # Build Linux executable
```

### Code Quality
```bash
npm run lint         # Run ESLint and auto-fix issues
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript type checking for both main and renderer processes
```

## Architecture

This is an Electron application built with Vue 3, TypeScript, and Vite. The application is structured into three main processes:

### Main Process (`src/main/`)
- Entry point: `src/main/index.ts`
- Handles Electron app lifecycle and window management
- Manages IPC communication with renderer process
- Includes NFC functionality integration
- Configured for secure preload script usage

### Preload Scripts (`src/preload/`)
- Security layer between main and renderer processes
- Exposes safe APIs to renderer via context isolation

### Renderer Process (`src/renderer/src/`)
- Vue 3 application with TypeScript
- Uses Pinia for state management
- Vue Router for navigation
- Organized into:
  - `components/` - Reusable Vue components
  - `composables/` - Vue composition API hooks (e.g., useToast)
  - `stores/` - Pinia stores for state management
  - `services/` - Business logic and API calls
  - `types/` - TypeScript type definitions
  - `views/` - Page-level components
  - `router/` - Route configuration
  - `assets/` - Static assets and styles

## Key Technologies
- Electron with Vite for development tooling
- Vue 3 with Composition API
- TypeScript throughout
- Pinia for state management
- Chart.js for data visualization
- Axios for HTTP requests
- NFC integration via nfc-pcsc
- Serial port communication
- FontAwesome icons

## Development Notes

### Path Aliases
- `@renderer` maps to `src/renderer/src/` for clean imports

### API Configuration
- Development and production API URL: `http://91.108.122.35:3000`
- API proxy configured at `/api` route during development

### Environment Variables
- Supports `VITE_` and `ELECTRON_` prefixed environment variables
- API URL configured via build-time environment variables

### Type Safety
- Separate TypeScript configurations for Node.js (`tsconfig.node.json`) and web (`tsconfig.web.json`)
- Type checking runs for both main and renderer processes
- Centralized type definitions in `src/renderer/src/types/`