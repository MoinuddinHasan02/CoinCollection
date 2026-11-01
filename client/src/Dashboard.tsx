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
import { CoinShowcaseCard, type CoinData } from './components/CoinShowcaseCard';
import { CoinInspectionModal } from './components/CoinInspectionModal';
import { 
  Coins, 
  Globe2, 
  History, 
  Search, 
  X, 
  ShieldCheck, 
  PlusCircle, 
  LogOut, 
  Download, 
  Sparkles,
  Camera,
  Filter
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────
   COUNT-UP HOOK (GSAP Ease)
   Animates numeric targets with smooth power3.out deceleration.
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
   DASHBOARD — Redesigned with Open Design & Stripe Standards
───────────────────────────────────────────────────────────────── */
export function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────
  const [coins, setCoins] = useState<CoinData[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfileData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statsTriggered, setStatsTriggered] = useState(false);
  const [inspectedCoin, setInspectedCoin] = useState<CoinData | null>(null);

  // ── Navigation ─────────────────────────────────────────────────────────
  const { navigateTo } = usePageTransition();

  // ── Toast notifications ────────────────────────────────────────────────
  const { toast, container: toastContainer } = useToast();

  // ── Admin role derived from verified profile ───────────────────────────
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
    if (!error && data) setCoins(data as CoinData[]);
  }, []);

  useEffect(() => {
    fetchCoins();
    insforge.auth.getCurrentUser().then(({ data }: any) => {
      if (data?.user) {
        setUser(data.user);
        insforge.database.from('profiles').select('*').eq('id', data.user.id).single().then((res: any) => {
          if (res?.data) setProfileData(res.data);
        });
      }
    });
    return () => { scrambleCleanupRef.current?.(); };
  }, [fetchCoins]);

  // ── Extract unique countries for filter pills ─────────────────────────
  const countryList = useMemo(() => {
    const list = Array.from(new Set(coins.map(c => c.country).filter(Boolean))) as string[];
    return ['ALL', ...list];
  }, [coins]);

  // ── Filtered coins ─────────────────────────────────────────────────────
  const filteredCoins = useMemo(() => {
    let result = coins;

    if (selectedCountry !== 'ALL') {
      result = result.filter(c => c.country === selectedCountry);
    }

    if (selectedCondition !== 'ALL') {
      result = result.filter(c => {
        const cond = (c.condition || '').toUpperCase();
        if (selectedCondition === 'MINT') return cond.includes('MS') || cond.includes('MINT');
        if (selectedCondition === 'PROOF') return cond.includes('PR') || cond.includes('PROOF');
        if (selectedCondition === 'CIRCULATED') return !cond.includes('MS') && !cond.includes('PR');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.name        && c.name.toLowerCase().includes(q))       ||
        (c.country     && c.country.toLowerCase().includes(q))    ||
        (c.year        && c.year.toLowerCase().includes(q))       ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [coins, searchQuery, selectedCountry, selectedCondition]);

  const uniqueCountriesCount = useMemo(
    () => new Set(coins.map(c => c.country).filter(Boolean)).size,
    [coins]
  );

  const oldestCoin = useMemo(() => {
    if (!coins.length) return 'N/A';
    const years = coins.map(c => parseInt(c.year || '')).filter(y => !isNaN(y));
    return years.length ? Math.min(...years) : 'N/A';
  }, [coins]);

  // ── Animated counters ──────────────────────────────────────────────────
  const displayCoins     = useCountUp(coins.length,          statsTriggered, 1.6);
  const displayCountries = useCountUp(uniqueCountriesCount,  statsTriggered, 2.0);

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
    if (!window.confirm('Are you sure you want to remove this specimen from the vault?')) return;
    
    const delRes = await insforge.database.from('coins').delete().eq('id', id);
    if (delRes?.error) {
      toast('Error deleting coin: ' + delRes.error.message, 'error');
    } else {
      setCoins(prev => prev.filter(c => c.id !== id));
      toast('Specimen removed successfully from vault.', 'success');
      if (inspectedCoin?.id === id) setInspectedCoin(null);
    }
  };

  // ── GSAP ANIMATIONS ────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1 ── Header nav items stagger in
      gsap.from('.dash-nav-item', {
        y: -24,
        opacity: 0,
        duration: 0.7,
        stagger: { each: 0.08, ease: 'power2.out' },
        ease: 'expo.out',
        delay: 0.35,
      });

      // 2 ── Stat cards reveal with precision stagger
      gsap.from('.stat-card', {
        y: 60,
        opacity: 0,
        duration: 1.0,
        stagger: { each: 0.15, ease: 'power2.out' },
        ease: 'expo.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 88%',
          once: true,
        },
      });

      // 3 ── Stat icons subtle floating parallax
      gsap.to('.stat-icon', {
        y: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
      });

      // 4 ── Search bar reveal
      gsap.from(searchRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: searchRef.current,
          start: 'top 92%',
          once: true,
        },
      });

      // 5 ── Gallery heading: character reveal mask
      if (galleryTitleRef.current) {
        const chars = galleryTitleRef.current.querySelectorAll('.word-mask-inner');
        gsap.from(chars, {
          y: '120%',
          duration: 0.8,
          stagger: { each: 0.05, ease: 'power1.out' },
          ease: 'expo.out',
          scrollTrigger: {
            trigger: galleryTitleRef.current,
            start: 'top 92%',
            once: true,
          },
        });

        const line = galleryTitleRef.current.querySelector('.gallery-line');
        if (line) {
          gsap.from(line, {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.4,
            ease: 'expo.out',
            delay: 0.2,
            scrollTrigger: {
              trigger: galleryTitleRef.current,
              start: 'top 92%',
              once: true,
            },
          });
        }
      }

      // 6 ── Curator banner
      gsap.from('.admin-banner', {
        y: 25,
        opacity: 0,
        duration: 0.85,
        ease: 'expo.out',
        delay: 0.5,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── LOGO SCRAMBLE ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!logoTextRef.current) return;
    const el = logoTextRef.current;
    const timer = setTimeout(() => {
      scrambleCleanupRef.current = scrambleText(el, 'NumisVault', 850);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ── GALLERY CARD ENTRANCE ──────────────────────────────────────────────
  useEffect(() => {
    if (!coins.length || hasAnimatedGallery.current || !galleryRef.current) return;
    hasAnimatedGallery.current = true;

    const frame = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        const cards = galleryRef.current!.querySelectorAll('.coin-card-item');
        if (!cards.length) return;

        gsap.from(cards, {
          y: 70,
          opacity: 0,
          duration: 0.9,
          stagger: {
            each: 0.06,
            ease: 'power3.out',
            from: 'start',
          },
          ease: 'expo.out',
          clearProps: 'transform',
        });

        ScrollTrigger.refresh();
      }, galleryRef);

      return () => ctx.revert();
    });

    return () => cancelAnimationFrame(frame);
  }, [coins]);

  // ── MAGNETIC BUTTON ────────────────────────────────────────────────────
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
    gsap.to(btn, { x, y, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
  }, []);

  // ── AVATAR UPLOAD ──────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    const file = e.target.files[0];
    setIsUploadingAvatar(true);
    try {
      const fileExt  = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const uploadRes = await insforge.storage.from('avatars').upload(fileName, file);
      if (uploadRes?.error) throw uploadRes.error;
      const publicUrl = insforge.storage.from('avatars').getPublicUrl(fileName);
      const updateRes = await insforge.auth.setProfile({ avatar_url: publicUrl });
      if (updateRes?.error) throw updateRes.error;
      if (updateRes?.data) setProfileData(updateRes.data);
      toast('Profile picture updated successfully.', 'success');
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
    a.download = 'numisvault_sovereign_catalog.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Vault catalogue exported to CSV.', 'success');
  };

  const avatarUrl = profile?.avatar_url || null;
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? 'V';

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className="bg-mesh-gradient font-body text-zinc-100 min-h-screen flex flex-col selection:bg-gold-500/30 selection:text-gold-200"
    >
      {/* Toast notification layer */}
      {toastContainer}

      {/* Specimen Quick Inspection Modal */}
      <CoinInspectionModal
        coin={inspectedCoin}
        onClose={() => setInspectedCoin(null)}
        onNavigateDetails={(c) => navigateTo('/details', { state: { coin: c } })}
      />

      {/* ════════════════════════════════════════
          HEADER (Stripe-Calibrated Dark Glass)
      ════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 sm:px-8 h-20 bg-[#08090d]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        
        {/* Brand Mark */}
        <div className="flex items-center gap-3.5 dash-nav-item">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20 border border-gold-300/30">
            <Coins className="w-5 h-5 text-black" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white">
              <span ref={logoTextRef}>NumisVault</span>
            </h1>
            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-gold-400 border border-gold-400/30 px-1.5 py-0.5 rounded bg-gold-400/10 hidden sm:inline-block">
              {isAdmin ? 'Curator Console' : 'Archive'}
            </span>
          </div>
        </div>

        {/* Global Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            onClick={() => navigateTo('/dashboard')}
            className="dash-nav-item text-gold-400 font-label text-xs uppercase tracking-widest font-bold hover:text-gold-300 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vault</span>
          </button>
          <button
            onClick={() => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' })}
            className="dash-nav-item text-zinc-400 font-label text-xs uppercase tracking-widest font-medium hover:text-white transition-colors"
          >
            Analytics
          </button>
          {isAdmin && (
            <button
              onClick={exportCSV}
              className="dash-nav-item text-zinc-400 font-label text-xs uppercase tracking-widest font-medium hover:text-gold-300 transition-colors flex items-center gap-1.5"
              title="Export Full CSV Archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </nav>

        {/* Profile / Curator Action */}
        <div className="flex items-center gap-3">
          {!isAdmin ? (
            <button
              onClick={() => navigateTo('/login')}
              className="dash-nav-item flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400/10 hover:bg-gold-400/20 border border-gold-400/30 text-gold-300 font-label text-xs uppercase font-bold tracking-wider transition-all"
              title="Sign in as Curator to unlock admin tools"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              <span>Curator Access</span>
            </button>
          ) : (
            <div
              className="dash-nav-item relative group cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Update Curator Picture"
            >
              <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={handleAvatarUpload} />
              <div className="w-10 h-10 rounded-full bg-[#161a29] flex items-center justify-center overflow-hidden border border-gold-400/40 shadow-md transition-transform group-hover:scale-105">
                {isUploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                ) : avatarUrl ? (
                  <img alt="Curator Profile" className="w-full h-full object-cover" src={avatarUrl} />
                ) : (
                  <span className="font-display font-bold text-gold-400 text-sm select-none">{avatarInitial}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3.5 h-3.5 text-gold-300" />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <main className="pt-28 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full flex-1">

        {/* ── Curator Command Banner ───────────── */}
        {isAdmin && (
          <div className="admin-banner bg-[#0f1322]/85 backdrop-blur-xl border border-gold-400/25 p-6 rounded-3xl mb-10 shadow-2xl shadow-gold-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl text-white">Curator Command Console</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-label uppercase font-bold tracking-wider">
                    Full Ledger Access
                  </span>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Authorize acquisitions, update numismatic census descriptions, and maintain archival records.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
              <button
                onClick={() => navigateTo('/add')}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                className="magnetic-btn flex-1 md:flex-none bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catalog Specimen</span>
              </button>

              <button
                onClick={async () => { await insforge.auth.signOut(); navigateTo('/login'); }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5"
                title="Sign out of Curator session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Analytics Metric Chamber ─────────── */}
        <section
          id="analytics"
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10 scroll-mt-28"
        >
          {/* Total Coins Stat */}
          <div className="stat-card p-6 rounded-2xl bg-[#0f121d]/80 backdrop-blur-xl border border-white/10 hover:border-gold-400/30 transition-all flex flex-col items-center justify-center text-center shadow-lg group">
            <div className="stat-icon w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight tabular-nums">
              {displayCoins}
            </h3>
            <p className="text-zinc-400 font-label text-[11px] uppercase tracking-widest font-semibold mt-1">
              Catalogued Specimens
            </p>
          </div>

          {/* Unique Sovereign Origins Stat */}
          <div className="stat-card p-6 rounded-2xl bg-[#0f121d]/80 backdrop-blur-xl border border-white/10 hover:border-gold-400/30 transition-all flex flex-col items-center justify-center text-center shadow-lg group">
            <div className="stat-icon w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight tabular-nums">
              {displayCountries}
            </h3>
            <p className="text-zinc-400 font-label text-[11px] uppercase tracking-widest font-semibold mt-1">
              Sovereign Empires & Nations
            </p>
          </div>

          {/* Oldest Specimen Year Stat */}
          <div
            onClick={() => oldestCoin !== 'N/A' && setSearchQuery(oldestCoin.toString())}
            className={`stat-card p-6 rounded-2xl bg-[#0f121d]/80 backdrop-blur-xl border border-white/10 transition-all flex flex-col items-center justify-center text-center shadow-lg group ${
              oldestCoin !== 'N/A' ? 'cursor-pointer hover:border-gold-400/50 hover:shadow-gold-500/10' : ''
            }`}
            title={oldestCoin !== 'N/A' ? 'Click to filter vault for the oldest record' : ''}
          >
            <div className="stat-icon w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
              {oldestCoin}
            </h3>
            <p className="text-zinc-400 font-label text-[11px] uppercase tracking-widest font-semibold mt-1 flex items-center gap-1">
              <span>Oldest Specimen Era</span>
              {oldestCoin !== 'N/A' && <Sparkles className="w-3 h-3 text-gold-400" />}
            </p>
          </div>
        </section>

        {/* ── Search & Filter Command Ribbon ───── */}
        <section ref={searchRef} className="mb-10 space-y-4">
          {/* Main Search Input */}
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-gold-400 transition-colors z-10" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d101b]/90 backdrop-blur-xl border border-white/10 focus:border-gold-400/50 rounded-2xl pl-14 pr-12 py-4 text-white placeholder-zinc-500 outline-none transition-all text-base shadow-lg focus:shadow-gold-500/10"
              placeholder="Search by specimen title, year, sovereign country, or historical provenance..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Bar: Countries & Conditions */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Country Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-500 font-label font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Origin:</span>
              </span>
              {countryList.slice(0, 6).map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-3 py-1 rounded-full font-label text-xs transition-all ${
                    selectedCountry === country
                      ? 'bg-gold-400 text-black font-bold shadow-md shadow-gold-400/20'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {country === 'ALL' ? 'All Nations' : country}
                </button>
              ))}
            </div>

            {/* Condition Filters */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-zinc-500 font-label font-bold uppercase tracking-wider text-[10px] mr-1">
                Grade:
              </span>
              {[
                { id: 'ALL', label: 'All Grades' },
                { id: 'MINT', label: 'Mint State' },
                { id: 'PROOF', label: 'Proof' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedCondition(tier.id)}
                  className={`px-2.5 py-1 rounded-md font-label text-[11px] transition-all ${
                    selectedCondition === tier.id
                      ? 'bg-gold-400/20 text-gold-300 border border-gold-400/40 font-bold'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Gallery Section ──────────────────── */}
        <section>
          {/* Section Heading with Editorial Line */}
          <div ref={galleryTitleRef} className="mb-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  {'Specimen Gallery'.split('').map((char, i) => (
                    <span key={i} className="word-mask">
                      <span className="word-mask-inner">{char}</span>
                    </span>
                  ))}
                </h2>
                <p className="text-zinc-500 text-xs font-label mt-1">
                  Verified numismatic pieces on physical archive record
                </p>
              </div>
              <div className="text-right">
                <span className="font-label text-gold-400 font-bold text-sm tabular-nums">
                  {filteredCoins.length}
                </span>
                <span className="text-zinc-500 font-label text-xs uppercase tracking-wider ml-1">
                  Specimens
                </span>
              </div>
            </div>
            <div className="gallery-line mt-3 w-full" />
          </div>

          {/* Empty State vs Grid */}
          {filteredCoins.length === 0 ? (
            <div className="w-full bg-[#0d101b]/70 backdrop-blur-xl border border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-zinc-500">
                <Coins className="w-10 h-10" />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">No Matching Specimens</h3>
              <p className="text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
                No archive records match your search query or filter selection. Try resetting filters to view all pieces in the vault.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('ALL');
                  setSelectedCondition('ALL');
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition-all"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div
              ref={galleryRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredCoins.map((coin) => (
                <CoinShowcaseCard
                  key={coin.id}
                  coin={coin}
                  isAdmin={isAdmin}
                  onSelect={(selected) => setInspectedCoin(selected)}
                  onDelete={handleDeleteCoin}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ════════════════════════════════════════
          FOOTER (Colophon)
      ════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-white/5 py-8 px-6 bg-[#06070a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-label">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-gold-400" />
            <span className="text-zinc-400 font-semibold">NumisVault Archive Ledger</span>
            <span>• Verified Numismatics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Open Design Standards</span>
            <span>•</span>
            <span>Stripe Elevation Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
