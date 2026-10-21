# Repository Guidelines

## Project Structure & Module Organization

This is a Vite-powered JavaScript game with a Capacitor Android wrapper.

- `src/game/` contains game state and mechanics such as economy, upgrades, prestige, and achievements.
- `src/ui/` contains DOM-facing interfaces; `src/systems/`, `src/storage/`, `src/api/`, and `src/audio/` contain cross-cutting services.
- `src/utils/` holds shared helpers; `src/assets/`, `public/`, and `music/` hold web assets and audio.
- `android/` contains the generated/native Android project. Update web code first, then synchronize Capacitor as needed.

## Build, Test, and Development Commands

Run these commands from the repository root:

- `npm install` installs the locked JavaScript dependencies.
- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` creates the production bundle in `dist/` and is the primary validation command.
- `npm run preview` serves the built bundle locally for production-like checks.
- `./deploy.sh` builds and deploys Firebase Hosting; use only when deployment is intended and Firebase CLI credentials are configured.

There is no configured JavaScript test runner or lint script. Manually verify clicking, persistence, authentication, ranking, audio, responsive layouts, and offline behavior when changing those areas.

## Coding Style & Naming Conventions

Use ES modules and two-space indentation. Keep classes and class files in `PascalCase` (for example, `SaveManager.js`), functions and variables in `camelCase`, and constants in `UPPER_SNAKE_CASE`. Prefer focused modules and preserve the existing relative-import style. Keep user-facing text consistent with the current Portuguese UI. Put environment-specific values in `.env` using the `VITE_` prefix; use `.env.example` as the template and never commit secrets.

## Testing Guidelines

No automated coverage requirement currently exists. For each change, run `npm run build` and exercise the affected browser flow with `npm run dev`. When adding tests, keep them near the related module and use descriptive behavior-based names.

## Commit & Pull Request Guidelines

Recent commits use concise Conventional Commit-style prefixes such as `feat:` and `fix:` (often written in Portuguese). Follow that pattern, for example: `feat: adiciona bônus de combo`. Pull requests should explain the user-visible impact, list validation steps, link related issues when applicable, and include screenshots or a short recording for UI changes. Call out required environment variables or Firebase/Android setup explicitly.
