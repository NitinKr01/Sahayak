import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import BIFormWizard from '../components/bi/BIFormWizard'
import ChatInput from '../components/chat/ChatInput'
import MessageBubble from '../components/chat/MessageBubble'
import AnnouncementRunner from '../components/layout/AnnouncementRunner'
import DashboardStrip from '../components/layout/DashboardStrip'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import type { BIProductName, MetricsResponse, StoredSession, UiMessage } from '../types'

const HISTORY_WINDOW = 30 // Streamlit rendered the last 30 messages

const SUGGESTIONS = [
  '📋 Product Info',
  '🎯 Sales Pitch',
  '❓ Objection Handling',
  '💳 BPPC Credit',
]

const SAMVAAD_URL = 'https://sahayak-samvaad.vercel.app'

export default function ChatPage() {
  const { user, logout, setUser } = useAuth()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [thinking, setThinking] = useState(false)
  const [biProduct, setBiProduct] = useState<BIProductName | null>(null)
  const [generatingBI, setGeneratingBI] = useState(false)
  // `id` makes repeat occurrences of the same message distinct state, so the
  // auto-dismiss timer restarts instead of the effect being skipped.
  const [banner, setBannerState] = useState<{ text: string; id: number } | null>(null)
  const setBanner = useCallback(
    (text: string | null) => setBannerState(text === null ? null : { text, id: Date.now() }),
    [],
  )
  const [readingAloudIndex, setReadingAloudIndex] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [sessions, setSessions] = useState<StoredSession[]>([])
  const [currentSession, setCurrentSession] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia('(min-width: 768px)').matches,
  )
  const [ttsEnabled, setTtsEnabled] = useState(
    () => localStorage.getItem('tts_enabled') === '1',
  )

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, biProduct])

  // Transient errors clear themselves so a stale banner never lingers.
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBannerState(null), 5000)
    return () => clearTimeout(t)
  }, [banner])

  // Restore the persisted session (same S3 data the Streamlit app used)
  useEffect(() => {
    api
      .getSessions()
      .then((data) => {
        setSessions(data.sessions ?? [])
        setCurrentSession(data.current_session ?? 0)
        const current = data.sessions[data.current_session] ?? data.sessions[0]
        if (!current) return
        const history = current.history ?? []
        const start = Math.max(0, history.length - HISTORY_WINDOW)
        setMessages(
          history.slice(start).map((msg, i) => ({
            role: msg.role,
            content: msg.content ?? '',
            index: start + i,
            feedback: msg.feedback ?? null,
            showDetailedFb: !!msg.show_detailed_fb,
          })),
        )
      })
      .catch((e) => handleAuthError(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    api
      .getMetrics()
      .then(setMetrics)
      .catch(() => setMetrics({ registered: false }))
  }, [])

  /** Announcements: the target strip is the only live data we have, so the
   * runner echoes progress rather than inventing campaign copy. */
  const announcements = useMemo(() => {
    if (!metrics?.registered) return []
    const items = [
      `🎯 Target ₹${metrics.target}L · Achieved ₹${metrics.achieved}L (${metrics.achieved_percent}%)`,
    ]
    if (metrics.report_date) items.push(`📅 Updated as of ${metrics.report_date}`)
    return items
  }, [metrics])

  const greetingName = useMemo(() => {
    const local = user?.email?.split('@')[0] ?? ''
    const first = local.split(/[._-]+/).filter(Boolean)[0]
    return first ? first[0].toUpperCase() + first.slice(1) : ''
  }, [user?.email])

  const handleAuthError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null)
        return true
      }
      return false
    },
    [setUser],
  )

  const updateTts = (value: boolean) => {
    setTtsEnabled(value)
    localStorage.setItem('tts_enabled', value ? '1' : '0')
  }

  const send = async (text: string) => {
    if (thinking || generatingBI) return
    setBanner(null)

    // Abandoning an open BI form — parity with Streamlit's message
    if (biProduct) {
      setBiProduct(null)
      try {
        const r = await api.appendAssistant('Incomplete details for BI creative generation.')
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: 'Incomplete details for BI creative generation.',
            index: r.message_index,
          },
        ])
      } catch (e) {
        if (handleAuthError(e)) return
      }
    }

    setMessages((m) => [...m, { role: 'user', content: text, index: -1 }])
    setThinking(true)
    try {
      const res = await api.chat(text, ttsEnabled)
      if (res.type === 'blocked') {
        setMessages((m) => m.slice(0, -1))
        setBanner(res.answer ?? 'This question cannot be processed.')
      } else if (res.type === 'bi_form') {
        setBiProduct(res.bi_product!)
      } else {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: res.answer ?? '',
            index: res.message_index ?? -1,
            feedback: null,
            downloads: res.downloads,
            campaignImageB64: res.campaign_image_b64,
            audioB64: res.audio_b64,
            animate: true,
          },
        ])
      }
    } catch (e) {
      if (!handleAuthError(e)) {
        setBanner(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
        setMessages((m) => m.slice(0, -1))
      }
    } finally {
      setThinking(false)
    }
  }

  const submitBI = async (formData: Record<string, unknown>) => {
    if (!biProduct) return
    setGeneratingBI(true)
    try {
      const res = await api.biGenerate(biProduct, formData)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.answer,
          index: res.message_index,
          feedback: null,
          biImageB64: res.image_b64,
        },
      ])
      setBiProduct(null)
    } catch (e) {
      if (!handleAuthError(e)) {
        setBanner(e instanceof Error ? e.message : 'BI generation failed.')
      }
    } finally {
      setGeneratingBI(false)
    }
  }

  const onThumb = async (index: number, value: number) => {
    if (index < 0) return
    setMessages((m) =>
      m.map((msg) =>
        msg.index === index
          ? { ...msg, feedback: value, showDetailedFb: value === 0 }
          : msg,
      ),
    )
    try {
      await api.feedback(index, value)
    } catch (e) {
      handleAuthError(e)
    }
  }

  const onDetailedSubmit = async (index: number, text: string) => {
    setMessages((m) =>
      m.map((msg) => (msg.index === index ? { ...msg, showDetailedFb: false } : msg)),
    )
    try {
      await api.feedback(index, 0, text)
    } catch (e) {
      handleAuthError(e)
    }
  }

  const onReadAloud = async (index: number) => {
    const msg = messages.find((m) => m.index === index)
    if (!msg || !msg.content.trim()) return
    setReadingAloudIndex(index)
    try {
      const res = await api.tts(msg.content)
      setMessages((m) =>
        m.map((x) => (x.index === index ? { ...x, audioB64: res.audio_b64 } : x)),
      )
    } catch (e) {
      if (!handleAuthError(e)) setBanner('Audio generation failed.')
    } finally {
      setReadingAloudIndex(null)
    }
  }

  const isEmpty = messages.length === 0 && !thinking && !biProduct

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <Sidebar
        open={sidebarOpen}
        email={user?.email ?? ''}
        metrics={metrics}
        sessions={sessions}
        currentSession={currentSession}
        ttsEnabled={ttsEnabled}
        onTtsChange={updateTts}
        onLogout={() => void logout()}
        onClose={() => setSidebarOpen(false)}
        samvaadUrl={SAMVAAD_URL}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <AnnouncementRunner items={announcements} />
        <DashboardStrip metrics={metrics} />

        {banner && (
          <div
            role="status"
            className="mx-3 mt-2 flex flex-none items-start gap-2 rounded-[10px] border border-[rgba(229,45,18,0.2)] bg-[rgba(229,45,18,0.08)] px-3.5 py-2 text-[12.5px] text-chilli"
          >
            <span className="flex-1">{banner.text}</span>
            <button
              onClick={() => setBannerState(null)}
              aria-label="Dismiss"
              className="flex-none text-[15px] leading-none text-chilli/70 transition-colors hover:text-chilli"
            >
              ×
            </button>
          </div>
        )}

        {isEmpty ? (
          /* ── Empty state: greeting, chips and a centred composer ── */
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-offwhite px-3.5 py-6">
            <div className="flex w-full max-w-3xl flex-col items-center gap-5">
              <div className="flex flex-col items-center gap-4">
                <div className="h-[70px] w-[70px] overflow-hidden rounded-[20px] bg-white shadow-lg">
                  <img src="/logo.png" alt="" className="h-full w-full object-contain p-2" />
                </div>
                <div className="text-center">
                  <h3 className="text-[19px] font-bold text-prussian">
                    Namaste{greetingName ? `, ${greetingName}` : ''} 👋
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[280px] text-[12.5px] leading-[1.55] text-subtext">
                    I'm Sahayak AI — your intelligent sales partner. Ask me anything about
                    Bandhan Life products, policies &amp; processes.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s.replace(/^\W+\s*/, ''))}
                      className="whitespace-nowrap rounded-full border-[1.5px] border-[rgba(21,48,80,0.1)] bg-white px-[11px] py-[7px] text-[11.5px] font-medium text-prussian shadow-sm transition-colors hover:bg-prussian hover:text-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <ChatInput bare disabled={thinking || generatingBI} onSend={(t) => void send(t)} />
            </div>
          </div>
        ) : (
          <>
            <main className="flex flex-1 flex-col gap-3 overflow-y-auto bg-offwhite px-3.5 py-3.5">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={`${msg.index}-${i}`}
                    message={msg}
                    readingAloud={readingAloudIndex === msg.index}
                    onThumb={onThumb}
                    onDetailedSubmit={onDetailedSubmit}
                    onReadAloud={onReadAloud}
                  />
                ))}

                {biProduct && (
                  <div className="flex items-start gap-2">
                    <div className="h-[30px] w-[30px] flex-none overflow-hidden rounded-[9px] bg-white shadow-[0_2px_6px_rgba(21,48,80,0.2)]">
                      <img
                        src="/logo.png"
                        alt="Sahayak"
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="inline-block rounded-[4px_18px_18px_18px] border border-[rgba(21,48,80,0.1)] bg-white px-[13px] py-[11px] text-[13.5px] text-bodytext shadow-sm">
                        Sure! Let's collect some details:
                      </div>
                      <BIFormWizard
                        product={biProduct}
                        busy={generatingBI}
                        onSubmit={submitBI}
                      />
                    </div>
                  </div>
                )}

                {thinking && (
                  <div className="flex items-start gap-2">
                    <div className="h-[30px] w-[30px] flex-none overflow-hidden rounded-[9px] bg-white shadow-[0_2px_6px_rgba(21,48,80,0.2)]">
                      <img
                        src="/logo.png"
                        alt=""
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <div className="rounded-[4px_18px_18px_18px] border border-[rgba(21,48,80,0.1)] bg-white px-[13px] py-[11px] shadow-sm">
                      <div className="flex items-center gap-1">
                        <span className="t-dot h-[7px] w-[7px] rounded-full bg-azure" />
                        <span className="t-dot h-[7px] w-[7px] rounded-full bg-azure [animation-delay:0.18s]" />
                        <span className="t-dot h-[7px] w-[7px] rounded-full bg-azure [animation-delay:0.36s]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </main>

            <ChatInput disabled={thinking || generatingBI} onSend={(t) => void send(t)} />
          </>
        )}
      </div>
    </div>
  )
}
