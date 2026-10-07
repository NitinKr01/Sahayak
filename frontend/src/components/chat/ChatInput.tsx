import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { blobToWav } from '../../utils/audio'
import { MicIcon, SendIcon, StopIcon } from '../layout/icons'

interface Props {
  disabled: boolean
  onSend: (text: string) => void
  /** Renders without the top border/padding, for the centred empty state. */
  bare?: boolean
}

export default function ChatInput({ disabled, onSend, bare = false }: Props) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [sttError, setSttError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const submit = () => {
    const value = text.trim()
    if (!value || disabled) return
    setText('')
    onSend(value)
  }

  const startRecording = async () => {
    setSttError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
          const wav = await blobToWav(blob)
          const { text: transcript } = await api.stt(wav)
          if (transcript.trim()) {
            onSend(transcript.trim())
          } else {
            setSttError('Could not understand the audio. Please try again.')
          }
        } catch (e) {
          setSttError(e instanceof Error ? e.message : 'Transcription error')
        } finally {
          setTranscribing(false)
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setSttError('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setRecording(false)
  }

  return (
    <div
      className={
        bare
          ? 'w-full'
          : 'flex-none border-t border-surface bg-white px-3 pb-4 pt-2.5 md:pb-3'
      }
    >
      {sttError && (
        <p className="mx-auto mb-2 max-w-3xl text-[11.5px] text-chilli">{sttError}</p>
      )}

      <div
        className={`mx-auto flex max-w-3xl items-center gap-1.5 rounded-[24px] border-[1.5px] border-[rgba(21,48,80,0.1)] py-2 pl-3.5 pr-2 transition-shadow focus-within:border-prussian focus-within:shadow-[0_0_0_3px_rgba(21,48,80,0.08)] ${
          bare ? 'bg-white shadow-[0_2px_12px_rgba(21,48,80,0.10)]' : 'bg-offwhite'
        }`}
      >
        <button
          title={recording ? 'Stop recording' : 'Speak your query'}
          aria-label={recording ? 'Stop recording' : 'Speak your query'}
          onClick={recording ? stopRecording : startRecording}
          disabled={disabled || transcribing}
          className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
            recording
              ? 'animate-pulse bg-[rgba(229,45,18,0.1)] text-chilli'
              : 'text-mutedtext hover:bg-surface'
          }`}
        >
          {recording ? <StopIcon className="h-[15px] w-[15px]" /> : <MicIcon className="h-[17px] w-[17px]" />}
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={transcribing ? 'Transcribing audio…' : 'Ask anything about Bandhan Life…'}
          disabled={disabled || transcribing}
          className="h-5 min-w-0 flex-1 bg-transparent text-[13px] leading-[1.4] text-bodytext outline-none placeholder:text-mutedtext disabled:opacity-60"
        />

        <button
          onClick={submit}
          aria-label="Send"
          disabled={disabled || transcribing || !text.trim()}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-prussian text-white shadow-[0_2px_8px_rgba(21,48,80,0.28)] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        >
          <SendIcon className="h-[15px] w-[15px]" />
        </button>
      </div>

      {bare && (
        <p className="mt-1.5 text-center text-[9.5px] text-mutedtext">
          Sahayak AI · Always verify before sharing with customers
        </p>
      )}
    </div>
  )
}
