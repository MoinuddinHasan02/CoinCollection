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
        // Logo icon drops from above with slight rotation
        .from(logoIconRef.current, {
          y: -60,
          scale: 0.55,
          opacity: 0,
          rotation: -12,
          duration: 1.1,
        })
        // Subtitle: letter-spacing collapses in
        .from(subtitleRef.current, {
          opacity: 0,
          letterSpacing: '0.6em',
          duration: 0.9,
        }, '-=0.45')
        // Email field slides up
        .from('.login-field', {
          y: 28,
          opacity: 0,
          duration: 0.7,
          stagger: 0.14,
        }, '-=0.4')
        // Submit button last
        .from(btnRef.current, {
          y: 18,
          opacity: 0,
          duration: 0.65,
        }, '-=0.2');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── Title scramble ─────────────────────────────────────────────────
  useEffect(() => {
    if (!titleRef.current) return;
    const el = titleRef.current;
    const timer = setTimeout(() => {
      scrambleRef.current = scrambleText(el, 'NumisVault', 1000);
    }, 350);
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
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.3;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.3;
    gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.75, ease: 'expo.out', overwrite: 'auto' });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce frontend cooldown after repeated failures
    if (Date.now() < cooldownUntil) return;

    if (!insforge?.auth) { setError('Service unavailable. Please try again later.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await insforge.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) {
        const newCount = failCount + 1;
        setFailCount(newCount);

        // Exponential back-off: 3 → 5s, 4 → 15s, 5+ → 30s
        const delays: Record<number, number> = { 3: 5, 4: 15 };
        const delaySecs = newCount >= 5 ? 30 : (delays[newCount] ?? 0);
        if (delaySecs > 0) {
          const until = Date.now() + delaySecs * 1000;
          setCooldownUntil(until);
          setCooldownSecs(delaySecs);
        }

        setError(signInError.message);
        // Horizontal shake on error
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
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="bg-background font-body text-on-background min-h-screen flex flex-col items-center justify-center p-6 mesh-gradient"
    >
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 w-full">
        <div className="w-full max-w-md bg-surface/60 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-2xl border border-white/40">

          {/* ── Branding ── */}
          <div className="text-center mb-10 space-y-4">
            <div
              ref={logoIconRef}
              className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-gold-500/30 rotate-3"
            >
              <span className="material-symbols-outlined text-4xl text-on-primary">deployed_code</span>
            </div>
            <h1
              ref={titleRef}
              className="text-4xl font-display font-black tracking-tight text-on-surface"
            >
              NumisVault
            </h1>
            <p
              ref={subtitleRef}
              className="font-label text-gold-600 mt-2 text-sm uppercase tracking-[0.2em] font-bold"
            >
              Elite Access
            </p>
          </div>

          {/* ── Form ── */}
          <div ref={formRef} className="space-y-8 relative z-10" id="loginForm">
            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-medium border border-error/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">error</span>
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Email */}
              <div className="relative floating-label-input group login-field">
                <input
                  className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-gold-500 transition-colors text-on-surface text-lg outline-none"
                  id="email"
                  name="email"
                  placeholder=" "
                  required
                  maxLength={255}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <label
                  className="absolute left-0 top-3 text-outline font-label transition-all pointer-events-none duration-200 uppercase tracking-widest text-xs font-bold"
                  htmlFor="email"
                >
                  Email Address
                </label>
              </div>

              {/* Password */}
              <div className="relative floating-label-input group login-field">
                <input
                  className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-gold-500 transition-colors text-on-surface text-lg outline-none"
                  id="password"
                  name="password"
                  placeholder=" "
                  required
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <label
                  className="absolute left-0 top-3 text-outline font-label transition-all pointer-events-none duration-200 uppercase tracking-widest text-xs font-bold"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-0 top-3 text-outline hover:text-gold-600 transition-colors"
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              ref={btnRef}
              onClick={handleSubmit}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className={`magnetic-btn w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-gold-500/30 transition-colors duration-300 active:scale-[0.98] flex items-center justify-center gap-3 ${
                cooldownSecs > 0 ? 'opacity-50 cursor-not-allowed saturate-0' : ''
              }`}
              type="button"
              disabled={loading || cooldownSecs > 0}
            >
              <span className="font-label tracking-widest uppercase text-sm">
                {cooldownSecs > 0
                  ? `Try again in ${cooldownSecs}s`
                  : loading
                  ? 'Verifying...'
                  : 'Sign In'}
              </span>
              <span className="material-symbols-outlined text-xl">
                {cooldownSecs > 0 ? 'lock_clock' : loading ? 'sync' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
