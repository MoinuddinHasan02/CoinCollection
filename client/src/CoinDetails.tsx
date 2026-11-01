import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { insforge } from './lib/insforge';
import { 
  ArrowLeft, 
  Share2, 
  ShieldCheck, 
  Globe2, 
  Coins, 
  Scale, 
  BookOpen, 
  Check 
} from 'lucide-react';
import { useToast } from './components/Toast';

export function CoinDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast, container: toastContainer } = useToast();
  const [copied, setCopied] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coin, setCoin] = useState<any>(location.state?.coin || null);
  const coinId = searchParams.get('id') || location.state?.coin?.id;

  useEffect(() => {
    if (!coin && coinId) {
      insforge.database
        .from('coins')
        .select('*')
        .eq('id', coinId)
        .single()
        .then((res: any) => {
          if (res?.data) setCoin(res.data);
        });
    }
  }, [coin, coinId]);

  // Fallback museum piece if accessed directly without state
  const displayCoin = coin || {
    id: 'archive-1907-double-eagle',
    name: '1907 Saint-Gaudens Double Eagle',
    year: '1907',
    country: 'United States',
    mint_mark: 'None (Philadelphia)',
    condition: 'MS-67 High Relief',
    description: "A masterpiece of American numismatics, the Saint-Gaudens Double Eagle was born from President Theodore Roosevelt's ambition to revitalize sovereign coinage. Designed by the sculptor Augustus Saint-Gaudens, this High Relief strike variant represents the pinnacle of early 20th-century die engineering.",
    image_url: null,
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast('Archival dossier link copied to clipboard.', 'success');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast('Share link ready: ' + window.location.href, 'info');
    }
  };

  return (
    <div className="bg-[#08090d] font-body text-zinc-100 min-h-screen flex flex-col selection:bg-gold-500/30 selection:text-gold-200">
      {toastContainer}

      {/* ── Fixed Blur Navigation Header ── */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 h-20 bg-[#08090d]/80 backdrop-blur-2xl border-b border-white/10">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-label uppercase font-bold tracking-wider active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Vault</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-400/10 hover:bg-gold-400/20 border border-gold-400/30 text-gold-300 text-xs font-label font-bold uppercase tracking-wider transition-all"
            title="Share Dossier Link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Share Specimen'}</span>
          </button>
        </div>
      </header>

      {/* ── Sovereign Specimen Display Hero ── */}
      <section className="relative pt-24 pb-16 w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#151a29] via-[#0e121d] to-[#08090d] border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.12)_0%,transparent_65%)] pointer-events-none" />

        <div className="relative z-10 px-6 flex flex-col items-center text-center">
          {/* Specimen Portrait */}
          <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-br from-[#1a2135] via-[#101424] to-[#090c14] border border-gold-400/30 p-6 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.15)] relative group">
            {displayCoin.image_url ? (
              <img
                src={displayCoin.image_url}
                alt={displayCoin.name}
                className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gold-400">
                <Coins className="w-24 h-24 drop-shadow" />
                <span className="text-[11px] font-label font-bold uppercase tracking-widest mt-2 text-gold-300/80">
                  Sovereign Specimen
                </span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-gold-400/20 text-[10px] font-label text-gold-300 uppercase tracking-widest">
              High Relief Strike
            </div>
          </div>
        </div>
      </section>

      {/* ── Master Archival Dossier ── */}
      <main className="relative z-20 px-4 sm:px-6 max-w-4xl mx-auto w-full -mt-6 pb-20">
        <div className="bg-[#0e111c]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10">
          
          {/* Title & Sovereign Origin Header */}
          <div className="flex flex-col gap-2 pb-6 border-b border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs font-label font-bold tracking-widest uppercase">
                {displayCoin.condition || 'Mint State'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-label">
                Mintage Era {displayCoin.year || 'Historic'}
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-4xl text-white tracking-tight mt-1">
              {displayCoin.name}
            </h1>

            <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
              <Globe2 className="w-4 h-4 text-gold-400" />
              <span className="font-medium text-zinc-300">{displayCoin.country || 'Global Sovereignty'}</span>
              <span className="text-white/20">•</span>
              <span className="font-label text-xs uppercase tracking-wider text-gold-300 font-semibold">
                Mint: {displayCoin.mint_mark || 'Original Strike'}
              </span>
            </div>
          </div>

          {/* Historical Significance Section */}
          <div className="mt-8">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-gold-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Historical Significance & Provenance</span>
            </h2>
            <p className="text-zinc-300 leading-relaxed text-sm sm:text-base bg-white/[0.02] border border-white/5 rounded-2xl p-5">
              {displayCoin.description}
            </p>
          </div>

          {/* Technical Specifications Grid */}
          <div className="mt-8">
            <h2 className="font-label text-xs font-bold uppercase tracking-widest text-gold-400 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Numismatic Census Specifications</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold font-label">Sovereignty</span>
                <span className="text-sm font-bold text-white">{displayCoin.country || 'Universal'}</span>
              </div>

              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold font-label">Strike Year</span>
                <span className="text-sm font-bold text-gold-300 font-label">{displayCoin.year || 'Historic'}</span>
              </div>

              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold font-label">Mint Mark</span>
                <span className="text-sm font-bold text-white font-label">{displayCoin.mint_mark || 'None (Philadelphia)'}</span>
              </div>

              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold font-label">Grade / Condition</span>
                <span className="text-sm font-bold text-emerald-400 font-label">{displayCoin.condition || 'Mint State'}</span>
              </div>

              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold font-label">Metal Composition</span>
                <span className="text-sm font-bold text-white">Sovereign Bullion</span>
              </div>

              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold font-label">Authentication</span>
                <span className="text-sm font-bold text-gold-300">PCGS / NGC Census</span>
              </div>
            </div>
          </div>

          {/* Authentication Badge */}
          <div className="mt-8 p-5 rounded-2xl bg-gold-400/5 border border-gold-400/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Sovereign Vault Verification Guarantee</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Specimen catalogued in NumisVault digital repository with verified census provenance and strike classification.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
