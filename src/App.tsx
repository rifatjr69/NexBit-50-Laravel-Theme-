import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { initMockStorage } from './services/dataService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AdminGuard } from './components/AdminGuard';
import { HomePage } from './pages/HomePage';
import { ThemeDetailPage } from './pages/ThemeDetailPage';
import { PaymentPage } from './pages/PaymentPage';
import { LoginPage } from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

// Code splitting: Lazy load AdminDashboard for superior user-side page load speed
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

// Smooth scroll to top helper on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll if not restoring back button position
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}

// Layout wrapper for standard public pages with proper responsive padding
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F6F7FB] text-[#12141C] antialiased">
      <Navbar />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Sleek loading screen for lazy loaded pages
function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="w-8 h-8 text-[#E8473F] animate-spin" />
      <p className="text-xs font-semibold text-[#7A819A]">লোড হচ্ছে...</p>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initMockStorage();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes with 1200px container, Navbar & Footer */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <HomePage />
                  </PublicLayout>
                }
              />
              <Route
                path="/theme/:id"
                element={
                  <PublicLayout>
                    <ThemeDetailPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/payment"
                element={
                  <PublicLayout>
                    <PaymentPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicLayout>
                    <LoginPage />
                  </PublicLayout>
                }
              />

              {/* Admin Dashboard: Strictly Protected by AdminGuard & Lazy Loaded */}
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <Suspense fallback={<PageLoadingFallback />}>
                      <AdminDashboard />
                    </Suspense>
                  </AdminGuard>
                }
              />

              {/* Catch-all fallback */}
              <Route
                path="*"
                element={
                  <PublicLayout>
                    <HomePage />
                  </PublicLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
