# Submission kit

Everything here is a **starting point**. Judges can tell when answers aren't written by the students — rewrite every answer in your own words and add your own stories.

## Demo video script (about 3 minutes)

The official rules make the video "the most critical component" and require, in the video: **every team member's name, the app's name, its purpose in one sentence, who it's for, the tools and languages used, and a demo**. Keep it between 1 and 3 minutes and set it to **Public** on YouTube (not Unlisted). The sample judging rubric has a whole row for **explaining your code** — "Video does not explain code" scores 1 of 5 — so one of you must explain the engine on screen, in your own words.

Before recording: use the live site (or `npm run build && npm run preview`), set the browser to 1280×800, close other tabs.

| Time | On screen | What you say (in your own words) |
|---|---|---|
| 0:00–0:20 | Both of you on camera, then the start page | Your names. "Benefits Matcher shows LA County families which benefits *each person* in their home may qualify for, under the rules in effect today. It's for mixed-status and immigrant families in our district. We built it with React and TypeScript, and the rules are JSON data with official sources." |
| 0:20–0:40 | One real, specific moment from your community | Why you built it. Keep it short and true. |
| 0:40–1:20 | Switch to **Español** or **Հայերեն**, tap **See an example family**. The overview shows who gets what. Tap **Sofia** in the list, change her status from "Prefer not to say" to **U.S. citizen** | Each person is screened separately, because that's how California benefits work. Maria gets restricted Medi-Cal; her kids get full Medi-Cal, WIC, and Head Start. When Sofia is a citizen, CalFresh and CalWORKs appear for her and Maria's results don't change. |
| 1:20–1:50 | Scroll to **How rule changes reach your family**: Jan 1, 2026, Maria's Medi-Cal goes from full to restricted (shown in amber, because it's a loss). Tap **See results on this date** on a planned 2027 change | The app re-runs the family on every day a rule changes, so you can see who a law reaches and when, with the source behind it. |
| 1:50–2:30 | Your editor: `rules/programs/medi-cal.json` (one dated rule), then `runRule`/`runProgram` in `src/engine.ts` | **Explain the code yourself.** Rules are data with start and end dates. Every condition answers pass, fail, or *unknown* — a skipped question is never treated as "no". Show one bug you found and fixed yourselves, and how a test in `tests/personas.json` now guards it. |
| 2:30–2:45 | DevTools → Network → clear → run a screening → **0 requests**. Then `npm test` | Privacy and accuracy we can prove: nothing leaves the phone, and 600+ tests check the rules against official sources. |
| 2:45–3:00 | Both of you | What you learned, who tested it (real families, an outside reviewer), and what you'd build next. |

Leave tax credits and disaster mode out of the video unless you have checked those rules yourselves; mention them in one sentence at most.

**Network-tab tip:** load the page and switch languages *first* (fonts load once), then clear the Network panel. Screening itself makes no requests.

## Answer outlines

**What is the purpose of the app?**
Help LA County families find every benefit each household member may qualify for under current rules — with sources, in their language, without giving up their privacy.

**What inspired it?**
Aiden's original idea and what you've seen in your own communities: families who didn't know their children qualified, and confusion after the 2026 changes. *Use one real, specific moment here.*

**What technical challenge did you face, and how did you solve it?**
Rules depend on time, on each person, and on the household at once. You stored rules as dated JSON and built an engine that evaluates them as of any date, with three outcomes (pass, fail, unknown) so a skipped question is never treated as "no". Tests are tied to official sources. Possible details: the H.R. 1 change hit current CalFresh recipients only at renewal; the dental cut moved from 2026 to 2027 while you were building; refugees' Medi-Cal moves in steps (federal → state-funded → restricted).

**What would you do next?**
Outside review by benefits navigators, more languages, an opt-in aid map, all LA County ZIP codes, and a disaster mode for emergencies like the 2025 wildfires.

## District facts you can cite (real numbers, with source)

California's 30th district, ACS 2024 1-year ([Census Reporter](https://censusreporter.org/profiles/50000US0630-congressional-district-30-ca/)):
- 741,397 people
- 11.9% below the poverty line (about 87,700 people)
- 48.4% speak a language other than English at home
- 37.1% were born outside the U.S.

## AI disclosure

The rules require you to list every AI tool and what it did. Draft (edit to match what really happened):

- **Claude (Anthropic)** helped edit the project brief and overview.
- **Claude Code (Anthropic), October 7, 2026:** set up the repository; researched program rules and income limits from official sources; drafted the rules data, rules engine, user interface, Spanish and Armenian translations, test personas, documentation, and this submission kit. All rules are marked `claude-draft` until a team member checks them against the sources.
- **Claude Code (Anthropic), October 13, 2026:** redesigned the interface (one question per screen, house drawing, dark mode).
- **Claude Code (Anthropic), October 19, 2026:** checked an outside review against the code and fixed what held up: household dollar maximums shown once, a results overview, accessibility and input-validation fixes, plan accuracy, a translation-key bug. Built the rule-change timeline ("policy time machine"): `timeline()` in `src/engine.ts` and `src/components/Timeline.tsx`. Researched past winners and Rep. Friedman's priorities, then built the tax-credit and disaster-mode features (rules data, engine facts, personas, interface, translations).
- **Claude Code (Anthropic), October 19, 2026 (second session):** ran three review agents (bug audit, visual design review, research on the official rules and past winners) and acted on them: redesigned the look (light "paper" theme, one blue for actions, calmer type, collapsible people on Results, overview with per-person counts); fixed bugs (income field dropped decimal points; near-miss amounts mixed up percentage points and dollars; FERA offered to 1–2 person homes; adults were shown the children's Medi-Cal rule as their reason; the timeline missed the October 2027 CFAP change; Orange County ZIPs counted as LA County; Child Tax Credit estimate ignored the 15%-of-earnings limit; browser Back left the app); added personas for each fix; updated README counts and screenshots.
- **What we did ourselves:** *(list it honestly — e.g., verifying every rule against its source, native-speaker translation review, testing on real phones, outside review, recording the video, writing these answers.)*
