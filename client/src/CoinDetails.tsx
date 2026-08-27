

export function CoinDetails() {
  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col">
      

<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 premium-blur bg-transparent">
<button className="p-2 rounded-full hover:bg-black/10 transition-colors flex items-center justify-center" onClick={() => history.back()}>
<span className="material-symbols-outlined text-on-surface">arrow_back</span>
</button>
<div className="flex gap-2">
<button className="p-2 rounded-full hover:bg-black/10 transition-colors flex items-center justify-center">
<span className="material-symbols-outlined text-on-surface">share</span>
</button>
</div>
</header>

<section className="relative h-[397px] w-full flex items-center justify-center overflow-hidden bg-[#12110d]">
<div className="absolute inset-0 opacity-40 bg-gradient-to-br from-gold-900 to-black"></div>
<div className="relative z-10 p-8 flex justify-center w-full">
<div className="w-64 h-64 rounded-full bg-gold-100 border-4 border-gold-200 flex items-center justify-center shadow-inner coin-glow">
  <span className="material-symbols-outlined text-8xl text-gold-400">monetization_on</span>
</div>
</div>

<div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent"></div>
</section>

<main className="relative z-20 px-6 -mt-10">
<div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl border border-outline-variant/20">
<div className="flex flex-col gap-1">
<h1 className="font-headline font-black text-2xl tracking-tight text-on-surface">1907 Saint-Gaudens Double Eagle</h1>
<p className="font-label text-sm text-secondary uppercase tracking-widest font-bold">High Relief, Flat Rim</p>
</div>
<div className="mt-6 flex items-baseline gap-2">
<span className="text-3xl font-black text-primary">$2,850,000</span>
<span className="text-sm font-label text-outline uppercase">Est. Value</span>
</div>

<div className="mt-8">
<h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Historical Significance</h2>
<p className="text-on-surface-variant leading-relaxed text-sm">
                    A masterpiece of American numismatics, the Saint-Gaudens Double Eagle was born from President Theodore Roosevelt's desire to beautify American coinage. Designed by the legendary sculptor Augustus Saint-Gaudens, this High Relief variant represents the pinnacle of his artistic vision before his passing. The intricate detail and depth of the strike required multiple presses, making it a rare engineering marvel of its era.
                </p>
</div>

<div className="mt-8">
<h2 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Specifications</h2>
<div className="grid grid-cols-2 gap-4">
<div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1 border border-outline-variant/10">
<span className="text-[10px] uppercase tracking-tighter text-outline font-bold">Country</span>
<span className="text-sm font-bold text-on-surface">United States</span>
</div>
<div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1 border border-outline-variant/10">
<span className="text-[10px] uppercase tracking-tighter text-outline font-bold">Year</span>
<span className="text-sm font-bold text-on-surface">1907</span>
</div>
<div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1 border border-outline-variant/10">
<span className="text-[10px] uppercase tracking-tighter text-outline font-bold">Mint Mark</span>
<span className="text-sm font-bold text-on-surface">None (Philadelphia)</span>
</div>
<div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1 border border-outline-variant/10">
<span className="text-[10px] uppercase tracking-tighter text-outline font-bold">Condition</span>
<div className="flex items-center gap-1.5">
<span className="text-sm font-bold text-on-surface">MS-67</span>
<span className="px-1.5 py-0.5 bg-primary-container/20 text-primary text-[10px] font-black rounded uppercase">Mint State</span>
</div>
</div>
<div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1 border border-outline-variant/10">
<span className="text-[10px] uppercase tracking-tighter text-outline font-bold">Composition</span>
<span className="text-sm font-bold text-on-surface">90% Gold, 10% Copper</span>
</div>
<div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1 border border-outline-variant/10">
<span className="text-[10px] uppercase tracking-tighter text-outline font-bold">Weight</span>
<span className="text-sm font-bold text-on-surface">33.43g</span>
</div>
</div>
</div>

<div className="mt-8 grid grid-cols-2 gap-3">
<button className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-primary-container text-primary font-bold rounded-xl active:scale-95 transition-all text-sm">
<span className="material-symbols-outlined text-sm">edit_note</span>
                    Add Note
                </button>
<button className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-all text-sm shadow-md">
<span className="material-symbols-outlined text-sm">trending_up</span>
                    Update Valuation
                </button>
</div>
</div>

<div className="mt-6 grid grid-cols-1 gap-4">
<div className="bg-secondary-container/30 p-5 rounded-xl flex items-center gap-4">
<div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-inner">
<span className="material-symbols-outlined">verified</span>
</div>
<div>
<h4 className="font-bold text-on-surface">PCGS Authenticated</h4>
<p className="text-xs text-on-surface-variant opacity-80">Certification #81723491</p>
</div>
</div>
</div>
</main>




    </div>
  );
}
