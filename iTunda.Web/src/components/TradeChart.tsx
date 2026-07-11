import { useMemo } from 'react';
import { seededRand } from '../lib/trading';
import type { PricePoint } from '../types';
import './TradeChart.css';

interface Candle { o: number; h: number; l: number; c: number; date: string; }

interface Props {
  points: PricePoint[];
  symbol: string;
  livePrice?: number | null;
  px: (kes: number) => string;
  height?: number;
}

// Candlestick chart drawn as plain SVG (no charting lib). OHLC is synthesised
// deterministically from the average-price series so it looks like a real feed.
export default function TradeChart({ points, symbol, livePrice, px, height = 380 }: Props) {
  const candles = useMemo<Candle[]>(() => {
    const cs: Candle[] = [];
    for (let i = 0; i < points.length; i++) {
      const c = points[i].price;
      const o = i === 0 ? c : points[i - 1].price;
      const body = Math.abs(c - o) || c * 0.008;
      const r1 = seededRand(`${symbol}h${i}`);
      const r2 = seededRand(`${symbol}l${i}`);
      const h = Math.max(o, c) + body * (0.25 + r1 * 1.1);
      const l = Math.min(o, c) - body * (0.25 + r2 * 1.1);
      cs.push({ o, c, h, l: Math.max(0.01, l), date: points[i].date });
    }
    return cs;
  }, [points, symbol]);

  if (candles.length < 2) return <div className="tc-empty">No chart data.</div>;

  const W = 1000, H = height;
  const padT = 12, padB = 24, padR = 62, padL = 6;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const last = livePrice ?? candles[candles.length - 1].c;
  let lo = Math.min(last, ...candles.map(c => c.l));
  let hi = Math.max(last, ...candles.map(c => c.h));
  const pad = (hi - lo) * 0.08 || hi * 0.02;
  lo -= pad; hi += pad;
  const span = hi - lo || 1;

  const x = (i: number) => padL + (i + 0.5) * (iw / candles.length);
  const y = (v: number) => padT + ih - ((v - lo) / span) * ih;
  const slot = iw / candles.length;
  const bw = Math.min(14, slot * 0.6);

  const UP = '#1fae74', DOWN = '#e5484d';
  const lastUp = last >= candles[0].c;

  const grid = [0, 0.25, 0.5, 0.75, 1].map(t => ({ yy: padT + t * ih, v: hi - t * span }));
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const lastCandle = candles[candles.length - 1];

  return (
    <div className="tc-wrap">
      <div className="tc-legend">
        <span className="tc-sym">{symbol}</span>
        <span>O <b>{lastCandle.o.toFixed(2)}</b></span>
        <span>H <b className="up">{lastCandle.h.toFixed(2)}</b></span>
        <span>L <b className="down">{lastCandle.l.toFixed(2)}</b></span>
        <span>C <b>{last.toFixed(2)}</b></span>
      </div>
      <svg className="tc-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${symbol} candlestick chart`}>
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.yy} x2={W - padR} y2={g.yy} className="tc-grid" vectorEffect="non-scaling-stroke" />
            <text x={W - padR + 6} y={g.yy + 3} className="tc-axis">{Math.round(g.v).toLocaleString()}</text>
          </g>
        ))}

        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const col = up ? UP : DOWN;
          const yO = y(c.o), yC = y(c.c);
          const top = Math.min(yO, yC);
          const bh = Math.max(1.5, Math.abs(yC - yO));
          return (
            <g key={i}>
              <line x1={x(i)} y1={y(c.h)} x2={x(i)} y2={y(c.l)} stroke={col} strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <rect x={x(i) - bw / 2} y={top} width={bw} height={bh} fill={col} rx={1} />
            </g>
          );
        })}

        {/* Live price line + tag */}
        <line x1={padL} y1={y(last)} x2={W - padR} y2={y(last)} className="tc-lastline" vectorEffect="non-scaling-stroke" />
        <g>
          <rect x={W - padR} y={y(last) - 10} width={padR} height={20} fill={lastUp ? UP : DOWN} />
          <text x={W - padR / 2} y={y(last) + 4} className="tc-lasttag" textAnchor="middle">{last.toFixed(2)}</text>
        </g>

        <text x={padL} y={H - 7} className="tc-axis" textAnchor="start">{fmtDate(candles[0].date)}</text>
        <text x={padL + iw / 2} y={H - 7} className="tc-axis" textAnchor="middle">{fmtDate(candles[Math.floor(candles.length / 2)].date)}</text>
        <text x={W - padR} y={H - 7} className="tc-axis" textAnchor="end">{fmtDate(lastCandle.date)}</text>
      </svg>
      <div className="tc-note">Simulated OHLC from farm-gate averages · {px(Math.round(last))}</div>
    </div>
  );
}
