# Progress tracker

> **Deadline: Monday, October 26, 2026, 9:00 AM Pacific (12:00 PM ET).** Submit a day early.
> Last updated: October 7, 2026.

Legend: ✅ done · 🟡 done as a draft, needs a human check · ⬜ to do · 🙋 must be done by Arthur or Aiden (not by AI)

---

## At a glance

| Area | Status |
|---|---|
| Repo, build, CI, tests | ✅ |
| Rules engine (dated, per-person, three-valued) | ✅ |
| 16 programs encoded with sources | 🟡 researched and sourced; each rule still needs Arthur's personal check |
| Persona test suite (36 households) | ✅ |
| Rule linter (schema, sources, dates, 90-day check, translations) | ✅ |
| English interface | ✅ |
| Spanish and Armenian | 🟡 complete drafts; **native-speaker review required** |
| Results by person, "as of" date, why/why not, near misses | ✅ |
| Printable bilingual plan | ✅ |
| Privacy (on-device, CSP, no network) | ✅ |
| Help directory with bus/rail directions | ✅ |
| Quick exit, offline/installable app | ✅ |
| Live website (GitHub Pages) | ✅ https://arthurtunyan.github.io/benefits-matcher/ |
| Outside review, demo video, written answers | 🙋 |

---

## What's done

### Setup
- ✅ Git repo with `main` branch, MIT license, `.gitignore`
- ✅ Vite + React + TypeScript, no backend
- ✅ `npm test` (Vitest) — 483 tests passing
- ✅ GitHub Actions: tests + type-check + build on every push and pull request, plus a **weekly run** so stale rules (not checked in 90 days) turn the badge red
- ✅ Deploys to GitHub Pages on every push to `main`: https://arthurtunyan.github.io/benefits-matcher/
- ✅ Issue form for reporting a rule change, pull-request checklist

### Rules engine (`src/engine.ts`)
- ✅ Rules are JSON data with `effective.from` / `effective.to`, evaluated **as of any date**
- ✅ Every condition returns **pass / fail / unknown**; a skipped question gives "Possibly", never "No"
- ✅ Per-person and household-wide programs
- ✅ Dated income tables (FPL, CalFresh, WIC, CalWORKs, CARE, LifeLine, LIFE, CSPP, CAPI), so FPL updates are data edits
- ✅ "Could get *full-scope* if: pregnant" — better options that are one answer away
- ✅ Near misses: income within 10% above a limit is flagged with the dollar amount
- ✅ "Unsure" values (e.g. "other lawful status") return Possibly instead of guessing
- ✅ Programs hidden when irrelevant (no WIC card for a 40-year-old man)

### Programs (`rules/programs/`)
Medi-Cal (full and restricted, with 2024–2027 dated rules), Covered California (2025, 2026, 2027 rules), CalFresh (including H.R. 1), CFAP (including the planned Oct 2027 expansion), CalWORKs (child-only cases, $450 work deduction), WIC (Medi-Cal/CalFresh/CalWORKs count automatically), Head Start / Early Head Start / State Preschool, SUN Bucks, CAPI, California LifeLine, LA Metro LIFE, SCE CARE/FERA, SoCalGas CARE, LADWP EZ-SAVE, BWP Lifeline, Glendale Care.

### Interface
- ✅ Welcome screen in 3 languages, "See an example family" button (also at `/#example`)
- ✅ Household form: ZIP fills in the area and utilities; income can be skipped; immigration status optional
- ✅ Results by person with a status dropdown right on each person (the demo "child toggle")
- ✅ "As of" date picker with Today / Dec 2025 / Jul 2027 shortcuts
- ✅ "Why?" panel: plain-language rule, every condition with ✓ / ✗ / ?, your value, source link, dates, rule ID
- ✅ "Good to know": universal school meals, public charge guide link, SSI, clinics
- ✅ Help directory by area, with language list, phone, website, and Google Maps transit directions
- ✅ Bilingual printable plan (your language + English) with a merged document checklist
- ✅ Quick exit, skip link, focus moves to each new screen, dark mode, works on 375px phones with no sideways scrolling
- ✅ Fonts and icons bundled (no Google Fonts call); Armenian fonts load only when Armenian is on screen

---

## 🙋 What Arthur and Aiden need to do (in order)

1. ✅ ~~Make the repo public so the site goes live.~~ Done Oct 7 — live at https://arthurtunyan.github.io/benefits-matcher/ (every push to `main` redeploys).
2. **Arthur: check every rule yourself** (about 2–3 hours). For each rule in `rules/programs/*.json` and each table in `rules/tables.json`, open the `source`, confirm the numbers and dates, then change `"verifiedBy": "claude-draft"` to `"verifiedBy": "Arthur"` and set `lastVerified` to that day. Items flagged ⚠️ in [docs/SOURCES.md](docs/SOURCES.md) matter most.
3. **Aiden: get native-speaker review** of `src/i18n/es.json` and `src/i18n/hy.json` (Armenian is Eastern Armenian; ask whether Western Armenian is better for your audience). Fix anything they mark. No legal term should go out unreviewed.
4. **Test on a real, inexpensive Android phone** over cellular data. Add the app to the home screen, turn on airplane mode, and confirm it still opens.
5. **Outside review (big credibility boost):** ask a benefits navigator or legal aid worker (for example Neighborhood Legal Services' Health Consumer Center, 1-800-896-3202) to look at 10 personas from `tests/personas.json`. Record who reviewed and what changed in `docs/SOURCES.md`.
6. **Record the demo video** using [docs/SUBMISSION.md](docs/SUBMISSION.md#demo-video-script-about-3-minutes). Practice the DevTools Network-tab moment.
7. **Write the submission answers in your own words.** The outlines in `docs/SUBMISSION.md` are only starting points. Add a real, specific moment from your own community to "What inspired it?".
8. **Fill in the AI disclosure** in `docs/SUBMISSION.md` honestly, including this session.
9. **Submit by Sunday, October 25.** The portal closes Monday, October 26 at 9:00 AM Pacific.

---

## Research findings that changed the original brief

These came up while checking sources on October 7, 2026. The rules data uses the newer facts.

| Brief said | What sources say now | Where |
|---|---|---|
| Medi-Cal adult dental for undocumented adults ended July 1, 2026 | The 2026–27 budget **moved it to July 1, 2027** | Health Access and CIPC, June 30, 2026 |
| Refugees who lose federal CalFresh → "check CFAP" | **Most can't get CFAP either** (survivors of domestic violence are an exception). The app says so and points to food banks and 211 | LA DPSS ePolicy 63-405 |
| H.R. 1 CalFresh change hits "new applicants from April 1, 2026" | Also hits **current recipients at their next renewal** after April 1, 2026 | CDSS H.R. 1 FAQ |
| (not in brief) | Federal Medi-Cal funding for refugees/asylees/parolees ended **Oct 1, 2026**. California pays for full scope **through June 30, 2027**, then restricted scope is scheduled | DHCS H.R. 1 fact sheet; 2026–27 budget |
| "Verify current status of My Health LA" | **My Health LA ended January 31, 2024** (members moved to Medi-Cal). Community clinics are shown instead | LA County DHS |
| $30 Medi-Cal premium from July 1, 2027 | Still planned; the amount ($30–$50) will be decided in the May 2027 budget | 2026–27 budget |
| (not in brief) | CalFresh work rules for ages 18–64 started **June 1, 2026** | LA DPSS H.R. 1 page |
| (not in brief) | Enhanced Covered California subsidies **ended Dec 31, 2025**; the 400% "cliff" is back in 2026 | Covered California resources |
| (not in brief) | California LifeLine income limits now vary by household size (1 person: $24,600/yr from June 1, 2026) | CPUC fact sheet, May 2026 |
| (not in brief) | Head Start can't require immigration papers; a court vacated the 2025 HHS reinterpretation on Sept 21, 2026 | CSBA; court reports |
| (not in brief) | The 2022 public charge rule stayed in effect only until **Sept 18, 2026**. The app links to California's official guide instead of explaining it | CalHHS public charge guide |
| "Still to gather: district numbers" | **CA-30 (ACS 2024 1-year):** 741,397 people; 11.9% below poverty; 48.4% speak a language other than English at home; 37.1% foreign-born; median household income $89,846 | [Census Reporter](https://censusreporter.org/profiles/50000US0630-congressional-district-30-ca/) |

---

## Deliberate simplifications (known limits)

These are honest shortcuts for a screener. Each is a good "what we'd build next" answer for judges.

- **Household = everyone entered.** Real CalFresh and CalWORKs households can be smaller (who buys and cooks together). The household-size estimate may be high.
- **One income number for the whole home.** No deductions for rent, child care, or medical costs. Households with someone 60+ or disabled get a note that different rules may still qualify them.
- **CalWORKs** uses the applicant income test (MBSAC) with one $450 work deduction; it doesn't check assets or time limits.
- **CAPI** compares household income to the individual/couple payment level; sponsor income and living arrangements aren't modeled (shown as notes).
- **Utility territory** comes from a ZIP table covering CA-30 and nearby areas; split ZIPs ask the user. Pasadena Water and Power discounts aren't encoded yet.
- **LA County check** uses ZIP prefixes (900–918 plus Antelope Valley), with a small exclusion list for San Bernardino ZIPs.
- **"As of" range** is October 1, 2025 to December 31, 2027 — the period our tables cover. Some tables (LifeLine, EZ-SAVE, LIFE, State Preschool) only have their current version, so older dates show "Possibly" with "we don't have this limit for that date".
- **Medi-Cal** uses 138% / 213% / 266% FPL with the household size entered; MAGI details (tax households, 5% disregard) and the asset test are not modeled (asset test shown as a note).
- **Help directory** is a list with transit links instead of a map (no map tiles = no location leak). An opt-in map could be added later.

---

## Backlog (only after everything above)

- ⬜ Interactive aid map (Leaflet, loads only when opened, user picks an area)
- ⬜ Korean, Chinese, Tagalog, Russian (add a JSON file in `src/i18n/` — the linter checks every key)
- ⬜ CalFresh estimate with rent/utility deductions
- ⬜ More ZIPs in `rules/zips.json` (all of LA County)
- ⬜ Pasadena Water and Power and LADWP senior Lifeline programs
- ⬜ A "disaster mode" (D-SNAP and recovery programs after a declared emergency — relevant after the 2025 LA wildfires)
- ⬜ Printed QR-code flyers for libraries, school counselors, and clinics
- ⬜ Publish the `rules/` dataset as its own package so other screeners can reuse it

---

## Log

| Date | What happened |
|---|---|
| 2026-10-07 | Repo made public; site live on GitHub Pages. CI actions updated to current versions. |
| 2026-10-07 | Repo created. Researched and encoded 16 programs with sources; built engine, interface, 3 languages, bilingual plan, 36 personas, rule linter, CI, and docs. |
