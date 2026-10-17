import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Menu, X, LayoutDashboard, LogOut, ChevronRight, User } from 'lucide-react';

interface NavbarProps {
  onOpenAuth?: (initialMode?: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';

  // Shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (!isHome) {
      navigate('/#' + sectionId);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getFirstLetter = (name?: string) => {
    if (!name) return 'ইউ';
    return name.trim().charAt(0);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-[#F6F7FB]/95 backdrop-blur-md border-b border-[#E4E7F0] transition-shadow duration-200 ${
          scrolled ? 'shadow-[0_4px_16px_rgba(18,20,28,0.06)]' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12141C] rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-[8px] bg-[#12141C] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <span className="text-xl font-bold text-[#12141C] tracking-tight group-hover:text-[#E8473F] transition-colors">
              {settings.brand_name || 'Nexbit Live'}
            </span>
          </Link>

          {/* Desktop Navigation Links (>= md) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A5068]">
            <button
              onClick={() => scrollToSection('themes-section')}
              className="hover:text-[#12141C] transition-colors cursor-pointer py-2 focus:outline-none focus-visible:underline"
            >
              থিম সমূহ
            </button>
            <button
              onClick={() => scrollToSection('video-setup-section')}
              className="hover:text-[#12141C] transition-colors cursor-pointer py-2 focus:outline-none focus-visible:underline"
            >
              কীভাবে সেটআপ করবেন
            </button>
            <button
              onClick={() => scrollToSection('pricing-section')}
              className="hover:text-[#12141C] transition-colors cursor-pointer py-2 focus:outline-none focus-visible:underline"
            >
              দাম
            </button>
          </nav>

          {/* Desktop Right Action Zone (>= md) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#12141C] bg-white border border-[#E4E7F0] rounded-[10px] hover:border-[#12141C] transition-colors min-h-[44px]"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#E8473F]" />
                    <span>ড্যাশবোর্ড</span>
                  </Link>
                )}

                {/* User Avatar & Name */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E4E7F0] rounded-[10px] min-h-[44px]">
                  <div className="w-6 h-6 rounded-full bg-[#FDE9E7] text-[#E8473F] font-semibold text-xs flex items-center justify-center">
                    {getFirstLetter(user.full_name)}
                  </div>
                  <span className="text-sm font-medium text-[#12141C] max-w-[120px] truncate">
                    {user.full_name || 'ইউজারের নাম'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 text-xs font-semibold text-[#4A5068] bg-white border border-[#E4E7F0] rounded-[10px] hover:text-[#E8473F] hover:border-[#E8473F] transition-colors cursor-pointer min-h-[44px]"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login?mode=login"
                  className="px-5 py-2 text-xs font-semibold text-[#12141C] bg-white border border-[#E4E7F0] rounded-[10px] hover:border-[#12141C] transition-colors min-h-[44px] flex items-center justify-center"
                >
                  লগইন
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#12141C] rounded-[10px] hover:bg-[#252835] transition-colors min-h-[44px] flex items-center justify-center shadow-sm"
                >
                  সাইন আপ
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button (< md, min 48x48px touch target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-12 h-12 flex items-center justify-center rounded-[12px] text-[#12141C] hover:bg-slate-200/80 active:bg-slate-300 transition-colors cursor-pointer"
            aria-label="মেনু খুলুন"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay and Slide-in Panel (< md) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop Blur & Dark Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div
            className="relative w-[85%] max-w-[340px] h-[100dvh] bg-white shadow-2xl flex flex-col justify-between z-10 transition-transform duration-300 ease-out"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <div>
              {/* Drawer Header */}
              <div className="px-5 h-18 border-b border-[#E4E7F0] flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-[7px] bg-[#12141C] flex items-center justify-center text-white font-bold text-base shadow-xs">
                    N
                  </div>
                  <span className="text-lg font-bold text-[#12141C]">
                    {settings.brand_name || 'Nexbit Live'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#12141C] hover:bg-slate-100 cursor-pointer"
                  aria-label="মেনু বন্ধ করুন"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-1">
                <button
                  type="button"
                  onClick={() => scrollToSection('themes-section')}
                  className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] rounded-[10px] text-base font-semibold text-[#12141C] hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <span>থিম সমূহ</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('video-setup-section')}
                  className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] rounded-[10px] text-base font-semibold text-[#12141C] hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <span>কীভাবে সেটআপ করবেন</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('pricing-section')}
                  className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] rounded-[10px] text-base font-semibold text-[#12141C] hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <span>দাম ও প্যাকেজ</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </nav>
            </div>

            {/* Bottom User / Auth Section */}
            <div className="p-4 border-t border-[#E4E7F0] bg-[#F8FAFC] space-y-3">
              {user ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 bg-white border border-[#E4E7F0] rounded-[12px]">
                    <div className="w-10 h-10 rounded-full bg-[#FDE9E7] text-[#E8473F] font-bold text-sm flex items-center justify-center shrink-0">
                      {getFirstLetter(user.full_name)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-[#12141C] truncate">{user.full_name}</p>
                      <p className="text-xs text-[#7A819A] truncate">{user.email}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-[#12141C] text-white rounded-[12px] font-semibold text-sm shadow-xs"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#E8473F]" />
                      <span>অ্যাডমিন ড্যাশবোর্ড</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-white border border-[#E4E7F0] hover:border-[#B8322B] text-[#B8322B] rounded-[12px] font-semibold text-sm transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    to="/login?mode=login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center px-4 py-3.5 min-h-[48px] bg-white border border-[#E4E7F0] hover:border-[#12141C] text-[#12141C] rounded-[12px] font-bold text-sm transition-colors"
                  >
                    লগইন করুন
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center px-4 py-3.5 min-h-[48px] bg-[#E8473F] hover:bg-[#d63b33] text-white rounded-[12px] font-bold text-sm shadow-sm transition-colors"
                  >
                    নতুন একাউন্ট খুলুন
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
