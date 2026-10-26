# Progress tracker

> **Deadline: Monday, October 26, 2026, 9:00 AM Pacific (12:00 PM ET).** Submit a day early.
> Last updated: October 25, 2026.

Legend: ✅ done · 🟡 done as a draft, needs a human check · ⬜ to do · 🙋 must be done by Arthur or Aiden (not by AI)

---

## At a glance

| Area | Status |
|---|---|
| Repo, build, CI, tests | ✅ |
| Rules engine (dated, per-person, three-valued) | ✅ |
| 25 programs encoded with sources (16 benefits + 4 tax credits + 5 disaster) | 🟡 researched and sourced; each rule still needs Arthur's personal check |
| Persona test suite (68 households, every rule exercised) + edge-case and random stress tests | ✅ |
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
- ✅ `npm test` (Vitest) — 795 tests passing, 68 personas; CI fails if any rule is never the one that grants a result to some persona; `tests/fuzz.test.ts` screens and renders 300 random households in all 3 languages
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
**Tax credits:** federal EITC, Child Tax Credit (with the 2025 parent-SSN change), CalEITC, Young Child Tax Credit (works with an ITIN and $0 income). **Disaster help:** FEMA Individual Assistance, SBA disaster loans, Disaster Unemployment Assistance, CalFresh replacement, D-SNAP. Medi-Cal (full and restricted, with 2024–2027 dated rules), Covered California (2025, 2026, 2027 rules), CalFresh (including H.R. 1), CFAP (including the planned Oct 2027 expansion), CalWORKs (child-only cases, $450 work deduction), WIC (Medi-Cal/CalFresh/CalWORKs count automatically), Head Start / Early Head Start / State Preschool, SUN Bucks, CAPI, California LifeLine, LA Metro LIFE, SCE CARE/FERA, SoCalGas CARE, LADWP EZ-SAVE, BWP Lifeline, Glendale Care.

### Interface
- ✅ Welcome screen in 3 languages, "See an example family" button (also at `/#example`)
- ✅ Household form: ZIP fills in the area and utilities; income can be skipped; immigration status optional
- ✅ Results by person with a status dropdown right on each person (the demo "child toggle")
- ✅ "As of" date picker with Today / Dec 2025 / Jul 2027 shortcuts
- ✅ **Money back at tax time** section: four credits with amounts by number of children, ITIN and mixed-status rules, free filing help (VITA, CalFile); totals in the overview as "a year, at tax time"
- ✅ **Disaster mode**: a disaster question on the house (siren on the chimney) with date and what was lost; a Disaster help card right under the overview with a countdown for each deadline (CalFresh replacement 10 days, DUA 30, FEMA 60 + 60 late) and first steps; deadlines also appear in the timeline; go-bag tip on the plan
- ✅ **Rule-change timeline** ("How rule changes reach your family"): runs the household on every day a rule or income table starts or stops (Oct 2025–Dec 2027), lists each change per person (before → after, with the rule and source), marks planned changes, highlights changes between today and the chosen date. Skips days where we only lack an income table. Ages stay as entered.
- ✅ "Why?" panel: plain-language rule, every condition with ✓ / ✗ / ?, your value, source link, dates, rule ID
- ✅ "Good to know": universal school meals, public charge guide link, SSI, clinics
- ✅ Help directory by area, with language list, phone, website, and Google Maps transit directions
- ✅ Bilingual printable plan (your language + English) with a merged document checklist
- ✅ Quick exit, skip link, focus moves to each new screen, opens in light mode (dark mode is a button), works on 320px phones with no sideways scrolling
- ✅ Fonts and icons bundled (no Google Fonts call); Armenian fonts load only when Armenian is on screen

---

## 🙋 What Arthur and Aiden need to do (in order)

0. **Most important: the AI rule.** The 2026 rules say "all coding and technical development must be done by the student" and AI "must not constitute the entirety of the technical development" ([rules PDF](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)). The public repo shows Claude co-authored nearly every commit. Do not hide it (no history rewrites, no deleting `CLAUDE.md`, no going private). Instead: (a) write the AI disclosure honestly in your own words, including what *you* did; (b) consider emailing the CAC with the disclosure and asking whether it's acceptable before Oct 26; (c) make your own contribution real: verify the rules and be able to explain `src/engine.ts` without notes. **Note:** on Oct 22, at Arthur's request, AI agents also fixed the CAPI bug and the other wrong-money bugs (review fixes #4 and #13), so CAPI is no longer a student-written fix. Pick something else to write yourselves (for example the 11+ person table gap under Known issues) and explain it in the video.
1. ✅ ~~Make the repo public so the site goes live.~~ Done Oct 7 — live at https://arthurtunyan.github.io/benefits-matcher/ (every push to `main` redeploys).
2. **Arthur: check every rule yourself** (about 3–4 hours). **As of Oct 19, 0 of 56 rules are checked** (12 tax and disaster rules were added Oct 19 — see the two new sections in [docs/SOURCES.md](docs/SOURCES.md)) — all still say `claude-draft`. The Oct 25 stress test split the `ctc-phaseout-end` table into a tax-year-2024 version ($2,000 a child) and a later one ($2,200); check both. The Oct 22 fixes changed `capi.json`, `calworks.json`, `federal-eitc.json`, `child-tax-credit.json`, `caleitc.json`, `yctc.json` and the new `ctc-phaseout-end` table, so check those closely. Already confirmed on Oct 22 (still check them yourself): the FTB says federal AGI must also be under the CalEITC limit; the IRS says everyone on the EITC return needs a valid SSN, and the full Child Tax Credit is $2,200 per child up to $200,000 ($400,000 joint). For each rule in `rules/programs/*.json` and each table in `rules/tables.json`, open the `source`, confirm the numbers and dates, then change `"verifiedBy": "claude-draft"` to `"verifiedBy": "Arthur"` and set `lastVerified` to that day. Items flagged ⚠️ in [docs/SOURCES.md](docs/SOURCES.md) matter most.
3. **Aiden: get native-speaker review** of `src/i18n/es.json` and `src/i18n/hy.json` (Armenian is Eastern Armenian; ask whether Western Armenian is better for your audience). Fix anything they mark. No legal term should go out unreviewed. The Oct 22 changes added more to check: `ui.eyebrow`, `ui.tagline` (the `*…*` marks the underlined words), `ui.exitShort`, `ui.startHere`, `ui.oneApp`, `ui.exampleBanner`, `ui.checkOwn`, `ui.repHelp`, `ui.repLink`, `ui.earned`, `ui.nearData`, `ui.months` (Armenian month names must be genitive), `ui.dateLong`, `ui.couldGetIf`, `ui.wouldChangeIf`, everything under `ui.when.*` and `ui.skipped.*`, `ui.dependsOnSkipped`, `ui.disasterFuture`, and notes `cw.olderCaretaker`, `capi.ownIncome`, `tax.filerSsn`, `tax.ctcPhaseOut`. The Oct 25 stress test added `ui.zipShort`, `ui.incomeInvalid`, `ui.ageInvalid`. Also some Armenian sentences use ":" where Armenian uses "։". The earlier redesign also added: every `ui` key added after `ui.steps` in `es.json` and `hy.json` (Next button, step names, the answer sentence, the "Not sure" helper questions, dark mode).
4. **Test on a real, inexpensive Android phone** over cellular data. Add the app to the home screen, turn on airplane mode, and confirm it still opens.
5. **Outside review (big credibility boost):** ask a benefits navigator or legal aid worker (for example Neighborhood Legal Services' Health Consumer Center, 1-800-896-3202) to look at 10 personas from `tests/personas.json`. Record who reviewed and what changed in `docs/SOURCES.md`.
5b. **Read the simulated judge review** in `reviews/friedman-review.md` (git-ignored; an AI persona modeled on Rep. Friedman's public record, not from her office). Its team-only items (#1 authorship, #2 hand-check the demo's rules, #11 native review + one real family, #12 video) are yours.
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

## Known issues not fixed yet (from the Oct 19 bug audit and the Oct 22 review)

- ✅ ~~CAPI compares a family of 3+ to the *couple* amount.~~ Fixed Oct 22 by the engineer agent (at Arthur's request): individual vs couple by the number of people who could apply.
- ⬜ The timeline can show a change on the day a *table* starts rather than a rule (e.g. a 3-year-old flips Head Start ↔ State Preschool on Jul 1, 2026 / Jul 1, 2027 because the `cspp` table only covers that year). Oct 22: dates no table covers now fall back to the nearest table when that is safe, so this happens less.
- ✅ ~~FEMA more than 120 days after a disaster lists the 60-day date as "passed".~~ Fixed Oct 22.
- ✅ ~~"Edit answers" / "Answer skipped questions" always reopen at the ZIP question.~~ Now opens at the first unanswered part.
- ✅ ~~Typed values skip the input limits.~~ A future disaster date shows a warning; an age over 120 counts as not answered (Oct 22).
- ✅ ~~Service worker: `index.html` is stale for one visit after each deploy.~~ The page is now network-first (cache `v2`). Old hashed files still pile up until the cache name is bumped (`ponytail:` note in `public/sw.js`).
- ⬜ `calworks-mbsac`, `calworks-map` and `cspp-monthly` have no "each additional person" amount, so homes of 11+ people reuse the largest size (`it.todo` in `tests/edge.test.ts`; needs a verified source). A good student-written fix.
- ✅ ~~The example banner names "Maria, 25" even if someone edits the example family.~~ It now hides after any edit.

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
| 2026-10-25 | **Full stress test and fixes** on Arthur's request. Checked every screen at 320/375/768/1280 px in EN/ES/HY (276 automated checks: no sideways scrolling, no console errors), keyboard use, print, Quick exit, and 300 random households × 7 dates × 3 languages (no crashes, no missing translations, no NaN). **Fixed:** (1) **tapping a person's window could delete them** — the invisible ✕ button's tap area covered the window (one tap on a phone, a second click on desktop); now only the part of the ✕ outside the window is clickable; (2) the app now **always opens in light mode** (dark mode stays as a button; no dark flash before load); (3) typing an invalid income ("abc", "-500") or age ("200") was silently dropped — the field now keeps what was typed and says it isn't counted; the age box is no longer a number spinner (a mouse wheel changed ages); (4) a partial ZIP ("916") counted as answered — now only 5 digits do, with a "ZIP codes have 5 digits" hint, and LA County ZIPs missing from our table say "Area: LA County"; (5) long names pushed the plan and timeline off-screen — text now wraps and names are capped at 40 characters; (6) with 10+ people the house windows spilled over the door and icons — smaller windows for big families; (7) in Armenian on phones the "Make my plan" button was squeezed to 34 px and overflowed; (8) printing the Results page printed the Edit/Make-plan buttons. **Rules:** 6 rules were never tested by any persona (`covered-ca-help-2027`, `calworks-pregnant`, `head-start-up-to-130`, `sce-care`, `ctc-itin-parent-partial`, `dua`) — added 7 personas and a test that fails if any rule goes untested again. Found and fixed a data error: `ctc-phaseout-end` used the tax-year-2025 $2,200 credit for 2025 filing too (tax year 2024 was $2,000, so the joint phase-out ends at $440,000 + $40,000 a child); split into two dated versions (checked against 26 U.S.C. 24 and the Pub. L. 119-21 §70104 effective-date note). Still `claude-draft` like every rule. New es/hy strings need native review: `ui.zipShort`, `ui.incomeInvalid`, `ui.ageInvalid`. |
| 2026-10-24 | **"Doesn't look AI-made" pass** (Leo). Checked the site against a 30-point list of tells that make sites look AI-generated, and fixed every one that applied: our own drawn icons instead of Lucide (and decorative icons removed); no gradients, glow, blur, drop shadows, or radial orbs; tighter corners (3 to 8px); no pastel tints (status chips use a full-color outline); no hover or entrance animations; Bricolage Grotesque instead of Inter; start page points as a plain list instead of three cards; trust row as one sentence instead of checkmark bullets; no arrows on buttons; results count as one sentence instead of number tiles; no em dashes, middle-dot separators, or "not X, it's Y" lines in the interface text, README, and submission doc; emoji removed from the README. Added **Privacy** and **Terms of use** pages, linked from the footer. Not applicable: skeleton loaders (nothing loads from a server), pricing, testimonials. No eligibility logic, data, or questions changed; 771 tests pass. New es/hy text needs native review: `ui.privacyLink`, `ui.termsLink`, `ui.footerLinks`, everything under `legal`, and the reworded `ui.summary`, `ui.overviewCount`, `ui.privacyChip`, `ui.disclaimer`, `ui.notDetermination`, `ui.tmPlanned`, `ui.deadlinePassed`, `ui.heroLead`, `values.sceCare`. |
| 2026-10-22 | **Product-grade visual redesign** on Arthur's request ("look like a well-funded startup or top civic tech org"). Researched 11 live references first (Code for America, GetCalFresh, GOV.UK question pages and type scale, USWDS typesetting and step indicator, mRelief, Benefit Kitchen, Linear, Stripe, Vercel, Notion, Dribbble multi-step forms) plus Radix Colors and Refactoring UI palette guidance. New system in `src/styles.css` (rewritten from scratch, tokens first): one font, Inter (Display optical size for headings), 17px body; warm neutral grays with one Pacific-blue primary `#1b6497`; green/amber/gray for likely/possibly/not; apricot only in the illustration; rounded corners (10–20px), soft shadows; full dark mode. Every page restyled: header, landing (new short headline, one-sentence explanation, trust row: Free · Private · About 5 minutes · No sign-up), question flow (card with segmented progress, larger tiles with clear selected state, **new Back button**), results (stat tiles, benefit cards with an action footer), folds, help, plan, footer, empty state. New logo and app icons; README screenshots refreshed. No eligibility logic, questions, data or routing changed; 771 tests pass. Checked at 375 and 1440 px, light and dark, EN/ES/HY, keyboard focus, no horizontal overflow, tap targets ≥44px. Packages: added `@fontsource-variable/inter`; removed Fraunces, Figtree, Noto Serif Armenian. New es/hy strings need native review: `heroTitle`, `heroLead`, `trustFree`, `trustPrivate`, `trustTime`, `trustNoSignup`, `startCta`. |
| 2026-10-22 | **Recolored from color-preference research** (Arthur felt the colors were off). The cream/forest/mustard palette leaned on olive, khaki and dark-yellow tones, the hues people like least (Palmer & Schloss 2010, PNAS). New palette: a cool, trusted base (deep harbor blue `#1e4a60`, slate ink `#1c2b3a`; blue is the most-liked hue across cultures and reads as competent) with warm accents for warmth (poppy `#f47a4c` main buttons, apricot `#ffb38f` for picked answers and the person you're on, bright sun yellow `#ffc23d` only for small joyful touches), bright warm-white paper (brightness raises pleasantness, Valdez & Mehrabian 1994), jacaranda purple for "possibly" (dark amber text turns brown), ink text on bright amber for warnings, a sky patch and green bushes on the house. Dark mode is a deep harbor night instead of green-black. Every text pair checked at AA in both themes, plus an automated contrast scan of start, household, results and plan (0 failures). App icons, theme colors and README screenshots updated. |
| 2026-10-22 | Finishing pass before pushing: an age over 120 counts as not answered (test added); the example banner hides once the example is edited; the service worker loads the page network-first so a deploy shows at once (cache `v2`); focus no longer jumps to the headline on first load. Checked the IRS EITC and Child Tax Credit pages and the FTB CalEITC limits against the new rules. 771 tests pass. |
| 2026-10-22 | **Team review and fixes** on Arthur's request: an AI persona modeled on Rep. Friedman's public record reviewed the app against the 2026 rules and past winners (`reviews/friedman-review.md`, git-ignored; predicted top 3, held back by unverified rules and AI authorship), then a designer agent and an engineer agent fixed what it found. **Design:** Quick exit shows a word (Exit/Salir/Ելք) and fits at 320–375 px (languages become a dropdown on phones); "Start here" card with the top 3 actions and Apply/Call buttons; tax credits, rules date, timeline and help start closed (Results 42% shorter on a phone); plan grouped by where to apply with deadlines first, merged proof-of-income item, help filtered by the family's area (prints 1 page in English, 2 in Spanish/Armenian); example-family banner; EBT number tap-to-call; out-of-range "as of" date message; "your Representative's office can help" link. **Engineering:** dates with no published table no longer look like lost benefits (Jul 2027 now 9 likely, same as today); Armenian month names in Chromium; skipped answers read as "Depends on answers you left out: age, income…"; "None of these" remembered; form reopens at the first unanswered part; FEMA 120-day date; future disaster date warning; money input rejects "Infinity"/"0x10"/"1e6"; Long Beach gas name; skip link no longer breaks Quick exit; focus stays at the top on first load so Tab reaches Quick exit. **Wrong-money fixes (#4, #13):** Child Tax Credit income phase-out (new `ctc-phaseout-end` table), job question is a real Yes/No, unknown-children limits fail above the largest limit, CalEITC/YCTC total-income cap, CAPI individual vs couple, CalWORKs for an adult 60+/disabled with a younger adult is Possibly, EITC/CTC Possibly with a filer-SSN note when an adult has no SSN. Rules fixed in place (the law didn't change, so no fake timeline change); all still `claude-draft`. 11 new personas (61 total), new `tests/edge.test.ts` (65 tests); 770 tests pass. Browser-checked at 320–1280 px in 3 languages, light/dark, keyboard, print. |
| 2026-10-22 | **Visual revamp** on Arthur's request (the blue "SaaS" look felt disconnected): a community-bulletin style inspired by nonprofit sites. Cream paper, green-black ink, forest-green blocks, one sun-yellow accent for main buttons and picked answers; Fraunces serif headlines (Noto Serif Armenian for Armenian), Figtree body; square corners everywhere except faces, status dots and the house's tap spots (teammate's tip). Redrawn house (line art, sun, bushes, yellow door, the person you're on has their window lit), new logo and app icons, forest-green "family at a glance" block with big numbers, programs as ruled rows, warm green-black dark mode. Contrast re-checked in both themes. Packages added: `@fontsource-variable/fraunces`, `@fontsource-variable/noto-serif-armenian`. New es/hy string to review: `ui.eyebrow`; the tagline now marks the underlined words with `*…*`. Screenshots refreshed. |
| 2026-10-19 | Ran three review agents on Arthur's request (bug audit, visual design review, research on the 2026 rules, judging rubric and past winners). **Redesign:** light "paper" page with white cards and thin borders instead of the saturated blue page; one blue for actions and selections, orange only on the house; calmer type weights; visible form-control borders (WCAG 1.4.11); navy dark mode; new app icon colors. **Results:** overview first (likely/possibly counts plus each person with a jump link), people fold when there are 4+, the house drawing and repeated status pills removed, rule IDs hidden in a tooltip, timeline marks losses in amber, page is about half as long. **Bugs fixed:** income dropped decimals (1500.50 → $150,050); near-miss shown in percentage points as dollars, and fired on age and disaster deadlines; FERA offered to 1–2 person homes (now 3+); adults shown the children's Medi-Cal rule as their reason; timeline skipped the Oct 2027 CFAP change; Orange County ZIPs counted as LA County (Gorman added); Child Tax Credit estimate now capped at 15% of earnings over $2,500; "job income" checkbox gave two answers for the same unchecked box; pregnancy answers stayed after the age changed to 70; browser Back left the app (Quick exit still clears the history); "Check my family" after the example reopened the example family; out-of-range "as of" dates accepted; plan said "For: For the whole household"; disaster deadlines now on the printed plan; footer no longer claims a "full check" while rules are drafts. Also: "None of these" answer for benefits, "Add a person" button under each person, ZIP placeholder no longer looks pre-filled. 3 new personas, 2 new engine tests. README counts and screenshots updated; demo script rewritten around the official video requirements and the rubric's code row. New es/hy strings need native review (`footerDraft`, `noneOfThese`, `zipPlaceholder`, `wholeHousehold`, `cond.householdSize.gte`, `rules.care.fera`). |
| 2026-10-19 | Researched past Congressional App Challenge winners near CA-30 (Friedman 2025: SyncRide; Chu 2025: Fire Up; Sherman 2025: FireSafe; Gomez 2025: Know Your Rights) and Rep. Friedman's priorities (wildfire recovery, affordability, transportation, constituent casework). Built two features on Arthur's request: **tax credits** (4 programs, 7 dated tables) and **disaster mode** (5 programs, deadlines, timeline integration). 7 new personas. Disaster help is opt-in. New es/hy text needs native review. |
| 2026-10-19 | Built the rule-change timeline (the review's "Policy Time Machine"), on Arthur's request. New es/hy strings need native review. Demo script updated to show it. |
| 2026-10-19 | Acted on an outside review (verified each point against the code first). Fixed: CalFresh/CFAP/CalWORKs/CAPI dollar maximums repeated on every person's card (now shown once in a new "Your family at a glance" box, labeled as a household total and a maximum); new overview box with counts, Make my plan, and Answer skipped questions; duplicate HTML ids when a program shows for several people; answer tiles claimed to be radio buttons without arrow keys (now pressed buttons); negative income/age accepted; house checklist marked skipped parts as done; plan hid one person's "possibly" when another was "likely"; "Free help near you" heading replaced by a repeated translation key. Clearer immigration-status help ("stays on this device"). New es/hy text needs native review. Review points not taken: ZIP already pre-fills utilities; unchecked boxes as "no" is normal for a screener. |
| 2026-10-13 | UI redesign merged (PR #1): one question per screen, house drawing as the question map and progress, tap tiles, dark mode button. |
| 2026-10-07 | Repo made public; site live on GitHub Pages. CI actions updated to current versions. |
| 2026-10-07 | Repo created. Researched and encoded 16 programs with sources; built engine, interface, 3 languages, bilingual plan, 36 personas, rule linter, CI, and docs. |
