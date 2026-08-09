import { NavLink } from 'react-router-dom'
import { useData, useCitiesWithCounts } from '@/data/DataContext'
import { DataHealth } from '@/components/shell/DataHealth'
import { cn } from '@/lib/cn'

/**
 * Two destinations, a derived city list, and a count. That is the whole
 * navigation system — anything more would be a menu about a menu.
 */
export function Sidebar() {
  const { dataset } = useData()
  const cities = useCitiesWithCounts()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r border-hairline bg-canvas md:flex">
      <div className="px-6 pt-7 pb-6">
        <NavLink to="/" className="block">
          <span className="block text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-ink">
            {dataset.projectName}
          </span>
          {dataset.updatedAt ? (
            <span className="mt-0.5 block text-[12px] leading-4 text-ink-3">
              Updated {dataset.updatedAt}
            </span>
          ) : null}
        </NavLink>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="label-micro px-3 pb-2">TikToks</p>
        <NavItem to="/" end>
          Wall
        </NavItem>
        <NavItem to="/graph">Graph</NavItem>

        {cities.length > 0 ? (
          <>
            <p className="label-micro px-3 pt-7 pb-2">Cities</p>
            {cities.map(({ city, count }) => (
              <NavItem key={city.id} to={`/city/${city.id}`} count={count}>
                {city.name}
              </NavItem>
            ))}
          </>
        ) : null}
      </nav>

      <div className="border-t border-hairline px-6 py-4">
        <p className="text-[12px] leading-4 text-ink-3">
          {dataset.tiktoks.length} TikTok{dataset.tiktoks.length === 1 ? '' : 's'} ·{' '}
          {cities.length} cit{cities.length === 1 ? 'y' : 'ies'}
        </p>
        <DataHealth className="mt-1.5" />
      </div>
    </aside>
  )
}

function NavItem({
  to,
  end,
  count,
  children,
}: {
  to: string
  end?: boolean
  count?: number
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-9 items-center gap-2 rounded-[7px] px-3 text-[14px] leading-5 transition-colors duration-150',
          isActive ? 'bg-overlay text-ink' : 'text-ink-2 hover:bg-surface hover:text-ink',
        )
      }
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count !== undefined ? (
        <span className="shrink-0 text-[12px] tabular-nums text-ink-3">{count}</span>
      ) : null}
    </NavLink>
  )
}
