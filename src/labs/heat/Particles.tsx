import { useEffect, useRef } from 'react';

/**
 * Qualitative particle picture. Particle speed grows with √(absolute temperature);
 * the share of particles in each arrangement follows the solid / liquid / gas fractions.
 * It is a visual aid only — no value shown elsewhere is derived from it.
 */
interface Props {
  T: number;
  solid: number;
  liquid: number;
  gas: number;
  label: string;
  /** Freeze motion (reduced-motion preference or paused simulation is NOT used here — particles keep jiggling). */
  still?: boolean;
}

const N = 64;
const W = 320;
const H = 220;

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hx: number;
  hy: number;
  phase: number;
}

export function Particles({ T, solid, liquid, gas, label, still }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ T, solid, liquid, gas });
  live.current = { T, solid, liquid, gas };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext?.('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // lattice homes: 8 × 8 block at the bottom centre
    const cols = 8;
    const gap = 17;
    const ox = W / 2 - ((cols - 1) * gap) / 2;
    const oy = H - 22 - 7 * gap;
    const ps: P[] = Array.from({ length: N }, (_, i) => {
      const hx = ox + (i % cols) * gap;
      const hy = oy + Math.floor(i / cols) * gap;
      return { x: hx, y: hy, vx: Math.random() - 0.5, vy: Math.random() - 0.5, hx, hy, phase: Math.random() * Math.PI * 2 };
    });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      const { T: temp, solid: fs, liquid: fl } = live.current;
      const TK = Math.max(1, temp + 273.15);
      const k = Math.sqrt(TK / 273.15);
      const nSolid = Math.round(fs * N);
      const nLiquid = Math.round(fl * N);
      ctx.clearRect(0, 0, W, H);
      // the liquid settles in the lower part of the box, roughly the height of the solid block
      const liquidTop = oy - 14;
      const move = !reduce && !still;
      ps.forEach((p, i) => {
        if (i < nSolid) {
          // vibrate about a fixed lattice site
          const amp = 1.2 * k;
          const tt = frame * 0.35 + p.phase;
          const tx = p.hx + (move ? Math.sin(tt * 1.3) * amp : 0);
          const ty = p.hy + (move ? Math.cos(tt * 1.7) * amp : 0);
          p.x += (tx - p.x) * 0.25;
          p.y += (ty - p.y) * 0.25;
          p.vx = 0;
          p.vy = 0;
        } else if (i < nSolid + nLiquid) {
          // close together, sliding past each other in the lower part of the box
          const sp = 0.9 * k;
          if (move) {
            p.vx += (Math.random() - 0.5) * 0.6 * sp;
            p.vy += (Math.random() - 0.5) * 0.6 * sp + 0.05;
            const v = Math.hypot(p.vx, p.vy) || 1;
            p.vx = (p.vx / v) * sp;
            p.vy = (p.vy / v) * sp;
            p.x += p.vx;
            p.y += p.vy;
          }
          if (p.y < liquidTop) p.y += (liquidTop - p.y) * 0.2;
          if (p.y > H - 14) (p.y = H - 14), (p.vy = -Math.abs(p.vy));
          if (p.x < 14) (p.x = 14), (p.vx = Math.abs(p.vx));
          if (p.x > W - 14) (p.x = W - 14), (p.vx = -Math.abs(p.vx));
        } else {
          // far apart, fast, straight-line motion between collisions with the walls
          const sp = 3.2 * k;
          const v = Math.hypot(p.vx, p.vy) || 1;
          p.vx = (p.vx / v) * sp;
          p.vy = (p.vy / v) * sp;
          if (move) {
            p.x += p.vx;
            p.y += p.vy;
          }
          if (p.x < 10 || p.x > W - 10) (p.vx *= -1), (p.x = Math.min(W - 10, Math.max(10, p.x)));
          if (p.y < 10 || p.y > H - 10) (p.vy *= -1), (p.y = Math.min(H - 10, Math.max(10, p.y)));
        }
        const kind = i < nSolid ? 0 : i < nSolid + nLiquid ? 1 : 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6.2, 0, Math.PI * 2);
        ctx.fillStyle = kind === 0 ? '#2f6fd0' : kind === 1 ? '#0a8f7f' : '#6a55c2';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  return <canvas ref={ref} className="particles" role="img" aria-label={label} style={{ width: '100%', aspectRatio: `${W} / ${H}` }} />;
}
