import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Badge, Empty } from '../components/ui'
import { useStore } from '../store'
import { MODULES, PHASES, moduleHref, visibleFeatures, type ModuleDef } from './registry'

function Hero({ title, lead, small }: { title: string; lead?: string; small?: boolean }) {
  return (
    <section className={`hero ${small ? 'hero--kecil' : ''}`}>
      <div className="hero__biru">
        <div className="hero__segitiga" aria-hidden />
        <div className="hero__dalam mx-auto max-w-[1400px] px-4 md:px-8">
          <h1 className="judul">{title}</h1>
          {lead && <p>{lead}</p>}
        </div>
      </div>
    </section>
  )
}

// Highlights the full name in "X stands for <full name>. …" so the acronym is easy to decode.
function Expanded({ hint }: { hint: string }) {
  const parts = hint.match(/^(.*? stands for )(.+?)(\.(?: .*)?)$/)
  if (!parts) return <>{hint}</>
  return <>{parts[1]}<mark className="rounded-sm bg-sorot-soft px-1 font-bold text-accent-strong [box-decoration-break:clone]">{parts[2]}</mark>{parts[3]}</>
}

function ModuleCard({ m }: { m: ModuleDef }) {
  const Icon = m.icon
  return (
    <li className="grid">
      <Link to={moduleHref(m)} className="modul">
        <span className="flex items-start justify-between gap-3">
          <span className={`modul__ikon ${m.phase ? '!bg-nav' : ''}`}><Icon className="size-7" aria-hidden /></span>
          {m.phase && <Badge t="neutral">Phase {m.phase} · in development</Badge>}
        </span>
        <span className="modul__kode">{m.code}</span>
        <span className="modul__nama">{m.name}</span>
        <span className="modul__hint"><Expanded hint={m.hint} /></span>
      </Link>
    </li>
  )
}

// Home: every module the user may open, then the modules still being built. Search lives in the navbar.
export function Home() {
  const { me, can } = useStore()
  const live = MODULES.filter((m) => !m.phase && visibleFeatures(m, can).length)
  const later = MODULES.filter((m) => m.phase)
  return (
    <>
      <Hero title={`Welcome, ${me.name.split(' ')[0]}`} />
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <div className="space-y-14">
          <section>
            <h2 className="judul mb-5 text-[2rem]">Modules</h2>
            <ul className="modul-grid">{live.map((m) => <ModuleCard key={m.code} m={m} />)}</ul>
          </section>
          {([2, 3, 4] as const).map((p) => (
            <section key={p}>
              <h2 className="judul text-[2rem]">Phase {p} · {PHASES[p].name}</h2>
              <p className="mb-5 mt-2 max-w-[68ch] text-[15px] text-ink-2">{PHASES[p].gate}</p>
              <ul className="modul-grid">{later.filter((m) => m.phase === p).map((m) => <ModuleCard key={m.code} m={m} />)}</ul>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

function UnderDevelopment({ m }: { m: ModuleDef }) {
  const phase = PHASES[m.phase!]
  return (
    <>
      <Hero small title={m.code} lead={m.hint} />
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <Link to="/" className="mb-3 inline-flex min-h-9 items-center gap-2 font-bold text-accent hover:text-accent-strong">← All modules</Link>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <img src="/develop.jpg" alt="Page under development" width={1408} height={768} className="w-full rounded border-2 border-ink" />
          <div className="space-y-6">
            <div>
              <Badge t="neutral">Phase {m.phase} · {phase.name}</Badge>
              <h2 className="judul mt-3 text-[2.5rem]">{m.name} is being built</h2>
              <p className="mt-3 text-[17px] text-ink-2">{phase.gate}</p>
            </div>
            {m.plan && (
              <div>
                <h3 className="text-[17px] font-bold">What it will do</h3>
                <ul className="mt-2 space-y-2">
                  {m.plan.map((p) => <li key={p} className="flex gap-3 text-[15px]"><span className="mt-2 size-2 shrink-0 bg-sorot" aria-hidden />{p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Module page: the features inside one module, as rows.
// A module with a single feature (Dashboard) has no page of its own and opens that feature.
export function ModulePage() {
  const { slug } = useParams()
  const store = useStore()
  const m = MODULES.find((x) => x.slug === slug)
  if (!m) return <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8"><Empty notFound title="Module not found" /></div>
  if (m.phase) return <UnderDevelopment m={m} />
  if (m.features.length === 1) return <Navigate to={m.features[0].to} replace />
  const features = visibleFeatures(m, store.can)
  return (
    <>
      <Hero small title={m.code} lead={m.hint} />
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <Link to="/" className="mb-3 inline-flex min-h-9 items-center gap-2 font-bold text-accent hover:text-accent-strong">← All modules</Link>
        <h2 className="judul mb-5 text-[2rem]">Features</h2>
        {features.length === 0 ? <Empty title="No features for your role">Switch the demo user from the account menu.</Empty> : (
          <div className="jenis max-w-5xl">
            {features.map((f) => {
              const Icon = f.icon
              const fig = f.figure?.(store)
              return (
                <Link key={f.to} to={f.to} className="jenis__baris">
                  <span className="jenis__ikon"><Icon className="size-7" aria-hidden /></span>
                  <span>
                    <span className="jenis__judul">{f.label}</span>
                    <span className="jenis__hint">{f.hint}</span>
                  </span>
                  <span className="jenis__angka tnum text-[15px] font-bold text-ink">{fig}</span>
                  <span className="jenis__panah"><ArrowRight className="size-7" aria-hidden /></span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
