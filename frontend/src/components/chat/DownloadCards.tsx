import type { DownloadGroup } from '../../types'
import { DownloadIcon } from '../layout/icons'

/** Colour per file type, matching the mockup's `.doc-thumb` badge palette. */
const BADGE: Record<string, string> = {
  pdf: 'bg-[#E52D12]',
  xls: 'bg-[#217346]',
  xlsx: 'bg-[#217346]',
  doc: 'bg-[#2B579A]',
  docx: 'bg-[#2B579A]',
  ppt: 'bg-[#D24726]',
  pptx: 'bg-[#D24726]',
  jpg: 'bg-[#2563EB]',
  jpeg: 'bg-[#2563EB]',
  png: 'bg-[#059669]',
  mp4: 'bg-[#DC2626]',
}

function extOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim())
  return (m?.[1] ?? 'file').toLowerCase()
}

export default function DownloadCards({ groups }: { groups: DownloadGroup[] }) {
  return (
    <div className="mt-1.5 space-y-3">
      {groups.map((group) => (
        <div key={group.product}>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-subtext">
            Downloads · {group.product}
          </p>
          {group.files.length === 0 ? (
            <p className="text-[12px] text-mutedtext">No documents found.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {group.files.map((file) => {
                const ext = extOf(file.name)
                return (
                  <a
                    key={file.url}
                    href={file.url}
                    download
                    className="flex items-center gap-2.5 rounded-[10px] border border-[rgba(21,48,80,0.1)] bg-white p-2.5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                  >
                    {/* file thumbnail with type badge */}
                    <div className="flex h-[52px] w-[42px] flex-none flex-col overflow-hidden rounded-[6px] border-[1.5px] border-[#e0e0e0] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.10)]">
                      <div className="flex-1 bg-gradient-to-b from-[#fafbfc] to-[#eef1f5]" />
                      <div
                        className={`flex h-[13px] items-center justify-center text-[7px] font-extrabold uppercase tracking-[0.8px] text-white ${
                          BADGE[ext] ?? 'bg-prussian'
                        }`}
                      >
                        {ext}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[12.5px] font-semibold leading-[1.3] text-prussian">
                        {file.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-subtext">{ext.toUpperCase()} document</p>
                    </div>

                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-prussian text-white">
                      <DownloadIcon className="h-[13px] w-[13px]" />
                    </span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
