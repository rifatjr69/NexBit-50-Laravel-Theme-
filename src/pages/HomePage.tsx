import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Theme } from '../types';
import { fetchThemes } from '../services/dataService';
import { StatsStrip } from '../components/StatsStrip';
import { ThemeCard } from '../components/ThemeCard';
import { VideoSection } from '../components/VideoSection';
import { UnlockBanner } from '../components/UnlockBanner';
import { Lock, Download, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, hasApprovedPayment } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [loading, setLoading] = useState(true);

  // Category pills scroll ref
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch active themes
    fetchThemes(false).then((data) => {
      setThemes(data);
      setLoading(false);
    });
  }, []);

  // Dynamically derive category pills from actual active themes
  const dynamicCategories = ['সব', ...Array.from(new Set(themes.map((t) => t.category).filter(Boolean)))];

  const filteredThemes = selectedCategory === 'সব'
    ? themes
    : themes.filter((t) => t.category === selectedCategory);

  const handleHeroUnlock = () => {
    if (hasApprovedPayment) {
      const el = document.getElementById('themes-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!user) {
      navigate('/login?redirect=/payment');
    } else {
      navigate('/payment');
    }
  };

  const scrollToThemes = () => {
    const el = document.getElementById('themes-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll selected category pill into center view smoothly
  const handleCategorySelect = (cat: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedCategory(cat);
    const target = e.currentTarget;
    if (categoryScrollRef.current && target) {
      const container = categoryScrollRef.current;
      const scrollLeft = target.offsetLeft - container.offsetWidth / 2 + target.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 md:space-y-20 pb-12 sm:pb-16 animate-fade-in-up">
      {/* ------------------------------------------------------------------ */}
      {/* Hero Section                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="pt-6 sm:pt-10 md:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FDE9E7] text-[#E8473F] rounded-full text-xs sm:text-sm font-bold shadow-2xs">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>একবার পেমেন্ট, সব থিম আনলক</span>
            </div>

            {/* Main Headline (Fluid clamp from 30px on small mobile to 52px on desktop) */}
            <h1 className="fluid-h1 font-extrabold text-[#12141C] tracking-tight">
              ৫০+ প্রিমিয়াম Laravel ওয়েবসাইট থিম, এক জায়গায়
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-[#4A5068] font-normal leading-relaxed max-w-xl">
              প্রতিটি থিমের লাইভ প্রিভিউ দেখুন, পছন্দ হলে একবার পেমেন্ট করে সব থিমের ZIP ফাইল ডাউনলোড করুন।
            </p>

            {/* CTA Buttons (Stacked full-width on mobile, side-by-side on sm+) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={handleHeroUnlock}
                className="w-full sm:w-auto px-6 py-3.5 min-h-[52px] sm:min-h-[48px] bg-[#E8473F] hover:bg-[#d63b33] active:scale-[0.98] text-white rounded-[12px] font-bold text-sm sm:text-base transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {hasApprovedPayment ? 'সব থিম আনলক করা আছে' : (settings.unlock_title || '৫০+ Laravel ওয়েবসাইট আনলক করুন')}
                </span>
              </button>
              <button
                onClick={scrollToThemes}
                className="w-full sm:w-auto px-6 py-3.5 min-h-[52px] sm:min-h-[48px] bg-white border border-[#E4E7F0] hover:border-[#12141C] active:scale-[0.98] text-[#12141C] rounded-[12px] font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer flex items-center justify-center"
              >
                থিম দেখুন
              </button>
            </div>
          </div>

          {/* Right Hero Graphic Mockup (Pixel-faithful, responsive without overflow) */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            {/* Outer Dark Window Frame */}
            <div className="bg-[#1E222D] rounded-[18px] p-2.5 sm:p-3.5 shadow-[0_16px_40px_rgba(18,20,28,0.15)] border border-[#2E3445]">
              {/* Window dots bar */}
              <div className="flex items-center gap-1.5 pb-2.5 px-1.5 border-b border-[#2E3445]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E8473F]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#F6921E]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#14935F]"></div>
                <span className="text-[10px] font-mono text-slate-400 ml-2 truncate">nexbit-themes.live</span>
              </div>

              {/* Inner UI Preview Canvas */}
              <div className="bg-[#12141C] rounded-[12px] p-3 sm:p-4 mt-2.5 space-y-3">
                {/* Simulated Header Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-[#252835]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-[5px] bg-[#E8473F] flex items-center justify-center text-[10px] text-white font-bold">
                      N
                    </div>
                    <div className="h-2 w-16 bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 bg-slate-700 rounded-full"></div>
                    <div className="h-2 w-6 bg-slate-700 rounded-full"></div>
                    <div className="h-5 px-2 rounded-full bg-[#E8473F] text-[9px] text-white font-bold flex items-center">
                      Live
                    </div>
                  </div>
                </div>

                {/* Simulated Banner Card */}
                <div className="bg-gradient-to-r from-[#202534] to-[#171B26] border border-[#2E3547] rounded-[10px] p-3 flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="h-2 w-24 bg-white/80 rounded-full"></div>
                    <div className="h-1.5 w-16 bg-white/40 rounded-full"></div>
                  </div>
                  <div className="px-2 py-1 rounded bg-[#E8473F] text-white text-[10px] font-bold shrink-0">
                    50+ Themes
                  </div>
                </div>

                {/* Simulated Grid of 3 Theme Mini-Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Mini Card 1 */}
                  <div className="bg-[#1C202C] border border-[#2E3547] rounded-[8px] p-1.5 space-y-1.5">
                    <div className="w-full aspect-[4/3] rounded bg-gradient-to-br from-[#E8473F] to-[#d63b33] flex items-center justify-center text-[9px] text-white font-bold">
                      Shopora
                    </div>
                    <div className="h-1.5 w-10 bg-slate-600 rounded-full"></div>
                    <div className="h-1 w-6 bg-slate-700 rounded-full"></div>
                  </div>

                  {/* Mini Card 2 */}
                  <div className="bg-[#1C202C] border border-[#2E3547] rounded-[8px] p-1.5 space-y-1.5">
                    <div className="w-full aspect-[4/3] rounded bg-gradient-to-br from-[#3B66D6] to-[#254ab5] flex items-center justify-center text-[9px] text-white font-bold">
                      Folio
                    </div>
                    <div className="h-1.5 w-10 bg-slate-600 rounded-full"></div>
                    <div className="h-1 w-6 bg-slate-700 rounded-full"></div>
                  </div>

                  {/* Mini Card 3 */}
                  <div className="bg-[#1C202C] border border-[#2E3547] rounded-[8px] p-1.5 space-y-1.5">
                    <div className="w-full aspect-[4/3] rounded bg-gradient-to-br from-[#15803D] to-[#0f602d] flex items-center justify-center text-[9px] text-white font-bold">
                      BizLine
                    </div>
                    <div className="h-1.5 w-10 bg-slate-600 rounded-full"></div>
                    <div className="h-1 w-6 bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating ZIP Download Badge */}
            <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white border border-[#E4E7F0] rounded-[14px] p-2.5 sm:p-3 shadow-lg flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[#E3F5EC] text-[#14935F] flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="pr-2">
                <p className="text-xs font-bold text-[#12141C] leading-none">ZIP ডাউনলোড</p>
                <p className="text-[10px] text-[#7A819A] mt-0.5">সব সোর্স কোড একসাথে</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats Strip                                                        */}
      {/* ------------------------------------------------------------------ */}
      <StatsStrip />

      {/* ------------------------------------------------------------------ */}
      {/* Themes Section                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section id="themes-section" className="scroll-mt-24 space-y-6">
        {/* Section Header & Responsive Categories */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="fluid-h2 font-bold text-[#12141C] tracking-tight">
              আমাদের থিমসমূহ
            </h2>
            <p className="text-xs sm:text-sm text-[#7A819A] mt-1 font-medium">
              আপনার পছন্দের ক্যাটাগরি বেছে নিন এবং লাইভ প্রিভিউ দেখুন
            </p>
          </div>

          {/* Category Filter Pills: Mobile Horizontal Smooth Scroll with snap */}
          <div className="relative max-w-full">
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory no-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {dynamicCategories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={(e) => handleCategorySelect(cat, e)}
                    className={`px-4 py-2 min-h-[44px] text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start active:scale-95 ${
                      active
                        ? 'bg-[#12141C] text-white shadow-xs'
                        : 'bg-white text-[#4A5068] border border-[#E4E7F0] hover:border-[#12141C]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid of Theme Cards: 1 col on < 600px, 2 cols on 600-999px, 3-4 cols on 1000px+ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-[18px] border border-[#E4E7F0] p-4 h-72 skeleton-shimmer"></div>
            ))}
          </div>
        ) : filteredThemes.length === 0 ? (
          <div className="bg-white rounded-[18px] border border-[#E4E7F0] p-10 sm:p-14 text-center text-slate-400">
            <p className="text-base font-bold text-[#12141C]">এই ক্যাটাগরিতে কোনো সক্রিয় থিম নেই</p>
            <p className="text-xs text-[#7A819A] mt-1">অন্য ক্যাটাগরি নির্বাচন করুন অথবা শীঘ্রই নতুন থিম যোগ করা হবে।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Video Setup Section                                                */}
      {/* ------------------------------------------------------------------ */}
      <VideoSection />

      {/* ------------------------------------------------------------------ */}
      {/* Unlock Banner                                                      */}
      {/* ------------------------------------------------------------------ */}
      <UnlockBanner />
    </div>
  );
};
