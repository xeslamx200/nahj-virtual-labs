/**
 * Main user journeys, rendered in jsdom with the real app, stores and physics.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { elecStore } from '../labs/electricity/store';
import { heatStore } from '../labs/heat/store';
import { motionStore } from '../labs/motion/store';
import { chemStore } from '../labs/chemistry/store';
import { molarMass } from '../chemistry/molarMass';
import { shells, bohrNotation } from '../chemistry/config';
import { elementBySymbol } from '../chemistry/elements';
import { progressStore } from '../lib/progress';

const partList = () => within(document.querySelector('.part-list') as HTMLElement);

function go(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

beforeEach(() => {
  localStorage.clear();
  progressStore.set({});
  elecStore.reset();
  motionStore.reset();
  heatStore.reset();
  chemStore.reset();
  // no API server in tests: the assistant must fall back to the labelled offline tutor
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});

describe('dashboard', () => {
  it('shows the platform title in both languages, in the header, footer and document title, keeping the NAHJ brand mark', async () => {
    go('#/');
    expect(document.title).toBe('Virtual Science Labs');
    expect(document.querySelector('.brand')).toHaveTextContent('Virtual Science Labs');
    expect(document.querySelector('.brand')).toHaveTextContent('N'); // separate NAHJ monogram is preserved
    fireEvent.click(screen.getAllByRole('button', { name: /Switch to Arabic|العربية/ })[0]);
    expect(document.title).toBe('مختبرات علمية افتراضية');
    expect(document.querySelector('.brand')).toHaveTextContent('مختبرات علمية افتراضية');
    expect(document.querySelector('.app-footer')).toHaveTextContent('مختبرات علمية افتراضية');
    expect(document.body.textContent).not.toContain('مختبرات NAHJ');
  });

  it('shows the four labs with progress and the offline assistant status', async () => {
    go('#/');
    expect(await screen.findByTestId('lab-card-electricity')).toBeInTheDocument();
    expect(screen.getByTestId('lab-card-motion')).toBeInTheDocument();
    expect(screen.getByTestId('lab-card-heat')).toBeInTheDocument();
    expect(screen.getByTestId('lab-card-chemistry')).toHaveTextContent(/Chemistry Lab/);
    expect(screen.getByTestId('lab-card-chemistry')).toHaveTextContent(/Semester 1/);
    expect(await screen.findByText(/no AI key is configured/i)).toBeInTheDocument();
  });

  it('switches to Arabic and right-to-left layout', async () => {
    go('#/');
    fireEvent.click(await screen.findByTestId('lang-toggle'));
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(screen.getAllByText('مختبر الكهرباء').length).toBeGreaterThan(0);
  });
});

describe('electricity lab journey', () => {
  it('records four Ohm’s-law readings, answers a check, and sees them in the report', async () => {
    go('#/lab/electricity');
    const record = await screen.findByRole('button', { name: /record reading/i });
    expect(screen.getByTestId('circuit-status')).toHaveAttribute('data-status', 'ok');
    for (const V of [1, 2, 3, 4]) {
      act(() => {
        elecStore.set((s) => s); // keep the store warm
      });
      fireEvent.click(partList().getByRole('button', { name: /^Battery/ }));
      const input = await screen.findByLabelText('Voltage (V)');
      fireEvent.change(input, { target: { value: String(V) } });
      fireEvent.click(record);
    }
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByText('0.4')).toBeInTheDocument();

    // numeric check: slope of the V–I graph from the learner's own data
    const slopeInput = screen.getByRole('textbox', { name: /slope of the V–I graph/i });
    fireEvent.change(slopeInput, { target: { value: '10' } });
    fireEvent.submit(slopeInput.closest('form')!);
    expect(await screen.findByText(/^Correct/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /report/i }));
    const summary = await screen.findByTestId('report-summary');
    expect(summary.textContent).toContain('4 readings');
    expect(summary.textContent).toContain('slope 10 Ω');
  });

  it('flags an open circuit when the switch is opened, and blocks recording', async () => {
    go('#/lab/electricity');
    await screen.findByTestId('circuit-canvas');
    fireEvent.click(partList().getByRole('button', { name: /^Switch/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByTestId('circuit-status')).toHaveAttribute('data-status', 'open');
    expect(screen.getByRole('button', { name: /record reading/i })).toBeDisabled();
  });

  it('places a bulb with the keyboard on the circuit canvas', async () => {
    go('#/lab/electricity?preset=blank&mode=free');
    const canvas = await screen.findByTestId('circuit-canvas');
    fireEvent.click(screen.getByRole('button', { name: /^Bulb/ }));
    canvas.focus();
    fireEvent.keyDown(canvas, { key: 'Enter' });
    expect(elecStore.get().circuit.elements.map((e) => e.kind)).toContain('bulb');
    fireEvent.keyDown(canvas, { key: 'Delete' });
    expect(elecStore.get().circuit.elements).toHaveLength(0);
  });

  it('opens the assistant and labels offline answers as scripted', async () => {
    go('#/lab/electricity');
    fireEvent.click(await screen.findByTestId('assistant-toggle'));
    expect(await screen.findByTestId('assistant-mode')).toHaveTextContent(/not AI-generated/i);
    fireEvent.click(screen.getByRole('button', { name: /why this result/i }));
    expect(await screen.findByText(/I = V \/ Req = 1 \/ 10 = 0.1 A/)).toBeInTheDocument();
    expect(screen.getAllByText('Scripted').length).toBeGreaterThan(0);
  });
});

describe('motion lab journey', () => {
  it('steps the cart and records consistent x, v readings', async () => {
    go('#/lab/motion?activity=accelerated&mode=guided');
    const step = await screen.findByTestId('step');
    fireEvent.click(step);
    fireEvent.click(step);
    expect(screen.getByTestId('time')).toHaveTextContent('2.0 / 6.0 s');
    fireEvent.click(screen.getByRole('button', { name: /record reading/i }));
    const table = screen.getByRole('table');
    // t = 2 s: x = 1·2 + ½·0.5·4 = 3 m, v = 1 + 0.5·2 = 2 m/s
    const cells = within(table).getAllByRole('cell').map((c) => c.textContent);
    expect(cells.slice(0, 5)).toEqual(['1', '2', '3', '2', '0.5']);
  });
});

describe('heat lab journey', () => {
  it('shows a constant-temperature plateau while ice melts', async () => {
    go('#/lab/heat?activity=latent-fusion&mode=guided');
    const step = await screen.findByTestId('step');
    fireEvent.click(step);
    expect(screen.getByTestId('plateau')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /record reading/i }));
    const tables = screen.getAllByRole('table').filter((t) => !t.hasAttribute('data-testid'));
    const cells = within(tables[0]).getAllByRole('cell').map((c) => c.textContent);
    expect(cells).toContain('334000'); // Q / m = Lf
  });
});

describe('chemistry lab journey', () => {
  it('shows the selected element with the engine’s Bohr distribution and records it', async () => {
    go('#/lab/chemistry');
    fireEvent.click(await screen.findByTestId('pt-Cl'));
    const card = screen.getByTestId('element-card');
    expect(within(card).getByTestId('bohr-notation')).toHaveTextContent(bohrNotation(shells(17)));
    expect(card).toHaveTextContent(String(elementBySymbol('Cl')!.radius));
    fireEvent.click(screen.getByRole('button', { name: /record reading/i }));
    const rows = document.querySelectorAll('table.data tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(/17.*3.*17.*3.*7/);
  });

  it('balances HgO by changing coefficients only, and resets', async () => {
    go('#/lab/chemistry?mode=free');
    fireEvent.click(await screen.findByTestId('module-reactions'));
    fireEvent.change(screen.getByTestId('reaction-select'), { target: { value: 'hgo' } });
    expect(screen.getByTestId('balance-status')).toHaveTextContent(/Not balanced yet: O has 1 on the left and 2 on the right/);
    const row = screen.getByTestId('equation-row');
    const before = row.querySelectorAll('.eq-formula');
    const formulas = [...before].map((x) => x.textContent);
    fireEvent.change(screen.getByTestId('coef-0'), { target: { value: '2' } });
    expect(screen.getByTestId('balance-status')).toHaveTextContent(/Hg has 2 on the left and 1 on the right/);
    fireEvent.change(screen.getByTestId('coef-1'), { target: { value: '2' } });
    expect(screen.getByTestId('balance-status')).toHaveTextContent(/Balanced: every element/);
    // formulas never change while balancing
    expect([...row.querySelectorAll('.eq-formula')].map((x) => x.textContent)).toEqual(formulas);
    fireEvent.click(screen.getByTestId('reset'));
    expect((screen.getByTestId('coef-0') as HTMLInputElement).value).toBe('1');
  });

  it('rejects an invalid custom equation with a clear message', async () => {
    go('#/lab/chemistry?mode=free');
    fireEvent.click(await screen.findByTestId('module-reactions'));
    const input = screen.getByTestId('custom-equation');
    fireEvent.change(input, { target: { value: 'H2 + Xx -> H2O' } });
    fireEvent.submit(input.closest('form')!);
    expect(await screen.findByTestId('custom-error')).toHaveTextContent(/Xx/);
  });

  it('shows the engine’s molar mass in the calculator', async () => {
    go('#/lab/chemistry?mode=free');
    fireEvent.click(await screen.findByTestId('module-reactions'));
    fireEvent.change(screen.getByTestId('mm-formula'), { target: { value: 'Ca(OH)2' } });
    const mm = molarMass('Ca(OH)2', 'book');
    expect(mm.ok && mm.value.total).toBeCloseTo(74.1, 1);
    expect(screen.getByTestId('mm-result')).toHaveTextContent('74.1');
  });

  it('prepares a standard solution from the mass the engine calculates', async () => {
    go('#/lab/chemistry?mode=free');
    fireEvent.click(await screen.findByTestId('module-solutions'));
    const needed = screen.getByTestId('mass-needed').textContent!.replace(/[^\d.]/g, '');
    fireEvent.change(screen.getByTestId('weigh-input'), { target: { value: needed } });
    fireEvent.click(screen.getByTestId('step-weigh'));
    fireEvent.click(screen.getByTestId('step-dissolve'));
    fireEvent.click(screen.getByTestId('step-fill'));
    expect(screen.getByTestId('solution-feedback').querySelector('.banner-ok')).not.toBeNull();
  });

  it('answers “why” offline from the engine’s balance check', async () => {
    go('#/lab/chemistry?mode=free');
    fireEvent.click(await screen.findByTestId('module-reactions'));
    fireEvent.change(screen.getByTestId('reaction-select'), { target: { value: 'hgo' } });
    fireEvent.click(screen.getByTestId('assistant-toggle'));
    expect(await screen.findByTestId('assistant-mode')).toHaveTextContent(/not AI-generated/i);
    fireEvent.click(screen.getByRole('button', { name: /why this result/i }));
    expect(await screen.findByText(/atom counts differ for O/)).toBeInTheDocument();
  });
});

describe('workshop mode', () => {
  it('launches a prepared scenario with its objective shown in the lab', async () => {
    go('#/workshop');
    const card = await screen.findByTestId('ws-e4');
    fireEvent.click(within(card).getByRole('link', { name: /launch/i }));
    expect(await screen.findByTestId('workshop-banner')).toHaveTextContent(/Series versus parallel/);
    expect(elecStore.get().presetId).toBe('series');
  });
});
