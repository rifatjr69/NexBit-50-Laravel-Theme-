import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Theme } from '../types';
import { Lock, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ThemeCardProps {
  theme: Theme;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme }) => {
  const { hasApprovedPayment } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Accent fallback colors matching brand aesthetic
  const colorMap: Record<string, { bg: string; bar: string; light: string }> = {
    'শপোরা': { bg: '#E8473F', bar: '#FEE2E2', light: '#FFF1F1' },
    'ফোলিও প্রো': { bg: '#3B66D6', bar: '#DBEAFE', light: '#EFF6FF' },
    'বিজনেসলাইন': { bg: '#15803D', bar: '#DCFCE7', light: '#F0FDF4' },
    'ক্লিনিকেয়ার': { bg: '#0E7490', bar: '#CFFAFE', light: '#ECFEFF' },
    'ফুডহাট': { bg: '#D97706', bar: '#FEF3C7', light: '#FFFBEB' },
    'এডুস্পেস': { bg: '#7C3AED', bar: '#EDE9FE', light: '#F5F3FF' },
    'নিউজপোস্ট': { bg: '#1E293B', bar: '#E2E8F0', light: '#F8FAFC' },
    'এস্টেটভিউ': { bg: '#BE185D', bar: '#FCE7F3', light: '#FDF2F8' }
  };

  const scheme = colorMap[theme.name] || {
    bg: theme.accent_color || '#E8473F',
    bar: '#F1F5F9',
    light: '#F8FAFC'
  };

  return (
    <Link
      to={`/theme/${theme.id}`}
      className="group block bg-white border border-[#E4E7F0] rounded-[18px] overflow-hidden hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] hover:border-[#CBD2E1] active:scale-[0.98] transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12141C]"
    >
      {/* Visual Preview / Thumbnail Area: Fixed 16:10 Aspect Ratio to avoid CLS */}
      <div className="relative aspect-[16/10] bg-[#F1F3F9] p-2.5 sm:p-3 overflow-hidden border-b border-[#E4E7F0] flex flex-col">
        {/* Stylized Browser Frame Header */}
        <div className="bg-white rounded-t-lg px-2.5 py-1.5 flex items-center justify-between border border-[#E4E7F0] shadow-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8473F]/70"></span>
            <span className="w-2 h-2 rounded-full bg-[#F6921E]/70"></span>
            <span className="w-2 h-2 rounded-full bg-[#14935F]/70"></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-8 h-1 rounded-full bg-[#E4E7F0]"></span>
            <span className="w-4 h-1 rounded-full bg-[#E4E7F0]"></span>
          </div>
        </div>

        {/* Thumbnail Image Container with Shimmer Skeleton */}
        <div className="relative flex-1 bg-white border-x border-b border-[#E4E7F0] rounded-b-lg overflow-hidden group-hover:scale-[1.01] transition-transform duration-200 ease-out">
          {theme.thumbnail_url && !imgError ? (
            <div className="w-full h-full relative">
              {/* Shimmer skeleton while loading */}
              {!imgLoaded && (
                <div className="absolute inset-0 skeleton-shimmer z-0" />
              )}
              <img
                src={theme.thumbnail_url}
                alt={theme.name}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Subtle hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          ) : (
            // Pixel-matched CSS Mockup fallback
            <div className="w-full h-full p-2.5 flex flex-col gap-2" style={{ backgroundColor: scheme.light }}>
              <div
                className="w-full rounded-md p-2 flex flex-col justify-center"
                style={{ backgroundColor: scheme.bg, height: '52%' }}
              >
                <div className="w-3/4 h-2 bg-white/90 rounded-sm mb-1.5"></div>
                <div className="w-1/2 h-1.5 bg-white/70 rounded-sm"></div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 flex-1">
                <div className="bg-white rounded border border-[#E4E7F0] shadow-2xs"></div>
                <div className="bg-white rounded border border-[#E4E7F0] shadow-2xs"></div>
                <div className="bg-white rounded border border-[#E4E7F0] shadow-2xs"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Info & Action Badge (Min 48px touch zone) */}
      <div className="p-4 flex items-center justify-between bg-white min-h-[64px]">
        <div className="overflow-hidden pr-2">
          <h3 className="font-bold text-base sm:text-[17px] text-[#12141C] group-hover:text-[#E8473F] transition-colors leading-snug truncate">
            {theme.name}
          </h3>
          <p className="text-xs text-[#7A819A] mt-0.5 font-medium truncate">
            {theme.category}
          </p>
        </div>

        {/* Lock or Download Status Indicator */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            hasApprovedPayment
              ? 'bg-[#E3F5EC] text-[#14935F]'
              : 'bg-[#F6F7FB] text-[#7A819A] group-hover:bg-[#F0F2F9] group-hover:text-[#12141C]'
          }`}
          title={hasApprovedPayment ? 'আনলক করা' : 'লক করা'}
          aria-label={hasApprovedPayment ? 'ডাউনলোড আনলক' : 'লক'}
        >
          {hasApprovedPayment ? (
            <Download className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </div>
      </div>
    </Link>
  );
};
