# Curriculum mapping

**Sources of truth:**

- Physics labs: *Science, Grade 10, Semester 2, Part 1 (Physics), 2025–2026*, Ministry of Education and Higher Education, Qatar (Arabic edition, 167 pages).
- Chemistry Lab: *Science, Grade 10, Semester 1* (chemistry units 1 and 2, printed pages 4–101), same ministry.

Page numbers below are the **printed** page numbers (see the note at the end for PDF page numbers).

The book numbers things *number-then-unit*: “Lesson 1-4” is lesson 1 of unit 4, “Figure 16-4” is figure 16 of unit 4, “equation 3-4” is equation 3 of unit 4, and “Activity b1-4” is activity b of lesson 1, unit 4. This document and the app use the same convention.

Every activity in the app carries one of three source labels, shown on screen:

| Label | Meaning |
|---|---|
| **From the textbook** | The activity, figure or worked example appears in the book; the lab reproduces its set-up and values. |
| **Textbook concept · lab procedure** | The concept and equations are in the book; the step-by-step procedure was designed for this lab. |
| **Enrichment** | Goes beyond the book. Only one feature is enrichment (the filament-bulb model, below). |

---

## Unit 4 · Fundamentals of Electricity — Electricity Lab (flagship)

Lessons: **1-4** Current, Voltage and Resistance (p. 120) · **2-4** Complex Circuits (p. 136). Pages 120–147.
Learning outcomes used: P1011.1, P1011.2, P1011.3, P1011.4, P1012.2, P1012.4.

| App activity | Source | Textbook reference | Outcomes | What is reproduced |
|---|---|---|---|---|
| How does voltage affect current? | Textbook | Lesson 1-4 · Activity b1-4 “Ohm’s law”, part 1 · p. 132 · Figure 16-4a | P1011.3, P1011.4 | Variable supply, switch, ammeter in series, 10 Ω resistor, voltmeter across it; readings at 1–4 V; V–I graph and slope = R. |
| How does resistance affect current? | Concept · lab procedure | Lesson 1-4 · Ohm’s law (eq. 3-4), examples 3–5 · pp. 129–131 | P1011.3, P1011.4 | 6 V fixed; vary R; I × R stays equal to V. |
| Compare series and parallel circuits | Textbook | Lesson 2-4 · Figures 19-4, 23-4, 24-4; Activity a1-4 · pp. 127, 137–142 | P1012.2 | Three 1 Ω bulbs on 1.5 V: series 0.5 A, 0.5 V each, Req = 3 Ω; parallel 1.5 A per bulb, 4.5 A total, Req = 1/3 Ω. |
| Combined circuit and electric power | Textbook | Lesson 2-4 · Example 11 and Review question 4 · pp. 143, 147 | P1012.2, P1012.4 | 20 Ω + (10 Ω ∥ 15 Ω) on 13 V: Req = 26 Ω, I = 0.5 A, V∥ = 3 V; P = VI = I²R = V²/R. |

Free building: battery, resistor, bulb, switch, wire, ammeter and voltmeter can be placed, moved, rotated, reversed and removed on a grid. Any arrangement is solved exactly (modified nodal analysis). Open circuits, short circuits (battery bridged by wires / closed switch / ammeter), ideal batteries in parallel, a voltmeter in series, an ammeter in parallel, unconnected ends and bypassed parts are detected and explained.

**Assumptions (shown in the lab):** ideal batteries (no internal resistance); wires, closed switches and ammeters have zero resistance; voltmeters draw no current; resistors and “ohmic” bulbs keep constant resistance; bulb brightness on screen ∝ √(P / rated power) and is only a visual cue; voltage limited to 0–24 V.

**Enrichment:** the optional “filament” bulb model R = R₀(1 + 0.5·|V|). The book shows that a lamp filament is non-ohmic (Figure 14-4 and part 2 of Activity b1-4) but gives no formula; this model only reproduces the curved trend and is labelled as enrichment.

**Not covered:** Activity c1-4 (resistance of a wire, R = ρL/A) and charge/time calculations (I = Q/t, V = W/Q) are not simulated; the assistant can discuss them.

---

## Unit 2 · Kinematics — Motion Lab

Lessons: **1-2** Vectors and Scalars (p. 38) · **2-2** Motion Description (p. 56). Pages 56–87 for the simulated content.
Learning outcomes used: P1003.1, P1003.2, P1003.3, P1004.1.

| App activity | Source | Textbook reference | Outcomes | What is reproduced |
|---|---|---|---|---|
| Uniform motion: speed and velocity | Concept · lab procedure | Lesson 2-2 · eqs 5-2, 6-2 · Figures 27-2, 28-2 · pp. 62–63 | P1003.2, P1003.3 | 5 m/s for 10 s; straight x–t line; slope = velocity; sign of velocity = direction; speed is never negative. |
| Uniformly accelerated motion | Textbook | Lesson 2-2 · eqs 7-2, 8-2, 9-2 · Figure 38-2, Example 25 · pp. 70–76 | P1003.3, P1004.1 | vi = 1 m/s, a = 0.5 m/s²: v(3 s) = 2.5 m/s; straight v–t, curved x–t. |
| Displacement from the area under v–t | Textbook | Lesson 2-2 · Example 24 (robot) · p. 74 | P1003.3 | 2 m/s² for 5 s, constant 5 s, −2 m/s² for 5 s → 100 m. |
| Distance vs displacement when the cart turns back | Concept · lab procedure | Lesson 2-2 · Figures 20-2, 21-2, 36-2b · pp. 57, 70 | P1003.1, P1003.2 | v0 = 10 m/s, a = −2 m/s² for 8 s: stops at 5 s; displacement 16 m, distance 34 m. |

Also available as a prepared motion: Example 16 (robot 0.5 m/s right for 15 s, then 0.3 m/s left for 18 s, ends at +2.1 m), using an instantaneous change of velocity at the start of a stage, as the book idealises it.

**Model:** piecewise-constant acceleration, exact equations 8-2 and 9-2 within each stage; distance accounts for a change of direction inside a stage. The animation, readouts, graphs and table rows are all evaluated from the same function at the same time t. Limits: |v| ≤ 20 m/s, |a| ≤ 5 m/s², up to 4 stages, 40 s per run.

**Not covered:** vector addition and resolution from Lesson 1-2, and the vf² = vi² + 2aΔx equation (10-2) is used in checks/explanations but not as a separate activity.

---

## Unit 3 · Heat and Changes in States of Matter — Heat & Matter Lab

Lessons: **1-3** Temperature and Heat (p. 90) · **2-3** Specific Heat Capacity and Specific Latent Heat (p. 100). Pages 90–117.
Learning outcomes used: P1006.1, P1006.2, P1007.1, P1007.2, P1007.3, P1007.4.

| App activity | Source | Textbook reference | Outcomes | What is reproduced |
|---|---|---|---|---|
| Specific heat capacity: water vs aluminium | Textbook | Lesson 2-3 · Activity a2-3 · eq. 4-3 · p. 105 | P1007.1, P1007.2 | 1 kg water and 1 kg aluminium, same heater, 10 min; compare ΔT; c = Q/(mΔT). |
| Heating curve of water | Textbook | Lesson 2-3 · Figure 16-3 · eqs 4-3, 5-3, 6-3 · pp. 106–108 | P1007.1, P1007.3 | 0.2 kg ice from −20 °C to steam; two plateaus; energy accounting per stage. |
| Specific latent heat of fusion of ice | Textbook | Lesson 2-3 · Activity b2-3 · eq. 5-3 · p. 111 | P1007.3 | Ice at 0 °C, 200 W; mass melted vs energy; Lf = Q/m. |
| Temperature scales | Textbook | Lesson 1-3 · eqs 1-3, 2-3, 3-3 · Examples 1–2 · p. 95 | P1006.2 | °C, °F and K readings of the same sample. |

**Values used (all from the book):** specific heat capacity, Table 2-3 (J/kg·°C): water 4184, ice 2000, steam 1970, oil 1800, aluminium 900, glass 840, granite 790, iron/steel 470, copper 387, lead 130. Lf(water) = 334 kJ/kg (Table 3-3). Lv(water) = 2430 kJ/kg (Table 4-3).

**Discrepancy flagged:** the book’s Lv for water, 2430 kJ/kg, differs from the value most references give at 100 °C (≈ 2260 kJ/kg). The lab uses the book’s value for fidelity and says so in its assumptions.

**Material selector:** only materials whose c is in Table 2-3 can be chosen. The change-of-state model is limited to water, the only substance for which the book gives c for all three states and both latent heats. The specific-heat comparison stops at 90 °C so that no change of state is involved.

**Assumptions (shown in the lab):** standard pressure (0 °C / 100 °C); ideal insulation, all heater energy goes into the sample; uniform temperature; constant c within each state; model range −40 °C to 140 °C; time can be sped up. **Assumption not from the book:** Activity a2-3 does not state the heater power, so the lab uses 100 W and labels it as an assumption.

**Particle model:** qualitative only (speed ∝ √T in kelvin, arrangement follows the solid/liquid/gas fractions). No number shown in the lab is derived from it.

**Not covered:** thermal equilibrium/mixing calculations (P1006.3–4) are discussed by the assistant but not simulated.

---

## Units 1–2 (Semester 1) · Periodicity · The Mole Concept and Stoichiometry — Chemistry Lab

Lessons: **1-1** The Periodic Table (p. 4) · **2-1** Gradation of Periodic Properties (p. 22) · **3-1** Chemical Reactivity of Elements (p. 32) · **1-2** Mass of Atoms and Compounds (p. 52) · **2-2** Chemical Equations (p. 66) · **3-2** Stoichiometry (p. 80).
Learning outcomes used: C1002.3–C1002.6 (Unit 1) and C1001.1, C1001.3–C1001.7 (Unit 2). Note the book's own numbering: Unit 1 outcomes are coded C1002.x and Unit 2 outcomes C1001.x.

The lab has three modules:

- Periodic Table Explorer
- Reactions & Stoichiometry
- Solutions & Concentration

| App activity | Source | Textbook reference | Outcomes | What is reproduced |
|---|---|---|---|---|
| Bohr distribution and the periodic table | Textbook | Lesson 1-1 · Activity 1-1a · Example 1 | C1002.3, C1002.4 | Select main-group elements, record Z, period, group, energy levels and valence electrons; relate levels to period and valence electrons to group. |
| Trends in atomic radius and reactivity | Textbook concept · lab procedure | Lesson 2-1 (radius figure, Table 5-1) · Lesson 3-1 | C1002.5, C1002.6 | Record textbook radii across period 2/3 and down group 1/17; plot radius vs Z; compare reactivity using the book's reactions. |
| Balancing equations and conservation of mass | Textbook | Lesson 2-2 · balancing rules, 2HgO → 2Hg + O2 | C1001.1 | Coefficients only (formulas are locked); atom inventory, charge row and mass bars; hints before the answer. |
| Stoichiometry: predicting the mass of a product | Textbook | Lesson 3-2 · Examples 30–33 · Activity 3-2a | C1001.4–C1001.6 | NaHCO3 + HCl → NaCl + H2O + CO2: mass → moles → mole ratio → mass, every step shown. |
| Preparing a standard solution | Textbook | Lesson 3-2 · Activity 3-2b · equation 7-2 · Examples 34–40 | C1001.7 | Prepare 250.0 mL of 0.0865 M CuSO4·5H2O: compute the mass, weigh, dissolve, fill to the mark; obtained molarity and % error. |

**Engines (all in `src/chemistry/`, no UI imports):**

- Element dataset: all 118 elements, with IUPAC standard atomic weights.
- Electron shells: Madelung order plus a table of known exceptions.
- Formula and equation parser: brackets, hydrates, charges and state symbols.
- Exact balancing solver: rational arithmetic, finds the smallest whole-number coefficients.
- Molar mass, conversions (mass, moles, particles and gas volume at STP), stoichiometry and concentration.

Every number the lab shows comes from these engines. The assistant is told that the engine's results are authoritative.

**Values used from the book:**

- Atomic radii (pm) for Z = 1–54 plus Cs.
- Melting points from Table 6-1.
- Flame colours from Table 8-1.
- NA = 6.022 × 10²³ (the book's examples round it to 6.02 × 10²³).
- Vm = 22.4 L/mol, used only for species marked (g) and only at STP.

The "Textbook rounding" mass mode, which is the default, uses atomic masses rounded to one decimal place, as in the book's worked examples. The other mode uses IUPAC values.

**Book examples checked by unit tests:**

- Bohr distributions from Lesson 1-1 and Table 5-1.
- All 18 textbook reactions solved to the book's coefficients.
- Molar masses for Examples 22–39.
- Percentage composition of Cr2(SO4)3.
- Conversions for Examples 21–28.
- Stoichiometry for Examples 29–33 and Activity 3-2a.
- Concentration for Examples 34–40 and Activity 3-2b.

**Textbook inconsistencies flagged:**

- Rb radius: the figure gives 265 pm, but Table 5-1 prints 267 pm. The lab uses 265.
- Example 23 truncates to 8.325 where rounding gives 8.326.
- Some examples use other masses: Zn 65.39, and Fe2O3 159.6 vs 159.7 depending on rounding.
- F2 is given as 37.997.

The lab follows the stated rounding rule and notes the difference in its assumptions.

**Bohr model:** shown as a simplified picture of main energy levels, with an on-screen disclaimer. The book applies it to the first four periods. Elements beyond that range show a "beyond the textbook" banner.

**Not covered:**

- Dilution is not in this textbook and is not included.
- Percentage by mass of a solution is named only in the unit overview; the lab offers it as a small calculator labelled that way.
- No random particle animations are used for reactions.

---

## Workshop scenarios

| Scenario | Lab | Activity used |
|---|---|---|
| 5-minute sequence: closed/open circuits → Ohm’s law → short circuit → series vs parallel | Electricity | ohm-voltage, series-parallel |
| The robot of Example 24 | Motion | robot-area |
| Speed or velocity? A cart that turns back | Motion | turnaround |
| Why does the temperature stop rising? | Heat | heating-curve |
| Water versus aluminium | Heat | specific-heat |

## Page-number note

Printed page numbers are used everywhere in the app. In the Semester 2 physics PDF supplied, printed page N is PDF page N + 12 (the PDF has 12 front-matter pages before printed page 1).
