import { describe, expect, it } from 'vitest';
import { MATERIALS, WATER } from './materials';
import {
  celsiusToFahrenheit,
  celsiusToKelvin,
  enthalpy,
  fahrenheitToCelsius,
  heatForPhaseChange,
  heatForTemperatureChange,
  heatingAt,
  initialState,
  kelvinToCelsius,
  latentHeatFrom,
  sampleHeating,
  specificAt,
  specificHeatFrom,
  stateFromEnthalpy,
  timeToLimit,
  waterEnergyBudget,
} from './model';

describe('textbook examples (Unit 3)', () => {
  it('example 3: 1 kg olive oil, c = 1790 J/kg°C, 25 → 105 °C → 143 200 J', () => {
    expect(heatForTemperatureChange(1, 1790, 105 - 25)).toBeCloseTo(143200, 9);
  });
  it('example 6: freezing 3 kg of water releases 1 002 000 J (Q = −mLf)', () => {
    expect(-heatForPhaseChange(3, WATER.Lf)).toBe(-1_002_000);
  });
  it('example 7: 100 000 J vaporizes 0.0411 kg of water (m = Q/Lv)', () => {
    expect(100_000 / WATER.Lv).toBeCloseTo(0.0411, 3); // book truncates 0.04115
  });
  it('temperature conversions (examples 1, 2)', () => {
    expect(celsiusToFahrenheit(40)).toBeCloseTo(104, 12);
    expect(celsiusToKelvin(30)).toBeCloseTo(303.15, 12);
    expect(kelvinToCelsius(500)).toBeCloseTo(226.85, 12);
    expect(celsiusToFahrenheit(226.85)).toBeCloseTo(440.33, 2);
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 12);
  });
  it('Table 2-3 values used by the material selector', () => {
    expect(MATERIALS.water.c).toBe(4184);
    expect(MATERIALS.aluminium.c).toBe(900);
    expect(MATERIALS.copper.c).toBe(387);
  });
});

describe('specific heat model', () => {
  it('Activity a2-3: same heater energy gives aluminium a ΔT about 4.65× that of water', () => {
    const P = 100;
    const t = 600; // 10 min
    const w = specificAt({ mass: 1, c: 4184, T0: 20, power: P }, t);
    const al = specificAt({ mass: 1, c: 900, T0: 20, power: P }, t);
    expect(w.T - 20).toBeCloseTo(60000 / 4184, 9);
    expect(al.T - 20).toBeCloseTo(60000 / 900, 9);
    expect((al.T - 20) / (w.T - 20)).toBeCloseTo(4184 / 900, 9);
    expect(specificHeatFrom(w.Q, 1, w.T - 20)).toBeCloseTo(4184, 6);
  });
  it('stops at the model upper limit instead of implying a phase change', () => {
    const r = specificAt({ mass: 0.5, c: 4184, T0: 20, power: 2000 }, 3600);
    expect(r.T).toBe(90);
    expect(r.atLimit).toBe(true);
    expect(r.Q).toBeCloseTo(0.5 * 4184 * 70, 6);
  });
});

describe('phase-change model (water)', () => {
  const m = 1;

  it('enthalpy and state are exact inverses', () => {
    for (const T of [-30, -5, 0.5, 37, 99.9, 120]) {
      const s = initialState(WATER, T);
      const back = stateFromEnthalpy(WATER, m, enthalpy(WATER, m, s));
      expect(back.T).toBeCloseTo(T, 9);
      expect(back.phase).toBe(s.phase);
    }
  });

  it('temperature stays at 0 °C while melting and at 100 °C while boiling', () => {
    const run = { mass: m, T0: -20, power: 1000 };
    const samples = sampleHeating(run, timeToLimit(run), 1);
    const melting = samples.filter((s) => s.phase === 'solid-liquid');
    const boiling = samples.filter((s) => s.phase === 'liquid-gas');
    expect(melting.length).toBeGreaterThan(300); // 334 000 J at 1000 W ≈ 334 s
    expect(melting.every((s) => s.T === 0)).toBe(true);
    expect(boiling.every((s) => s.T === 100)).toBe(true);
    // temperature never decreases while heating
    for (let i = 1; i < samples.length; i++) expect(samples[i].T).toBeGreaterThanOrEqual(samples[i - 1].T - 1e-12);
  });

  it('melting plateau lasts mLf / P and boiling plateau mLv / P', () => {
    const P = 1000;
    const run = { mass: m, T0: 0, power: P }; // ice at 0 °C
    const tMeltEnd = (m * WATER.Lf) / P;
    expect(heatingAt(run, tMeltEnd - 1).phase).toBe('solid-liquid');
    expect(heatingAt(run, tMeltEnd + 1).phase).toBe('liquid');
    const tBoilStart = tMeltEnd + (m * WATER.cLiquid * 100) / P;
    const tBoilEnd = tBoilStart + (m * WATER.Lv) / P;
    expect(heatingAt(run, tBoilStart + 1).phase).toBe('liquid-gas');
    expect(heatingAt(run, tBoilEnd + 1).phase).toBe('gas');
  });

  it('energy accounting: −20 °C ice → 120 °C steam', () => {
    const expected = m * 2000 * 20 + m * WATER.Lf + m * 4184 * 100 + m * WATER.Lv + m * 1970 * 20;
    expect(waterEnergyBudget(m, -20, 120).total).toBeCloseTo(expected, 6);
    const run = { mass: m, T0: -20, power: 1500 };
    const t = expected / 1500;
    const s = heatingAt(run, t);
    expect(s.T).toBeCloseTo(120, 6);
    expect(s.Q).toBeCloseTo(expected, 6);
  });

  it('melted fraction during fusion equals Q/(mLf) — Activity b2-3', () => {
    const run = { mass: 0.5, T0: 0, power: 200 };
    const s = heatingAt(run, 180); // 3 minutes
    expect(s.liquid).toBeCloseTo((200 * 180) / (0.5 * WATER.Lf), 12);
    expect(latentHeatFrom(200 * 180, s.liquid * 0.5)).toBeCloseTo(WATER.Lf, 6);
  });

  it('cooling: water at 20 °C freezes at 0 °C and releases mLf', () => {
    const run = { mass: m, T0: 20, power: -500 };
    const tFreezeStart = (m * 4184 * 20) / 500;
    const s = heatingAt(run, tFreezeStart + 100);
    expect(s.phase).toBe('solid-liquid');
    expect(s.T).toBe(0);
    expect(s.solid).toBeCloseTo((500 * 100) / (m * WATER.Lf), 12);
    expect(s.Q).toBeCloseTo(-(m * 4184 * 20 + 500 * 100), 6);
  });

  it('stops at model limits and reports it', () => {
    const run = { mass: 0.2, T0: 120, power: 2000 };
    const s = heatingAt(run, 10_000);
    expect(s.T).toBeCloseTo(140, 9);
    expect(s.atLimit).toBe(true);
    expect(heatingAt(run, 0)).toMatchObject({ T: 120, Q: 0, atLimit: false });
  });

  it('mass fractions always sum to 1', () => {
    const run = { mass: 1.3, T0: -10, power: 800 };
    for (const s of sampleHeating(run, timeToLimit(run), 37)) {
      expect(s.solid + s.liquid + s.gas).toBeCloseTo(1, 12);
    }
  });
});
