# Demo video script, click by click (2:00)

**Length:** the official 2026 rules say the video "should be 1-3 minutes long", and judges may penalize videos that go over ([rules PDF](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)). This script runs **2:00**, with one narrator.

**The video must include:** the name of every team member (so say Aiden's name too, even though only you record), the app name, its purpose in one sentence, who it's for, the tools and languages, and a demo. Sections 1–2 cover the required parts. Upload to YouTube as **Public** (Unlisted doesn't count).

Lines marked **SAY** are a starting point. Say them in your own words.

---

## Before you hit record

1. **Chrome:** open https://arthurtunyan.github.io/benefits-matcher/ in a new window with no other tabs open. Hide the bookmarks bar (Cmd+Shift+B), set zoom to 100% (Cmd+0), and make the window fill the screen.
2. **Load the fonts first:** click **Español**, then **Հայերեն**, then **English**. Then reload (Cmd+R) so the app starts fresh on the start page. (This keeps font downloads out of the Network tab in section 8.)
3. **Set up DevTools:** press Cmd+Option+I, click the **Network** tab, then press Cmd+Option+I again to close it. Chrome remembers the tab, so it opens straight to Network in section 8.
4. Turn on **Do Not Disturb** so no notifications pop up.
5. Sections 1 and 9 are you on camera. Record the screen part (sections 2–8) in one take with QuickTime (Cmd+Shift+5 → Record Entire Screen, mic on), then put the camera clips at the start and end.

---

## 1 · On camera: names, app, purpose (0:00–0:12)

**DO:** You on camera.

**SAY:** "Hi, I'm Arthur. My teammate Aiden and I built Benefits Matcher. It shows LA County families what benefits each person at home may qualify for, under today's rules."

## 2 · Who it's for, tools (0:12–0:24)

**DO:** Chrome on the start page ("See what help your family can get"). Move the mouse slowly over the headline, then over **Check what you qualify for**.

**SAY:** "It's for immigrant and mixed-status families in our district, where kids often qualify even when a parent doesn't. We built it with React and TypeScript."

## 3 · Enter a family (0:24–0:47)

**DO:**
1. Click **Check what you qualify for**.
2. Click the ZIP box and type **91605**. The **LADWP** and **SoCalGas** bubbles on the house get check marks. Circle them with the mouse.
3. Click the **envelope labeled Income** on the right side of the house and type **2400**.
4. Click the **Y** window in the middle of the house. This skips the questions in between on purpose.
5. Name: **Ana**. Age: **31**. Scroll down a little and click **Green card, less than 5 years**.
6. Scroll up and click the dashed **+** window next to Ana's. (Don't click the small **×** on a window, which removes that person.)
7. Name: **Leo**. Age: **3**. Scroll down a little and click **U.S. citizen (including born in the U.S.)**.
8. Click **See results** (bottom right). Point at **Ana: 2 likely** and **Leo: 4 likely** in "Your family at a glance".

**SAY:** "You answer by tapping the house. The ZIP code fills in the utility companies. You can skip anything, and a skipped answer never counts as a 'no.' Ana has a green card, and her son Leo was born here. Each person gets their own results."

## 4 · The mixed-status family (0:47–1:10)

**DO:**
1. Click the **Benefits Matcher** logo (top left), then **See an example family**.
2. In "Your family at a glance", point at **Sofia: 3 likely, 2 possibly**, then click **Sofia**.
3. At the top of Sofia's card, open the **Immigration status** dropdown and pick **U.S. citizen (including born in the U.S.)**.
4. Scroll up to "Your family at a glance". Sofia now shows **5 likely, 0 possibly**, with new lines **CalFresh: up to $1,217 a month** and **CalWORKs: up to $1,659 a month**. Point at **Maria**, who still shows **1 likely, 0 possibly**.

(The example banner disappears after the edit. That's normal.)

**SAY:** "Here's a harder case: Maria is undocumented, with four kids whose status we left blank. So two-year-old Sofia gets two 'possibly' results. Make her a U.S. citizen, and CalFresh and CalWORKs become likely, while Maria's results don't change. That's the case most screeners get wrong."

## 5 · Why, and how it works (1:10–1:31)

**DO:**
1. In "Your family at a glance", click **Maria**. Her card shows **Restricted Medi-Cal (emergency and pregnancy care)**.
2. Click **Why?** under it. Move the mouse down the "What we checked" list, then over **Official source** and "In effect since January 1, 2026". Don't click the source link, because it opens a new tab.

**SAY:** "Tap 'Why?' to see the rule in plain English, every condition we checked, and the official source. Behind this, each rule is data with start and end dates, and a skipped answer counts as 'unknown,' so you get 'possibly,' never a wrong 'no.'"

## 6 · Rules over time (1:31–1:42)

**DO:**
1. Scroll down past the people cards until you see the closed row **How rule changes reach your family** (just under "Rules as of"). Click it to open.
2. Point at **January 1, 2026 · Maria · Medi-Cal**: "Likely · Full-scope Medi-Cal" → "Likely · Restricted Medi-Cal" (the second one is amber because it's a loss).

**SAY:** "So the app can replay the family through every law change. Maria lost full Medi-Cal on January 1st, 2026."

## 7 · Spanish (1:42–1:48)

**DO:** Scroll to the top and click **ES** in the header. The whole page switches to Spanish.

**SAY:** "And it all works in Spanish and Armenian."

## 8 · Privacy proof (1:48–1:56)

**DO:**
1. Press Cmd+Option+I. DevTools opens on the empty **Network** tab.
2. Click **EN** in the header. In the overview, click **Mateo** and set his status to **U.S. citizen**.
3. Point at the bottom of the Network panel: **0 requests**.

**SAY:** "And here's the network tab while the app re-checks the family: zero requests. Nothing leaves your phone."

> Practice this once before recording. If anything shows up in the Network tab, it will be a font file. Repeat the font warm-up from "Before you hit record" and try again.

## 9 · On camera: wrap-up (1:56–2:00)

**DO:** You on camera.

**SAY:** "Thanks for watching!"
