import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

const SEP_CELL = /^:?-{2,}:?$/

/** True for a row like `| --- | :--- | ---: |` (a GFM alignment separator). */
function isSeparatorRow(line: string): boolean {
  const t = line.trim()
  if (!t.includes('-') || !t.includes('|')) return false
  const cells = t.replace(/^\|/, '').replace(/\|$/, '').split('|')
  return cells.length > 0 && cells.every((c) => SEP_CELL.test(c.trim()))
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|') && line.trim().endsWith('|')
}

/**
 * Repairs table shapes the model sometimes emits that GFM refuses to parse,
 * which otherwise render as a headerless block of raw pipes:
 *
 *  1. `<br>` immediately before a table row — a table can't start inside a
 *     paragraph, so the whole block stays literal text.
 *  2. The alignment separator placed *above* the header row instead of below.
 *  3. A header row with no separator following it at all.
 */
export function normalizeTables(src: string): string {
  // 1. a <br> that is followed by a table row must become a real line break
  let text = src.replace(/<br\s*\/?>\s*(?=\|)/gi, '\n\n')

  const lines = text.split('\n')
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const next = lines[i + 1]

    // 2. separator that *starts* a table (nothing table-like above it) sits
    //    above its header → swap so the header comes first. A separator that
    //    follows a header row is the normal, valid layout and is left alone.
    const prev = lines[i - 1] ?? ''
    if (
      isSeparatorRow(line) &&
      !isTableRow(prev) &&
      next &&
      isTableRow(next) &&
      !isSeparatorRow(next)
    ) {
      out.push(next, line)
      i++
      continue
    }

    out.push(line)

    // 3. a table's first row with no separator under it → synthesise one.
    //    Only applies when this row *opens* a table (nothing table-like above),
    //    so rows inside an already-valid table are untouched.
    if (
      isTableRow(line) &&
      !isSeparatorRow(line) &&
      !isTableRow(prev) &&
      next &&
      isTableRow(next) &&
      !isSeparatorRow(next)
    ) {
      const cols = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').length
      out.push(`|${' --- |'.repeat(cols)}`)
    }
  }

  text = out.join('\n')
  return text
}

/** Renders assistant answers: GFM for the product/commission tables, raw HTML
 * allowed because historical answers stored in S3 contain tags like <br>. */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table: ({ node: _node, ...props }) => (
            <div className="table-wrap">
              <table {...props} />
            </div>
          ),
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" />
          ),
        }}
      >
        {normalizeTables(children)}
      </ReactMarkdown>
    </div>
  )
}
