import React, { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsapConfig';
import { 
  X, 
  Globe2, 
  Coins, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import type { CoinData } from './CoinShowcaseCard';

interface CoinInspectionModalProps {
  coin: CoinData | null;
  onClose: () => void;
  onNavigateDetails: (coin: CoinData) => void;
}

export const CoinInspectionModal: React.FC<CoinInspectionModalProps> = ({
  coin,
  onClose,
  onNavigateDetails,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!coin) return;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Cinematic modal reveal
    const ctx = gsap.context(() => {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { scale: 0.92, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' }
      );
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      ctx.revert();
    };
  }, [coin, onClose]);

  if (!coin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Darkened Velvet Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0d101b] border border-gold-400/30 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] flex flex-col z-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          title="Close Inspection"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-b from-[#161c2e] to-[#0d101b] border-b border-white/5 flex flex-col sm:flex-row gap-6 items-center">
          {/* Specimen Showcase Well */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0 rounded-2xl bg-gradient-to-br from-[#1b2238] via-[#101424] to-[#0a0d16] border border-gold-400/20 p-4 flex items-center justify-center shadow-inner overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />
            {coin.image_url ? (
              <img
                src={coin.image_url}
                alt={coin.name}
                className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)] z-10 hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <Coins className="w-20 h-20 text-gold-400/80 drop-shadow" />
            )}
            <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 border border-gold-400/20 text-[10px] font-label text-gold-300">
              <Sparkles className="w-3 h-3 text-gold-400" />
              <span>Specimen View</span>
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs font-label font-bold tracking-widest uppercase">
                {coin.condition || 'Mint State Specimen'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-label font-medium">
                {coin.year || 'Historic Year'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight mb-2">
              {coin.name}
            </h2>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-sm font-medium">
              <Globe2 className="w-4 h-4 text-gold-400/80" />
              <span>{coin.country || 'Global Sovereignty'}</span>
              {coin.mint_mark && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-gold-300 font-label text-xs uppercase font-bold tracking-wider">
                    Mint: {coin.mint_mark}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body: Curatorial Specs */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Provenance Description */}
          <div>
            <h4 className="text-xs font-label uppercase font-bold tracking-widest text-gold-400 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Historical Provenance & Archive Dossier</span>
            </h4>
            <p className="text-zinc-300 text-sm leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-4">
              {coin.description || 'This rare numismatic treasure is preserved in the sovereign digital archive, catalogued with historical census metrics and authenticated provenance.'}
            </p>
          </div>

          {/* Numismatic Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="block text-[10px] font-label uppercase tracking-widest text-zinc-500 font-bold">Country</span>
              <span className="text-sm font-bold text-white mt-0.5 block truncate">{coin.country || 'Universal'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="block text-[10px] font-label uppercase tracking-widest text-zinc-500 font-bold">Mintage Year</span>
              <span className="text-sm font-bold text-gold-300 font-label mt-0.5 block">{coin.year || 'N/A'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="block text-[10px] font-label uppercase tracking-widest text-zinc-500 font-bold">Mint Mark</span>
              <span className="text-sm font-bold text-white font-label mt-0.5 block">{coin.mint_mark || 'None (Philadelphia)'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="block text-[10px] font-label uppercase tracking-widest text-zinc-500 font-bold">Grading Status</span>
              <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{coin.condition || 'Mint State'}</span>
            </div>
          </div>

          {/* Trust Authentication Strip */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-400/5 border border-gold-400/20 text-xs text-gold-200">
            <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-white block">Sovereign Numismatic Ledger Authenticated</span>
              <span className="text-zinc-400 text-[11px]">Census verification recorded under archival identification: {coin.id}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:px-8 border-t border-white/5 bg-[#090b13] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-500 font-label">
            NumisVault Archival Record • {coin.year || 'Heritage'}
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs border border-white/10 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigateDetails(coin);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-bold text-xs shadow-lg shadow-gold-500/20 active:scale-95 transition-all"
            >
              <span>View Full Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
