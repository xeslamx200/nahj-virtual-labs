# Workshop demo script

A presenter's script for showing NAHJ Virtual Science Labs live. Times are suggestions for each part; the total session length is up to you.

## Before the session (5 minutes, once)

1. Start the app: `npm run build && npm start`, then open `http://localhost:8787` in Chrome or Edge. (For a hosted copy, open its URL instead.)
2. Open **Workshop mode** in the top bar.
3. Tick **Presenter view (larger text)** for a projector.
4. Press **Reset all three labs to their starting set-ups**. If the laptop was used before, also press **Also erase saved tables and answers on this device**.
5. Decide which language to present in and use the language button (العربية / English) in the top-right corner. The whole interface, including the assistant, switches; charts keep left-to-right axes as in the textbook.
6. Check the assistant status on the dashboard. Without an API key it reads “offline guided tutor · scripted responses”. Say so honestly if you show it.

## Part 1 — Electricity in 5 minutes (flagship)

Start the timer on the Workshop page, then press **Launch** on step 1. Each lab page opened from Workshop mode shows a purple banner with the objective, what to do on screen, and an **Explanation** you can expand. Use **Next step** in the banner to move on.

**Step 1 — Closed and open circuits (≈1 min)**
- Point at the moving dots: they show conventional current from + to −.
- Click the switch S once to select it, and click it again to open it. Every reading drops to 0 and the status turns amber: “Open circuit — no current”.
- Say: *“No closed path, no current. The ammeter is in series; the voltmeter is in parallel.”*

**Step 2 — Ohm's law in four readings (≈1.5 min)**
- In the parts list, click **Battery**, type 1 in the voltage box, press **Record reading**. Repeat for 2, 3 and 4 V.
- Point at the table and the graph: a straight line through the origin, slope = 10 Ω.
- Say: *“For a fixed resistor V/I is constant — that is Ohm's law, V = IR.”*
- Optional: type 10 into question 2 and press Check to show the automated check.

**Step 3 — What a short circuit looks like (≈1 min)**
- Choose the **Wire** tool. Drag from the dot at the top of the resistor to the dot one step right and one step down; then drag from there back to the dot at the bottom of the resistor.
- The status turns red: “Short circuit”, and the faulty parts are outlined.
- Say: *“With no resistance, I = V/R has no limit. Real wires overheat — that's why we use fuses.”* Press **Undo** twice to recover.

**Step 4 — Series versus parallel (≈1.5 min)**
- Series circuit: 0.5 A everywhere, 0.5 V across each bulb, dim bulbs. Press **Record reading**.
- Press **Parallel bulbs (Fig. 24-4)**: 1.5 V across each bulb, 4.5 A from the cell, bright bulbs. Press **Record reading** again.
- Say: *“Series: Req = 3 Ω. Parallel: Req = 1/3 Ω, so the same cell supplies nine times the current.”*

## Part 2 — Optional scenarios (≈3–4 minutes each)

**Motion: the robot of Example 24.** Press Play; pause at 5, 10 and 15 s and record. Show the trapezium under the v–t graph: 25 + 50 + 25 = 100 m.

**Motion: speed or velocity?** Use **+1 s** up to 5 s (the cart stops), then to 8 s. Compare the readouts: displacement 16 m, distance 34 m; velocity negative, speed positive.

**Heat: why does the temperature stop rising?** Press Play. When the ice reaches 0 °C, point at the flat line on the graph, the blue banner, the particle model and the “Melting” row of the energy-accounting table, which grows while the temperature stays constant.

**Heat: water versus aluminium.** Press Play to 600 s (10 min): about 14 °C rise for water and 67 °C for aluminium with the same energy (60 000 J). Q = mcΔT.

## Part 3 — The learning assistant (≈2 minutes)

1. In any lab, press **Learning assistant**.
2. Press **Why this result?** — the answer quotes the actual readings on screen.
3. Press **Interpret my data** after recording a few rows.
4. Point out the label on each answer: **Scripted** (offline tutor) or **AI** (only when an API key is configured on the server). The app never presents scripted text as AI output and never invents measurements.

## Part 4 — Report (≈1 minute)

Press **Report** in the lab header. Show the hypothesis, results table and graph, the automated checks (expected values appear only after a correct answer or a reveal), and the summary built from the recorded values. **Print / save as PDF** or download Markdown, HTML or CSV. Remind the audience that progress stays on this device only; there are no accounts.

## If something goes wrong

- A lab looks wrong: press **Reset experiment** in the lab header, or **Reset all three labs** in Workshop mode.
- Wrong language: use the language button in the top-right.
- Text too small: tick **Presenter view (larger text)** on the Workshop page.
- No network: the app works fully offline once loaded; only the live AI assistant needs a connection and a key.
