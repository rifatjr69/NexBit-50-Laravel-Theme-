import React from 'react';
import { useSettings } from '../context/SettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const phone = settings.bkash_number || settings.nagad_number || '01647651231';

  return (
    <footer className="border-t border-[#E4E7F0] bg-white py-6 sm:py-8 mt-16 sm:mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-[#7A819A] text-center sm:text-left">
        <div>
          © {settings.brand_name || 'Nexbit Live'}। সর্বস্বত্ব সংরক্ষিত।
        </div>
        <div>
          যেকোনো প্রয়োজনে যোগাযোগ: <a href={`tel:${phone}`} className="text-[#12141C] font-semibold hover:text-[#E8473F] transition-colors py-1 inline-block">{phone}</a>
        </div>
      </div>
    </footer>
  );
};
