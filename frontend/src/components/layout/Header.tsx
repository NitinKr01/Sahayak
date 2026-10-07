import { MenuIcon } from './icons'

interface Props {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: Props) {
  return (
    <header className="z-10 flex flex-none items-center justify-between gap-3 border-b border-surface bg-white px-3.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onToggleSidebar}
          title="Menu"
          aria-label="Menu"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-offwhite text-brandblack transition-colors hover:bg-surface"
        >
          <MenuIcon className="h-[18px] w-[18px]" />
        </button>
        <img src="/header.png" alt="Bandhan Life" className="h-7 w-auto sm:h-8" />
      </div>

      <div className="flex items-center gap-1.5">
        <img src="/logo.png" alt="" className="h-7 w-7 rounded-[7px] object-contain" />
        <div className="flex flex-col leading-[1.1]">
          <span className="text-[10px] font-extrabold tracking-[0.3px] text-prussian">
            SAHAYAK
          </span>
          <span className="text-[9px] font-bold tracking-[1px] text-chilli">AI</span>
        </div>
      </div>
    </header>
  )
}
