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
        // Back button + logo stagger in from top
        .from('.addcoin-header-item', {
          y: -22,
          opacity: 0,
          duration: 0.7,
          stagger: 0.09,
        })
        // Upload zone scales from slightly smaller + opacity
        .from('.img-upload-zone', {
          scale: 0.96,
          opacity: 0,
          duration: 0.85,
        }, '-=0.3')
        // Camera / Browse buttons stagger
        .from('.upload-btn', {
          y: 14,
          opacity: 0,
          duration: 0.55,
          stagger: 0.1,
        }, '-=0.45')
        // Form fields cascade — each with slightly different timing
        .from('.form-field-item', {
          y: 24,
          opacity: 0,
          duration: 0.65,
          stagger: { each: 0.10, ease: 'power2.out' },
        }, '-=0.35')
        // Submit button appears last
        .from(submitBtnRef.current, {
          y: 18,
          opacity: 0,
          duration: 0.7,
        }, '-=0.15');
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // ── Magnetic submit ───────────────────────────────────────────────
  const handleMagneticMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.28;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.28;
    gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  }, []);

  const handleMagneticLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.75, ease: 'expo.out', overwrite: 'auto' });
  }, []);

  // ── Form submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('Coin name is required.', 'error'); return; }
    if (!file)        { toast('A coin image is required.', 'error'); return; }

    // Security check: File size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast('File is too large. Maximum size is 5MB.', 'error');
      return;
    }

    // Security check: File type (only images, no SVGs)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.', 'error');
      return;
    }

    setLoading(true);
    try {
      const fileExt  = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `coins/${fileName}`;

      const { error: uploadError } = await insforge.storage
        .from('coin_images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const publicUrl = insforge.storage.from('coin_images').getPublicUrl(filePath);

      const { error: dbError } = await insforge.database.from('coins').insert([{
        name:       name.trim().slice(0, 200),
        year:       year.trim().slice(0, 10),
        country:    country.trim().slice(0, 100),
        mint_mark:  mintMark.trim().slice(0, 20),
        condition,
        description: description.trim().slice(0, 2000),
        image_url:   publicUrl,
      }]);
      if (dbError) throw dbError;

      navigateTo('/dashboard');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast('Error adding coin: ' + msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="bg-mesh-gradient font-body text-on-background min-h-screen flex flex-col pb-28"
    >
      {/* Toast notification container */}
      {toastContainer}
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-surface/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo('/dashboard')}
            className="addcoin-header-item p-2 rounded-full hover:bg-surface-variant/80 transition-colors active:scale-95 duration-150 text-gold-700 bg-surface-variant/40"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="addcoin-header-item w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/30 ml-2">
            <span className="material-symbols-outlined text-white text-xl">add_circle</span>
          </div>
          <h1 className="addcoin-header-item text-2xl font-display font-black tracking-tight text-on-surface">
            Add New Coin
          </h1>
        </div>

        {/* Avatar — icon only; no external URL dependency */}
        <div className="addcoin-header-item w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border-2 border-gold-400/50 shadow-md">
          <span className="material-symbols-outlined text-gold-600">manage_accounts</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="pt-28 px-6 max-w-2xl mx-auto w-full">
        <div className="bg-surface/80 backdrop-blur-3xl p-8 md:p-10 rounded-[2rem] shadow-2xl border border-white/40 relative z-10">

          {/* Image upload zone */}
          <section className="space-y-6 mb-8">
            <div
              className="img-upload-zone relative aspect-video w-full rounded-2xl bg-surface-container-lowest border-2 border-dashed border-gold-300 flex flex-col items-center justify-center overflow-hidden group hover:border-gold-500 hover:bg-gold-50/50 transition-all cursor-pointer"
              onClick={e => { e.preventDefault(); fileInputRef.current?.click(); }}
            >
              {preview ? (
                <img src={preview} className="w-full h-full object-contain filter drop-shadow-xl p-4" alt="Coin preview" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gold-600">
                  <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                  </div>
                  <p className="font-label font-bold text-sm tracking-widest uppercase">Upload Coin Image</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="file" accept="image/*" capture="environment" hidden ref={cameraInputRef} onChange={handleFileChange} />
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />

              <button
                onClick={e => { e.preventDefault(); cameraInputRef.current?.click(); }}
                className="upload-btn flex items-center justify-center gap-2 py-4 px-4 bg-surface rounded-xl border border-outline-variant/30 hover:border-gold-400 hover:text-gold-700 transition-colors active:scale-95 font-bold text-on-surface-variant shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                Take Photo
              </button>
              <button
                onClick={e => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="upload-btn flex items-center justify-center gap-2 py-4 px-4 bg-surface rounded-xl border border-outline-variant/30 hover:border-gold-400 hover:text-gold-700 transition-colors active:scale-95 font-bold text-on-surface-variant shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">folder_open</span>
                Browse Files
              </button>
            </div>
          </section>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* Coin Name */}
            <div className="form-field-item relative floating-label-input group">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={200}
                className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-gold-500 transition-colors text-on-surface text-lg outline-none font-medium"
                id="name"
                placeholder=" "
                type="text"
              />
              <label className="absolute left-0 top-3 text-outline font-label transition-all pointer-events-none duration-200 uppercase tracking-widest text-xs font-bold" htmlFor="name">
                Coin Name
              </label>
            </div>

            {/* Year + Mint Mark */}
            <div className="grid grid-cols-2 gap-6">
              <div className="form-field-item relative floating-label-input group">
                <input
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  maxLength={10}
                  className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-gold-500 transition-colors text-on-surface text-lg outline-none font-medium"
                  id="year"
                  placeholder=" "
                  type="text"
                />
                <label className="absolute left-0 top-3 text-outline font-label transition-all pointer-events-none duration-200 uppercase tracking-widest text-xs font-bold" htmlFor="year">
                  Year
                </label>
              </div>
              <div className="form-field-item relative floating-label-input group">
                <input
                  value={mintMark}
                  onChange={e => setMintMark(e.target.value)}
                  maxLength={20}
                  className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-gold-500 transition-colors text-on-surface text-lg outline-none font-medium"
                  id="mintMark"
                  placeholder=" "
                  type="text"
                />
                <label className="absolute left-0 top-3 text-outline font-label transition-all pointer-events-none duration-200 uppercase tracking-widest text-xs font-bold" htmlFor="mintMark">
                  Mint Mark
                </label>
              </div>
            </div>

            {/* Country */}
            <div className="form-field-item relative floating-label-input group">
              <input
                value={country}
                onChange={e => setCountry(e.target.value)}
                maxLength={100}
                className="block w-full px-0 py-3 bg-transparent border-0 border-b-2 border-outline-variant focus:ring-0 focus:border-gold-500 transition-colors text-on-surface text-lg outline-none font-medium"
                id="country"
                placeholder=" "
                type="text"
              />
              <label className="absolute left-0 top-3 text-outline font-label transition-all pointer-events-none duration-200 uppercase tracking-widest text-xs font-bold" htmlFor="country">
                Country
              </label>
            </div>

            {/* Condition */}
            <div className="form-field-item space-y-1.5 pt-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-gold-600 font-bold">
                Condition Grade
              </label>
              <div className="relative">
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full appearance-none bg-surface border border-outline-variant/30 rounded-xl px-4 py-4 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all text-on-surface font-medium shadow-sm"
                >
                  <option disabled value="">Select formal grade...</option>
                  <option value="BU">BU (Brilliant Uncirculated)</option>
                  <option value="MS-70">MS-70 (Perfect Mint State)</option>
                  <option value="MS-65">MS-65 (Choice Mint State)</option>
                  <option value="AU-58">AU-58 (Choice About Uncirculated)</option>
                  <option value="XF-40">XF-40 (Extremely Fine)</option>
                  <option value="VF-20">VF-20 (Very Fine)</option>
                  <option value="F-12">F-12 (Fine)</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-600">
                  expand_more
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="form-field-item space-y-1.5 pt-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-gold-600 font-bold">
                Historical Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2000}
                className="w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-4 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all resize-none shadow-sm font-medium text-on-surface"
                placeholder="Mention historical context, luster, or visible flaws..."
                rows={4}
              />
            </div>

            {/* Submit */}
            <button
              ref={submitBtnRef}
              disabled={loading}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="magnetic-btn w-full mt-8 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-gold-500/30 transition-colors duration-300 active:scale-[0.98] flex items-center justify-center gap-3"
              type="submit"
            >
              <span className="font-label tracking-widest uppercase text-sm">
                {loading ? 'Processing...' : 'Add to Collection'}
              </span>
              <span className="material-symbols-outlined text-xl">
                {loading ? 'sync' : 'add_circle'}
              </span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
