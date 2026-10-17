import React from 'react';

export const StatsStrip: React.FC = () => {
  return (
    <div className="bg-white border border-[#E4E7F0] rounded-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-6 md:p-8">
      {/* 2x2 Grid on mobile (< md), 4-column row on desktop (>= md) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 md:divide-x divide-[#E4E7F0]">
        {/* Stat 1 */}
        <div className="pt-2 sm:pt-0 sm:px-3 md:px-4 text-left">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight">
            ৫০+
          </div>
          <p className="text-xs sm:text-sm text-[#7A819A] mt-1 font-medium leading-snug">
            Laravel ওয়েবসাইট থিম
          </p>
        </div>

        {/* Stat 2 */}
        <div className="pt-2 sm:pt-0 sm:px-3 md:px-6 text-left">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight">
            লাইভ
          </div>
          <p className="text-xs sm:text-sm text-[#7A819A] mt-1 font-medium leading-snug">
            প্রতিটির ডেমো প্রিভিউ
          </p>
        </div>

        {/* Stat 3 */}
        <div className="pt-4 sm:pt-0 sm:px-3 md:px-6 text-left border-t border-[#E4E7F0] sm:border-t-0">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight">
            ১ বার
          </div>
          <p className="text-xs sm:text-sm text-[#7A819A] mt-1 font-medium leading-snug">
            পেমেন্টে সব থিম
          </p>
        </div>

        {/* Stat 4 */}
        <div className="pt-4 sm:pt-0 sm:px-3 md:px-6 text-left border-t border-[#E4E7F0] sm:border-t-0">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight">
            সহজ
          </div>
          <p className="text-xs sm:text-sm text-[#7A819A] mt-1 font-medium leading-snug">
            bKash ও Nagad পেমেন্ট
          </p>
        </div>
      </div>
    </div>
  );
};
