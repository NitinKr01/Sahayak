import { useState } from 'react'
import { SpeakerIcon, ThumbDownIcon, ThumbUpIcon } from '../layout/icons'

interface Props {
  feedback: number | null | undefined
  showDetailedForm: boolean
  canReadAloud: boolean
  readingAloud: boolean
  onThumb: (value: number) => void
  onDetailedSubmit: (text: string) => void
  onReadAloud: () => void
}

export default function FeedbackButtons({
  feedback,
  showDetailedForm,
  canReadAloud,
  readingAloud,
  onThumb,
  onDetailedSubmit,
  onReadAloud,
}: Props) {
  const [detailed, setDetailed] = useState('')
  const decided = feedback !== null && feedback !== undefined

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-1.5">
        <button
          title="Good response"
          aria-label="Good response"
          disabled={decided}
          onClick={() => onThumb(1)}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:cursor-default ${
            feedback === 1
              ? 'border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D]'
              : 'border-[rgba(21,48,80,0.1)] bg-white text-mutedtext hover:bg-offwhite'
          }`}
        >
          <ThumbUpIcon className="h-[13px] w-[13px]" />
        </button>
        <button
          title="Bad response"
          aria-label="Bad response"
          disabled={decided}
          onClick={() => onThumb(0)}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:cursor-default ${
            feedback === 0
              ? 'border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]'
              : 'border-[rgba(21,48,80,0.1)] bg-white text-mutedtext hover:bg-offwhite'
          }`}
        >
          <ThumbDownIcon className="h-[13px] w-[13px]" />
        </button>

        {canReadAloud && (
          <button
            onClick={onReadAloud}
            disabled={readingAloud}
            className="flex items-center gap-1.5 rounded-full border border-[rgba(21,48,80,0.1)] bg-white px-2.5 py-1 text-[11px] font-semibold text-prussian transition-colors hover:bg-offwhite disabled:opacity-60"
          >
            <SpeakerIcon className="h-[12px] w-[12px]" />
            {readingAloud ? 'Generating…' : 'Read Aloud'}
          </button>
        )}
      </div>

      {showDetailedForm && (
        <form
          className="mt-2 max-w-md rounded-[10px] border border-[rgba(21,48,80,0.1)] bg-white p-3 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault()
            onDetailedSubmit(detailed)
            setDetailed('')
          }}
        >
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.5px] text-subtext">
            Help us improve — what went wrong?
          </label>
          <textarea
            value={detailed}
            onChange={(e) => setDetailed(e.target.value)}
            className="w-full rounded-md border-[1.5px] border-lightgrey bg-offwhite p-2 text-[12.5px] outline-none focus:border-prussian focus:bg-white"
            rows={3}
          />
          <button
            type="submit"
            className="mt-2 rounded-md bg-prussian px-3 py-1.5 text-[11.5px] font-bold text-white shadow-[0_3px_10px_rgba(21,48,80,0.24)] transition-opacity hover:opacity-90"
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  )
}
