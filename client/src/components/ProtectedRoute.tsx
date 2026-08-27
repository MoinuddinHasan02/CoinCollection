import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { insforge } from '../lib/insforge';

interface Props {
  children: React.ReactNode;
  /** If true, also requires profile.role === 'admin' */
  requireAdmin?: boolean;
}

/**
 * Guards a route behind authentication (and optionally admin role).
 *
 * - Unauthenticated  → redirect to /login
 * - Authenticated + non-admin (when requireAdmin=true) → redirect to /dashboard
 * - Loading state → shows nothing (avoids flash)
 */
export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'unauth' | 'forbidden'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: authData } = await insforge.auth.getCurrentUser();

      if (cancelled) return;

      if (!authData?.user) {
        setStatus('unauth');
        return;
      }

      if (!requireAdmin) {
        setStatus('allowed');
        return;
      }

      // Check admin role via direct DB query to avoid SDK caching/timing issues
      const profileRes = await insforge.database
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
        
      if (cancelled) return;

      console.log('ProtectedRoute DB profileRes:', profileRes);

      const role = profileRes.data?.role;
      
      console.log('ProtectedRoute derived role:', role);
      
      setStatus(role === 'admin' ? 'allowed' : 'forbidden');
    }

    check();
    return () => { cancelled = true; };
  }, [requireAdmin]);

  if (status === 'loading') return null; // avoid flash-of-wrong-content
  if (status === 'unauth')    return <Navigate to="/login"     replace />;
  if (status === 'forbidden') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
