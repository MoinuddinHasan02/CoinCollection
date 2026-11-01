/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from '../lib/gsapConfig';

interface TransitionContextType {
  navigateTo: (path: string, options?: { state?: unknown }) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateTo: () => {},
});

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstMount = useRef(true);
  const isAnimating = useRef(false);

  // ── Reveal new page after navigation ──────────────────────────────────────
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Initial load: fade opacity from black
      gsap.fromTo(
        overlay,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.75,
          ease: 'expo.inOut',
          delay: 0.05,
          onComplete: () => {
            overlay.style.pointerEvents = 'none';
            isAnimating.current = false;
          },
        }
      );
    } else {
      // Route changed: wipe from right → scaleX 1→0
      gsap.fromTo(
        overlay,
        { scaleX: 1, transformOrigin: 'right center', opacity: 1 },
        {
          scaleX: 0,
          transformOrigin: 'right center',
          duration: 0.7,
          ease: 'expo.inOut',
          onComplete: () => {
            overlay.style.pointerEvents = 'none';
            isAnimating.current = false;
          },
        }
      );
    }
  }, [location.pathname]);

  // ── Animate out then navigate ─────────────────────────────────────────────
  const navigateTo = useCallback(
    (path: string, options?: { state?: unknown }) => {
      const overlay = overlayRef.current;
      if (!overlay || isAnimating.current || location.pathname === path) return;

      isAnimating.current = true;
      overlay.style.pointerEvents = 'auto';

      gsap.fromTo(
        overlay,
        { scaleX: 0, transformOrigin: 'left center', opacity: 1 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: 0.55,
          ease: 'expo.inOut',
          onComplete: () => navigate(path, options),
        }
      );
    },
    [navigate, location.pathname]
  );

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {/* Dark gold curtain */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background:
            'linear-gradient(135deg, #0d0b05 0%, #1c1600 40%, #0d0b05 100%)',
          willChange: 'transform, opacity',
          pointerEvents: 'none',
        }}
      />
      {children}
    </TransitionContext.Provider>
  );
}

export const usePageTransition = () => useContext(TransitionContext);
