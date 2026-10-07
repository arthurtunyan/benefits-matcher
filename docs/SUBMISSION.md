# Submission kit

Everything here is a **starting point**. Judges can tell when answers aren't written by the students — rewrite every answer in your own words and add your own stories.

## Demo video script (about 3 minutes)

Before recording: run `npm run build && npm run preview` (or use the live site), set the browser to 1280×800, and close other tabs.

| Time | On screen | What you say (in your own words) |
|---|---|---|
| 0:00–0:20 | Title, then the North Hollywood family | Families miss benefits they qualify for, and the 2026 rule changes made it harder to know which ones. |
| 0:20–1:10 | Switch to **Español** or **Հայերեն**, click "See an example family" (or enter it by hand), show results split by person | Each person is screened separately, because that's how California benefits work. Maria gets restricted Medi-Cal; her kids get full Medi-Cal, WIC, and Head Start. |
| 1:10–1:35 | Change Sofia (2) from "Prefer not to say" to **U.S. citizen** | CalFresh and CalWORKs appear for Sofia. Maria's results don't change. This is the mixed-status case most screeners miss. |
| 1:35–2:00 | Open "Why?" on Maria's Medi-Cal: the rule, source link, dates. Click **Dec 2025** | In December 2025 Maria would have gotten full-scope Medi-Cal. The freeze started January 1, 2026. Rules are dated data, so the app stays correct when laws change. |
| 2:00–2:20 | **Make my plan** → bilingual plan → Print preview | Something a family can bring to the office: programs, where to apply, documents to bring, in their language and English. |
| 2:20–2:40 | Open DevTools → Network → clear → run a screening → **0 requests**. Then a terminal running `npm test` | Privacy and accuracy we can prove: no data leaves the phone, and 36 test households check every rule against official sources. |
| 2:40–3:00 | Both of you on camera | What you learned, and what you'd build next (see PROGRESS.md backlog). |

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
- **What we did ourselves:** *(list it honestly — e.g., verifying every rule against its source, native-speaker translation review, testing on real phones, outside review, recording the video, writing these answers.)*
