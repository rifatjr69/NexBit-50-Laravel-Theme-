import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { DownloadCloud, Server, CheckCircle2, VideoOff } from 'lucide-react';

export const VideoSection: React.FC = () => {
  const { settings } = useSettings();
  const videoUrl = settings.video_url?.trim() || '';

  const getEmbedInfo = (url: string): { type: 'youtube' | 'video' | 'empty'; src: string } => {
    if (!url) return { type: 'empty', src: '' };

    // YouTube regex
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
      };
    }

    // Direct video
    if (url.match(/\.(mp4|webm|ogg)$/i) || url.startsWith('blob:') || url.startsWith('data:video')) {
      return { type: 'video', src: url };
    }

    // Embed link
    if (url.includes('youtube.com/embed/')) {
      return { type: 'youtube', src: url };
    }

    return { type: 'youtube', src: url };
  };

  const embedInfo = getEmbedInfo(videoUrl);

  const steps = [
    {
      step: '১',
      title: 'থিম ডাউনলোড করুন',
      desc: 'পেমেন্ট অনুমোদনের পর ড্যাশবোর্ড বা থিম পেজ থেকে সম্পূর্ণ সোর্স কোডের ZIP ডাউনলোড করুন।',
      icon: DownloadCloud
    },
    {
      step: '২',
      title: 'সার্ভারে আপলোড করুন',
      desc: 'আপনার cPanel বা VPS হোস্টিংয়ে ফাইল আপলোড করে আনজিপ করুন ও ডাটাবেস তৈরি করুন।',
      icon: Server
    },
    {
      step: '৩',
      title: 'সেটআপ সম্পূর্ণ করুন',
      desc: '.env কনফিগার করে php artisan migrate কমান্ড রান করলেই আপনার ওয়েবসাইট প্রস্তুত।',
      icon: CheckCircle2
    }
  ];

  return (
    <section id="video-setup-section" className="scroll-mt-24">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
        <h2 className="fluid-h2 font-bold text-[#12141C] tracking-tight">
          কীভাবে সেটআপ করবেন (ভিডিও দেখুন)
        </h2>
        <p className="text-sm sm:text-base text-[#4A5068] mt-2 font-normal leading-relaxed">
          মাত্র ৩টি সহজ ধাপে আপনার সার্ভারে Laravel থিম ইনস্টল ও সেটআপ করুন
        </p>
      </div>

      {/* Main Video & Steps Container */}
      <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-4 sm:p-6 md:p-8 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-6 sm:space-y-8">
        {/* 16:9 Video Player Card: Fixed Aspect Ratio to prevent layout shift */}
        <div className="relative w-full aspect-video rounded-[12px] sm:rounded-[14px] overflow-hidden bg-[#12141C] border border-[#E4E7F0] shadow-sm">
          {embedInfo.type === 'youtube' && embedInfo.src ? (
            <iframe
              src={embedInfo.src}
              title="কীভাবে Laravel থিম সেটআপ করবেন"
              loading="lazy"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : embedInfo.type === 'video' && embedInfo.src ? (
            <video
              src={embedInfo.src}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            >
              আপনার ব্রাউজারে ভিডিও সমর্থিত নয়।
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center text-slate-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center mb-2.5">
                <VideoOff className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">ভিডিও শীঘ্রই আসছে</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                অ্যাডমিন প্যানেলের সেটিংস অপশন থেকে যেকোনো YouTube বা MP4 ভিডিও লিংক যুক্ত করলেই তা এখানে প্রদর্শিত হবে।
              </p>
            </div>
          )}
        </div>

        {/* 3 Step Cards Below Video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 pt-1">
          {steps.map((item, idx) => {
            return (
              <div
                key={idx}
                className="bg-[#F6F7FB] border border-[#E4E7F0] rounded-[14px] p-4 sm:p-5 flex items-start gap-3.5 transition-all hover:border-[#CBD2E1]"
              >
                <div className="w-10 h-10 rounded-[10px] bg-white border border-[#E4E7F0] text-[#12141C] font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {item.step}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm sm:text-[15px] text-[#12141C]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#7A819A] mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
