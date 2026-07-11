import { useId } from 'react';
import type { PricePoint } from '../types';
import './PriceChart.css';

interface Props {
  points: PricePoint[];
  unit: string;
  format: (n: number) => string;
  height?: number;
  up?: boolean;
}

// Lightweight SVG area+line chart — no charting library needed.
export default function PriceChart({ points, unit, format, height = 240, up = true }: Props) {
  const gid = useId().replace(/:/g, '');
  if (!points || points.length < 2) {
    return <div className="pchart-empty">No price history available.</div>;
  }

  const W = 720, H = height;
  const padL = 8, padR = 8, padT = 16, padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const prices = points.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  // Pad the value range a touch so the line isn't glued to the edges.
  const lo = min - span * 0.12;
  const hi = max + span * 0.12;
  const vspan = hi - lo || 1;

  const x = (i: number) => padL + (i / (points.length - 1)) * iw;
  const y = (v: number) => padT + ih - ((v - lo) / vspan) * ih;

  const linePts = points.map((p, i) => `${x(i).toFixed(1)},${y(p.price).toFixed(1)}`);
  const linePath = 'M' + linePts.join(' L');
  const areaPath = `M${x(0).toFixed(1)},${(padT + ih).toFixed(1)} L${linePts.join(' L')} L${x(points.length - 1).toFixed(1)},${(padT + ih).toFixed(1)} Z`;

  const stroke = up ? '#0e7a3e' : '#c0392b';
  const fillA = up ? 'rgba(22,163,74,0.22)' : 'rgba(192,57,43,0.18)';
  const fillB = up ? 'rgba(22,163,74,0.0)' : 'rgba(192,57,43,0.0)';

  const last = points[points.length - 1];
  const lastX = x(points.length - 1), lastY = y(last.price);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // A few horizontal gridlines with value labels.
  const grid = [0, 0.5, 1].map(t => {
    const v = hi - t * vspan;
    return { yy: padT + t * ih, v };
  });

  return (
    <svg className="pchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Price history chart">
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillA} />
          <stop offset="100%" stopColor={fillB} />
        </linearGradient>
      </defs>

      {grid.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.yy} x2={W - padR} y2={g.yy} stroke="#eef4f0" strokeWidth={1} />
          <text x={padL + 2} y={g.yy - 3} className="pchart-grid-label">{Math.round(g.v).toLocaleString()}</text>
        </g>
      ))}

      <path d={areaPath} fill={`url(#g${gid})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />

      <circle cx={lastX} cy={lastY} r={4.5} fill={stroke} stroke="#fff" strokeWidth={2} />

      <text x={padL} y={H - 8} className="pchart-axis" textAnchor="start">{fmtDate(points[0].date)}</text>
      <text x={W - padR} y={H - 8} className="pchart-axis" textAnchor="end">{fmtDate(last.date)}</text>
      <text x={lastX} y={Math.max(lastY - 10, 12)} className="pchart-last" textAnchor="end">{format(last.price)}/{unit}</text>
    </svg>
  );
}
