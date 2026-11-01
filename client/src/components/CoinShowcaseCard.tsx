import React, { useRef, useCallback } from 'react';
import { gsap } from '../lib/gsapConfig';
import { 
  Coins, 
  Globe2, 
  Calendar, 
  Trash2, 
  Eye, 
  Award
} from 'lucide-react';

export interface CoinData {
  id: string;
  name: string;
  description?: string;
  country?: string;
  year?: string;
  mint_mark?: string;
  condition?: string;
  image_url?: string;
  created_at?: string;
  estimated_value?: string;
}

interface CoinShowcaseCardProps {
  coin: CoinData;
  isAdmin?: boolean;
  onSelect?: (coin: CoinData) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
}

/**
 * Returns curated styling for numismatic grading tiers.
 */
function getConditionTier(condition?: string) {
  const c = (condition || '').toUpperCase();
  if (c.includes('MS') || c.includes('MINT') || c.includes('UNCIRCULATED')) {
    return {
      label: condition || 'Mint State',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
    };
  }
  if (c.includes('PR') || c.includes('PROOF') || c.includes('PF')) {
    return {
      label: condition || 'Proof Strike',
      badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
      dotClass: 'bg-sky-400',
    };
  }
  if (c.includes('AU') || c.includes('ABOUT')) {
    return {
      label: condition || 'About Uncirculated',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    label: condition || 'Circulated Specimen',
    badgeClass: 'bg-zinc-900/80 text-zinc-300 border-zinc-700/40',
    dotClass: 'bg-zinc-400',
  };
}

export const CoinShowcaseCard: React.FC<CoinShowcaseCardProps> = ({
  coin,
  isAdmin = false,
  onSelect,
  onDelete,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const tier = getConditionTier(coin.condition);

  // ── 3D Specular Tilt on Cursor Hover ──────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Subtle, weighted tilt (max ±6.5deg)
    const rx = ((y - cy) / cy) * -6.5;
    const ry = ((x - cx) / cx) * 6.5;

    gsap.to(card, {
      rotationX: rx,
      rotationY: ry,
      transformPerspective: 950,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    // Dynamic specular reflection tracking cursor
    if (shineRef.current) {
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      shineRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(212,175,55,0.16) 0%, rgba(255,255,255,0.03) 30%, transparent 65%)`;
      gsap.to(shineRef.current, { opacity: 1, duration: 0.25, overwrite: 'auto' });
    }

    // Parallax floating depth for specimen coin image
    if (imageRef.current) {
      const moveX = ((x - cx) / cx) * 8;
      const moveY = ((y - cy) / cy) * 8;
      gsap.to(imageRef.current, {
        x: moveX,
        y: moveY,
        scale: 1.08,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      duration: 0.75,
      ease: 'expo.out',
      overwrite: 'auto',
    });

    if (shineRef.current) {
      gsap.to(shineRef.current, { opacity: 0, duration: 0.5, overwrite: 'auto' });
    }

    if (imageRef.current) {
      gsap.to(imageRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect && onSelect(coin)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="coin-card-item group relative cursor-pointer rounded-2xl bg-[#0f121d]/90 backdrop-blur-xl border border-white/10 hover:border-gold-400/40 transition-colors duration-300 flex flex-col overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-gold-500/10"
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Dynamic Specular Sheen Layer */}
      <div
        ref={shineRef}
        className="pointer-events-none absolute inset-0 z-30 opacity-0 transition-opacity duration-300"
      />

      {/* ── Specimen Display Chamber ──────────────────────────────────── */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-[#181d2c]/60 via-[#111522] to-[#0c0e17] p-6 flex items-center justify-center overflow-hidden border-b border-white/5">
        {/* Subtle radial ambient spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Specimen Portrait */}
        {coin.image_url ? (
          <img
            ref={imageRef}
            src={coin.image_url}
            alt={coin.name}
            className="w-full h-full object-contain filter drop-shadow-[0_16px_25px_rgba(0,0,0,0.8)] z-10 select-none transition-transform will-change-transform"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold-400/20 via-gold-500/10 to-transparent border border-gold-400/30 flex items-center justify-center shadow-inner relative z-10 group-hover:scale-105 transition-transform duration-500">
            <Coins className="w-12 h-12 text-gold-400 drop-shadow" />
            <div className="absolute inset-0 rounded-full border border-gold-300/20 animate-pulse pointer-events-none" />
          </div>
        )}

        {/* Year Pill (Top Right) */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-label font-semibold tracking-wider text-gold-200 shadow-sm">
          <Calendar className="w-3 h-3 text-gold-400" />
          <span>{coin.year || 'N/D'}</span>
        </div>

        {/* Mint Mark Badge (if present) */}
        {coin.mint_mark && (
          <div className="absolute bottom-3 right-3.5 z-20 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-gold-400/20 text-[10px] font-label font-bold tracking-widest text-gold-300 uppercase">
            Mint: {coin.mint_mark}
          </div>
        )}

        {/* Curator Admin Delete Action */}
        {isAdmin && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e, coin.id);
            }}
            className="absolute top-3.5 left-3.5 z-40 w-8 h-8 rounded-full bg-red-950/70 hover:bg-red-900 border border-red-500/30 text-red-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-md active:scale-95"
            title="Remove Specimen from Vault"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Metadata Dossier ──────────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col justify-between relative z-20 bg-[#0f121d]/90">
        <div>
          {/* Header Row: Country + Grading Status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium truncate">
              <Globe2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{coin.country || 'Global Sovereignty'}</span>
            </div>

            {/* Condition Tier Pill */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-label font-bold tracking-wider shrink-0 ${tier.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tier.dotClass}`} />
              <span className="truncate max-w-[110px]">{tier.label}</span>
            </div>
          </div>

          {/* Master Coin Title */}
          <h3 className="font-display font-bold text-lg text-white leading-snug group-hover:text-gold-300 transition-colors duration-200 line-clamp-1 mb-2">
            {coin.name}
          </h3>

          {/* Curatorial Provenance Snippet */}
          <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
            {coin.description || 'Museum archive specimen catalogued in NumisVault sovereign ledger.'}
          </p>
        </div>

        {/* ── Card Footer Action Bar ───────────────────────────────────── */}
        <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[11px] font-label text-gold-400/90 font-medium">
            <Award className="w-3.5 h-3.5 text-gold-400" />
            <span>Vault Certified</span>
          </div>

          <div className="flex items-center gap-1 text-gold-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all font-label text-[11px] font-bold uppercase tracking-wider">
            <span>Inspect</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
