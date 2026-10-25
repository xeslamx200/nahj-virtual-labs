# NAHJ Virtual Science Labs — Grade 10

Browser-based science laboratories built on the Grade 10 Science textbooks (Qatar). There are three physics labs (Semester 2, Part 1) and one chemistry lab (Semester 1):

- **Electricity Lab** (Unit 4, flagship) — build circuits with batteries, resistors, bulbs, switches, wires, ammeters and voltmeters; live solving, current-flow view, fault detection, I–V characteristics; four guided activities (Ohm's law V–I, resistance vs current, series vs parallel, combined circuit and power).
- **Motion Lab** (Unit 2) — a cart on a straight track with play/pause/step/reset, velocity and acceleration arrows, x–t and v–t graphs, speed vs velocity, distance vs displacement; four activities.
- **Heat & Matter Lab** (Unit 3) — heating and cooling of water through all three states, a specific-heat comparison of textbook materials, T–t graph, particle model, phase indicators, energy accounting with Q = mcΔT and Q = mL; four activities.
- **Chemistry Lab** (Semester 1, Units 1–2) has three modules and five activities (Bohr distribution, radius trend, balancing, stoichiometry, standard solution):
  - **Periodic table explorer:** verified data for all 118 elements, Bohr shell model with a disclaimer, period and group, radius and metallic-character trends, and reactivity.
  - **Reactions and stoichiometry:** balancing by coefficients only, with an atom inventory, conservation of mass and hints. It also has molar mass, mole conversions and stoichiometry, with every step shown.
  - **Solutions:** molarity, preparing a standard solution, and mass percent.

Plus: Arabic (RTL) and English (LTR) interface, a learning assistant (live AI through the server — Google Gemini, free tier, or Anthropic Claude — or a clearly labelled offline tutor), printable/exportable reports, and a workshop mode with prepared scenarios. Progress is stored only in the browser (no accounts).

See [`docs/curriculum-mapping.md`](docs/curriculum-mapping.md) for how every activity maps to the textbook, and [`docs/workshop-demo-script.md`](docs/workshop-demo-script.md) for a live-demo script.

## Requirements

- Node.js 22.12 or newer and npm (tested with Node 22.22 on Linux). The npm scripts are plain `node` commands, so they also work in the Windows Command Prompt and PowerShell.
- A modern browser (tested with Chromium; see *Testing*).

## Setup

```bash
npm install
cp .env.example .env      # optional: only needed for the live AI assistant
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development: Vite on http://localhost:5173 and the API server on port 8787 (Vite proxies `/api`). |
| `npm run build` | Type-check and build the production bundle into `dist/`. |
| `npm start` | Serve `dist/` and the API from one port (default 8787): http://localhost:8787 |
| `npm test` | Unit, component and user-journey tests (Vitest + Testing Library, jsdom). |
| `npm run test:e2e` | Browser tests (Playwright, Chromium) against a fresh production build. |
| `npm run typecheck` | TypeScript only. |

The app is a static single-page app (hash routing), so `dist/` can also be hosted on any static host; without the Node server the assistant simply runs in its offline mode.

## Deploying

See [`docs/deployment.md`](docs/deployment.md) (Arabic): Vercel from a private GitHub repo or the CLI, the environment variables, a post-deploy checklist, and how the private textbook index is handled. `docs/security-and-content.md` covers data flow and copyright.

## Learning assistant and API keys

- The browser never talks to an AI provider directly and never sees a key.
- To enable live answers, put a key in `.env` (loaded automatically by the npm scripts; a missing `.env` is fine) or in the server environment, and restart `npm start` / `npm run dev`:
  - **Google Gemini (free tier):** `GEMINI_API_KEY` from https://aistudio.google.com/apikey. Optional `GEMINI_MODEL` (default `gemini-flash-lite-latest`, about 1–2 s per answer; `gemini-flash-latest` measured 20–80 s). When Google reports the model as overloaded or rate-limited (429/5xx), the server retries once and then tries `GEMINI_FALLBACK_MODELS` in order (default `gemini-flash-latest`). Each model gets `GEMINI_TIMEOUT_MS` (default 15000) before the next is tried. Note that Google's terms allow free-tier content to be used to improve its products; the app sends simulation values, recorded data and the student's typed question, never names or accounts.
  - **Anthropic Claude (paid):** `ANTHROPIC_API_KEY`. Optional `ANTHROPIC_MODEL` (default `claude-opus-5-5`).
  - Gemini is used when its key is set, otherwise Claude. `AI_PROVIDER=gemini|claude` forces one.
  - A variable already set in the system environment (for example a Windows user variable) takes precedence over the same name in `.env`.
  - When a request fails, the server prints `[assistant] request failed: … status=<code> category=<timeout|auth|rate_limited|…>` and the browser falls back to the offline tutor for that answer.
- The server sends Gemini (1) up to four **textbook passages retrieved for that question**, (2) the open lab's curriculum summary, (3) the simulation's current values and the learner's recorded table. Requests are validated, size-limited and rate-limited (20 per minute per IP).
- **Textbook retrieval** (`server/textbook.js`): `server/textbook/index.json` holds ~480 passages of the two Grade 10 books (Semester 2 Part 1 Physics, units 1–4, printed pp. 2–149, excluding assessment pages; Semester 1 Chemistry, units 1–2, pp. 2–102), each with book, unit, lesson and printed page. Passages are ranked with BM25 over normalised Arabic/English terms (no vector database, no extra service), favouring the open lab's unit, and a passage must match at least half of the question's term weight. Nothing is retrieved for topics the books do not cover.
- **Source labels**: the model returns JSON naming which passages it used. The server keeps only ids that were really retrieved and builds the citation (book · unit · lesson · pages) from the index, never from model text. The UI shows *From the textbook* (with citation), *From your current experiment* (only when simulation state was sent), *General science knowledge (not from the textbook)*, or *Source not identified* when the reply could not be verified. Offline answers show *Scripted*.
- **Rebuilding the index** (only needed if the books change): `pip install pymupdf`, then `python scripts/build-textbook-index.py <physics-s2.pdf> <chemistry-s1.pdf>`. The PDFs are not read at runtime. PDF text keeps some Arabic letter-order quirks, so passages are used as context and never quoted to students.
- Server logs hold only provider, model, language, lab, status/category, passage counts and timing, never keys, questions, prompts or answers.
- Without a key, `/api/assistant/status` reports `available: false` and the assistant runs as an **offline guided tutor**: deterministic, rule-based responses built from the curriculum and the live simulation values. It is labelled “scripted responses, not AI-generated”, and each answer carries a **Scripted** tag. AI answers carry an **AI** tag.
- `.env` is git-ignored. No secret is committed.

## Project structure

```
src/
  physics/      pure, tested models — circuit solver (MNA), motion, heat
  chemistry/    pure, tested chemistry engines — elements, shells, formula/equation parser, exact balancer, moles, concentration
  curriculum/   lab and activity definitions from the textbook (both languages)
  labs/         one folder per lab: state store, UI, recorders
  components/   shared UI: lab shell, activity guide, questions, charts, records table
  assistant/    assistant panel and offline tutor
  reports/      report model (fits, checks, summary) and exports
  workshop/     workshop scenarios and page
  i18n/         Arabic/English strings and direction handling
  lib/          formatting, local progress store
server/         Express server: static hosting and the AI endpoint
e2e/            Playwright tests
docs/           curriculum mapping, workshop script
```

The UI, physics, curriculum and AI layers are separate: the physics folder has no UI imports, and the curriculum files contain only data and answer checks.

## Testing

- `npm test` — 179 tests in 11 files (including textbook retrieval, citation validation and assistant source-label tests). The 41 chemistry engine tests check results against the textbook's examples. The rest cover the circuit solver (textbook examples, Kirchhoff's laws, energy conservation, shorts, invalid circuits, meter misuse, filament bulb), motion equations and graph consistency (slope of x–t = v, area under v–t = displacement), heat (Q = mcΔT, phase-change energy accounting, boundaries, conversions), lab recorders and stores (reset, limits, undo), report fits/checks/exports, server request validation, and rendered user journeys (dashboard with four labs, Arabic RTL, recording, keyboard placement, assistant fallback, workshop launch, chemistry element recording, balancing and reset, invalid equations, molar mass, solution preparation), and the offline tutor's chemistry answers.
- `npm run test:e2e` — 12 browser test runs in Chromium (desktop 1440 px; tests tagged @responsive also run at tablet 820 px): building a circuit with the mouse and shorting it, the Ohm's-law activity through to CSV export, motion playback, the heat lab in Arabic, workshop launch, the assistant API without a key, a chemistry journey (element, balancing, solution) and Arabic layout with left-to-right formulas. If Playwright's browser is not installed on your machine, run `npx playwright install chromium` once.

## Assumptions and honest limitations

- **Physics simplifications** (also shown in each lab under “Model assumptions”): ideal batteries, wires and meters; constant resistance except the optional filament bulb (an enrichment model, not a real lamp); point-like cart in one dimension with piecewise-constant acceleration; ideal insulation and uniform temperature for heating; standard pressure; water only for change of state.
- **Textbook value flagged:** Lv(water) = 2430 kJ/kg as printed in the book (most references give ≈ 2260 kJ/kg).
- **Assumed value:** the heater power in Activity a2-3 is not given in the book; the lab uses 100 W and says so.
- **Not simulated:** wire resistance R = ρL/A (Activity c1-4), vector addition (Lesson 1-2), thermal equilibrium/mixing.
- **Chemistry simplifications** (also shown in the lab):
  - The Bohr model is a simplified picture.
  - Atomic radii are shown only where the book prints them; nothing is estimated.
  - Gas volumes use 22.4 L/mol at STP only.
  - Solution preparation is ideal.
  - There is no dilution, because it is not in the textbook.
- **Chemistry textbook inconsistencies flagged:**
  - Rb radius: the figure gives 265 pm, Table 5-1 gives 267 pm.
  - Example 23 truncates to 8.325.
  - The book sometimes uses Zn 65.39, and Fe2O3 159.6 vs 159.7.
  - F2 is given as 37.997.
- **Chemistry dependencies:** no new library was added; the chemistry engines are plain TypeScript.
- **Circuit grid:** parts sit on a 10 × 6 grid; wires are drawn as straight or L-shaped runs. There is no free-form wiring or curved wires.
- **Assistant:** the Gemini path has been confirmed to reach Google with a real key on the owner's machine (it returned a 503 "high demand" response, which led to the retry/fallback logic); a full successful live answer has not been observed here, and Claude has not been exercised with a valid key. The Gemini request/response handling is unit-tested against mocked responses, and the no-key path (status, 503 response, offline tutor) is tested end to end. The default Gemini model alias (`gemini-flash-latest`) should be checked against Google AI Studio; set `GEMINI_MODEL` if it is not available to your key.
- **Browsers/devices:** automated and visual checks were run only in headless Chromium (desktop and tablet widths, plus a 390 px overflow check that includes every chemistry module in both languages). Safari, Firefox, real tablets and projectors have not been tested.
- **Accessibility:** keyboard operation of the circuit canvas (arrow keys, Enter, Delete, Space, Escape), labelled controls, live status text, reduced-motion support and colour-independent status text were implemented; no audit with a screen reader has been done.
- **Branding:** “NAHJ” and the “N” mark are placeholders (see `src/config/brand.ts`). The maroon-and-gold palette and geometric pattern are inspired by the general look of Qatari government education sites, but no official logo, emblem, accreditation or endorsement is used or implied. Colour tokens live at the top of `src/styles/global.css`.
- **Storage:** progress lives in the browser's localStorage on one device; clearing browser data removes it.
