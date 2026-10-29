import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, LogOut, Menu, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useStore } from '../store'
import { roleLabel } from '../i18n/en'
import { allowed, locate, moduleHref, MODULES, visibleFeatures } from '../modules/registry'
import { cx } from './ui'

export { allowed }

interface Hit { to: string; label: string; sub: string }
const has = (text: string, q: string) => text.toLowerCase().includes(q)

// One search in the navbar for modules, features, vessels and crew.
function GlobalSearch({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const { s, can } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const term = q.trim().toLowerCase()

  const groups = useMemo(() => {
    if (term.length < 2) return null
    const mods: Hit[] = MODULES
      .filter((m) => visibleFeatures(m, can).length && (has(m.code, term) || has(m.name, term) || has(m.hint, term)))
      .map((m) => ({ to: moduleHref(m), label: `${m.code} · ${m.name}`, sub: 'Module' }))
    const feats: Hit[] = MODULES.flatMap((m) => visibleFeatures(m, can)
      .filter((f) => has(f.label, term) || has(f.hint, term))
      .map((f) => ({ to: f.to, label: f.label, sub: m.code })))
    const vessels: Hit[] = can('vessel.read') ? s.vessels.filter((x) => has(x.name, term) || has(x.code, term)).slice(0, 5).map((x) => ({ to: `/vessels/${x.id}`, label: x.name, sub: x.code })) : []
    const crew: Hit[] = can('crew.read') ? s.crew.filter((x) => has(x.name, term) || has(x.crewNo, term)).slice(0, 5).map((x) => ({ to: `/crew/${x.id}`, label: x.name, sub: x.crewNo })) : []
    return ([['Modules', mods], ['Features', feats], ['Vessels', vessels], ['Crew', crew]] as const).filter(([, list]) => list.length)
  }, [term, s.vessels, s.crew, can])

  useEffect(() => {
    const h = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const go = (to: string) => { nav(to); setQ(''); setOpen(false); onDone?.() }

  return (
    <div ref={box} className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface/80" aria-hidden />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); onDone?.() } }}
        placeholder="Search modules, features, vessels, crew"
        aria-label="Search modules, features, vessels and crew"
        className="kepala__kontrol w-full pl-9 pr-3 text-sm outline-none"
      />
      {open && groups && (
        <div className="absolute left-0 right-0 top-12 z-40 max-h-[70vh] overflow-y-auto rounded border-2 border-ink bg-surface text-ink shadow-xl md:left-auto md:w-[28rem]">
          {groups.length === 0 ? (
            <div className="p-4 text-center">
              <img src="/not-found.jpg" alt="" width={1408} height={768} className="mx-auto w-full max-w-[22rem] rounded" />
              <p className="mt-2 text-[15px] font-bold">Nothing found for “{q.trim()}”</p>
              <p className="text-sm text-ink-2">Try a module code such as E-DOC, a task such as renew, or a vessel name.</p>
            </div>
          ) : groups.map(([title, list]) => (
            <div key={title} className="border-b border-line py-1 last:border-0">
              <div className="px-3 pt-2 pb-1 text-[13px] font-bold text-ink-2">{title}</div>
              <ul>
                {list.map((r) => (
                  <li key={r.to}>
                    <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[15px] hover:bg-accent-soft" onClick={() => go(r.to)}>
                      <span className="truncate font-semibold">{r.label}</span>
                      <span className="tnum shrink-0 text-xs text-ink-2">{r.sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

// Square avatar with the account menu: profile, user guide, demo user switch, log out.
function AccountMenu() {
  const { s, me, setMe, signOut } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const click = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key) }
  }, [open])
  const go = (to: string) => { setOpen(false); nav(to) }
  const item = 'flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-semibold text-ink hover:bg-accent-soft'
  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${me.name}`}
        className="grid size-11 place-items-center rounded border-2 border-surface/60 bg-sorot font-display text-lg font-extrabold text-surface transition-colors hover:border-surface"
      >
        {initials(me.name)}
      </button>
      {open && (
        <div role="menu" className="rise absolute right-0 top-14 z-50 w-72 overflow-hidden rounded border-2 border-ink bg-surface text-ink shadow-xl">
          <div className="flex items-center gap-3 border-b-2 border-ink px-4 py-4">
            <span className="grid size-11 shrink-0 place-items-center rounded bg-sorot font-display text-lg font-extrabold text-surface">{initials(me.name)}</span>
            <div className="min-w-0">
              <div className="truncate font-bold">{me.name}</div>
              <div className="truncate text-sm text-ink-2">{me.roles.map((r) => roleLabel[r]).join(', ')}</div>
            </div>
          </div>
          <button role="menuitem" className={item} onClick={() => go('/profile')}><UserRound className="size-5 text-accent" />My profile</button>
          <button role="menuitem" className={item} onClick={() => go('/guide')}><BookOpen className="size-5 text-accent" />Read User Guidance</button>
          <div className="border-t border-line px-4 py-3">
            <label className="block text-[13px] font-bold text-ink-2" htmlFor="demo-user">Demo: view as another user</label>
            <select
              id="demo-user"
              value={me.id}
              onChange={(e) => { setMe(e.target.value); setOpen(false); nav('/') }}
              className="mt-1.5 h-10 w-full rounded-lg border-2 border-ink-3 bg-surface px-2 text-sm outline-none focus:border-accent"
            >
              {s.users.filter((u) => u.active).map((u) => <option key={u.id} value={u.id}>{u.name} · {u.roles.map((r) => roleLabel[r]).join(', ')}</option>)}
            </select>
          </div>
          <button role="menuitem" className={`${item} border-t border-line !text-bad hover:!bg-bad-soft`} onClick={() => { signOut(); go('/login') }}><LogOut className="size-5" />Log out</button>
        </div>
      )}
    </div>
  )
}

function Breadcrumb() {
  const { pathname } = useLocation()
  const here = locate(pathname)
  if (!here) return null
  const { module: m, feature: f } = here
  if (pathname.startsWith('/sales/') || pathname.startsWith('/procurement/') || pathname.startsWith('/operations/') || pathname.startsWith('/finance/')) return null
  const deeper = f && pathname !== f.to
  // A single-feature module is the feature, so the trail stops at the module.
  if (m.features.length === 1) {
    return (
      <nav aria-label="Breadcrumb" className="remah mb-5">
        <Link to="/">Modules</Link>
        <ChevronRight className="size-4 text-ink-3" aria-hidden />
        <span className="text-ink">{m.code} · {m.name}</span>
      </nav>
    )
  }
  return (
    <nav aria-label="Breadcrumb" className="remah mb-5">
      <Link to="/">Modules</Link>
      <ChevronRight className="size-4 text-ink-3" aria-hidden />
      <Link to={`/m/${m.slug}`}>{m.code} · {m.name}</Link>
      {f && <>
        <ChevronRight className="size-4 text-ink-3" aria-hidden />
        {deeper ? <Link to={f.to}>{f.label}</Link> : <span className="text-ink">{f.label}</span>}
      </>}
    </nav>
  )
}

export function Shell() {
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const landing = loc.pathname === '/' || loc.pathname.startsWith('/m/')
  const [phoneSearch, setPhoneSearch] = useState(false)
  useEffect(() => setPhoneSearch(false), [loc.pathname])
  const { signedIn } = useStore()
  const isModule = loc.pathname.startsWith('/sales/') || loc.pathname.startsWith('/procurement/') || loc.pathname.startsWith('/operations/') || loc.pathname.startsWith('/finance/')
  useEffect(() => {
    if (!isModule) return
    const html = document.documentElement
    const prev = [html.style.overflow, document.body.style.overflow]
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => { html.style.overflow = prev[0]; document.body.style.overflow = prev[1] }
  }, [isModule])
  // Every page needs a session; without one, go to the login page and come back here afterwards.
  if (!signedIn) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  return (
    <div className={cx('flex flex-col', isModule ? 'h-dvh overflow-hidden' : 'min-h-full')}>
      <header className="kepala sticky top-0 z-30 shrink-0">
        <div className={cx('flex min-h-[72px] items-center justify-between gap-4 py-2 pr-4 md:pr-8', isModule ? 'pl-0' : 'pl-4 md:pl-8')}>
          <div className="flex items-center">
            {isModule && <div className="flex w-16 shrink-0 justify-center"><button onClick={() => window.dispatchEvent(new Event('toggle-module-sidebar'))} className="grid size-10 place-items-center rounded-lg border-2 border-surface/60 text-surface" aria-label="Toggle menu"><Menu className="size-5" /></button></div>}
            <div className={cx(isModule && 'hidden lg:block')}>
              <Link to="/" className="merek shrink-0" aria-label="Harum Energy, to all modules">
                <img src="/logo.svg" alt="Harum Energy" width={163} height={32} />
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {!isModule && <GlobalSearch className="hidden w-full max-w-sm md:block" />}
            {!isModule && <button onClick={() => setPhoneSearch((x) => !x)} className="grid size-11 place-items-center rounded border-2 border-surface/60 md:hidden" aria-label="Search" aria-expanded={phoneSearch}><Search className="size-5" /></button>}
            <AccountMenu />
          </div>
        </div>
        {phoneSearch && <div className="px-4 pb-3 md:hidden"><GlobalSearch autoFocus onDone={() => setPhoneSearch(false)} /></div>}
      </header>
      <main className={cx('flex-1', isModule && 'flex min-h-0')}>
        {landing ? <Outlet /> : isModule ? <Outlet /> : (
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            <Breadcrumb />
            <Outlet />
          </div>
        )}
      </main>
      {!isModule && <footer className="bg-surface-2 px-4 py-6 text-center text-sm text-ink-2">
        OneEnergy · Fleet Management System
      </footer>}
    </div>
  )
}

export function Guard({ perm, children }: { perm?: string | string[]; children: ReactNode }) {
  const { can, me } = useStore()
  if (allowed(can, perm)) return <>{children}</>
  return (
    <div className="mx-auto max-w-lg rounded border-2 border-ink bg-surface p-8 text-center">
      <ShieldCheck className="mx-auto size-8 text-ink-3" aria-hidden />
      <h1 className="judul mt-3 text-3xl">Not part of your role</h1>
      <p className="mt-2 text-ink-2">{me.name} signs in as {me.roles.map((r) => roleLabel[r]).join(', ')}. Switch the demo user from the account menu (the square avatar at the top right) to see it.</p>
      <Link to="/" className="mt-4 inline-block font-bold text-accent hover:underline">Back to all modules</Link>
    </div>
  )
}
