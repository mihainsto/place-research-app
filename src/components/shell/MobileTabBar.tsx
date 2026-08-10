import { NavLink } from 'react-router-dom'
import { CalendarDays, LayoutGrid, Search, Waypoints } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Three tabs, because on mobile there are only three jobs: see everything,
 * explore the map, find the one you need.
 *
 * Cities are a filter here rather than a destination — on the ground, a city
 * is something you filter *by*, not somewhere you navigate to.
 */
export function MobileTabBar({ onSearch }: { onSearch: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 pb-[var(--safe-b)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        <Tab to="/" end label="Wall" icon={<LayoutGrid aria-hidden className="size-[21px]" strokeWidth={1.75} />} />
        <Tab to="/timeline" label="Trip" icon={<CalendarDays aria-hidden className="size-[21px]" strokeWidth={1.75} />} />
        <Tab to="/graph" label="Graph" icon={<Waypoints aria-hidden className="size-[21px]" strokeWidth={1.75} />} />
        <button
          type="button"
          onClick={onSearch}
          className="flex h-[52px] flex-col items-center justify-center gap-[3px] text-ink-3 transition-colors active:text-ink"
        >
          <Search aria-hidden className="size-[21px]" strokeWidth={1.75} />
          <span className="text-[10px] leading-[12px] font-medium">Search</span>
        </button>
      </div>
    </nav>
  )
}

function Tab({
  to,
  end,
  label,
  icon,
}: {
  to: string
  end?: boolean
  label: string
  icon: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-[52px] flex-col items-center justify-center gap-[3px] transition-colors duration-150',
          isActive ? 'text-ink' : 'text-ink-3',
        )
      }
    >
      {icon}
      <span className="text-[10px] leading-[12px] font-medium">{label}</span>
    </NavLink>
  )
}
