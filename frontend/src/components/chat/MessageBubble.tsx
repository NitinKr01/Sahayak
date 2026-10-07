import { useEffect, useMemo, useRef } from 'react'
import type { UiMessage } from '../../types'
import { base64ToBlobUrl } from '../../utils/audio'
import DownloadCards from './DownloadCards'
import FeedbackButtons from './FeedbackButtons'
import Markdown from './Markdown'
import { useTypewriter } from './useTypewriter'

interface Props {
  message: UiMessage
  readingAloud: boolean
  onThumb: (index: number, value: number) => void
  onDetailedSubmit: (index: number, text: string) => void
  onReadAloud: (index: number) => void
}

export default function MessageBubble({
  message,
  readingAloud,
  onThumb,
  onDetailedSubmit,
  onReadAloud,
}: Props) {
  const isUser = message.role === 'user'
  const displayed = useTypewriter(message.content, !isUser && !!message.animate)
  const done = displayed.length === message.content.length

  const audioUrl = useMemo(
    () => (message.audioB64 ? base64ToBlobUrl(message.audioB64) : null),
    [message.audioB64],
  )
  const audioUrlRef = useRef<string | null>(null)
  useEffect(() => {
    audioUrlRef.current = audioUrl
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [audioUrl])

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-[7px]">
        <div className="max-w-[82%] rounded-[18px_18px_4px_18px] bg-prussian px-[13px] py-2.5 text-[13.5px] leading-[1.5] text-white shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="h-[30px] w-[30px] flex-none overflow-hidden rounded-[9px] bg-white shadow-[0_2px_6px_rgba(21,48,80,0.2)]">
        <img src="/logo.png" alt="Sahayak" className="h-full w-full object-contain p-0.5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        {message.content && (
          <div className="max-w-[95%] rounded-[4px_18px_18px_18px] border border-[rgba(21,48,80,0.1)] bg-white px-[13px] py-[11px] text-[13.5px] leading-[1.55] text-bodytext shadow-sm">
            <Markdown>{displayed}</Markdown>
          </div>
        )}

        {done && message.campaignImageB64 && (
          <img
            src={`data:image/png;base64,${message.campaignImageB64}`}
            alt="Campaign"
            className="mt-1.5 w-full max-w-[420px] rounded-[10px] border border-[rgba(21,48,80,0.1)] shadow-sm"
          />
        )}

        {message.biImageB64 && (
          <img
            src={`data:image/jpeg;base64,${message.biImageB64}`}
            alt="Benefit Illustration"
            className="mt-1.5 w-full max-w-[420px] rounded-[10px] border border-[rgba(21,48,80,0.1)] shadow-sm"
          />
        )}

        {done && message.downloads && message.downloads.length > 0 && (
          <DownloadCards groups={message.downloads} />
        )}

        {audioUrl && <audio className="mt-2 block w-full max-w-[320px]" src={audioUrl} controls autoPlay />}

        {done && (
          <FeedbackButtons
            feedback={message.feedback}
            showDetailedForm={!!message.showDetailedFb}
            canReadAloud={!!message.content.trim()}
            readingAloud={readingAloud}
            onThumb={(v) => onThumb(message.index, v)}
            onDetailedSubmit={(t) => onDetailedSubmit(message.index, t)}
            onReadAloud={() => onReadAloud(message.index)}
          />
        )}
      </div>
    </div>
  )
}
