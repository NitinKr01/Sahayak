/* Dev-only visual harness: mounts the real chat shell against a stubbed API so
 * the redesign can be eyeballed without Cognito/S3. Not referenced by the app
 * bundle — open /preview.html with `npm run dev`. */
import { StrictMode, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BIFormWizard from './components/bi/BIFormWizard'
import Markdown from './components/chat/Markdown'
import ChatInput from './components/chat/ChatInput'
import DownloadCards from './components/chat/DownloadCards'
import FeedbackButtons from './components/chat/FeedbackButtons'
import MessageBubble from './components/chat/MessageBubble'
import AnnouncementRunner from './components/layout/AnnouncementRunner'
import DashboardStrip from './components/layout/DashboardStrip'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import type { MetricsResponse, StoredSession, UiMessage } from './types'

const metrics: MetricsResponse = {
  registered: true,
  target: 9.4,
  achieved: 6.2,
  achieved_percent: 66,
  designation: 'Relationship Manager',
  report_date: '31 August 2026',
}

const sessions: StoredSession[] = [
  { id: 's1', name: 'Shubh Samriddhi benefits', timestamp: '10:12 AM', history: [], custom_name: false },
  { id: 's2', name: 'BPPC credit for iTerm Elite', timestamp: 'Yesterday', history: [], custom_name: false },
  { id: 's3', name: 'Ultima Plus BI creative', timestamp: '2 Sep', history: [], custom_name: false },
]

const messages: UiMessage[] = [
  { role: 'user', content: 'Tell me about Shubh Samriddhi — key benefits', index: 0 },
  {
    role: 'assistant',
    index: 1,
    feedback: null,
    content:
      '**Shubh Samriddhi** — Non-linked participating savings plan.\n\n' +
      '**Key Benefits:**\n\n' +
      '- Annual cash bonuses from Year 1\n' +
      '- Lump-sum at maturity + Terminal Bonus\n' +
      '- Life cover throughout the term\n' +
      '- Entry age: 3 months – 65 years\n',
  },
  { role: 'user', content: 'What is the BPPC credit for 12 PPT?', index: 2 },
  {
    role: 'assistant',
    index: 3,
    feedback: null,
    content:
      'Here is the **BPPC credit** table for Shubh Samriddhi:\n\n' +
      '| PPT | ATS < ₹60K | ATS ≥ ₹60K |\n' +
      '| --- | --- | --- |\n' +
      '| ≤5 | 50% | 60% |\n' +
      '| 6 to 9 | 50% | 60% |\n' +
      '| 10 | 90% | 100% |\n' +
      '| 12 | 90% | 100% |\n',
    downloads: [
      {
        product: 'Shubh Samriddhi',
        files: [
          { name: 'Shubh Samriddhi Brochure.pdf', url: '#brochure', icon: 'picture_as_pdf' },
          { name: 'BPPC Credit Aug26.xlsx', url: '#bppc', icon: 'table' },
        ],
      },
    ],
  },
]

const noop = () => {}

const params = new URLSearchParams(location.search)
const SIDEBAR_OPEN = params.get('menu') !== '0'
const VIEW = params.get('view') ?? 'chat'

/** Views offered in the switcher. `md` and `banner` stay query-param-only —
 * they are dev harnesses, not screens a reviewer needs to see. */
const VIEWS = [
  ['chat', 'Chat'],
  ['empty', 'Welcome'],
  ['bi', 'BI wizard'],
] as const

function ViewSwitcher({
  view,
  onChange,
}: {
  view: string
  onChange: (v: string) => void
}) {
  return (
    <div className="fixed right-3 top-[62px] z-50 flex gap-1 rounded-full border border-[rgba(21,48,80,0.12)] bg-white/95 p-1 shadow-[0_4px_16px_rgba(21,48,80,0.18)] backdrop-blur">
      {VIEWS.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-current={view === key}
          className={
            'rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ' +
            (view === key
              ? 'bg-prussian text-white'
              : 'text-prussian hover:bg-[rgba(21,48,80,0.07)]')
          }
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** Empty state + BI wizard, mirroring ChatPage's own markup. */
function EmptyPreview() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <Header onToggleSidebar={noop} />
      <AnnouncementRunner items={['🎯 Target ₹9.4L · Achieved ₹6.2L (66%)']} />
      <DashboardStrip metrics={metrics} />
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-offwhite px-3.5 py-6">
        <div className="flex w-full max-w-3xl flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-4">
            <div className="h-[70px] w-[70px] overflow-hidden rounded-[20px] bg-white shadow-lg">
              <img src="/logo.png" alt="" className="h-full w-full object-contain p-2" />
            </div>
            <div className="text-center">
              <h3 className="text-[19px] font-bold text-prussian">Namaste, Rohan 👋</h3>
              <p className="mx-auto mt-1.5 max-w-[280px] text-[12.5px] leading-[1.55] text-subtext">
                I'm Sahayak AI — your intelligent sales partner. Ask me anything about Bandhan
                Life products, policies &amp; processes.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['📋 Product Info', '🎯 Sales Pitch', '❓ Objection Handling', '💳 BPPC Credit'].map(
                (s) => (
                  <button
                    key={s}
                    className="whitespace-nowrap rounded-full border-[1.5px] border-[rgba(21,48,80,0.1)] bg-white px-[11px] py-[7px] text-[11.5px] font-medium text-prussian shadow-sm"
                  >
                    {s}
                  </button>
                ),
              )}
            </div>
          </div>
          <ChatInput bare disabled={false} onSend={noop} />
        </div>
      </div>
    </div>
  )
}

function BiPreview() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-offwhite">
      <Header onToggleSidebar={noop} />
      <main className="flex-1 overflow-y-auto px-3.5 py-3.5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          <MessageBubble
            message={{ role: 'user', content: 'Generate BI for Ultima Plus', index: 0 }}
            readingAloud={false}
            onThumb={noop}
            onDetailedSubmit={noop}
            onReadAloud={noop}
          />
          <div className="flex items-start gap-2">
            <div className="h-[30px] w-[30px] flex-none overflow-hidden rounded-[9px] bg-white shadow-[0_2px_6px_rgba(21,48,80,0.2)]">
              <img src="/logo.png" alt="" className="h-full w-full object-contain p-0.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-block rounded-[4px_18px_18px_18px] border border-[rgba(21,48,80,0.1)] bg-white px-[13px] py-[11px] text-[13.5px] text-bodytext shadow-sm">
                Sure! Let's collect some details:
              </div>
              <BIFormWizard product="iInvest Ultima Plus" busy={false} onSubmit={noop} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/** Table-parsing cases matching real assistant output shapes. */
const MD_CASES: Record<string, string> = {
  clean: '| PPT | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  'bold-header': '**BPPC**\n| PPT | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  'no-blank-line-after-text':
    'Here is the table:\n| PPT | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  'br-before': 'Here is the table:<br>| PPT | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  'leading-spaces':
    '  | PPT | A | B |\n  | --- | --- | --- |\n  | 10 | 90% | 100% |',
  'heading-before':
    '#### **Bandhan Life iTerm Elite**\n| PPT | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  'no-outer-pipes': 'PPT | A | B\n--- | --- | ---\n10 | 90% | 100%',
  // Blank first cell: the real KB tables use "| PPT | ..." but several have an
  // empty leading header cell, which renders as an empty <th>.
  'empty-first-header': '|  | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  // Separator on the SAME line count but with a leading blank line — GFM then
  // treats row 1 as the header and row 2 (the real header) as a body row.
  'blank-line-then-table':
    'Text\n\n\n| PPT | A | B |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  // A table preceded by a separator-looking line
  'sep-first': '| --- | --- | --- |\n| PPT | A | B |\n| 10 | 90% | 100% |',
  // Header cells that are bold — common in the KB tables
  'bold-cells':
    '| **PPT** | **ATS < ₹60K** | **ATS ≥ ₹60K** |\n| --- | --- | --- |\n| 10 | 90% | 100% |',
  // KB style: alignment separator with colons and padding
  'kb-style':
    '| PPT                              |  10   |\n| -------------------------------- | ------|\n| **Premium - 1.5 Lacs to < 2 Lacs |  100% |',
}

function MdPreview() {
  return (
    <div className="bg-offwhite p-6">
      {Object.entries(MD_CASES).map(([name, md]) => (
        <div key={name} data-case={name} className="mb-6">
          <p className="mb-1 text-[11px] font-bold uppercase text-chilli">{name}</p>
          <div className="rounded-lg border border-[rgba(21,48,80,0.1)] bg-white p-3">
            <Markdown>{md}</Markdown>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Mirrors ChatPage's banner state + auto-dismiss effect verbatim. */
function BannerPreview() {
  const [banner, setBannerState] = useState<{ text: string; id: number } | null>(null)
  const setBanner = (text: string | null) =>
    setBannerState(text === null ? null : { text, id: Date.now() })

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBannerState(null), 5000)
    return () => clearTimeout(t)
  }, [banner])

  return (
    <div className="p-6">
      <button
        id="show"
        onClick={() => setBanner('Audio generation failed.')}
        className="rounded-md bg-prussian px-4 py-2 text-[13px] font-bold text-white"
      >
        Trigger error
      </button>
      {banner && (
        <div
          role="status"
          className="mx-3 mt-2 flex items-start gap-2 rounded-[10px] border border-[rgba(229,45,18,0.2)] bg-[rgba(229,45,18,0.08)] px-3.5 py-2 text-[12.5px] text-chilli"
        >
          <span className="flex-1">{banner.text}</span>
          <button
            onClick={() => setBannerState(null)}
            aria-label="Dismiss"
            className="flex-none text-[15px] leading-none text-chilli/70"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

function Preview() {
  const [open, setOpen] = useState(SIDEBAR_OPEN)
  const [view, setView] = useState(VIEW)

  // The markdown harness is driven by tests via ?view=md and has no switcher.
  if (view === 'md') return <MdPreview />

  const screen =
    view === 'banner' ? (
      <BannerPreview />
    ) : view === 'empty' ? (
      <EmptyPreview />
    ) : view === 'bi' ? (
      <BiPreview />
    ) : (
      <ChatPreview open={open} setOpen={setOpen} />
    )

  return (
    <>
      {screen}
      <ViewSwitcher view={view} onChange={setView} />
    </>
  )
}

function ChatPreview({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <Sidebar
        open={open}
        email="rohan.sharma@bandhanlife.com"
        metrics={metrics}
        sessions={sessions}
        currentSession={0}
        ttsEnabled
        onTtsChange={noop}
        onLogout={noop}
        onClose={() => setOpen(false)}
        samvaadUrl="#"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={() => setOpen((o) => !o)} />
        <AnnouncementRunner
          items={[`🎯 Target ₹9.4L · Achieved ₹6.2L (66%)`, '📅 Updated as of 31 August 2026']}
        />
        <DashboardStrip metrics={metrics} />
        <main className="flex flex-1 flex-col gap-3 overflow-y-auto bg-offwhite px-3.5 py-3.5">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                readingAloud={false}
                onThumb={noop}
                onDetailedSubmit={noop}
                onReadAloud={noop}
              />
            ))}
            <div className="flex items-start gap-2">
              <div className="h-[30px] w-[30px] flex-none overflow-hidden rounded-[9px] bg-white shadow-[0_2px_6px_rgba(21,48,80,0.2)]">
                <img src="/logo.png" alt="" className="h-full w-full object-contain p-0.5" />
              </div>
              <div className="rounded-[4px_18px_18px_18px] border border-[rgba(21,48,80,0.1)] bg-white px-[13px] py-[11px] shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="t-dot h-[7px] w-[7px] rounded-full bg-azure" />
                  <span className="t-dot h-[7px] w-[7px] rounded-full bg-azure [animation-delay:0.18s]" />
                  <span className="t-dot h-[7px] w-[7px] rounded-full bg-azure [animation-delay:0.36s]" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <ChatInput disabled={false} onSend={noop} />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)

// keep imports used
void DownloadCards
void FeedbackButtons
