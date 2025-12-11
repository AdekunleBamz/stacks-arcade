# Stacks Arcade

Playground of Stacks smart-contract mini-games with a matching Next.js frontend and curated learning resources.

## Layout
- `stacks-arcade/` — Clarity contracts for each mini-game plus Vitest suites (`npm test`) and Clarinet config.
- `frontend/` — Next.js app for the arcade UI (`npm run dev`, `npm run build`).
- `docs/` — Short gameplay and contract notes (e.g., `docs/games/coin-flip.md`).
- `stacks/` — Stacks knowledge base with a quick index at `stacks/INDEX.md`.

## Quickstart
1. Install dependencies:
   - `cd stacks-arcade && npm install`
   - `cd frontend && npm install`
2. Run contract tests from `stacks-arcade/`:
   - `npm test` for unit tests
   - `npm run test:report` for coverage and cost output
3. Run the frontend from `frontend/`:
   - `npm run dev` then open `http://localhost:3000`

## Notes
- Node.js 18+ is recommended for both workspaces.
- Clarinet CLI is optional for extra contract inspection; core tests run via `vitest` with the Clarinet SDK environment.
