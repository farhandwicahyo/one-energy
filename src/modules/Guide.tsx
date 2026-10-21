import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { Button, cx, PageHeader } from '../components/ui'
import { GUIDE } from './guideContent'

export default function Guide() {
  const [params, setParams] = useSearchParams()
  const [id, setId] = useState(params.get('m') ?? GUIDE[0].id)
  const sec = GUIDE.find((g) => g.id === id) ?? GUIDE[0]
  const pick = (next: string) => { setId(next); setParams({ m: next }, { replace: true }); window.scrollTo(0, 0) }
  const idx = GUIDE.indexOf(sec)
  const next = GUIDE[idx + 1]

  return (
    <div>
      <PageHeader title="User guidance" lead="Step-by-step instructions for each module. Pick a module on the left." />
      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label="Guide sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {GUIDE.map((g) => (
              <li key={g.id} className="shrink-0">
                <button
                  onClick={() => pick(g.id)}
                  aria-current={g.id === sec.id ? 'page' : undefined}
                  className={cx('w-full rounded-lg border-2 px-4 py-2.5 text-left transition-colors', g.id === sec.id ? 'border-accent bg-accent text-surface' : 'border-transparent hover:border-accent hover:bg-accent-soft')}
                >
                  <span className="font-display text-xl font-extrabold uppercase leading-none">{g.id === 'start' ? 'Start' : g.code}</span>
                  <span className={cx('block text-sm', g.id === sec.id ? 'text-surface/90' : 'text-ink-2')}>{g.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0">
          <header className="rounded border-2 border-ink bg-surface p-6">
            <h2 className="judul text-[2.75rem]">{sec.id === 'start' ? sec.name : `${sec.code} · ${sec.name}`}</h2>
            <p className="mt-3 max-w-[68ch] text-[17px] text-ink">{sec.intro}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="text-[15px]"><span className="font-bold">Used by:</span> <span className="text-ink-2">{sec.who}</span></span>
              {sec.open && <Link to={sec.open}><Button size="sm">Open {sec.code}<ArrowRight className="size-4" /></Button></Link>}
            </div>
          </header>

          <div className="mt-8 space-y-10">
            {sec.tasks.map((t) => (
              <section key={t.title}>
                <h3 className="judul text-[1.75rem]">{t.title}</h3>
                <ol className="mt-4 space-y-3">
                  {t.steps.map((s, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded bg-accent font-display text-lg font-extrabold text-surface" aria-hidden>{i + 1}</span>
                      <span className="pt-1 text-[16px] leading-relaxed text-ink">{s}</span>
                    </li>
                  ))}
                </ol>
                {t.tip && (
                  <p className="mt-4 flex gap-3 rounded border-l-[6px] border-sorot bg-sorot-soft p-4 text-[15px] text-ink">
                    <Lightbulb className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />{t.tip}
                  </p>
                )}
              </section>
            ))}
          </div>

          {next && (
            <button onClick={() => pick(next.id)} className="mt-12 flex w-full items-center justify-between gap-4 rounded border-2 border-ink bg-surface p-5 text-left transition-colors hover:border-accent hover:bg-accent-soft">
              <span><span className="block text-sm font-bold text-ink-2">Next</span><span className="judul text-[1.75rem]">{next.code} · {next.name}</span></span>
              <ArrowRight className="size-7 text-accent" aria-hidden />
            </button>
          )}
        </article>
      </div>
    </div>
  )
}
