import type { MetricsResponse, StoredSession } from '../../types'

import { ExternalIcon, LogoutIcon, SearchIcon } from './icons'

import { useMemo, useState } from 'react'

interface Props {
  open: boolean
  email: string
  metrics: MetricsResponse | null
  sessions: StoredSession[]
  currentSession: number
  ttsEnabled: boolean
  onTtsChange: (value: boolean) => void
  onLogout: () => void
  onClose: () => void
  samvaadUrl: string
}

const APP_VERSION = '2.2'

export default function Sidebar({
  open,
  email,
  metrics,
  sessions,
  currentSession,
  ttsEnabled,
  onTtsChange,
  onLogout,
  onClose,
  samvaadUrl,
}: Props) {
  const [query, setQuery] = useState('')

  const initials = (email.trim()[0] ?? '?').toUpperCase()

  const displayName = useMemo(() => {
    const local = email.split('@')[0] ?? ''

    return (
      local
        .split(/[.\_-]+/)
        .filter(Boolean)
        .map((p) => p[0].toUpperCase() + p.slice(1))
        .join(' ') || email
    )
  }, [email])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) return sessions

    return sessions.filter((s) => s.name.toLowerCase().includes(q))
  }, [sessions, query])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        aria-hidden={!open}
        {...(!open && { inert: '' as unknown as boolean })}
        className={`fixed inset-y-0 left-0 z-30 flex w-[296px] flex-col overflow-hidden bg-white shadow-[6px_0_28px_rgba(0,0,0,0.16)] transition-[transform,width] duration-200 md:static md:z-auto md:shadow-none ${
          open
            ? 'translate-x-0 md:w-[296px] md:border-r md:border-surface'
            : '-translate-x-full md:w-0 md:translate-x-0 md:border-r-0'
        }`}
      >
        {/* Fixed-width inner shell so content doesn't reflow while aside animates */}
        <div className="flex h-full w-[296px] flex-none flex-col">

          {/* Profile header */}
          <div className="relative flex-none overflow-hidden bg-prussian px-[18px] pb-[18px] pt-6 md:pt-5">
            <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/[0.035]" />
            <div className="absolute -bottom-10 right-10 h-20 w-20 rounded-full bg-white/[0.025]" />

            <div className="relative mb-3.5 flex items-center gap-[11px]">
              <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[14px] border-2 border-white/20 bg-gradient-to-br from-chilli to-[#FF6040] text-[17px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-bold text-white">
                  {displayName}
                </h3>

                {metrics?.designation && (
                  <p className="mt-1 inline-flex max-w-full truncate rounded-full bg-white/10 px-[8px] py-[3px] text-[10.5px] font-medium text-white/90 ring-1 ring-inset ring-white/[0.08]">
                    {metrics.designation}
                  </p>
                )}
              </div>
            </div>

            <p
              className="relative truncate text-[10.5px] text-white/60"
              title={email}
            >
              {email}
            </p>
          </div>

          {/* History search */}
          <div className="mx-3.5 mt-3 mb-1 flex flex-none items-center gap-2 rounded-[11px] border-[1.5px] border-[rgba(21,48,80,0.1)] bg-surface px-3 py-2 transition-all focus-within:border-[rgba(21,48,80,0.22)] focus-within:bg-white focus-within:shadow-[0_2px_8px_rgba(21,48,80,0.06)]">
            <SearchIcon className="h-[13px] w-[13px] flex-none text-subtext" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="w-full flex-1 bg-transparent text-[12px] text-bodytext outline-none placeholder:text-subtext"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="flex h-4 w-4 items-center justify-center rounded-full text-[11px] text-subtext transition-colors hover:bg-[rgba(21,48,80,0.08)] hover:text-bodytext"
              >
              </button>
            )}
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto py-3.5 [scrollbar-width:thin]">
            <div className="mb-1 flex items-center justify-between px-[18px]">
              <p className="py-1.5 text-[9.5px] font-bold uppercase tracking-[1px] text-subtext">
                Recent Chats
              </p>

              {sessions.length > 0 && (
                <span className="rounded-full bg-surface px-1.5 py-0.5 text-[9px] font-medium text-subtext">
                  {sessions.length}
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="mx-3.5 mt-1 rounded-[10px] border border-dashed border-[rgba(21,48,80,0.12)] px-3 py-4 text-center">
                <p className="text-[11.5px] text-mutedtext">
                  {sessions.length === 0 ? 'No chats yet.' : 'No matches.'}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((s) => {
                  const active = s.id === sessions[currentSession]?.id

                  return (
                    <div
                      key={s.id}
                      className={`group mx-2 flex cursor-default items-start gap-[9px] rounded-[10px] px-[10px] py-[9px] transition-all ${
                        active
                          ? 'bg-[rgba(21,48,80,0.07)] shadow-[inset_3px_0_0_rgba(21,48,80,0.8)]'
                          : 'hover:bg-offwhite'
                      }`}
                    >
                      <span
                        className={`mt-[5px] h-[7px] w-[7px] flex-none rounded-full transition-all ${
                          active
                            ? 'bg-prussian shadow-[0_0_0_3px_rgba(21,48,80,0.08)]'
                            : 'bg-lightgrey group-hover:bg-[rgba(21,48,80,0.35)]'
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[12.5px] leading-[1.35] ${
                            active
                              ? 'font-medium text-prussian'
                              : 'text-bodytext'
                          }`}
                        >
                          {s.name}
                        </p>

                        <span className="mt-0.5 block text-[10.5px] text-mutedtext">
                          {s.timestamp}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-none flex-col gap-2.5 border-t border-surface bg-white px-[18px] pb-[22px] pt-3.5">

            {/* TTS */}
            <label className="flex cursor-pointer items-center justify-between rounded-[9px] px-1 py-1.5 transition-colors hover:bg-offwhite">
              <span className="text-[12px] text-bodytext">
                🔊 Auto Read Answers
              </span>

              <span className="relative ml-3 flex-none">
                <input
                  type="checkbox"
                  checked={ttsEnabled}
                  onChange={(e) => onTtsChange(e.target.checked)}
                  className="peer sr-only"
                />

                <span className="block h-[20px] w-[36px] rounded-full bg-[rgba(21,48,80,0.15)] transition-colors peer-checked:bg-prussian peer-focus-visible:ring-2 peer-focus-visible:ring-[rgba(21,48,80,0.2)]">
                  <span className="absolute left-[3px] top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform peer-checked:translate-x-4" />
                </span>
              </span>
            </label>

            {/* Samvaad */}
            <a
              href={samvaadUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-center gap-1.5 rounded-[9px] border border-[rgba(21,48,80,0.14)] bg-offwhite px-3 py-2 text-[11.5px] font-semibold text-prussian transition-all hover:-translate-y-px hover:bg-surface hover:shadow-[0_3px_8px_rgba(21,48,80,0.08)]"
            >
              Open Samvaad

              <ExternalIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            {/* Version + logout */}
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-surface bg-offwhite px-[9px] py-[3px] text-[10.5px] text-subtext">
                v{APP_VERSION}
              </span>

              <button
                onClick={onLogout}
                className="flex items-center gap-[5px] rounded-[8px] border border-[rgba(229,45,18,0.2)] bg-[rgba(229,45,18,0.08)] px-[13px] py-1.5 text-[11.5px] font-semibold text-chilli transition-all hover:-translate-y-px hover:bg-[rgba(229,45,18,0.14)] hover:shadow-[0_2px_6px_rgba(229,45,18,0.08)]"
              >
                <LogoutIcon className="h-[11px] w-[11px]" />
                Logout
              </button>
            </div>

            {/* Warning */}
            <p className="rounded-[8px] border-l-[3px] border-[#F59E0B] bg-[#FEFCE8] px-2.5 py-2 text-[10.5px] italic leading-[1.5] text-subtext">
              This agent is still learning and may give incorrect answers.
              Always verify before sharing with customers.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
