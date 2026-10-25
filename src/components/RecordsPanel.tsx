import type { ActivityDef } from '../curriculum/types';
import { useI18n, type L } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { fmt, linearFit, originSlope } from '../lib/format';
import { removeRecord, resetActivity, updateActivity, useActivityProgress } from '../lib/progress';
import { Icon } from './Icon';
import { LineChart, SERIES_COLORS, type ChartSeries } from './LineChart';

/**
 * Results table + graph built only from rows recorded from the simulation.
 */
export function RecordsPanel<S>({
  activity,
  onRecord,
  recordDisabled,
  tagLabels,
}: {
  activity: ActivityDef<S>;
  onRecord: () => void;
  recordDisabled?: string;
  tagLabels?: Record<string, L>;
}) {
  const { t } = useI18n();
  const progress = useActivityProgress(activity.lab, activity.id);
  const rows = progress.records;
  const col = (id: string) => activity.columns.find((c) => c.id === id);

  let series: ChartSeries[] = [];
  if (activity.chart) {
    const { x, y, fit } = activity.chart;
    const tags = [...new Set(rows.map((r) => r.tag ?? ''))];
    series = tags.map((tag, i) => ({
      id: `rec-${tag}`,
      label: tag && tagLabels?.[tag] ? t(tagLabels[tag]) : t(UI.recorded),
      kind: 'points' as const,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      points: rows.filter((r) => (r.tag ?? '') === tag).map((r) => ({ x: r.values[x], y: r.values[y] })),
    }));
    const pts = rows.map((r) => ({ x: r.values[x], y: r.values[y] })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (fit && pts.length >= 2) {
      const xs = pts.map((p) => p.x);
      const lo = Math.min(0, ...xs);
      const hi = Math.max(...xs);
      const line = fit === 'origin' ? { m: originSlope(pts) ?? 0, b: 0 } : linearFit(pts);
      if (line)
        series.push({
          id: 'fit',
          label: `${t(UI.fitLine)}: ${t(UI.slope)} = ${fmt(line.m, 4)}${activity.chart.slopeUnit ? ` ${activity.chart.slopeUnit}` : ''}`,
          kind: 'line',
          dashed: true,
          color: '#5b6478',
          points: [
            { x: lo, y: line.m * lo + line.b },
            { x: hi, y: line.m * hi + line.b },
          ],
        });
    }
  }

  const xc = activity.chart ? col(activity.chart.x) : undefined;
  const yc = activity.chart ? col(activity.chart.y) : undefined;

  return (
    <section className="panel records" aria-label={t(UI.results)}>
      <div className="panel-title">
        <span>{t(UI.results)}</span>
        <span style={{ display: 'flex', gap: 6 }}>
          {rows.length > 0 && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => updateActivity(activity.lab, activity.id, (p) => ({ ...p, records: [] }))}>
              {t(UI.clear)}
            </button>
          )}
          <button type="button" className="btn btn-sm btn-primary" onClick={onRecord} disabled={!!recordDisabled} title={recordDisabled}>
            <Icon name="record" /> {t(UI.record)}
          </button>
        </span>
      </div>
      {recordDisabled && <p className="small muted" style={{ marginBottom: 8 }}>{recordDisabled}</p>}

      {activity.chart && xc && yc && (
        <LineChart
          title={`${t(yc.label)} – ${t(xc.label)}`}
          series={series}
          xLabel={t(xc.label)}
          yLabel={t(yc.label)}
          xUnit={xc.unit}
          yUnit={yc.unit}
          height={220}
          emptyText={t(UI.needsRecords)}
        />
      )}

      {rows.length === 0 ? (
        <p className="empty-state">{t(UI.noRecords)}</p>
      ) : (
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="data">
            <caption className="sr-only">{t(UI.table)}</caption>
            <thead>
              <tr>
                <th scope="col" className="num">#</th>
                {tagLabels && <th scope="col" />}
                {activity.columns.map((c) => (
                  <th key={c.id} scope="col" className="num">
                    {t(c.label)} <span className="ltr muted">({c.unit})</span>
                  </th>
                ))}
                <th scope="col">
                  <span className="sr-only">{t(UI.remove)}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="num">{i + 1}</td>
                  {tagLabels && <td>{r.tag && tagLabels[r.tag] ? t(tagLabels[r.tag]) : ''}</td>}
                  {activity.columns.map((c) => (
                    <td key={c.id} className="num">
                      {fmt(r.values[c.id], c.digits ?? 3)}
                    </td>
                  ))}
                  <td>
                    <button type="button" className="btn btn-sm btn-ghost" aria-label={t(UI.remove)} onClick={() => removeRecord(activity.lab, activity.id, r.id)}>
                      <Icon name="trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export { resetActivity };
