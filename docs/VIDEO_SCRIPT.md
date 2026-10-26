# Demo video script, click by click (2:00)

One narrator, no code on screen, one example family (Ana and Leo). Each section below covers one of the six things the video has to include:

1. Your names and the name of your app
2. The purpose of your app and who it is for
3. The tools and coding languages used to build it
4. A demonstration of what the app does and how it works
5. A coding or technical difficulty you faced and how you solved it
6. What still needs to be improved

The official rules allow 1–3 minutes, and judges may penalize longer videos ([rules PDF](https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf)). Upload to YouTube as **Public** (Unlisted doesn't count).

Lines marked **SAY** are a starting point. Say them in your own words.

---

## Before you hit record

1. **Chrome:** open https://arthurtunyan.github.io/benefits-matcher/ in a new window with no other tabs open, and reload once (Cmd+R) so it shows "Open Door". Hide the bookmarks bar (Cmd+Shift+B), set zoom to 100% (Cmd+0), and make the window fill the screen.
2. Turn on **Do Not Disturb** so no notifications pop up.
3. Sections 1 and 7 are you on camera. Record the screen part (sections 2–6) in one take with QuickTime (Cmd+Shift+5 → Record Entire Screen, mic on), then put the camera clips at the start and end.

---

## 1 · Names and app name (0:00–0:10)

**DO:** You on camera.

**SAY:** "Hi, I'm Arthur. With my teammates Aiden and Tejas Deepak, we created Open Door, a benefits matcher."

## 2 · Purpose and who it's for (0:10–0:24)

**DO:** Chrome on the start page ("See what help your family can get"). Move the mouse slowly over the headline, then over **Check what you qualify for**.

**SAY:** "Open Door shows LA County families what each person at home may qualify for, under today's rules. It's for immigrant and mixed-status families, where kids often qualify even when a parent doesn't."

## 3 · Tools and languages (0:24–0:34)

**DO:** Scroll down slowly to show the three lines under the buttons: **Nothing leaves your phone**, **Every person is checked**, **Every answer shows its source**. Then scroll back to the top.

**SAY:** "We built it in TypeScript with React and Vite. Each rule is a JSON file with its official source, and everything runs on your phone."

## 4a · Demo: enter a family (0:34–0:56)

**DO:**
1. Click **Check what you qualify for**.
2. Click the ZIP box and type **91605**. The **LADWP** and **SoCalGas** bubbles on the house get check marks. Circle them with the mouse.
3. Click the **envelope labeled Income** on the right side of the house and type **2400**.
4. Click the **Y** window in the middle of the house. This skips the questions in between on purpose.
5. Name: **Ana**. Age: **31**. Scroll down a little and click **Green card, less than 5 years**.
6. Scroll up and click the dashed **+** window next to Ana's. (Don't click the small **×** on a window, which removes that person.)
7. Name: **Leo**. Age: **3**. **Leave his immigration status on "Prefer not to say."**
8. Click **See results** (bottom right).

**SAY:** "You answer by tapping the house. The ZIP fills in the utility companies, and you can skip anything. Ana has had a green card for under five years. Her son Leo is three, and we'll leave his status blank."

## 4b · Demo: results (0:56–1:12)

**DO:**
1. In "Your family at a glance", point at **Ana: 2 likely, 0 possibly** and **Leo: 3 likely, 1 possibly**.
2. Scroll down to Ana's card. Under **Likely eligible**, point at **Medi-Cal** and **CFAP (California Food Assistance Program)**.
3. Keep scrolling to Leo's card. Point at **Medi-Cal**, **WIC**, and **Head Start · Early Head Start · State Preschool** under Likely eligible.

**SAY:** "Each person gets their own results. Ana has to wait five years for CalFresh, so the app finds CFAP, California's food aid for her. Leo gets Medi-Cal, WIC, and free preschool."

## 5 · Technical difficulty and how we solved it (1:12–1:38)

**DO:**
1. Still on Leo's card, scroll to **Possibly eligible**: **CalFresh**, "Depends on answers you left out: immigration status". Click **Why?** under it.
2. Under "What we checked", point at **Immigration status: U.S. citizen (you skipped this)**, then at **Household income at or below $3,607 a month (yours: $2,400)**.
3. Scroll up to the **Immigration status** dropdown at the top of Leo's card and pick **U.S. citizen (including born in the U.S.)**. CalFresh moves up into **Likely eligible**, and Leo's card now says **4 likely, 0 possibly**.

**SAY:** "Our hardest problem was blank answers. A normal yes-or-no check turns a skipped question into 'not eligible.' So we made every check return pass, fail, or unknown. Here, income passes but immigration status is unknown, so CalFresh says 'possibly.' Mark Leo a citizen, and it's likely. Rules also carry start and end dates, because laws keep changing."

## 6 · What still needs to be improved (1:38–1:54)

**DO:**
1. Press Cmd+↓ to jump to the bottom of the page. Point at the footer line: **"Every rule links to its official source; our team is still checking each one by hand."**
2. Press Cmd+↑ to jump back to the top, and click **ES** in the header. The page switches to Spanish.

**SAY:** "What still needs work: we're checking every rule by hand against its source, our Spanish and Armenian need review by native speakers, and the food estimate doesn't count rent or child care yet."

## 7 · On camera: wrap-up (1:54–2:00)

**DO:** You on camera.

**SAY:** "Open Door is free and live today. Thanks for watching!"
