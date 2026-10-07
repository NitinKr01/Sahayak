import { useEffect, useRef, useState } from 'react'

/** Progressive reveal of assistant answers (the Streamlit app streamed the
 * finished answer character by character; this is the same effect). */
export function useTypewriter(text: string, enabled: boolean): string {
  const [length, setLength] = useState(enabled ? 0 : text.length)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLength(text.length)
      return
    }
    setLength(0)
    timer.current = setInterval(() => {
      setLength((l) => {
        if (l >= text.length) {
          if (timer.current) clearInterval(timer.current)
          return text.length
        }
        return l + 4
      })
    }, 15)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [text, enabled])

  return text.slice(0, length)
}
