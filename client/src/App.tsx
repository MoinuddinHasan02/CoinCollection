import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './lib/gsapConfig';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { AddCoin } from './AddCoin';
import { CoinDetails } from './CoinDetails';
import { CursorGlow } from './components/CursorGlow';
import { ScrollProgress } from './components/ScrollProgress';
import { TransitionProvider } from './contexts/TransitionContext';
import { ProtectedRoute } from './components/ProtectedRoute';

/**
 * Inner component — must be inside <Router> so TransitionProvider
 * can use useNavigate / useLocation.
 */
function AppContent() {
  // ── Lenis smooth scroll ──────────────────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Keep ScrollTrigger in sync with Lenis's virtual scroll position
    lenis.on('scroll', () => ScrollTrigger.update());

    // Use GSAP's ticker as the RAF source (single loop, no double RAF)
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <TransitionProvider>
      {/* Global ambient cursor spotlight */}
      <CursorGlow />
      {/* Scroll progress bar pinned at z:10000, above everything */}
      <ScrollProgress />

      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/*
          /add requires an authenticated admin session.
          - Unauthenticated visitors  → redirected to /login
          - Authenticated non-admins  → redirected to /dashboard
        */}
        <Route
          path="/add"
          element={
            <ProtectedRoute requireAdmin>
              <AddCoin />
            </ProtectedRoute>
          }
        />
        <Route path="/details"   element={<CoinDetails />} />
      </Routes>
    </TransitionProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
