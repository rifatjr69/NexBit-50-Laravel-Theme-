import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatBengaliCurrency } from '../utils/bengali';

export const UnlockBanner: React.FC = () => {
  const { user, hasApprovedPayment } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleUnlockClick = () => {
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

  return (
    <section id="pricing-section" className="scroll-mt-24">
      <div className="bg-[#12141C] text-white rounded-[20px] p-5 sm:p-8 md:p-10 shadow-[0_8px_32px_rgba(18,20,28,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        {/* Left Side Info */}
        <div className="max-w-xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {settings.unlock_title || '৫০+ Laravel ওয়েবসাইট আনলক করুন'}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 mt-2 font-normal leading-relaxed">
            লগইন করে একবার পেমেন্ট করুন। অ্যাডমিন যাচাই করলেই সব থিমের ZIP ফাইল ডাউনলোড করতে পারবেন।
          </p>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-2 mt-4 sm:mt-5">
            <span className="px-3 py-1 bg-[#E2136E] text-white rounded-full text-xs font-bold tracking-wide">
              bKash
            </span>
            <span className="px-3 py-1 bg-[#F6921E] text-white rounded-full text-xs font-bold tracking-wide">
              Nagad
            </span>
            <span className="text-[11px] text-slate-400 ml-1">
              পার্সোনাল সেন্ড মানি
            </span>
          </div>
        </div>

        {/* Right Side Pricing & CTA */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-between gap-4 shrink-0 pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
          <div className="text-left md:text-right">
            <div className="flex items-baseline gap-2 md:justify-end">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                {formatBengaliCurrency(settings.price || 2990)}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                একবারের পেমেন্ট
              </span>
            </div>
            <p className="text-[11px] text-[#14935F] font-semibold mt-0.5">
              ✓ লাইফটাইম অ্যাক্সেস ও আপডেট
            </p>
          </div>

          <button
            onClick={handleUnlockClick}
            className="w-full sm:w-auto px-7 py-3.5 min-h-[52px] bg-[#E8473F] hover:bg-[#d63b33] active:scale-[0.98] text-white rounded-[12px] font-bold text-sm sm:text-base transition-all duration-150 shadow-md cursor-pointer text-center flex items-center justify-center"
          >
            {hasApprovedPayment ? 'সব থিম দেখুন' : 'এখনই আনলক করুন'}
          </button>
        </div>
      </div>
    </section>
  );
};
