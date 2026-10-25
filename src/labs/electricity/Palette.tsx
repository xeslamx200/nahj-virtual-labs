import { useI18n } from '../../i18n/i18n';
import type { PresetId } from '../../physics/circuit/presets';
import { Icon } from '../../components/Icon';
import { E, TOOL_HELP, TOOL_NAMES } from './strings';
import { elecActions, useElec, type Tool } from './store';

const TOOLS: Tool[] = ['select', 'wire', 'battery', 'resistor', 'bulb', 'switch', 'ammeter', 'voltmeter'];

/** Small schematic glyphs for the tool buttons. */
function ToolGlyph({ tool }: { tool: Tool }) {
  const common = { stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 40 24" width={34} height={20} aria-hidden="true" focusable="false">
      {tool === 'select' && <path d="M15 4l11 8-5 1 3 6-2.5 1-3-6-3.5 3.5z" {...common} fill="currentColor" strokeWidth={1} />}
      {tool === 'wire' && (
        <>
          <line x1={5} y1={12} x2={35} y2={12} {...common} />
          <circle cx={5} cy={12} r={2.5} fill="currentColor" />
          <circle cx={35} cy={12} r={2.5} fill="currentColor" />
        </>
      )}
      {tool === 'battery' && (
        <>
          <path d="M3 12h14M23 12h14" {...common} />
          <line x1={17} y1={8} x2={17} y2={16} {...common} strokeWidth={3.2} />
          <line x1={23} y1={4} x2={23} y2={20} {...common} />
        </>
      )}
      {tool === 'resistor' && (
        <>
          <path d="M3 12h9M28 12h9" {...common} />
          <rect x={12} y={7} width={16} height={10} rx={1.5} {...common} />
        </>
      )}
      {tool === 'bulb' && (
        <>
          <path d="M3 12h10M27 12h10" {...common} />
          <circle cx={20} cy={12} r={7} {...common} />
          <path d="M15 7l10 10M15 17l10-10" {...common} strokeWidth={1.4} />
        </>
      )}
      {tool === 'switch' && (
        <>
          <path d="M3 12h10M27 12h10M13 12l12-7" {...common} />
          <circle cx={13} cy={12} r={2} fill="currentColor" />
          <circle cx={27} cy={12} r={2} fill="currentColor" />
        </>
      )}
      {(tool === 'ammeter' || tool === 'voltmeter') && (
        <>
          <path d="M3 12h9M28 12h9" {...common} />
          <circle cx={20} cy={12} r={8} {...common} />
          <text x={20} y={16} textAnchor="middle" fontSize={11} fontWeight={700} fill="currentColor" fontFamily="var(--font-latin)">
            {tool === 'ammeter' ? 'A' : 'V'}
          </text>
        </>
      )}
    </svg>
  );
}

export function Palette() {
  const { t } = useI18n();
  const { tool, presetId, undo, showFlow, circuit } = useElec();
  return (
    <div className="palette">
      <div className="palette-tools" role="toolbar" aria-label={t(E.parts)}>
        {TOOLS.map((k) => (
          <button
            key={k}
            type="button"
            className="tool-btn"
            aria-pressed={tool === k}
            onClick={() => elecActions.setTool(k)}
            title={t(TOOL_HELP[k])}
            data-tool={k}
          >
            <ToolGlyph tool={k} />
            <span>{t(TOOL_NAMES[k])}</span>
          </button>
        ))}
      </div>
      <div className="palette-actions">
        <label className="inline-select">
          <span className="small muted">{t(E.presets)}</span>
          <select
            value={presetId}
            onChange={(e) => elecActions.loadPreset(e.target.value as PresetId)}
            aria-label={t(E.presets)}
            data-testid="preset-select"
          >
            {Object.entries(E.presetNames).map(([id, name]) => (
              <option key={id} value={id}>
                {t(name)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-sm" onClick={() => elecActions.undo()} disabled={!undo.length}>
          <Icon name="reset" /> {t(E.undo)}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => elecActions.clear()} disabled={!circuit.elements.length}>
          <Icon name="trash" /> {t(E.clearAll)}
        </button>
        <label className="check-inline" title={t(E.flowNote)}>
          <input type="checkbox" checked={showFlow} onChange={() => elecActions.toggleFlow()} /> {t(E.flow)}
        </label>
      </div>
      <p className="small muted palette-help" aria-live="polite">
        {t(TOOL_HELP[tool])}
      </p>
    </div>
  );
}
