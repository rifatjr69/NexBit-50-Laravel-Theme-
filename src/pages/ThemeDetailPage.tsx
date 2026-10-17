import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Theme } from '../types';
import { fetchThemeById, getSignedZipUrl } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatBengaliCurrency } from '../utils/bengali';
import {
  Lock,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ImageIcon,
  ShieldCheck,
  FileArchive
} from 'lucide-react';

export const ThemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasApprovedPayment, userPayments } = useAuth();
  const { settings } = useSettings();

  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  // Gallery viewer states
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Download states
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Touch swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchThemeById(id).then((t) => {
        setTheme(t);
        setLoading(false);
        setActiveImageIndex(0);
      });
    }
  }, [id]);

  // Build full images list: [thumbnail_url] + (gallery_urls || [])
  const allImages: string[] = React.useMemo(() => {
    if (!theme) return [];
    const list: string[] = [];
    if (theme.thumbnail_url) list.push(theme.thumbnail_url);
    if (theme.gallery_urls && theme.gallery_urls.length > 0) {
      theme.gallery_urls.forEach((url) => {
        if (url && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list;
  }, [theme]);

  // Navigate images with arrows
  const handlePrevImage = useCallback(() => {
    if (allImages.length <= 1) return;
    setIsImageLoading(true);
    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const handleNextImage = useCallback(() => {
    if (allImages.length <= 1) return;
    setIsImageLoading(true);
    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  // Swipe detection for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Lock body scroll when Lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  // Keyboard navigation (Arrow keys + Esc for lightbox)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen && e.key === 'Escape') {
        setLightboxOpen(false);
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrevImage, handleNextImage]);

  // Determine user's payment state
  const isPending = userPayments.some((p) => p.status === 'pending') && !hasApprovedPayment;

  // Handle Download Click
  const handleDownload = async () => {
    if (!hasApprovedPayment || !theme) return;

    try {
      setDownloading(true);
      const signedUrl = await getSignedZipUrl(theme.zip_path);

      // Trigger actual download via hidden anchor
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}-source.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setCountdown(60);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.error('Download error', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleUnlockClick = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/payment`)}`);
    } else {
      navigate('/payment');
    }
  };

  const handleOpenLiveDemo = () => {
    if (theme?.preview_url) {
      window.open(theme.preview_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto py-10 px-4 sm:px-6">
        <div className="space-y-6">
          <div className="h-6 w-36 skeleton-shimmer rounded-md"></div>
          <div className="h-12 w-3/4 skeleton-shimmer rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-8 h-96 skeleton-shimmer rounded-[18px]"></div>
            <div className="lg:col-span-4 h-96 skeleton-shimmer rounded-[18px]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="max-w-[1200px] mx-auto py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#12141C]">থিমটি পাওয়া যায়নি</h2>
        <Link to="/" className="inline-block mt-4 text-[#E8473F] font-semibold text-sm">
          হোম পেজে ফিরে যান
        </Link>
      </div>
    );
  }

  const currentImageUrl = allImages[activeImageIndex] || theme.thumbnail_url;

  return (
    <div className="py-4 sm:py-6 space-y-6 pb-28 lg:pb-16 animate-fade-in-up">
      {/* ------------------------------------------------------------------ */}
      {/* 1) Breadcrumb & Header Info                                        */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#7A819A]">
          <Link to="/" className="hover:text-[#12141C] transition-colors">
            সব থিম
          </Link>
          <span>/</span>
          <span className="text-[#12141C] font-semibold truncate">{theme.name}</span>
        </nav>

        {/* Theme Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div className="flex items-center gap-3.5">
            {/* Mini preview thumbnail */}
            <div className="w-12 h-12 sm:w-14 sm:h-12 rounded-[10px] overflow-hidden bg-slate-100 p-0.5 flex flex-col justify-center shrink-0 shadow-2xs border border-[#E4E7F0]">
              <img
                src={theme.thumbnail_url}
                alt={theme.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover rounded-[8px]"
              />
            </div>

            <div className="overflow-hidden">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight truncate">
                {theme.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#7A819A] font-medium mt-0.5">
                {theme.category} Laravel ওয়েবসাইট থিম
              </p>
            </div>
          </div>

          {/* Desktop "লাইভ প্রিভিউ দেখুন" Button */}
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={handleOpenLiveDemo}
              disabled={!theme.preview_url}
              className={`px-5 py-2.5 min-h-[46px] rounded-[10px] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer ${
                theme.preview_url
                  ? 'bg-[#12141C] hover:bg-[#252835] text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>লাইভ প্রিভিউ দেখুন</span>
              <ExternalLink className="w-4 h-4 text-[#E8473F]" />
            </button>
          </div>
        </div>

        {/* Mobile Full-Width Prominent "লাইভ প্রিভিউ দেখুন" Button (Stacked right after title) */}
        <div className="block sm:hidden mt-3">
          <button
            type="button"
            onClick={handleOpenLiveDemo}
            disabled={!theme.preview_url}
            className={`w-full py-3.5 min-h-[50px] rounded-[12px] text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              theme.preview_url
                ? 'bg-[#12141C] text-white active:bg-[#252835]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>লাইভ প্রিভিউ দেখুন</span>
            <ExternalLink className="w-4 h-4 text-[#E8473F]" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2) Main Content: Gallery + Download Box                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Image Gallery Viewer inside Browser-Style Frame */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white border border-[#E4E7F0] rounded-[18px] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col">
            {/* Browser Window Controls Top Bar */}
            <div className="bg-[#F8FAFC] border-b border-[#E4E7F0] px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2.5">
              {/* Window dots & URL Bar */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8473F]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F6921E]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14935F]"></span>
                </div>
                <div className="bg-white border border-[#E4E7F0] rounded-lg px-2.5 py-1 text-[11px] sm:text-xs text-[#4A5068] font-mono flex-1 truncate shadow-2xs">
                  {theme.preview_url || `https://demo.example.com/${theme.name.toLowerCase()}`}
                </div>
              </div>

              {/* Top Bar Action */}
              <button
                type="button"
                onClick={handleOpenLiveDemo}
                disabled={!theme.preview_url}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#12141C] text-white hover:bg-[#252835] transition-colors cursor-pointer shrink-0"
              >
                <span>ভিজিট করুন</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#E8473F]" />
              </button>
            </div>

            {/* Viewport Frame with Main Image & Touch Swipe */}
            <div className="relative bg-[#EDF0F7] p-2.5 sm:p-5 flex flex-col items-center justify-center">
              {/* Main Image Container */}
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative w-full bg-white rounded-lg shadow-sm border border-[#E4E7F0] overflow-hidden max-h-[520px] sm:max-h-[580px] overflow-y-auto group touch-pan-y"
              >
                {/* Image loading skeleton */}
                {isImageLoading && (
                  <div className="absolute inset-0 skeleton-shimmer flex items-center justify-center z-10 min-h-[300px]">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ImageIcon className="w-8 h-8 animate-bounce" />
                      <span className="text-xs font-medium">ছবি লোড হচ্ছে...</span>
                    </div>
                  </div>
                )}

                {/* Click to open fullscreen lightbox */}
                <div
                  onClick={() => setLightboxOpen(true)}
                  className="cursor-zoom-in relative"
                  title="বড় করে দেখতে ক্লিক করুন"
                >
                  <img
                    src={currentImageUrl}
                    alt={`${theme.name} Screenshot ${activeImageIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                    className="w-full h-auto block object-top transition-opacity duration-200"
                  />

                  {/* Hover hint */}
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-md">
                    <Maximize2 className="w-3.5 h-3.5 text-[#E8473F]" />
                    <span>ফুলস্ক্রিন</span>
                  </div>
                </div>

                {/* Left & Right floating navigation arrows (Min 48px touch zone) */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 active:scale-95 text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90"
                      aria-label="Next Image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Dot Indicators on mobile */}
              {allImages.length > 1 && (
                <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
                  {allImages.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveImageIndex(dotIdx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        dotIdx === activeImageIndex
                          ? 'w-6 bg-[#12141C]'
                          : 'w-2 bg-slate-300'
                      }`}
                      aria-label={`Slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Thumbnails Row below Main Image (Mobile Horizontal Snap) */}
              {allImages.length > 1 && (
                <div className="w-full mt-3 sm:mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory">
                  {allImages.map((imgUrl, idx) => {
                    const isSelected = idx === activeImageIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (idx !== activeImageIndex) {
                            setIsImageLoading(true);
                            setActiveImageIndex(idx);
                          }
                        }}
                        className={`relative w-18 sm:w-20 h-13 sm:h-14 rounded-[8px] overflow-hidden shrink-0 border-2 transition-all cursor-pointer snap-start ${
                          isSelected
                            ? 'border-[#12141C] ring-2 ring-[#12141C]/20 shadow-xs'
                            : 'border-[#E4E7F0] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover object-top"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#12141C]/10 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Subtext Note under preview */}
          <div className="flex items-center justify-between text-xs text-[#7A819A] pt-1 px-1">
            <p>
              মোবাইলে বাম/ডান সোয়াইপ করে ছবি পরিবর্তন করুন বা বড় করে দেখতে ট্যাপ করুন।
            </p>
            {allImages.length > 1 && (
              <span className="font-mono text-[#4A5068] font-semibold shrink-0 ml-2">
                {activeImageIndex + 1} / {allImages.length}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Download Box */}
        <div className="lg:col-span-4 w-full">
          <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#12141C]">ডাউনলোড</h2>
              <p className="text-xs text-[#7A819A] mt-0.5">
                {theme.name} — সম্পূর্ণ সোর্স কোডের ZIP ফাইল
              </p>
            </div>

            {/* 4 Download States */}
            {hasApprovedPayment ? (
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-3.5 px-4 min-h-[50px] bg-[#14935F] hover:bg-[#10794e] active:scale-[0.98] text-white rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloading
                      ? 'ডাউনলোড শুরু হচ্ছে...'
                      : 'সম্পূর্ণ ZIP ডাউনলোড করুন'}
                  </span>
                </button>

                {downloadSuccess && (
                  <div className="bg-[#E3F5EC] border border-[#A7E5C7] text-[#14935F] rounded-lg p-3 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      ZIP ফাইল ডাউনলোড শুরু হয়েছে! {countdown !== null && `(${countdown}s)`}
                    </span>
                  </div>
                )}
              </div>
            ) : isPending ? (
              <div className="space-y-3">
                <div className="bg-[#FFF8E7] border border-[#FFE8A3] text-[#8C5D00] rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#F6921E] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">পেমেন্ট যাচাই চলছে</p>
                    <p className="mt-0.5 text-[#A37000]">
                      আপনার পেমেন্ট অপেক্ষমাণ রয়েছে। অ্যাডমিন অনুমোদন করলেই ডাউনলোড বাটন সক্রিয় হবে।
                    </p>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-3.5 px-4 min-h-[50px] bg-slate-200 text-slate-400 rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>অনুমোদনের অপেক্ষায়</span>
                </button>
              </div>
            ) : user ? (
              <div className="space-y-3">
                <button
                  onClick={handleUnlockClick}
                  className="w-full py-3.5 px-4 min-h-[50px] bg-[#E8473F] hover:bg-[#d63b33] active:scale-[0.98] text-white rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>পেমেন্ট করে সব আনলক করুন</span>
                </button>

                <p className="text-xs text-center text-[#7A819A]">
                  একবার পেমেন্ট (৳{settings.price || 2990}) করলেই এই থিমসহ সমস্ত থিমের ZIP ডাউনলোড করতে পারবেন।
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleUnlockClick}
                  className="w-full py-3.5 px-4 min-h-[50px] bg-[#E8473F] hover:bg-[#d63b33] active:scale-[0.98] text-white rounded-[12px] font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>লগইন করে আনলক করুন</span>
                </button>

                <p className="text-xs text-center text-[#7A819A]">
                  ডাউনলোড করতে প্রথমে একটি একাউন্ট খুলুন ও পেমেন্ট সম্পন্ন করুন।
                </p>
              </div>
            )}

            {/* Included Features List */}
            <div className="pt-4 border-t border-[#E4E7F0] space-y-2.5">
              <p className="text-xs font-bold text-[#12141C]">প্যাকেজে যা যা পাচ্ছেন:</p>
              <ul className="text-xs text-[#4A5068] space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14935F]"></span>
                  <span>সম্পূর্ণ Laravel সোর্স কোড (.zip)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14935F]"></span>
                  <span>ডাটাবেস ডাম্প (.sql ফাইল)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14935F]"></span>
                  <span>স্টেপ-বাই-স্টেপ সেটআপ গাইড ও ডকুমেন্টেশন</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14935F]"></span>
                  <span>লাইফটাইম ফ্রি আপডেট ও ভবিষ্যৎ ভার্সন</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3) Mobile Sticky Bottom Bar (Visible only on < lg)                 */}
      {/* ------------------------------------------------------------------ */}
      <aside
        aria-label="মোবাইল অ্যাকশন বার"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4E7F0] shadow-[0_-6px_24px_rgba(0,0,0,0.08)] px-4 py-3 lg:hidden flex items-center justify-between gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="text-left">
          <p className="text-xs text-[#7A819A] font-medium leading-none">ফুল প্যাক মূল্য</p>
          <p className="text-lg font-extrabold text-[#12141C] font-mono leading-tight mt-0.5">
            {formatBengaliCurrency(settings.price || 2990)}
          </p>
        </div>

        <div>
          {hasApprovedPayment ? (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-3 min-h-[48px] bg-[#14935F] active:bg-[#10794e] text-white rounded-[12px] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'ডাউনলোড...' : 'ZIP ডাউনলোড'}</span>
            </button>
          ) : isPending ? (
            <button
              disabled
              className="px-4 py-3 min-h-[48px] bg-amber-100 text-[#8C5D00] rounded-[12px] font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-not-allowed"
            >
              <Clock className="w-4 h-4 text-[#F6921E]" />
              <span>যাচাই চলছে</span>
            </button>
          ) : (
            <button
              onClick={handleUnlockClick}
              className="px-5 py-3 min-h-[48px] bg-[#E8473F] active:bg-[#d63b33] text-white rounded-[12px] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>আনলক করুন</span>
            </button>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* 4) Fullscreen Lightbox Modal                                       */}
      {/* ------------------------------------------------------------------ */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fade-in">
          {/* Top Bar with counter & close */}
          <div className="flex items-center justify-between text-white z-10 px-2 py-1">
            <span className="text-xs sm:text-sm font-mono text-slate-300">
              {theme.name} — {activeImageIndex + 1} / {allImages.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white cursor-pointer"
              aria-label="লাইটবক্স বন্ধ করুন"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Zoomed Image Container */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 overflow-auto flex items-center justify-center my-2 p-1"
          >
            <img
              src={currentImageUrl}
              alt={theme.name}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
            />
          </div>

          {/* Floating Navigation Arrows */}
          {allImages.length > 1 && (
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                type="button"
                onClick={handlePrevImage}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center cursor-pointer"
                aria-label="পূর্ববর্তী ছবি"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center cursor-pointer"
                aria-label="পরবর্তী ছবি"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
