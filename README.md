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

## Contributing

Stacks Arcade welcomes contributions! Here's how you can help:

### Ways to Contribute
- **Add New Games**: Create new mini-games with Clarity contracts and frontend integration
- **Improve Documentation**: Enhance docs in the `docs/` folder or improve this README
- **Fix Bugs**: Report or fix issues in games or the frontend
- **Add Tests**: Improve test coverage for contracts and frontend
- **Enhance UI/UX**: Improve the arcade interface and user experience

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-game`
3. Make your changes and add tests
4. Run tests: `npm test` in both `stacks-arcade/` and `frontend/`
5. Submit a pull request

### Game Development Guidelines
- Games should be simple but demonstrate key Clarity concepts
- Include comprehensive tests with good coverage
- Add documentation in `docs/games/`
- Ensure mobile-responsive frontend integration

## License

ISC License

Copyright (c) 2024 Adekunle Bamz

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
