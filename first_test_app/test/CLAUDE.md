# Project guide

Node.js 22+ project using ES modules (`"type": "module"`), plain JavaScript.

## Commands

- `npm start`: run `src/index.js` (loads `.env` if present)
- `npm run dev`: run with auto-restart on file changes
- `npm test`: run tests with the built-in `node:test` runner
- `npm run lint` / `npm run lint:fix`: ESLint
- `npm run format` / `npm run format:check`: Prettier
- `npm run check`: lint + format check + tests. Run this before calling a task done.

## Layout

- `src/`: application code; `src/index.js` is the entry point
- `test/`: tests, named `*.test.js`, mirroring `src/`

## Conventions

- ES module syntax only (`import`/`export`); no `require`, no `__dirname`
  (use `import.meta.dirname` / `import.meta.filename`).
- Prefer Node built-ins (`node:fs/promises`, `node:test`, `fetch`) over new dependencies.
  Ask before adding a dependency.
- Use `async`/`await`, not callbacks.
- Add or update tests alongside every behavior change.
- Configuration comes from environment variables; document new ones in `.env.example`.
  Never commit `.env` or secrets.
