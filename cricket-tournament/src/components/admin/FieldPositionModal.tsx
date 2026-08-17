'use client';

import { useState } from 'react';

// 8 directional sectors around the ground, each split into a close-in
// ("inner") and a boundary ("deep") zone -- 16 tappable regions total.
//
// Oriented for a right-handed batsman as the scorer sees the ground: the
// scorer sits behind the bowler's arm looking down the pitch at the
// batsman, so the bowler's end (straight shots -- long on/long off) is
// nearest the scorer at the BOTTOM of the diagram, and the wicketkeeper's
// end (backward shots -- fine leg/third man) is at the TOP, farthest away.
// Left/right follows the standard behind-the-bowler broadcast view: off
// side on the left, leg side on the right.
const SECTORS: { inner: string; outer: string }[] = [
  { inner: 'Fine Leg', outer: 'Long Leg' },
  { inner: 'Square Leg', outer: 'Deep Square Leg' },
  { inner: 'Mid Wicket', outer: 'Deep Mid Wicket' },
  { inner: 'Mid On', outer: 'Long On' },
  { inner: 'Mid Off', outer: 'Long Off' },
  { inner: 'Cover', outer: 'Deep Cover' },
  { inner: 'Point', outer: 'Deep Point' },
  { inner: 'Third Man', outer: 'Deep Third Man' },
];

const COMMENTARY_CHIPS = [
  'Seedha maidan ke bahar!',
  'Chauka!',
  'Chhakka!',
  'Clean bowled!',
  'Kya catch hai!',
  'Run out ho gaya!',
  'Tight bowling, dot ball',
  'Edge gaya, chauka mil gaya',
  'Bimla out!',
  'Zabardast shot!',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export default function FieldPositionModal({
  title,
  showFieldZone = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  showFieldZone?: boolean;
  onConfirm: (zone: string | null, commentary: string | null) => void;
  onCancel: () => void;
}) {
  const [zone, setZone] = useState<string | null>(null);
  const [commentary, setCommentary] = useState('');

  const cx = 150;
  const cy = 150;
  const rCenter = 26;
  const rInner = 95;
  const rOuter = 148;
  const sectorWidth = 360 / SECTORS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 pb-6 sm:rounded-2xl">
        <p className="mb-1 text-center text-sm font-black uppercase text-navy-900">{title}</p>

        {showFieldZone ? (
          <>
            <p className="mb-3 text-center text-xs text-slate-500">Tap where the ball went</p>
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
              ↑ Wicketkeeper&apos;s End
            </p>
            <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[280px] touch-manipulation select-none">
              <circle cx={cx} cy={cy} r={rOuter} className="fill-emerald-50 stroke-emerald-200" strokeWidth={1} />
              {SECTORS.map((sector, i) => {
                const start = i * sectorWidth;
                const end = start + sectorWidth;
                const mid = start + sectorWidth / 2;
                const innerLabelPos = polarToCartesian(cx, cy, (rCenter + rInner) / 2, mid);
                const outerLabelPos = polarToCartesian(cx, cy, (rInner + rOuter) / 2, mid);
                return (
                  <g key={sector.inner}>
                    <path
                      d={wedgePath(cx, cy, rCenter, rInner, start, end)}
                      className={`cursor-pointer stroke-white ${
                        zone === sector.inner ? 'fill-red-500' : 'fill-emerald-200 hover:fill-emerald-300'
                      }`}
                      strokeWidth={1.5}
                      onClick={() => setZone(sector.inner)}
                    />
                    <path
                      d={wedgePath(cx, cy, rInner, rOuter, start, end)}
                      className={`cursor-pointer stroke-white ${
                        zone === sector.outer ? 'fill-red-500' : 'fill-emerald-100 hover:fill-emerald-200'
                      }`}
                      strokeWidth={1.5}
                      onClick={() => setZone(sector.outer)}
                    />
                    <SectorLabel x={innerLabelPos.x} y={innerLabelPos.y} text={sector.inner} active={zone === sector.inner} />
                    <SectorLabel x={outerLabelPos.x} y={outerLabelPos.y} text={sector.outer} active={zone === sector.outer} />
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={rCenter} className="fill-navy-900" />
              <text x={cx} y={cy + 4} textAnchor="middle" className="fill-gold-400 text-[16px]">
                🏏
              </text>
            </svg>
            <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
              ↓ Bowler&apos;s End (You)
            </p>
            <p className="mt-2 text-center text-xs font-bold text-navy-900">
              {zone ? `Selected: ${zone}` : 'No zone selected yet'}
            </p>
          </>
        ) : (
          <p className="mb-3 text-center text-xs text-slate-500">Add commentary for this ball (optional)</p>
        )}

        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Quick Commentary</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMENTARY_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setCommentary(chip)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy-900 hover:bg-gold-500/20"
              >
                {chip}
              </button>
            ))}
          </div>
          <input
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            placeholder="Or type your own commentary…"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border-2 border-slate-300 py-2.5 text-xs font-bold uppercase text-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(showFieldZone ? zone : null, commentary.trim() || null)}
            disabled={showFieldZone && !zone}
            className="flex-[2] rounded-lg bg-navy-900 py-2.5 text-sm font-black uppercase text-white disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function SectorLabel({ x, y, text, active }: { x: number; y: number; text: string; active: boolean }) {
  const words = text.split(' ');
  const lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [text];
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className={`pointer-events-none select-none text-[7.5px] font-bold ${active ? 'fill-white' : 'fill-navy-900'}`}
    >
      {lines.map((line, i) => (
        <tspan key={line} x={x} dy={i === 0 ? (lines.length > 1 ? -3 : 0) : 8}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
