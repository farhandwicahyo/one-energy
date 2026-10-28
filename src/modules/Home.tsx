import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Empty } from '../components/ui'
import { useStore } from '../store'
import { MODULES, moduleHref, visibleFeatures, type ModuleDef } from './registry'

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
          <span className="modul__ikon"><Icon className="size-7" aria-hidden /></span>
        </span>
        <span className="modul__kode">{m.code}</span>
        <span className="modul__nama">{m.name}</span>
        <span className="modul__hint"><Expanded hint={m.hint} /></span>
      </Link>
    </li>
  )
}

// Home: every module the user may open.
export function Home() {
  const { me, can } = useStore()
  const visible = MODULES.filter((m) => visibleFeatures(m, can).length)
  return (
    <>
      <Hero title={`Welcome, ${me.name.split(' ')[0]}`} />
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-8 md:px-8 md:pt-10">
        <section>
          <h2 className="judul mb-5 text-[2rem]">Modules</h2>
          <ul className="modul-grid">{visible.map((m) => <ModuleCard key={m.code} m={m} />)}</ul>
        </section>
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
