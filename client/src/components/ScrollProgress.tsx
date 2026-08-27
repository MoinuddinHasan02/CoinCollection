import { useEffect, useRef } from 'react';

/**
 * 2 px gold progress line pinned at z-index 10000.
 * Scales on the X axis proportional to window.scrollY.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = barRef.current;
      if (!el) return;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;
      el.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener('scroll', update, { passive: true });
    update(); // init on mount
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background:
          'linear-gradient(90deg, #554616 0%, #D4AF37 40%, #AA8C2C 70%, #554616 100%)',
        transformOrigin: 'left center',
        transform: 'scaleX(0)',
        zIndex: 10000,
        willChange: 'transform',
      }}
    />
  );
}
