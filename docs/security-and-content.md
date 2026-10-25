# Security, textbook content and data flow

## What leaves the browser, and what the server does with it

| Data | Sent to | Notes |
|---|---|---|
| Student's typed question, language, lab id, activity title | App server, then Google Gemini | No name, account or device id. |
| Lab "state" text and recorded-data table | App server, then Gemini | **Reported by the lab page, not verified by the server** (see below). |
| Lab curriculum summary (`assistantContext`) | App server, then Gemini | Built into the front-end bundle. |
| Up to 4 textbook passages | Gemini only | Chosen on the server from `server/textbook/index.json`. Never sent to the browser. |

Google's free tier may use submitted content to improve its products. Use a paid key, or do not use the live assistant, when that is not acceptable for student data.

## Experiment state: what is and is not verified

The simulation engines run in the browser. The server receives text, so it cannot re-run them. `server/labState.js`:

- rejects state whose shape does not match the named lab (blocks pasted prose and prompt-injection text);
- cross-checks the numbers where the text allows it: Electricity (`V = I·R`, `P = V·I`, battery current = `V / Req`) and Motion (`speed = |v|`, `distance ≥ |displacement|`). Heat and Chemistry are checked for shape only;
- passes the values to the model as *reported by the lab page* inside fenced data blocks, and the UI says the same ("reported by the lab on this page; the server checked that they are consistent" or "... not re-checked by the server").

A student who edits their own browser can still send self-consistent fake numbers. That only affects their own answer; nothing is stored or shared.
Making the numbers fully server-verified would require sending the circuit/motion configuration and running the engine on the server (the engines are TypeScript in `src/`), which was not done.

## Secrets

- Keys live only in `.env` / the server environment (`.env` is git-ignored; `.env.example` has no values).
- Logs contain provider, model, language, lab, HTTP status or error category, passage counts and timing, never keys, questions, prompts, answers or lab state.
- Verified: no key-like string in the source tree, none in `dist/`, and `.env` / `server/` are not served over HTTP.

## The extracted textbook index

`server/textbook/index.json` contains text extracted from two Ministry of Education and Higher Education (Qatar) Grade 10 science textbooks. That text is the Ministry's copyrighted material.

- It is **git-ignored** so it cannot be pushed to a public repository by accident, and it is used only on the server (it is not in `dist/`, not served, and API responses carry citations, not passage text).
- Only short passages (up to four, about 900 characters each) are sent to Gemini per question.
- Before sharing the repository, a demo build, or a container image outside the organisation, confirm that the Ministry / publisher permits it, or ship without the index. The server then runs without textbook retrieval (answers are labelled as not textbook-supported) and the index can be rebuilt from the licensed PDFs with `python scripts/build-textbook-index.py <physics-s2.pdf> <chemistry-s1.pdf>`.
- Do not upload the PDFs or the index to external services other than the Gemini calls described above.

## Retrieval quality and citation checks

- `node server/eval/evaluate.js [retrieval-heldout.json]` prints a per-question report on the evaluation sets in `server/eval/`. Gold page ranges come from the books' tables of contents and `docs/curriculum-mapping.md`; every in-scope question also names an evidence term that must occur in a gold-range passage, and a test checks that.
- A citation is shown only if (1) the model named a passage that was really retrieved for that question, and (2) the answer's textbook terms and numbers are found in the cited passages. Otherwise the answer is labelled "partly supported" or as having no textbook support (see `supportOf` in `server/textbook.js`). This is a lexical check, not proof of meaning.
