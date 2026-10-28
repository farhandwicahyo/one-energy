import { Wrench } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { locate } from './registry'

export default function Placeholder() {
  const { pathname } = useLocation()
  const ctx = locate(pathname)
  const label = ctx?.feature?.label ?? 'This feature'
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded bg-accent-soft">
        <Wrench className="size-8 text-accent" aria-hidden />
      </span>
      <h1 className="judul mt-4 text-3xl">Coming Soon</h1>
      <p className="mt-3 text-[17px] text-ink-2"><strong>{label}</strong> is under active development and will be available soon.</p>
    </div>
  )
}
