import { useEffect, useState } from 'react'
import type { MetricsResponse } from '../../types'
import { ChevronUpIcon } from './icons'

interface Props {
  metrics: MetricsResponse | null
}

/** Target / Achieved / Progress strip, collapsible via the bar underneath.
 * Values come from /api/metrics — hidden entirely for unregistered users. */
export default function DashboardStrip({ metrics }: Props) {
  const [open, setOpen] = useState(() => localStorage.getItem('dash_open') !== '0')

  useEffect(() => {
    localStorage.setItem('dash_open', open ? '1' : '0')
  }, [open])

  if (!metrics?.registered) return null

  const pctRaw = Number(metrics.achieved_percent ?? 0)
  const pct = Number.isFinite(pctRaw) ? pctRaw : 0
  const barWidth = Math.max(0, Math.min(100, pct))

  return (
    <div className="flex-none">
      {open && (
        <div className="flex items-stretch bg-prussian px-3.5 pt-2 pb-2.5">
          <Col label="Target" value={`₹${metrics.target}L`} divider />
          <Col label="Achieved" value={`₹${metrics.achieved}L`} hit divider />
          <div className="flex flex-[1.5] flex-col justify-center gap-1 px-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-medium uppercase tracking-[0.8px] text-white/50">
                Progress
              </span>
              <span className="text-[13px] font-bold text-[#4ADE80]">{pct}%</span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] transition-[width] duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1 border-b border-surface bg-white py-[3px] transition-colors hover:bg-offwhite"
      >
        <ChevronUpIcon
          className={`h-[9px] w-[9px] text-subtext transition-transform duration-200 ${
            open ? '' : 'rotate-180'
          }`}
        />
        <span className="text-[9px] font-semibold tracking-[0.3px] text-subtext">
          {open ? 'Hide targets' : 'Show targets'}
        </span>
      </button>
    </div>
  )
}

function Col({
  label,
  value,
  hit,
  divider,
}: {
  label: string
  value: string
  hit?: boolean
  divider?: boolean
}) {
  return (
    <div
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 ${
        divider ? 'after:absolute after:right-0 after:top-[15%] after:h-[70%] after:w-px after:bg-white/12' : ''
      }`}
    >
      <span className="text-[8px] font-medium uppercase tracking-[0.8px] text-white/50">
        {label}
      </span>
      <span
        className={`text-[16px] font-bold tracking-[-0.3px] ${hit ? 'text-[#4ADE80]' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  )
}
