import { useEffect, useRef } from 'react';

/**
 * Soft radial spotlight that lazily follows the cursor.
 * Hidden automatically on touch-only devices.
 */
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -2000, y: -2000 });
  const current = useRef({ x: -2000, y: -2000 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Skip on touch-only devices (no hover capability)
    if (window.matchMedia('(hover: none)').matches) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      const el = glowRef.current;
      if (el) {
        // Lerp toward mouse for organic lag
        const lerp = 0.072;
        current.current.x += (mouse.current.x - current.current.x) * lerp;
        current.current.y += (mouse.current.y - current.current.y) * lerp;
        el.style.left = `${current.current.x}px`;
        el.style.top = `${current.current.y}px`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        width: '720px',
        height: '720px',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'translate(-50%, -50%)',
        background:
          'radial-gradient(circle, rgba(212,175,55,0.048) 0%, rgba(212,175,55,0.018) 40%, transparent 70%)',
        willChange: 'left, top',
      }}
    />
  );
}
