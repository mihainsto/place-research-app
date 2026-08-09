import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useData } from '@/data/DataContext'
import { cn } from '@/lib/cn'

/**
 * The debugging channel between you and your LLM — and the only piece of
 * developer-tool UI in the app.
 *
 * It is invisible when the data is clean, which is almost always. When it
 * isn't, it tells you exactly which entry and which field, so you can paste
 * the problem straight back to the model.
 */
export function DataHealth({ className }: { className?: string }) {
  const { dataset } = useData()
  const [open, setOpen] = useState(false)

  const errors = dataset.issues.filter((issue) => issue.level === 'error')
  const warnings = dataset.issues.filter((issue) => issue.level === 'warning')

  if (dataset.issues.length === 0) return null

  const tone = errors.length > 0 ? '#e0483d' : '#c9a227'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className={cn(
          'flex items-center gap-2 text-[12px] leading-4 text-ink-3 transition-colors hover:text-ink-2',
          className,
        )}
      >
        <span aria-hidden className="size-[6px] shrink-0 rounded-full" style={{ backgroundColor: tone }} />
        {errors.length > 0
          ? `${errors.length} entr${errors.length === 1 ? 'y' : 'ies'} not rendering`
          : `${warnings.length} data warning${warnings.length === 1 ? '' : 's'}`}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 data-[state=open]:animate-[fade-in_160ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[70] flex max-h-[min(76vh,640px)] w-[min(620px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-sheet border border-hairline bg-raised shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)] data-[state=open]:animate-[rise-in_180ms_cubic-bezier(0.32,0.72,0,1)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
            <div>
              <Dialog.Title className="text-[17px] leading-[23px] font-semibold text-ink">
                Data health
              </Dialog.Title>
              <p className="mt-1 text-[13px] leading-[18px] text-ink-3">
                {errors.length > 0
                  ? `${errors.length} entry${errors.length === 1 ? '' : ' types'} could not be rendered. `
                  : 'Everything rendered. '}
                {warnings.length > 0 ? `${warnings.length} field${warnings.length === 1 ? '' : 's'} were defaulted or derived.` : ''}
              </p>
            </div>
            <Dialog.Close className="grid size-8 shrink-0 place-items-center rounded-[7px] text-ink-3 transition-colors hover:bg-overlay hover:text-ink">
              <X aria-hidden className="size-4" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {[...errors, ...warnings].map((issue, i) => (
              <div key={`${issue.path}-${i}`} className="rounded-[8px] px-3 py-2.5 hover:bg-overlay/60">
                <div className="flex items-baseline gap-2">
                  <span
                    aria-hidden
                    className="size-[5px] shrink-0 translate-y-[-2px] rounded-full"
                    style={{ backgroundColor: issue.level === 'error' ? '#e0483d' : '#c9a227' }}
                  />
                  <span className="text-[14px] leading-[20px] font-medium text-ink">{issue.subject}</span>
                  <code className="font-mono text-[11px] text-ink-3">{issue.path}</code>
                </div>
                <p className="mt-1 pl-[13px] text-[13px] leading-[19px] text-ink-2">{issue.message}</p>
              </div>
            ))}
          </div>

          <p className="border-t border-hairline px-5 py-3 text-[12px] leading-[17px] text-ink-3">
            Run <code className="font-mono text-ink-2">npm run validate</code> to see this in the
            terminal before you commit.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
