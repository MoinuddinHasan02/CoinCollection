import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useLayoutEffect,
  useCallback,
} from 'react';
import { insforge } from './lib/insforge';
import { gsap, ScrollTrigger } from './lib/gsapConfig';
import { scrambleText } from './utils/scramble';
import { usePageTransition } from './contexts/TransitionContext';
import { useToast } from './components/Toast';

/* ─────────────────────────────────────────────────────────────────
   COUNT-UP HOOK
   Animates a number from 0 → target when `trigger` flips true.
   Re-runs if `target` changes (coins may load after IO fires).
───────────────────────────────────────────────────────────────── */
function useCountUp(target: number, trigger: boolean, duration = 1.8) {
  const [value, setValue] = useState(0);
  const objRef = useRef({ val: 0 });

  useEffect(() => {
    if (!trigger) return;
    objRef.current.val = 0;
    const tween = gsap.to(objRef.current, {
      val: target,
      duration,
      ease: 'power3.out',
      onUpdate: () => setValue(Math.round(objRef.current.val)),
    });
    return () => { tween.kill(); };
  }, [trigger, target, duration]);

  return trigger ? value : target;
}

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────────── */
export function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coins, setCoins] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfileData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statsTriggered, setStatsTriggered] = useState(false);

  // ── Navigation ─────────────────────────────────────────────────────────
  const { navigateTo } = usePageTransition();

  // ── Toast notifications (replaces window.alert) ────────────────────────
  const { toast, container: toastContainer } = useToast();

  // ── Admin role: derived from profile, NOT just presence of user ────────
  // This gates the curator UI — non-admin authenticated users see read-only view.
  const isAdmin = profile?.role === 'admin';

  // ── Refs ───────────────────────────────────────────────────────────────
  const rootRef          = useRef<HTMLDivElement>(null);
  const statsRef         = useRef<HTMLElement>(null);
  const galleryRef       = useRef<HTMLDivElement>(null);
  const galleryTitleRef  = useRef<HTMLDivElement>(null);
  const searchRef        = useRef<HTMLElement>(null);
  const logoTextRef      = useRef<HTMLSpanElement>(null);
  const avatarInputRef   = useRef<HTMLInputElement>(null);
  const hasAnimatedGallery = useRef(false);
  const scrambleCleanupRef = useRef<(() => void) | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────
  const fetchCoins = useCallback(async () => {
    const { data, error } = await insforge.database
      .from('coins')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCoins(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCoins();
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        insforge.database.from('profiles').select('*').eq('id', data.user.id).single().then((res) => {
          if (res.data) setProfileData(res.data);
        });
      }
    });
    return () => { scrambleCleanupRef.current?.(); };
  }, [fetchCoins]);

  // ── Derived values ─────────────────────────────────────────────────────
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return coins;
    const q = searchQuery.toLowerCase();
    return coins.filter(c =>
      (c.name        && c.name.toLowerCase().includes(q))       ||
      (c.country     && c.country.toLowerCase().includes(q))    ||
      (c.year        && c.year.toLowerCase().includes(q))       ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [coins, searchQuery]);

  const uniqueCountries = useMemo(
    () => new Set(coins.map(c => c.country).filter(Boolean)).size,
    [coins]
  );

  const oldestCoin = useMemo(() => {
    if (!coins.length) return 'N/A';
    const years = coins.map(c => parseInt(c.year)).filter(y => !isNaN(y));
    return years.length ? Math.min(...years) : 'N/A';
  }, [coins]);

  // ── Animated counters ──────────────────────────────────────────────────
  const displayCoins     = useCountUp(coins.length,     statsTriggered, 1.6);
  const displayCountries = useCountUp(uniqueCountries,  statsTriggered, 2.0);

  // ── IntersectionObserver → trigger count-up ────────────────────────────
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsTriggered(true); io.disconnect(); } },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── DELETE COIN ────────────────────────────────────────────────────────
  const handleDeleteCoin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this coin?')) return;
    
    const { error } = await insforge.database.from('coins').delete().eq('id', id);
    if (error) {
      toast('Error deleting coin: ' + error.message, 'error');
    } else {
      setCoins(prev => prev.filter(c => c.id !== id));
      toast('Coin deleted successfully.', 'success');
    }
  };

  // ── GSAP ANIMATIONS ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      // 1 ── Header nav items stagger in from above
      gsap.from('.dash-nav-item', {
        y: -28,
        opacity: 0,
        duration: 0.75,
        stagger: { each: 0.09, ease: 'power2.out' },
        ease: 'expo.out',
        delay: 0.45,
      });

      // 2 ── Stat cards reveal with editorial stagger
      gsap.from('.stat-card', {
        y: 75,
        opacity: 0,
        duration: 1.1,
        stagger: { each: 0.20, ease: 'power2.out' },
        ease: 'expo.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 84%',
          once: true,
        },
      });

      // 3 ── Stat icons subtle parallax (depth layer)
      gsap.to('.stat-icon', {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      });

      // 4 ── Search bar slides from left behind a mask
      gsap.from(searchRef.current, {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: searchRef.current,
          start: 'top 90%',
          once: true,
        },
      });

      // 5 ── Gallery heading: each char slides up through mask
      if (galleryTitleRef.current) {
        const chars = galleryTitleRef.current.querySelectorAll('.word-mask-inner');
        gsap.from(chars, {
          y: '120%',
          duration: 0.8,
          stagger: { each: 0.055, ease: 'power1.out' },
          ease: 'expo.out',
          scrollTrigger: {
            trigger: galleryTitleRef.current,
            start: 'top 92%',
            once: true,
          },
        });

        // Gallery editorial line reveal
        const line = galleryTitleRef.current.querySelector('.gallery-line');
        if (line) {
          gsap.from(line, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.4,
            ease: 'expo.out',
            delay: 0.25,
            scrollTrigger: {
              trigger: galleryTitleRef.current,
              start: 'top 92%',
              once: true,
            },
          });
        }
      }

      // 6 ── Admin welcome panel (if rendered)
      gsap.from('.admin-banner', {
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        delay: 0.7,
      });

    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── LOGO SCRAMBLE (slight delay for curtain to reveal) ─────────────────
  useEffect(() => {
    if (!logoTextRef.current) return;
    const el = logoTextRef.current;
    const timer = setTimeout(() => {
      scrambleCleanupRef.current = scrambleText(el, 'NumisVault', 900);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  // ── GALLERY CARD ENTRANCE (after coins load, run once) ─────────────────
  useEffect(() => {
    if (!coins.length || hasAnimatedGallery.current || !galleryRef.current) return;
    hasAnimatedGallery.current = true;

    // Wait one frame to guarantee cards are in the DOM
    const frame = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        const cards = galleryRef.current!.querySelectorAll('.coin-card-item');
        if (!cards.length) return;

        gsap.from(cards, {
          y: 85,
          opacity: 0,
          duration: 1,
          stagger: {
            each: 0.07,
            ease: 'power3.out',
            from: 'start',
          },
          ease: 'expo.out',
          clearProps: 'transform', // hand off to GSAP hover after entrance
        });

        // Refresh ScrollTrigger since new elements changed page height
        ScrollTrigger.refresh();
      }, galleryRef);

      return () => ctx.revert();
    });

    return () => cancelAnimationFrame(frame);
  }, [coins]);

  // ── CARD HOVER: Perspective tilt + radial shine ────────────────────────
  const handleCardMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -6.5;
    const ry = ((x - cx) / cx) *  6.5;

    gsap.to(card, {
      rotationX: rx,
      rotationY: ry,
      transformPerspective: 900,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    const shine = card.querySelector('.card-shine') as HTMLElement | null;
    if (shine) {
      const px = (x / rect.width)  * 100;
      const py = (y / rect.height) * 100;
      shine.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(212,175,55,0.14) 0%, transparent 62%)`;
      gsap.to(shine, { opacity: 1, duration: 0.28, overwrite: 'auto' });
    }
  }, []);

  const handleCardLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.7,
      ease: 'expo.out',
      overwrite: 'auto',
    });
    const shine = card.querySelector('.card-shine') as HTMLElement | null;
    if (shine) gsap.to(shine, { opacity: 0, duration: 0.5, overwrite: 'auto' });
  }, []);

  // ── MAGNETIC BUTTON ────────────────────────────────────────────────────
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.28;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.28;
    gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.75, ease: 'expo.out', overwrite: 'auto' });
  }, []);

  // ── AVATAR UPLOAD ──────────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    const file = e.target.files[0];
    setIsUploadingAvatar(true);
    try {
      const fileExt  = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await insforge.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const publicUrl = insforge.storage.from('avatars').getPublicUrl(fileName);
      const { data, error: updateError } = await insforge.auth.setProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;
      if (data) setProfileData(data);
      toast('Profile picture updated.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast('Error updating profile picture: ' + msg, 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── CSV EXPORT ─────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!coins.length) return;
    const headers = ['Name','Year','Mint Mark','Country','Condition','Description'];
    const rows = coins.map(c => [
      `"${(c.name        || '').replace(/"/g,'""')}"`,
      `"${c.year         || ''}"`,
      `"${c.mint_mark    || ''}"`,
      `"${c.country      || ''}"`,
      `"${c.condition    || ''}"`,
      `"${(c.description || '').replace(/"/g,'""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'numisvault_collection.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Avatar: use stored URL or fall back to user initials (no external dependency)
  const avatarUrl = profile?.avatar_url || null;
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? '?';

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className="bg-mesh-gradient font-body text-on-background min-h-screen flex flex-col"
    >
      {/* Toast notification container */}
      {toastContainer}
      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-surface/80 backdrop-blur-xl border-b border-white/20 shadow-sm">

        {/* Logo */}
        <div className="flex items-center gap-4 dash-nav-item">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/30">
            <span className="material-symbols-outlined text-white text-xl">deployed_code</span>
          </div>
          <h1 className="text-2xl font-display font-black tracking-tight text-on-surface hidden sm:block">
            <span ref={logoTextRef}>NumisVault</span>
            {isAdmin && (
              <span className="text-gold-600 ml-2 font-label text-sm tracking-widest uppercase align-middle">
                Elite
              </span>
            )}
          </h1>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigateTo('/dashboard')}
            className="dash-nav-item text-gold-700 font-label text-sm uppercase tracking-widest font-bold hover:text-gold-500 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' })}
            className="dash-nav-item text-on-surface-variant font-label text-sm uppercase tracking-widest font-medium hover:text-gold-600 transition-colors"
          >
            Analytics
          </button>
          {isAdmin && (
            <button
              onClick={exportCSV}
              className="dash-nav-item text-on-surface-variant font-label text-sm uppercase tracking-widest font-medium hover:text-gold-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export CSV
            </button>
          )}
        </nav>

        {/* Avatar */}
        <div
          className="dash-nav-item relative group cursor-pointer"
          onClick={() => isAdmin && avatarInputRef.current?.click()}
          title={isAdmin ? 'Change Profile Picture' : user ? 'Logged in' : 'Visitor'}
        >
          <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={handleAvatarUpload} />
          <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border-2 border-gold-400/50 shadow-md transition-transform group-hover:scale-105">
            {isUploadingAvatar ? (
              <span className="material-symbols-outlined text-gold-600 animate-spin">sync</span>
            ) : avatarUrl ? (
              <img alt="Profile" className="w-full h-full object-cover" src={avatarUrl} />
            ) : user ? (
              /* Initials fallback — no external dependency */
              <span className="font-display font-black text-gold-600 text-lg select-none">{avatarInitial}</span>
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            )}
          </div>
          {isAdmin && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-sm">edit</span>
            </div>
          )}
        </div>
      </header>

      {/* ════════════════════════════════════════
          MAIN
      ════════════════════════════════════════ */}
      <main className="pt-28 pb-10 px-6 max-w-7xl mx-auto w-full">

        {/* ── Admin Banner ─────────────────────── */}
        {isAdmin && (
          <div className="admin-banner bg-surface/80 backdrop-blur-md border border-gold-200 p-6 rounded-2xl mb-10 shadow-xl shadow-gold-500/5 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-14 h-14 bg-gradient-to-br from-gold-100 to-gold-200 text-gold-700 rounded-full flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-2xl text-on-surface">Welcome back, Curator</h2>
              <p className="text-on-surface-variant mt-1 font-medium">
                You have full access to manage and expand the collection.
              </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={() => navigateTo('/add')}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                className="magnetic-btn flex-1 md:flex-none bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gold-500/20 active:scale-95 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Add Coin
              </button>
              <button
                onClick={async () => { await insforge.auth.signOut(); navigateTo('/login'); }}
                className="bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/30 px-6 py-3 rounded-xl font-bold shadow-sm active:scale-95 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* ── Analytics Stats ───────────────────── */}
        <section
          id="analytics"
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 scroll-mt-24"
        >
          {/* Total Coins */}
          <div className="stat-card p-8 bg-surface/60 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 flex flex-col items-center justify-center text-center">
            <div className="stat-icon w-12 h-12 bg-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">monetization_on</span>
            </div>
            <h3 className="text-4xl font-black text-on-surface tracking-tight tabular-nums">
              {displayCoins}
            </h3>
            <p className="text-outline-variant font-label text-xs uppercase tracking-widest font-bold mt-2">
              Total Coins
            </p>
          </div>

          {/* Unique Countries */}
          <div className="stat-card p-8 bg-surface/60 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 flex flex-col items-center justify-center text-center">
            <div className="stat-icon w-12 h-12 bg-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">public</span>
            </div>
            <h3 className="text-4xl font-black text-on-surface tracking-tight tabular-nums">
              {displayCountries}
            </h3>
            <p className="text-outline-variant font-label text-xs uppercase tracking-widest font-bold mt-2">
              Unique Countries
            </p>
          </div>

          {/* Oldest Coin */}
          <div
            onClick={() => oldestCoin !== 'N/A' && setSearchQuery(oldestCoin.toString())}
            className={`stat-card p-8 bg-surface/60 backdrop-blur-md rounded-3xl shadow-lg border border-white/40 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              oldestCoin !== 'N/A' ? 'cursor-pointer hover:border-gold-400/50 hover:shadow-gold-500/10' : ''
            }`}
            title={oldestCoin !== 'N/A' ? 'Click to view oldest coin' : ''}
          >
            <div className="stat-icon w-12 h-12 bg-gold-100 text-gold-600 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined">history</span>
            </div>
            <h3 className="text-4xl font-black text-on-surface tracking-tight">{oldestCoin}</h3>
            <p className="text-outline-variant font-label text-xs uppercase tracking-widest font-bold mt-2">
              Oldest Coin
            </p>
          </div>
        </section>

        {/* ── Search ───────────────────────────── */}
        <section ref={searchRef} className="mb-10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-gold-500 transition-colors z-10">
              search
            </span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl pl-14 pr-6 py-4 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all text-lg shadow-sm"
              placeholder="Search by name, year, or country..."
              type="text"
            />
          </div>
        </section>

        {/* ── Gallery ──────────────────────────── */}
        <section>
          {/* Heading with per-character mask reveal */}
          <div ref={galleryTitleRef} className="mb-8">
            <div className="flex justify-between items-end">
              <h2 className="font-display font-black text-3xl text-on-surface">
                {'Gallery'.split('').map((char, i) => (
                  <span key={i} className="word-mask">
                    <span className="word-mask-inner">{char}</span>
                  </span>
                ))}
              </h2>
              <p className="font-label text-gold-600 font-bold uppercase tracking-widest text-sm">
                {filteredCoins.length} Results
              </p>
            </div>
            {/* Editorial divider line — scaleX revealed by GSAP */}
            <div className="gallery-line mt-3 w-full" />
          </div>

          {filteredCoins.length === 0 ? (
            <div className="w-full bg-surface/40 backdrop-blur-sm border-2 border-dashed border-outline-variant/30 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-outline">search_off</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-on-surface mb-2">No Coins Found</h3>
              <p className="text-on-surface-variant max-w-md mb-8">
                Try adjusting your search criteria to discover hidden treasures in the vault.
              </p>
            </div>
          ) : (
            <div
              ref={galleryRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredCoins.map(coin => (
                <div
                  key={coin.id}
                  className="coin-card-item group cursor-pointer bg-surface rounded-3xl overflow-hidden shadow-md border border-outline-variant/20 flex flex-col relative"
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                >
                  {/* Cursor-tracking shine */}
                  <div className="card-shine" />

                  {/* ── Image ── */}
                  <div className="relative aspect-[4/3] bg-surface-container-lowest p-6 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {coin.image_url ? (
                      <img
                        src={coin.image_url}
                        alt={coin.name}
                        className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-[1.06] transition-transform duration-700 ease-out z-0"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gold-100 border-4 border-gold-200 flex items-center justify-center shadow-inner">
                        <span className="material-symbols-outlined text-5xl text-gold-400">monetization_on</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-label uppercase tracking-wider text-on-surface z-20 shadow-sm border border-white/50">
                      {coin.year}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteCoin(e, coin.id)}
                        className="absolute top-4 left-4 w-10 h-10 bg-red-500 hover:bg-red-600 backdrop-blur-md rounded-full flex items-center justify-center text-white z-30 shadow-md border border-white/20 transition-all hover:scale-110"
                        title="Delete Coin"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>

                  {/* ── Body ── */}
                  <div className="p-6 bg-surface flex-1 flex flex-col relative">
                    <h3 className="font-display font-bold text-xl text-on-surface mb-2 leading-tight group-hover:text-gold-600 transition-colors duration-300">
                      {coin.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-md text-xs font-bold">
                        {coin.condition}
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="text-on-surface-variant text-sm font-medium">{coin.country}</span>
                    </div>
                    <p className="text-on-surface-variant text-sm line-clamp-2 leading-relaxed flex-1">
                      {coin.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
