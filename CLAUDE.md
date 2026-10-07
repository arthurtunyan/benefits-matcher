# Benefits Matcher

Private, client-only benefits screener for LA County (2026 Congressional App Challenge, CA-30). React + Vite + TypeScript, no backend.

- `npm run dev` · `npm test` · `npm run build`
- Rules are data: `rules/programs/*.json` (schema: `rules/program.schema.json`), income tables in `rules/tables.json`. Never edit a rule's past behavior — end it with `effective.to` and add a new rule.
- Every rule/table needs an https `source`, `lastVerified` within 90 days, and `verifiedBy`. `tests/rules.test.ts` enforces this plus translation parity.
- Expected results live in `tests/personas.json`; add a persona for every rule change.
- UI text lives in `src/i18n/{en,es,hy}.json`. Every key must exist in all three. Official program names stay in English.
- Privacy is a hard requirement: no network calls, analytics, cookies, or third-party scripts. The production CSP sets `connect-src 'self'`.
- Track work and open items in `PROGRESS.md`.
