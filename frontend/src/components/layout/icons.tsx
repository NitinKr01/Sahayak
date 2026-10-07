/** Inline icon set ported from sahayak-ui-assets/vectors/*.svg.
 * Inlined rather than <img> so stroke colour follows `currentColor`. */
type P = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const MenuIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export const SendIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
  </svg>
)

export const MicIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
)

export const StopIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

export const SearchIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

export const DownloadIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export const LogoutIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

export const ChevronUpIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <polyline points="6 15 12 9 18 15" />
  </svg>
)

export const ChevronRightIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export const GridIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="2" y="8" width="4" height="12" rx="1" />
    <rect x="8" y="5" width="4" height="15" rx="1" />
    <rect x="14" y="2" width="4" height="18" rx="1" />
  </svg>
)

export const PlusIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export const ExternalIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export const SpeakerIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
)

export const ThumbUpIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 22V11m0 0 4-8a3 3 0 0 1 3 3v4h5a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17.5 21H7" />
  </svg>
)

export const ThumbDownIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M17 2v11m0 0-4 8a3 3 0 0 1-3-3v-4H5a2 2 0 0 1-2-2.4l1.5-7A2 2 0 0 1 6.5 3H17" />
  </svg>
)

export const FileIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)
