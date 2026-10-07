interface Props {
  items: string[]
}

/** Scrolling announcement bar. Renders nothing when there is nothing to say —
 * the design has no empty state for it. */
export default function AnnouncementRunner({ items }: Props) {
  if (items.length === 0) return null
  const text = items.join('   |   ')

  return (
    <div className="runner relative flex h-[26px] flex-none items-center overflow-hidden">
      <div className="relative h-full flex-1 overflow-hidden">
        <p className="runner-text text-[11px] font-normal text-white/90">{text}</p>
      </div>
    </div>
  )
}
