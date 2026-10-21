import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../../components/ui'
import { roleLabel } from '../../i18n/en'
import { useStore } from '../../store'

export default function Login() {
  const { s, signIn: startSession } = useStore()
  const nav = useNavigate()
  // After signing in, return to the page that sent us here (or the home page).
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [username, setUsername] = useState('hendra.w')
  const [password, setPassword] = useState('demo-password-2026')
  const [err, setErr] = useState('')
  const user = s.users.find((u) => u.username === username.trim().toLowerCase())

  const signIn = () => {
    if (!user || !password) return setErr('Username or password is wrong.')
    if (!user.active) return setErr('This account is inactive. Ask IT to reactivate it.')
    startSession(user.id)
    nav(from, { replace: true })
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      {/* Orange edge and diagonal cut from the reference login, with the fleet photo as the panel */}
      <section className="relative hidden bg-sorot lg:block" style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 5rem) 100%, 0 100%)', marginRight: '-5rem', zIndex: 1 }}>
        <div
          className="relative flex h-full flex-col justify-between overflow-hidden bg-nav bg-cover p-14 pr-32 text-surface"
          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 5rem) 100%, 0 100%)', marginRight: 16, backgroundImage: 'url(/tongkang.jpeg)', backgroundPosition: 'center 58%' }}
        >
          {/* Logo charcoal laid over the photo, slightly transparent, plus a darker base for the headline */}
          <div className="absolute inset-0 bg-nav/60" aria-hidden />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(59,57,57,.7)_0%,rgba(59,57,57,0)_55%)]" aria-hidden />
          <span className="merek relative z-10 self-start !p-3"><img src="/logo.svg" alt="Harum Energy" className="!h-11" width={224} height={44} /></span>
          <p className="judul relative z-10 max-w-[12ch] text-[clamp(3rem,1.75rem+3.6vw,5.5rem)]">Fleet management <span className="mt-[.15em] block text-sorot">TB / BG</span></p>
        </div>
      </section>

      <section className="flex flex-col bg-ground lg:justify-center lg:pl-28">
        <div className="relative h-56 bg-cover lg:hidden" style={{ backgroundImage: 'url(/tongkang.jpeg)', backgroundPosition: 'center 58%' }}>
          <div className="absolute inset-0 bg-nav/60" aria-hidden />
          <span className="merek absolute left-4 top-4"><img src="/logo.svg" alt="Harum Energy" width={163} height={32} /></span>
          <div className="absolute inset-x-0 bottom-0 h-2 bg-sorot" aria-hidden />
        </div>
        <div className="mx-auto w-full max-w-sm px-4 py-10 lg:mx-0 lg:py-12">
          <h1 className="judul text-[3.5rem] after:mt-3 after:block after:h-1.5 after:w-14 after:bg-sorot">Sign in</h1>
          <p className="mt-5 text-lg text-ink-2">Use your office account.</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); signIn() }}>
            <Field label="Username"><Input value={username} onChange={(e) => { setUsername(e.target.value); setErr('') }} autoComplete="username" /></Field>
            <Field label="Password"><Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setErr('') }} autoComplete="current-password" /></Field>
            {err && <p className="rounded-md bg-bad-soft p-3 text-sm text-bad">{err}</p>}
            <Button className="!h-14 w-full !rounded font-display !text-2xl !font-extrabold uppercase tracking-[.08em] shadow-[inset_0_-5px_0_var(--color-sorot)]" type="submit">Sign in</Button>
          </form>
          <div className="mt-10">
            <div className="text-[13px] font-bold text-ink">Demo accounts</div>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {s.users.map((u) => (
                <li key={u.id}>
                  <button onClick={() => { setUsername(u.username); setErr('') }} className={`w-full rounded-md px-3 py-2 text-left text-[13px] transition-colors ${username === u.username ? 'bg-accent-soft' : 'bg-surface-2/70 hover:bg-surface-2'}`}>
                    <div className="truncate font-medium">{u.name}</div>
                    <div className="truncate text-ink-2">{u.active ? u.roles.map((r) => roleLabel[r]).join(', ') : 'Inactive'}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
