# Agent Notes

## Project Shape
- This is a local resume portfolio editor.
- Static frontend files live in `public/`.
- The Node HTTP server is `server.js`.
- The canonical resume content is `data/resume.json`.
- Run the app with `npm run dev` or `npm start`, then open `http://localhost:5173`.

## Editing Rules
- Treat `data/resume.json` as user-owned resume content. Make targeted edits only.
- Avoid rewriting `data/resume.json` through PowerShell JSON conversion because it can corrupt Chinese text encoding. Prefer small `apply_patch` edits or Node-based validation only.
- Keep `public/script.js` valid JavaScript after any text edits; run `node --check public\script.js`.
- Validate resume JSON with `node -e "JSON.parse(require('fs').readFileSync('data/resume.json','utf8'))"`.

## Styling Notes
- Screen styling and print/PDF styling are intentionally separate.
- Print/PDF rules are in `public/styles.css` under `@media print`.
- Preserve the visual resume layout unless the user explicitly asks for a denser ATS-style resume.
- The print version hides `.english-block` to reduce PDF length while keeping the on-screen English toggle available.

## Current Resume Direction
- Positioning: System Analyst / Developer moving toward backend, data integration, and general software engineering roles.
- Important keywords already represented include API integration, FHIR, database work, Docker, SDLC, data structures, and algorithms.
