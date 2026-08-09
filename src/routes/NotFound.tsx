import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFound() {
  return (
    <div className="page pt-10 pb-24">
      <EmptyState
        title="Nothing here"
        description="That page doesn't exist."
        action={
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
          >
            Back to the Wall
          </Link>
        }
      />
    </div>
  )
}
