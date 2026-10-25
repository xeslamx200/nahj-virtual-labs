/**
 * Checks on the experiment state a lab page sends with a question.
 *
 * The simulation engines run in the browser and the server receives only text, so the server cannot
 * re-run them. What it can do is (1) confirm the text has the shape the named lab produces, (2) check
 * the numbers for internal physical consistency where the text allows it, and (3) tell the model and
 * the student that the values are *reported by the lab page*, never "verified by the server".
 *
 * status: 'none'        no state was sent
 *         'consistent'  right shape and the numbers pass the lab's consistency checks
 *         'format-only' right shape; no numeric cross-check exists for this lab/module
 *         'rejected'    wrong shape for the lab, or the numbers contradict each other: state is not used
 */
const FORMAT = {
  electricity: /^Circuit status: [\w -]+\./,
  motion: /^Set-up: x0 = /,
  heat: /^(Specific heat comparison|Heating curve of water)\./,
  chemistry: /^Module: (Periodic Table Explorer|Reactions & Stoichiometry|Solutions & Concentration)\./,
};

const num = (s) => Number.parseFloat(s);
const close = (a, b, rel = 0.02, abs = 0.003) => Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));

/** Ohm's law and P = VI for every ohmic part, battery current = V / Req for a single-battery circuit. */
function electricityConsistent(state) {
  let batteryV = null;
  let batteries = 0;
  for (const line of state.split('\n')) {
    const m = line.match(/^- (.+?)(?: \((.*?)\))?: V = ([\d.e+-]+) V, I = ([\d.e+-]+) A, P = ([\d.e+-]+) W/);
    if (!m) continue;
    const [, name, props = '', v, i, p] = m.map((x, k) => (k >= 3 ? num(x) : x));
    if (/^Battery/.test(name)) {
      batteries++;
      batteryV = num(props);
    }
    const r = props.match(/^([\d.e+-]+) ohm$/); // filament bulbs say "filament, cold …" and are not ohmic
    if (r && !close(v, i * num(r[1]))) return false;
    if (!/^Battery/.test(name) && !close(p, v * i, 0.03, 0.005)) return false;
  }
  const total = state.match(/Total battery current ([\d.e+-]+) A\./);
  const req = state.match(/Equivalent resistance ([\d.e+-]+) ohm\./);
  if (total && req && batteries === 1 && batteryV && num(req[1]) > 0 && !/filament/.test(state) && !close(num(total[1]), batteryV / num(req[1]))) return false;
  return true;
}

/** Speed equals |v| and distance is never less than |displacement|. */
function motionConsistent(state) {
  const m = state.match(/v = (-?[\d.e+-]+) m\/s, speed = (-?[\d.e+-]+) m\/s, a = .*?distance = (-?[\d.e+-]+) m, displacement = (-?[\d.e+-]+) m/);
  if (!m) return true;
  const [v, speed, distance, displacement] = m.slice(1).map(num);
  return close(Math.abs(v), speed, 0.01, 0.002) && distance + 0.002 >= Math.abs(displacement);
}

const CHECKS = { electricity: electricityConsistent, motion: motionConsistent };

export function checkLabState(lab, rawState) {
  const state = String(rawState ?? '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim();
  if (!state) return { state: '', status: 'none' };
  if (!FORMAT[lab]?.test(state)) return { state: '', status: 'rejected', reason: 'format' };
  const check = CHECKS[lab];
  if (!check) return { state, status: 'format-only' };
  return check(state) ? { state, status: 'consistent' } : { state: '', status: 'rejected', reason: 'inconsistent' };
}
