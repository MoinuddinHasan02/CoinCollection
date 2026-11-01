import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from 'react';
import { insforge } from './lib/insforge';
import { gsap } from './lib/gsapConfig';
import { scrambleText } from './utils/scramble';
import { usePageTransition } from './contexts/TransitionContext';
import { 
  Coins, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export function Login() {
  const [email,          setEmail]         = useState('');
  const [password,       setPassword]      = useState('');
  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState<string | null>(null);
  const [showPass,       setShowPass]      = useState(false);
  // Rate-limit state — increments on each bad login
  const [failCount,      setFailCount]     = useState(0);
  const [cooldownUntil,  setCooldownUntil] = useState<number>(0);
  const [cooldownSecs,   setCooldownSecs]  = useState(0);

  const { navigateTo } = usePageTransition();

  // ── Animation refs ────────────────────────────────────────────────
  const rootRef      = useRef<HTMLDivElement>(null);
  const logoIconRef  = useRef<HTMLDivElement>(null);
  const titleRef     = useRef<HTMLHeadingElement>(null);
  const subtitleRef  = useRef<HTMLParagraphElement>(null);
  const formRef      = useRef<HTMLDivElement>(null);
  const btnRef       = useRef<HTMLButtonElement>(null);
  const scrambleRef  = useRef<(() => void) | null>(null);

  // ── Cinematic entrance timeline ───────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl
        .from(logoIconRef.current, {
          y: -50,
          scale: 0.6,
          opacity: 0,
          rotation: -10,
          duration: 1.0,
        })
        .from(subtitleRef.current, {
          opacity: 0,
          letterSpacing: '0.5em',
          duration: 0.85,
        }, '-=0.4')
        .from('.login-field', {
          y: 24,
          opacity: 0,
          duration: 0.65,
          stagger: 0.12,
        }, '-=0.35')
        .from(btnRef.current, {
          y: 16,
          opacity: 0,
          duration: 0.6,
        }, '-=0.2');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── Title scramble ─────────────────────────────────────────────────
  useEffect(() => {
    if (!titleRef.current) return;
    const el = titleRef.current;
    const timer = setTimeout(() => {
      scrambleRef.current = scrambleText(el, 'NumisVault', 950);
    }, 300);
    return () => {
      clearTimeout(timer);
      scrambleRef.current?.();
    };
  }, []);

  // ── Cooldown countdown ticker ──────────────────────────────────────
  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownSecs(0);
        setCooldownUntil(0);
        clearInterval(interval);
      } else {
        setCooldownSecs(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // ── Magnetic button ────────────────────────────────────────────────
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
    gsap.to(btn, { x, y, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Date.now() < cooldownUntil) return;

    if (!insforge?.auth) { setError('Authentication service unavailable.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await insforge.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        const newCount = failCount + 1;
        setFailCount(newCount);

        const delays: Record<number, number> = { 3: 5, 4: 15 };
        const delaySecs = newCount >= 5 ? 30 : (delays[newCount] ?? 0);
        if (delaySecs > 0) {
          const until = Date.now() + delaySecs * 1000;
          setCooldownUntil(until);
          setCooldownSecs(delaySecs);
        }

        setError(signInError.message);
        if (formRef.current) {
          gsap.fromTo(
            formRef.current,
            { x: -10 },
            { x: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.4)' }
          );
        }
      } else {
        void data;
        navigateTo('/dashboard');
      }
    } catch {
      setError('An unexpected authentication error occurred.');
      setLoading(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="bg-mesh-gradient font-body text-zinc-100 min-h-screen flex flex-col items-center justify-center p-6 selection:bg-gold-500/30 selection:text-gold-200"
    >
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 w-full">
        <div className="w-full max-w-md bg-[#0f121d]/90 backdrop-blur-3xl p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.1)] border border-white/10">

          {/* ── Sovereign Vault Branding ── */}
          <div className="text-center mb-8 space-y-3">
            <div
              ref={logoIconRef}
              className="w-16 h-16 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-gold-500/25 border border-gold-300/30"
            >
              <Coins className="w-8 h-8 text-black" />
            </div>
            <h1
              ref={titleRef}
              className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white"
            >
              NumisVault
            </h1>
            <p
              ref={subtitleRef}
              className="font-label text-gold-400 text-xs uppercase tracking-[0.25em] font-bold"
            >
              Curator Authentication
            </p>
          </div>

          {/* ── Form ── */}
          <div ref={formRef} className="space-y-6 relative z-10" id="loginForm">
            {error && (
              <div className="bg-red-950/60 text-red-200 p-3.5 rounded-xl text-xs font-medium border border-red-500/30 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5 login-field">
                <label
                  className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block"
                  htmlFor="email"
                >
                  Curator Email
                </label>
                <input
                  className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition-all text-sm shadow-inner"
                  id="email"
                  name="email"
                  placeholder="curator@numisvault.org"
                  required
                  maxLength={255}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 login-field relative">
                <label
                  className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block"
                  htmlFor="password"
                >
                  Vault Passkey
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl pl-4 pr-11 py-3.5 text-white placeholder-zinc-600 outline-none transition-all text-sm shadow-inner"
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    required
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-gold-400 transition-colors p-1"
                    title={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              ref={btnRef}
              onClick={handleSubmit}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className={`magnetic-btn w-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-300 text-black font-bold py-4 px-6 rounded-xl shadow-xl shadow-gold-500/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 text-xs font-label uppercase tracking-widest ${
                cooldownSecs > 0 ? 'opacity-50 cursor-not-allowed saturate-0' : ''
              }`}
              type="button"
              disabled={loading || cooldownSecs > 0}
            >
              <span>
                {cooldownSecs > 0
                  ? `Locked (${cooldownSecs}s)`
                  : loading
                  ? 'Verifying Credentials...'
                  : 'Enter Sovereign Vault'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Instant Demo Curator Access */}
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  setEmail('curator@numisvault.org');
                  setPassword('curator123');
                  const { error: signInErr } = await insforge.auth.signInWithPassword({
                    email: 'curator@numisvault.org',
                    password: 'curator123',
                  });
                  if (!signInErr) navigateTo('/dashboard');
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gold-400/10 hover:bg-gold-400/20 border border-gold-400/30 text-gold-300 font-label text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-gold-500/5"
              >
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span>One-Click Curator Demo Login (Admin)</span>
              </button>
            </div>

            {/* Security Indicator */}
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-label pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400/60" />
              <span>TLS 1.3 End-to-End Vault Encryption</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
