import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [deniedToastShown, setDeniedToastShown] = useState(false);

  useEffect(() => {
    // If user is loaded and logged in, but not an admin
    if (!loading && user && !isAdmin && !deniedToastShown) {
      showToast('এই পেজে আপনার প্রবেশাধিকার নেই।', 'error');
      setDeniedToastShown(true);
    }
  }, [loading, user, isAdmin, deniedToastShown, showToast]);

  // Loading state: Show a clean full-screen loading spinner
  // Absolutely nothing of the admin dashboard is rendered until loading completes
  if (loading) {
    return (
      <div className="min-h-screen bg-[#12141C] flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center animate-pulse mb-4">
          <div className="w-6 h-6 border-2 border-[#E8473F] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-slate-300">অ্যাডমিন অ্যাক্সেস যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Logged in but not role='admin' -> Redirect to home page
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // role === 'admin' -> Show Dashboard
  return <>{children}</>;
};
