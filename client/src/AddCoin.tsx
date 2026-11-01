import React, {
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import { insforge } from './lib/insforge';
import { gsap } from './lib/gsapConfig';
import { usePageTransition } from './contexts/TransitionContext';
import { useToast } from './components/Toast';
import { 
  ArrowLeft, 
  PlusCircle, 
  UploadCloud, 
  Camera, 
  FolderOpen, 
  ShieldCheck, 
  Coins, 
  ChevronDown
} from 'lucide-react';

// ─ Security constants ─────────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function AddCoin() {
  const [name,        setName]        = useState('');
  const [year,        setYear]        = useState('');
  const [country,     setCountry]     = useState('');
  const [mintMark,    setMintMark]    = useState('');
  const [condition,   setCondition]   = useState('');
  const [description, setDescription] = useState('');
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  const { navigateTo } = usePageTransition();
  const { toast, container: toastContainer } = useToast();

  // ── Refs ─────────────────────────────────────────────────────────
  const rootRef       = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef  = useRef<HTMLButtonElement>(null);

  // ── File selection (with type + size validation) ───────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_MIME_TYPES.has(selected.type)) {
      toast('Only JPEG, PNG, WebP, or GIF images are accepted.', 'error');
      e.target.value = '';
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast(`Image must be under ${MAX_FILE_SIZE_MB} MB. This file is ${(selected.size / 1024 / 1024).toFixed(1)} MB.`, 'error');
      e.target.value = '';
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  // ── Editorial entrance timeline ───────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl
        .from('.addcoin-header-item', {
          y: -22,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
        })
        .from('.img-upload-zone', {
          scale: 0.96,
          opacity: 0,
          duration: 0.85,
        }, '-=0.3')
        .from('.upload-btn', {
          y: 14,
          opacity: 0,
          duration: 0.55,
          stagger: 0.09,
        }, '-=0.4')
        .from('.form-field-item', {
          y: 20,
          opacity: 0,
          duration: 0.65,
          stagger: 0.07,
        }, '-=0.35')
        .from(submitBtnRef.current, {
          y: 18,
          opacity: 0,
          duration: 0.7,
        }, '-=0.2');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── Magnetic Button ───────────────────────────────────────────────
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
    gsap.to(btn, { x, y, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
  }, []);

  // ── Form submission ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast('Specimen name is required.', 'error');
      return;
    }

    if (!file) {
      toast('Please upload or capture a specimen portrait photograph.', 'error');
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      toast('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.', 'error');
      return;
    }

    setLoading(true);
    try {
      const fileExt  = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `coins/${fileName}`;

      const uploadRes = await insforge.storage
        .from('coin_images')
        .upload(filePath, file);
      if (uploadRes?.error) throw uploadRes.error;

      const publicUrl = insforge.storage.from('coin_images').getPublicUrl(filePath);

      const dbRes = await insforge.database.from('coins').insert([{
        name:        name.trim().slice(0, 200),
        year:        year.trim().slice(0, 10),
        country:     country.trim().slice(0, 100),
        mint_mark:   mintMark.trim().slice(0, 20),
        condition:   condition || 'Uncertified',
        description: description.trim().slice(0, 2000),
        image_url:   publicUrl,
      }]);
      if (dbRes?.error) throw dbRes.error;

      toast('Specimen catalogued in NumisVault ledger!', 'success');
      setTimeout(() => navigateTo('/dashboard'), 500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast('Error cataloguing specimen: ' + msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="bg-mesh-gradient font-body text-zinc-100 min-h-screen flex flex-col pb-28 selection:bg-gold-500/30 selection:text-gold-200"
    >
      {toastContainer}

      {/* ── Fixed Blur Navigation Header ── */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-6 sm:px-8 h-20 bg-[#08090d]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo('/dashboard')}
            className="addcoin-header-item p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gold-400 transition-colors active:scale-95"
            title="Return to Vault"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="addcoin-header-item w-10 h-10 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20 text-black">
            <Coins className="w-5 h-5" />
          </div>
          <h1 className="addcoin-header-item text-xl sm:text-2xl font-display font-bold tracking-tight text-white">
            Catalog New Specimen
          </h1>
        </div>

        <div className="addcoin-header-item hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 font-label text-xs uppercase font-bold tracking-widest">
          <ShieldCheck className="w-4 h-4 text-gold-400" />
          <span>Curator Console</span>
        </div>
      </header>

      {/* ── Main Form Container ── */}
      <main className="pt-28 px-4 sm:px-6 max-w-2xl mx-auto w-full">
        <div className="bg-[#0f121d]/90 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/10 relative z-10">
          
          {/* Section Header */}
          <div className="mb-8 pb-6 border-b border-white/5">
            <h2 className="font-display font-bold text-2xl text-white">Archival Acquisition Entry</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Record physical attribution, census parameters, and upload high-resolution obverse portrait.
            </p>
          </div>

          {/* Image Upload Zone */}
          <section className="space-y-4 mb-8">
            <div
              className="img-upload-zone relative aspect-video w-full rounded-2xl bg-[#090b13] border-2 border-dashed border-gold-400/30 hover:border-gold-400/70 flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer shadow-inner"
              onClick={e => { e.preventDefault(); fileInputRef.current?.click(); }}
            >
              {preview ? (
                <img src={preview} className="w-full h-full object-contain filter drop-shadow-2xl p-4" alt="Specimen preview" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-zinc-400 group-hover:text-gold-300 transition-colors p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-label font-bold text-sm tracking-widest uppercase text-white">
                      Upload Specimen Portrait
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">JPEG, PNG, WebP up to 5MB</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="file" accept="image/*" capture="environment" hidden ref={cameraInputRef} onChange={handleFileChange} />
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />

              <button
                type="button"
                onClick={e => { e.preventDefault(); cameraInputRef.current?.click(); }}
                className="upload-btn flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-all active:scale-95 text-xs font-label font-bold uppercase tracking-wider"
              >
                <Camera className="w-4 h-4 text-gold-400" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={e => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="upload-btn flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-zinc-300 hover:text-white transition-all active:scale-95 text-xs font-label font-bold uppercase tracking-wider"
              >
                <FolderOpen className="w-4 h-4 text-gold-400" />
                <span>Browse Files</span>
              </button>
            </div>
          </section>

          {/* Acquisition Attributes Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Specimen Name */}
            <div className="form-field-item space-y-1.5">
              <label className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block" htmlFor="name">
                Specimen Title / Denomination *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={200}
                className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition-all text-sm font-medium shadow-inner"
                id="name"
                placeholder="e.g. 1907 Saint-Gaudens Double Eagle"
                type="text"
              />
            </div>

            {/* Year + Mint Mark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field-item space-y-1.5">
                <label className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block" htmlFor="year">
                  Mintage Year
                </label>
                <input
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  maxLength={10}
                  className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white font-label placeholder-zinc-600 outline-none transition-all text-sm shadow-inner"
                  id="year"
                  placeholder="e.g. 1907"
                  type="text"
                />
              </div>

              <div className="form-field-item space-y-1.5">
                <label className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block" htmlFor="mintMark">
                  Mint Mark / Strike
                </label>
                <input
                  value={mintMark}
                  onChange={e => setMintMark(e.target.value)}
                  maxLength={20}
                  className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white font-label placeholder-zinc-600 outline-none transition-all text-sm shadow-inner"
                  id="mintMark"
                  placeholder="e.g. S, D, CC, None (Phila)"
                  type="text"
                />
              </div>
            </div>

            {/* Sovereign Origin / Country */}
            <div className="form-field-item space-y-1.5">
              <label className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block" htmlFor="country">
                Sovereign Origin / Empire
              </label>
              <input
                value={country}
                onChange={e => setCountry(e.target.value)}
                maxLength={100}
                className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition-all text-sm shadow-inner"
                id="country"
                placeholder="e.g. United States, Roman Empire, Great Britain"
                type="text"
              />
            </div>

            {/* Condition Tier */}
            <div className="form-field-item space-y-1.5">
              <label className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block">
                Condition Classification / Grade
              </label>
              <div className="relative">
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full appearance-none bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white outline-none transition-all text-sm font-label shadow-inner cursor-pointer"
                >
                  <option disabled value="">Select certified grade tier...</option>
                  <option value="MS-70 Ultra Cameo">MS-70 (Perfect Mint State)</option>
                  <option value="MS-65 High Relief">MS-65 (Choice Mint State)</option>
                  <option value="MS-63 Mint State">MS-63 (Choice Uncirculated)</option>
                  <option value="Proof PR-68">Proof PR-68 (Deep Mirror Strike)</option>
                  <option value="AU-58 Choice AU">AU-58 (Choice About Uncirculated)</option>
                  <option value="XF-45 Extremely Fine">XF-45 (Extremely Fine)</option>
                  <option value="VF-30 Very Fine">VF-30 (Very Fine)</option>
                  <option value="Uncertified Rare Specimen">Uncertified Rare Specimen</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gold-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Provenance & Historical Description */}
            <div className="form-field-item space-y-1.5">
              <label className="text-[11px] font-label uppercase tracking-widest text-gold-400 font-bold block">
                Historical Significance & Provenance
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2000}
                className="w-full bg-[#090b13] border border-white/10 focus:border-gold-400/60 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition-all text-sm resize-none shadow-inner leading-relaxed"
                placeholder="Mention die variety, strike sharpness, historical context, or certificate census details..."
                rows={4}
              />
            </div>

            {/* Submit Action */}
            <button
              ref={submitBtnRef}
              disabled={loading}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="magnetic-btn w-full mt-4 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-300 text-black font-bold py-4 px-6 rounded-xl shadow-xl shadow-gold-500/25 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 text-xs font-label uppercase tracking-widest disabled:opacity-50"
              type="submit"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Recording in Ledger...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Commit Specimen to Vault</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
