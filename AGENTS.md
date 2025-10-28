# Repository Guidelines

## Project Structure & Module Organization
The workspace is split into `backend/` (Express + Socket.IO server in `server.js`) and `frontend/` (Vue 3 + Vite). Client code lives in `frontend/src/`, with UI components under `components/` and real-time helpers in `services/communicationManager.js`. Static assets are served from `frontend/public/`, and production bundles land in `frontend/dist/`.

## Build, Test, and Development Commands
Run `npm install` separately in `backend/` and `frontend/`. Start the realtime API with `npm start` from `backend/` (listens on port 8088). Develop the Vue app with `npm run dev` inside `frontend/`; add `--host` when testing on other devices. Use `npm run build` to create the production bundle and `npm run preview` to smoke-test the build locally.

## Coding Style & Naming Conventions
JavaScript uses ES modules, 2-space indentation, and single quotes for strings. Favor `const`/`let` over `var` and camelCase for variables and functions. Vue single-file components stay in PascalCase (`GameEngine.vue`), while composables/utilities use lowerCamelCase filenames. Linting is manual—run a formatter such as `npx eslint` or `npm run lint` once a config is added, and submit the config with accompanying instructions.

## Testing Guidelines
Automated testing is pending. When adding coverage, place Vue unit tests under `frontend/src/__tests__/` using Vitest + Vue Test Utils, and group integration tests that hit the WebSocket API under `frontend/tests/e2e/` or `backend/tests/` using your preferred runner (e.g., Jest + Supertest). Mirror socket event scenarios (connect, disconnect, `setPlayerName`, `updatePlayerList`) and document any fixtures. Share coverage goals in the PR description until a baseline is codified.

## Commit & Pull Request Guidelines
No Git history is bundled, so adopt conventional commit prefixes (`feat:`, `fix:`, `chore:`) with imperative summaries under 72 chars. Squash local work before opening a PR. Each PR should include: goal-oriented description, testing notes (or "Tests: not run"), screenshots/GIFs for UI changes, and a checklist of impacted areas (frontend/backend). Link issues or task IDs when available and tag reviewers who own the affected module.

## Socket & Configuration Tips
Backend and frontend expect matching ports and event names; adjust only via environment variables or clearly documented constants. When deploying, ensure CORS settings in `backend/server.js` are tightened from the development `origin: "*"` default, and verify the frontend build points to the correct WebSocket URL.
