import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Theme, Payment } from '../types';
import {
  fetchThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  fetchAllPayments,
  updatePaymentStatus,
  uploadThemeThumbnailFile,
  uploadThemeGalleryFile,
  uploadThemeZipFile,
  removeStorageFile
} from '../services/dataService';
import {
  formatBengaliCurrency,
  toBengaliNumber,
  formatBengaliDate
} from '../utils/bengali';
import {
  LayoutDashboard,
  Layers,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Upload,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
  Clock,
  ArrowLeft,
  X,
  FileArchive,
  Image as ImageIcon,
  Check,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Images,
  Play,
  Video,
  VideoOff,
  Menu
} from 'lucide-react';

interface GalleryItem {
  id: string;
  url?: string;
  file?: File;
  preview: string;
  isNew: boolean;
}

const getAdminVideoEmbed = (url: string): { type: 'youtube' | 'video' | 'empty'; src: string } => {
  if (!url || !url.trim()) return { type: 'empty', src: '' };
  const clean = url.trim();

  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
    };
  }

  if (clean.match(/\.(mp4|webm|ogg)($|\?)/i) || clean.startsWith('blob:') || clean.startsWith('data:video')) {
    return { type: 'video', src: clean };
  }

  if (clean.includes('youtube.com/embed/')) {
    return { type: 'youtube', src: clean };
  }

  return { type: 'youtube', src: clean };
};

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'payments' | 'settings'>('themes');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Themes state
  // ---------------------------------------------------------------------------
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themesLoading, setThemesLoading] = useState(true);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ই-কমার্স');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Main Thumbnail file state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string>('');

  // Gallery Images file state (up to 10 images)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // ZIP file state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [existingZipPath, setExistingZipPath] = useState<string>('');
  const [zipProgress, setZipProgress] = useState<number | null>(null);

  const [savingTheme, setSavingTheme] = useState(false);
  const [formError, setFormError] = useState('');

  // Themes list filters
  const [themeSearch, setThemeSearch] = useState('');
  const [selectedThemeCatFilter, setSelectedThemeCatFilter] = useState('সব');

  // Delete dialog
  const [deleteThemeTarget, setDeleteThemeTarget] = useState<Theme | null>(null);

  // ---------------------------------------------------------------------------
  // Payments state
  // ---------------------------------------------------------------------------
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Reject dialog
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPaymentForReject, setSelectedPaymentForReject] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('TrxID মেলেনি, সঠিক TrxID দিয়ে আবার জমা দিন।');

  // Lock body scroll when mobile sidebar drawer or dialogs are open
  useEffect(() => {
    if (mobileSidebarOpen || deleteThemeTarget || rejectModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen, deleteThemeTarget, rejectModalOpen]);

  // Handle ESC key for mobile drawer and dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
        if (deleteThemeTarget) setDeleteThemeTarget(null);
        if (rejectModalOpen) setRejectModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen, deleteThemeTarget, rejectModalOpen]);

  // ---------------------------------------------------------------------------
  // Settings form states
  // ---------------------------------------------------------------------------
  const [settingsForm, setSettingsForm] = useState({
    bkash_number: settings.bkash_number || '',
    nagad_number: settings.nagad_number || '',
    price: settings.price || 2990,
    unlock_title: settings.unlock_title || '',
    brand_name: settings.brand_name || 'Nexbit Live',
    video_url: settings.video_url || ''
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Input refs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettingsForm({
      bkash_number: settings.bkash_number || '',
      nagad_number: settings.nagad_number || '',
      price: settings.price || 2990,
      unlock_title: settings.unlock_title || '',
      brand_name: settings.brand_name || 'Nexbit Live',
      video_url: settings.video_url || ''
    });
  }, [settings]);

  const loadData = async () => {
    setThemesLoading(true);
    setPaymentsLoading(true);
    try {
      const loadedThemes = await fetchThemes(true);
      setThemes(loadedThemes);

      const loadedPayments = await fetchAllPayments();
      setPayments(loadedPayments);
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setThemesLoading(false);
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const categories = [
    'ই-কমার্স',
    'পোর্টফোলিও',
    'ব্যবসা',
    'স্বাস্থ্যসেবা',
    'রেস্টুরেন্ট',
    'শিক্ষা',
    'ব্লগ ও নিউজ',
    'রিয়েল এস্টেট',
    'অন্যান্য'
  ];

  // ---------------------------------------------------------------------------
  // Theme Form Handlers
  // ---------------------------------------------------------------------------
  const resetThemeForm = () => {
    setIsEditing(false);
    setEditingThemeId(null);
    setName('');
    setCategory('ই-কমার্স');
    setDescription('');
    setPreviewUrl('');
    setIsActive(true);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setExistingThumbnailUrl('');
    setGalleryItems([]);
    setZipFile(null);
    setExistingZipPath('');
    setZipProgress(null);
    setFormError('');
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  // Thumbnail handler
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('অনুগ্রহ করে শুধুমাত্র JPG, PNG অথবা WEBP ফরম্যাটের ছবি দিন।');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।');
      return;
    }

    setFormError('');
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gallery files handler (Multiple files selection, max 10 total)
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    if (galleryItems.length + fileArray.length > 10) {
      setFormError('গ্যালারিতে সর্বোচ্চ ১০টি ছবি যোগ করতে পারবেন।');
      return;
    }

    setFormError('');

    fileArray.forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setFormError('কিছু ফাইল বাদ দেওয়া হয়েছে (শুধুমাত্র JPG, PNG বা WEBP সমর্থন করে)।');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('কিছু ফাইল বাদ দেওয়া হয়েছে (সাইজ সর্বোচ্চ ৫ MB হতে পারবে)।');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setGalleryItems((prev) => [
          ...prev,
          {
            id: 'new_' + Math.random().toString(36).substring(2, 9),
            file,
            preview: reader.result as string,
            isNew: true
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const removeGalleryItem = (index: number) => {
    setGalleryItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGalleryItem = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryItems.length) return;

    setGalleryItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = item;
      return copy;
    });
  };

  // ZIP handler
  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setFormError('অনুগ্রহ করে শুধুমাত্র .zip ফাইল আপলোড করুন।');
      return;
    }

    setFormError('');
    setZipFile(file);
  };

  const handleTestLink = () => {
    if (!previewUrl) {
      setFormError('অনুগ্রহ করে আগে প্রিভিউ লিংক লিখুন।');
      return;
    }
    if (!previewUrl.startsWith('https://')) {
      setFormError('লাইভ প্রিভিউ লিংক অবশ্যই https:// দিয়ে শুরু হতে হবে।');
      return;
    }
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('থিমের নাম প্রদান করা বাধ্যতামূলক।');
      return;
    }
    if (!previewUrl.trim() || !previewUrl.startsWith('https://')) {
      setFormError('সঠিক লাইভ প্রিভিউ লিংক দিন (অবশ্যই https:// দিয়ে শুরু হতে হবে)।');
      return;
    }

    if (!isEditing && !thumbnailFile) {
      setFormError('থিমের মূল ছবি (থাম্বনেইল) আপলোড করা বাধ্যতামূলক।');
      return;
    }

    if (!isEditing && !zipFile) {
      setFormError('থিমের সোর্স কোডের ZIP ফাইল আপলোড করা বাধ্যতামূলক।');
      return;
    }

    setSavingTheme(true);

    let finalThumbnailUrl = existingThumbnailUrl;
    let finalZipPath = existingZipPath;
    const finalGalleryUrls: string[] = [];

    const themeIdForUpload = editingThemeId || 'theme_' + Date.now();

    try {
      // 1. Upload thumbnail if changed
      if (thumbnailFile) {
        const thumbRes = await uploadThemeThumbnailFile(thumbnailFile);
        if (!thumbRes.success || !thumbRes.url) {
          throw new Error(thumbRes.error || 'মূল ছবি আপলোড করতে সমস্যা হয়েছে।');
        }
        finalThumbnailUrl = thumbRes.url;

        if (isEditing && existingThumbnailUrl && existingThumbnailUrl !== thumbRes.url) {
          removeStorageFile('theme-images', existingThumbnailUrl);
        }
      }

      // 2. Upload gallery images
      if (galleryItems.length > 0) {
        setGalleryUploading(true);
        for (const item of galleryItems) {
          if (item.isNew && item.file) {
            const uploadRes = await uploadThemeGalleryFile(item.file, themeIdForUpload);
            if (uploadRes.success && uploadRes.url) {
              finalGalleryUrls.push(uploadRes.url);
            }
          } else if (item.url) {
            finalGalleryUrls.push(item.url);
          }
        }
        setGalleryUploading(false);
      }

      // 3. Upload zip if changed
      if (zipFile) {
        const zipRes = await uploadThemeZipFile(zipFile, (percent) => {
          setZipProgress(percent);
        });
        if (!zipRes.success || !zipRes.path) {
          throw new Error(zipRes.error || 'ZIP ফাইল আপলোড করতে সমস্যা হয়েছে।');
        }
        finalZipPath = zipRes.path;

        if (isEditing && existingZipPath && existingZipPath !== zipRes.path) {
          removeStorageFile('theme-zips', existingZipPath);
        }
      }

      // 4. Save to Database
      if (isEditing && editingThemeId) {
        const updated = await updateTheme(editingThemeId, {
          name: name.trim(),
          category,
          description: description.trim(),
          preview_url: previewUrl.trim(),
          thumbnail_url: finalThumbnailUrl,
          gallery_urls: finalGalleryUrls,
          zip_path: finalZipPath,
          is_active: isActive
        });

        if (!updated) {
          throw new Error('থিম আপডেট করা যায়নি।');
        }
        showToast('থিম সফলভাবে আপডেট হয়েছে!', 'success');
      } else {
        const created = await createTheme({
          name: name.trim(),
          category,
          description: description.trim(),
          preview_url: previewUrl.trim(),
          thumbnail_url: finalThumbnailUrl,
          gallery_urls: finalGalleryUrls,
          zip_path: finalZipPath,
          is_active: isActive
        });

        if (!created) {
          throw new Error('নতুন থিম সেভ করা যায়নি।');
        }
        showToast('নতুন থিম সফলভাবে যোগ হয়েছে!', 'success');
      }

      resetThemeForm();
      const updatedList = await fetchThemes(true);
      setThemes(updatedList);
    } catch (err: any) {
      console.error('Error saving theme:', err);
      setFormError(err.message || 'থিম সেভ করার সময় একটি ত্রুটি ঘটেছে।');
    } finally {
      setSavingTheme(false);
      setGalleryUploading(false);
      setZipProgress(null);
    }
  };

  const handleEditThemeClick = (t: Theme) => {
    setIsEditing(true);
    setEditingThemeId(t.id);
    setName(t.name);
    setCategory(t.category || 'ই-কমার্স');
    setDescription(t.description || '');
    setPreviewUrl(t.preview_url || '');
    setIsActive(t.is_active);

    setExistingThumbnailUrl(t.thumbnail_url || '');
    setThumbnailPreview(t.thumbnail_url || null);
    setThumbnailFile(null);

    // Pre-populate gallery items
    const existingGallery = (t.gallery_urls || []).map((url, i) => ({
      id: `existing_${i}_${url}`,
      url,
      preview: url,
      isNew: false
    }));
    setGalleryItems(existingGallery);

    setExistingZipPath(t.zip_path || '');
    setZipFile(null);
    setFormError('');

    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleConfirmDeleteTheme = async () => {
    if (!deleteThemeTarget) return;

    try {
      await deleteTheme(deleteThemeTarget.id);
      showToast('থিম ও সংশ্লিষ্ট ফাইলসমূহ সফলভাবে মুছে ফেলা হয়েছে।', 'info');
      setThemes((prev) => prev.filter((t) => t.id !== deleteThemeTarget.id));
    } catch (err: any) {
      showToast('থিম মুছতে সমস্যা হয়েছে: ' + err.message, 'error');
    } finally {
      setDeleteThemeTarget(null);
    }
  };

  const handleToggleThemeStatus = async (t: Theme) => {
    const nextStatus = !t.is_active;
    const updated = await updateTheme(t.id, { is_active: nextStatus });
    if (updated) {
      setThemes((prev) => prev.map((item) => (item.id === t.id ? updated : item)));
      showToast(`থিমটি এখন ${nextStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে।`, 'info');
    }
  };

  // Payment Handlers
  const handleApprovePayment = async (p: Payment) => {
    const res = await updatePaymentStatus(p.id, 'approved');
    if (res) {
      setPayments((prev) => prev.map((item) => (item.id === p.id ? res : item)));
      showToast(`TrxID ${p.trx_id} সফলভাবে অনুমোদন করা হয়েছে।`, 'success');
    }
  };

  const openRejectDialog = (p: Payment) => {
    setSelectedPaymentForReject(p);
    setRejectReason('TrxID মেলেনি, সঠিক TrxID দিয়ে আবার জমা দিন।');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedPaymentForReject) return;
    const res = await updatePaymentStatus(selectedPaymentForReject.id, 'rejected', rejectReason);
    if (res) {
      setPayments((prev) => prev.map((item) => (item.id === selectedPaymentForReject.id ? res : item)));
      showToast(`পেমেন্ট বাতিল করা হয়েছে।`, 'info');
    }
    setRejectModalOpen(false);
    setSelectedPaymentForReject(null);
  };

  // Settings Handlers
  const [savingVideo, setSavingVideo] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateSettings({
      bkash_number: settingsForm.bkash_number.trim(),
      nagad_number: settingsForm.nagad_number.trim(),
      price: Number(settingsForm.price),
      unlock_title: settingsForm.unlock_title.trim(),
      brand_name: settingsForm.brand_name.trim(),
      video_url: settingsForm.video_url.trim()
    });
    if (success) {
      setSettingsSaved(true);
      showToast('পেমেন্ট ও আনলক সেটিংস সফলভাবে আপডেট হয়েছে!', 'success');
      setTimeout(() => setSettingsSaved(false), 3000);
    } else {
      showToast('সেটিংস আপডেট করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleSaveVideoSettings = async () => {
    setSavingVideo(true);
    const success = await updateSettings({
      video_url: settingsForm.video_url.trim()
    });
    setSavingVideo(false);
    if (success) {
      setSettingsSaved(true);
      showToast('হোম পেজের সেটআপ ভিডিও সফলভাবে সেভ হয়েছে!', 'success');
      setTimeout(() => setSettingsSaved(false), 3000);
    } else {
      showToast('ভিডিও লিংক সেভ করতে সমস্যা হয়েছে।', 'error');
    }
  };

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const totalThemes = themes.length;
  const totalRevenue = payments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 2990), 0);

  const filteredThemes = themes.filter((t) => {
    if (selectedThemeCatFilter !== 'সব' && t.category !== selectedThemeCatFilter) return false;
    if (themeSearch.trim()) {
      return t.name.toLowerCase().includes(themeSearch.toLowerCase());
    }
    return true;
  });

  const filteredPayments = payments.filter((p) => {
    if (paymentFilter !== 'all' && p.status !== paymentFilter) return false;
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      const matchTrx = p.trx_id.toLowerCase().includes(q);
      const matchPhone = p.sender_number.includes(q);
      const matchName = p.user?.full_name?.toLowerCase().includes(q) || false;
      const matchEmail = p.user?.email?.toLowerCase().includes(q) || false;
      return matchTrx || matchPhone || matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[#F6F7FB] flex flex-col md:flex-row antialiased">
      {/* ------------------------------------------------------------------ */}
      {/* Mobile Top Header Bar (< md)                                       */}
      {/* ------------------------------------------------------------------ */}
      <header className="md:hidden bg-[#12141C] text-white px-4 h-16 flex items-center justify-between border-b border-white/10 sticky top-0 z-30 shadow-md">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-white text-[#12141C] flex items-center justify-center font-bold text-base shadow-sm">
            N
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            {settings.brand_name || 'Nexbit Live'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E8473F] text-white rounded-full ml-1">
            অ্যাডমিন
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          aria-label="অ্যাডমিন মেনু খুলুন"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile Drawer Sidebar (< md) with Slide-in and Backdrop Overlay    */}
      {/* ------------------------------------------------------------------ */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Dark Overlay */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            aria-hidden="true"
          />

          <div
            className="relative w-[80%] max-w-[300px] h-[100dvh] bg-[#12141C] text-white flex flex-col justify-between shadow-2xl z-10 animate-fade-in"
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <div>
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <Link to="/" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[8px] bg-white text-[#12141C] flex items-center justify-center font-bold text-base">
                    N
                  </div>
                  <span className="text-base font-bold text-white">
                    {settings.brand_name || 'Nexbit Live'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  aria-label="মেনু বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items with Badges */}
              <nav className="p-4 space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('overview');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-semibold transition-all min-h-[48px] cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 text-[#E8473F]" />
                  <span>ওভারভিউ</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('themes');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] text-sm font-semibold transition-all min-h-[48px] cursor-pointer ${
                    activeTab === 'themes'
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <span>থিম ম্যানেজমেন্ট</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full font-mono text-slate-300">
                    {toBengaliNumber(totalThemes)}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('payments');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[10px] text-sm font-semibold transition-all min-h-[48px] cursor-pointer ${
                    activeTab === 'payments'
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>পেমেন্ট যাচাই</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E8473F] text-white text-[11px] font-bold">
                      {toBengaliNumber(pendingCount)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-semibold transition-all min-h-[48px] cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-white/10 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5 text-amber-400" />
                  <span>সেটিংস</span>
                </button>
              </nav>
            </div>

            <div className="p-4 border-t border-white/10 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>মূল ওয়েবসাইটে ফিরে যান</span>
              </Link>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[8px] text-xs font-semibold text-[#B8322B] hover:bg-white/5 min-h-[44px] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Desktop Dark Sidebar (hidden on mobile, visible md+)               */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden md:flex md:w-[250px] bg-[#12141C] text-white flex-col justify-between shrink-0 shadow-lg min-h-screen">
        <div>
          {/* Logo & Brand */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-white text-[#12141C] flex items-center justify-center font-bold text-lg shadow-sm">
                N
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                {settings.brand_name || 'Nexbit Live'}
              </span>
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E8473F] text-white rounded-full">
              অ্যাডমিন
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#E8473F]" />
              <span>ওভারভিউ</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>থিম ম্যানেজমেন্ট</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full font-mono text-slate-300">
                {toBengaliNumber(totalThemes)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>পেমেন্ট যাচাই</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E8473F] text-white text-[11px] font-bold">
                  {toBengaliNumber(pendingCount)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-amber-400" />
              <span>সেটিংস</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূল ওয়েবসাইটে ফিরে যান</span>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-semibold text-[#B8322B] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content Area (Responsive mobile-first padding)                */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-full min-w-0">
        {/* ================================================================ */}
        {/* TAB 1: OVERVIEW                                                  */}
        {/* ================================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-[#12141C]">ড্যাশবোর্ড ওভারভিউ</h1>
              <p className="text-xs text-[#7A819A] mt-0.5">
                ওয়েবসাইটের পরিসংখ্যান, সাম্প্রতিক থিম ও পেমেন্ট অ্যাক্টিভিটি
              </p>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-[#E4E7F0] rounded-[16px] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#7A819A]">মোট থিম</p>
                  <p className="text-2xl font-bold text-[#12141C] mt-1 font-mono">
                    {toBengaliNumber(totalThemes)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-[#E4E7F0] rounded-[16px] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#7A819A]">অ্যাডমিন ইউজার</p>
                  <p className="text-2xl font-bold text-[#12141C] mt-1 font-mono">
                    ১
                  </p>
                </div>
                <div className="w-11 h-11 rounded-[10px] bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-[#E4E7F0] rounded-[16px] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#7A819A]">অপেক্ষমাণ পেমেন্ট</p>
                  <p className="text-2xl font-bold text-[#E8473F] mt-1 font-mono">
                    {toBengaliNumber(pendingCount)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-[#E4E7F0] rounded-[16px] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#7A819A]">মোট আয় (অনুমোদিত)</p>
                  <p className="text-2xl font-bold text-[#14935F] mt-1 font-mono">
                    {formatBengaliCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-[10px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Action: Pending Payments Preview */}
            <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#12141C]">
                  অপেক্ষমাণ পেমেন্টসমূহ ({toBengaliNumber(pendingCount)})
                </h2>
                <button
                  onClick={() => {
                    setActiveTab('payments');
                    setPaymentFilter('pending');
                  }}
                  className="text-xs font-semibold text-[#E8473F] hover:underline cursor-pointer"
                >
                  সব যাচাই করুন
                </button>
              </div>

              {pendingCount === 0 ? (
                <div className="py-8 text-center text-xs text-[#7A819A]">
                  এখন কোনো অপেক্ষমাণ পেমেন্ট নেই।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E4E7F0] text-[#7A819A]">
                        <th className="py-2.5 px-3 font-semibold">ইউজার</th>
                        <th className="py-2.5 px-3 font-semibold">মেথড</th>
                        <th className="py-2.5 px-3 font-semibold">TrxID</th>
                        <th className="py-2.5 px-3 font-semibold">পরিমাণ</th>
                        <th className="py-2.5 px-3 font-semibold text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7F0]">
                      {payments
                        .filter((p) => p.status === 'pending')
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3">
                              <p className="font-semibold text-[#12141C]">{p.user?.full_name || 'ইউজার'}</p>
                              <p className="text-[11px] text-[#7A819A]">{p.sender_number}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.method === 'bkash'
                                    ? 'bg-[#FDEAF3] text-[#E2136E]'
                                    : 'bg-[#FEF1E0] text-[#F6921E]'
                                }`}
                              >
                                {p.method === 'bkash' ? 'bKash' : 'Nagad'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold">{p.trx_id}</td>
                            <td className="py-3 px-3 font-mono font-bold text-[#12141C]">
                              {formatBengaliCurrency(p.amount)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApprovePayment(p)}
                                  className="px-2.5 py-1 bg-[#14935F] text-white rounded text-[11px] font-semibold hover:bg-[#10794e] cursor-pointer"
                                >
                                  অনুমোদন
                                </button>
                                <button
                                  onClick={() => openRejectDialog(p)}
                                  className="px-2.5 py-1 bg-[#FDE9E7] text-[#B8322B] rounded text-[11px] font-semibold hover:bg-[#fbd0cb] cursor-pointer"
                                >
                                  বাতিল
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: THEME MANAGEMENT (With Multi-Image Gallery Support)       */}
        {/* ================================================================ */}
        {activeTab === 'themes' && (
          <div className="space-y-8" ref={formTopRef}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#12141C]">থিম ম্যানেজমেন্ট</h1>
                <p className="text-xs text-[#7A819A] mt-0.5">
                  থিম যোগ করুন, থাম্বনেইল ও প্রিভিউ গ্যালারির একাধিক ছবি আপলোড করুন
                </p>
              </div>

              {isEditing && (
                <button
                  onClick={resetThemeForm}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#12141C] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন থিম ফর্ম তৈরি করুন</span>
                </button>
              )}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Form Card                                                    */}
            {/* ------------------------------------------------------------ */}
            <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E7F0]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-[#E8473F]/10 text-[#E8473F] flex items-center justify-center font-bold text-xs">
                    {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <h2 className="text-base font-bold text-[#12141C]">
                    {isEditing ? 'থিম এডিট করুন' : 'নতুন থিম যোগ করুন'}
                  </h2>
                </div>
                {isEditing && (
                  <span className="text-xs text-[#7A819A] font-mono">
                    ID: {editingThemeId}
                  </span>
                )}
              </div>

              {formError && (
                <div className="bg-[#FDE9E7] border border-[#F8B4B4] text-[#B8322B] rounded-lg p-3 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitTheme} className="space-y-5">
                {/* 1. Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      থিমের নাম <span className="text-[#E8473F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: শপোরা"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      ক্যাটাগরি <span className="text-[#E8473F]">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px] bg-white cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Short Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#12141C]">
                    ছোট বিবরণ (Short Description)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="থিমের মূল ফিচার ও বিবরণ লিখুন..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C]"
                  />
                </div>

                {/* 3. Live Preview Link */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#12141C]">
                    লাইভ প্রিভিউ লিংক (Live Preview URL) <span className="text-[#E8473F]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://demo.example.com/shopora"
                      value={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] font-mono focus:outline-none focus:border-[#12141C] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={handleTestLink}
                      className="px-4 py-2.5 bg-white border border-[#E4E7F0] hover:border-[#12141C] text-[#12141C] rounded-[10px] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>লিংক টেস্ট করুন</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A819A]">
                    এই লিংক নতুন ট্যাবে খুলবে। গ্যালারির ছবিগুলো প্রিভিউ পেজে দেখাবে।
                  </p>
                </div>

                {/* 4. Main Thumbnail Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#12141C]">
                    মূল ছবি / থাম্বনেইল (themes.thumbnail_url) <span className="text-[#E8473F]">*</span>
                  </label>

                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-[#CBD2E1] hover:border-[#12141C] rounded-[14px] p-4 text-center cursor-pointer transition-colors bg-[#F8FAFC] flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden group"
                  >
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />

                    {thumbnailPreview ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail Preview"
                          className="w-24 h-16 rounded-lg object-cover border border-[#E4E7F0] shadow-xs"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-[#12141C]">মূল ছবি নির্বাচিত</p>
                          <p className="text-[11px] text-[#7A819A] group-hover:underline">
                            ছবি পরিবর্তন করতে ক্লিক করুন
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                        <p className="text-xs font-semibold text-[#12141C]">
                          মূল থাম্বনেইল ছবি বেছে নিন বা ড্র্যাগ করুন
                        </p>
                        <p className="text-[11px] text-[#7A819A]">
                          JPG, PNG বা WEBP (সর্বোচ্চ ৫ MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. MULTI-IMAGE PREVIEW GALLERY UPLOAD (New Feature) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      প্রিভিউ গ্যালারি ছবি (একাধিক - themes.gallery_urls)
                    </label>
                    <span className="text-[11px] text-[#7A819A]">
                      ({toBengaliNumber(galleryItems.length)} / ১০টি ছবি)
                    </span>
                  </div>

                  <div
                    onClick={() => galleryInputRef.current?.click()}
                    className="border-2 border-dashed border-[#CBD2E1] hover:border-[#12141C] rounded-[14px] p-4 text-center cursor-pointer transition-colors bg-[#F8FAFC] flex flex-col items-center justify-center min-h-[90px]"
                  >
                    <input
                      ref={galleryInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleGallerySelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 text-slate-600">
                      <Images className="w-5 h-5 text-[#3B66D6]" />
                      <span className="text-xs font-semibold text-[#12141C]">
                        একসাথে একাধিক স্ক্রিনশট ছবি নির্বাচন করুন
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A819A] mt-0.5">
                      প্রতিটি সর্বোচ্চ ৫ MB, মোট ১০টি ছবি পর্যন্ত গ্যালারিতে থাকবে
                    </p>
                  </div>

                  {/* Gallery Items Grid with Reorder and Remove buttons */}
                  {galleryItems.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                      {galleryItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative group bg-white border border-[#E4E7F0] rounded-[10px] overflow-hidden p-1 shadow-2xs flex flex-col"
                        >
                          <div className="aspect-[4/3] w-full rounded overflow-hidden bg-slate-100">
                            <img
                              src={item.preview}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>

                          {/* Index badge */}
                          <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {index + 1}
                          </span>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGalleryItem(index);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#B8322B] text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Reorder controls */}
                          <div className="flex items-center justify-between pt-1 px-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveGalleryItem(index, 'left');
                              }}
                              className="p-1 text-slate-500 hover:text-[#12141C] disabled:opacity-20 cursor-pointer"
                              title="বামে সরান"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-[#7A819A]">ক্রম</span>
                            <button
                              type="button"
                              disabled={index === galleryItems.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveGalleryItem(index, 'right');
                              }}
                              className="p-1 text-slate-500 hover:text-[#12141C] disabled:opacity-20 cursor-pointer"
                              title="ডানে সরান"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. ZIP File Upload Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#12141C]">
                    ZIP ফাইল আপলোড (theme-zips প্রাইভেট বাকেট) <span className="text-[#E8473F]">*</span>
                  </label>

                  <div
                    onClick={() => zipInputRef.current?.click()}
                    className="border-2 border-dashed border-[#CBD2E1] hover:border-[#12141C] rounded-[14px] p-4 text-center cursor-pointer transition-colors bg-[#F8FAFC] flex flex-col items-center justify-center min-h-[100px] relative overflow-hidden group"
                  >
                    <input
                      ref={zipInputRef}
                      type="file"
                      accept=".zip,application/zip"
                      onChange={handleZipSelect}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <FileArchive className="w-6 h-6 text-amber-500" />
                      {zipFile ? (
                        <div>
                          <p className="text-xs font-bold text-[#14935F] flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" />
                            <span>{zipFile.name}</span>
                          </p>
                          <p className="text-[11px] text-[#7A819A]">
                            সাইজ: {(zipFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      ) : isEditing && existingZipPath ? (
                        <div>
                          <p className="text-xs font-semibold text-[#12141C]">
                            বর্তমানে ZIP ফাইল সংরক্ষিত আছে
                          </p>
                          <p className="text-[11px] text-[#7A819A] font-mono mt-0.5">
                            {existingZipPath}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-[#12141C]">
                            সোর্স কোডের .zip ফাইল নির্বাচন করুন
                          </p>
                          <p className="text-[11px] text-[#7A819A]">
                            শুধুমাত্র .zip ফাইল সমর্থিত
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ZIP Progress Bar */}
                  {zipProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#7A819A] font-semibold">
                        <span>ZIP আপলোড হচ্ছে...</span>
                        <span>{zipProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#14935F] h-full transition-all duration-300"
                          style={{ width: `${zipProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#12141C] rounded border-[#CBD2E1] cursor-pointer"
                  />
                  <label htmlFor="isActiveToggle" className="text-xs font-semibold text-[#12141C] cursor-pointer">
                    সক্রিয় রাখুন (হোম পেজে ও ইউজারদের দেখতে দিন)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E7F0]">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetThemeForm}
                      disabled={savingTheme}
                      className="px-5 py-2.5 border border-[#E4E7F0] rounded-[10px] text-xs font-semibold text-[#4A5068] hover:bg-slate-50 cursor-pointer min-h-[44px]"
                    >
                      বাতিল
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={savingTheme}
                    className="px-6 py-2.5 bg-[#E8473F] hover:bg-[#d63b33] disabled:opacity-60 text-white rounded-[10px] text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
                  >
                    {savingTheme ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{galleryUploading ? 'গ্যালারি ছবি আপলোড হচ্ছে...' : 'সেভ হচ্ছে...'}</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'থিম আপডেট করুন' : 'থিম সেভ করুন'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Theme List Table                                             */}
            {/* ------------------------------------------------------------ */}
            <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#12141C]">
                    সব থিম তালিকা ({toBengaliNumber(filteredThemes.length)})
                  </h2>
                  <p className="text-xs text-[#7A819A]">
                    আপনার সাইটে বর্তমানে যুক্ত থাকা সমস্ত Laravel থিম
                  </p>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-[#7A819A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="থিমের নাম দিয়ে খুঁজুন..."
                      value={themeSearch}
                      onChange={(e) => setThemeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-[#E4E7F0] rounded-[8px] text-xs focus:outline-none focus:border-[#12141C]"
                    />
                  </div>

                  <select
                    value={selectedThemeCatFilter}
                    onChange={(e) => setSelectedThemeCatFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-[#E4E7F0] rounded-[8px] text-xs font-medium text-[#4A5068] cursor-pointer"
                  >
                    <option value="সব">সকল ক্যাটাগরি</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {themesLoading ? (
                <div className="py-12 text-center text-xs text-[#7A819A] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E8473F]" />
                  <span>থিম লোড হচ্ছে...</span>
                </div>
              ) : filteredThemes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-[#12141C]">এখনো কোনো থিম যোগ করা হয়নি।</p>
                  <p className="text-xs text-[#7A819A]">
                    উপরের ফর্ম থেকে নতুন থিম যোগ করলে তা এখানে তালিকাভুক্ত হবে।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E4E7F0] text-[#7A819A]">
                      <tr>
                        <th className="py-3 px-3.5 font-semibold">থাম্বনেইল ও নাম</th>
                        <th className="py-3 px-3.5 font-semibold">ক্যাটাগরি</th>
                        <th className="py-3 px-3.5 font-semibold">লাইভ লিংক</th>
                        <th className="py-3 px-3.5 font-semibold text-center">গ্যালারি</th>
                        <th className="py-3 px-3.5 font-semibold text-center">ZIP</th>
                        <th className="py-3 px-3.5 font-semibold text-center">স্ট্যাটাস</th>
                        <th className="py-3 px-3.5 font-semibold">তারিখ</th>
                        <th className="py-3 px-3.5 font-semibold text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7F0]">
                      {filteredThemes.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-9 rounded-md overflow-hidden bg-slate-100 border border-[#E4E7F0] shrink-0">
                                {t.thumbnail_url ? (
                                  <img
                                    src={t.thumbnail_url}
                                    alt={t.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#12141C]">{t.name}</p>
                                <p className="text-[11px] text-[#7A819A] truncate max-w-[160px]">
                                  {t.description || 'কোনো বিবরণ নেই'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3.5 font-medium text-[#4A5068]">
                            {t.category}
                          </td>

                          <td className="py-3 px-3.5">
                            <a
                              href={t.preview_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#3B66D6] hover:underline font-mono text-[11px]"
                            >
                              <span>ভিজিট</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>

                          {/* Gallery Count */}
                          <td className="py-3 px-3.5 text-center font-mono">
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#4A5068] bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                              <Images className="w-3 h-3 text-[#3B66D6]" />
                              <span>{toBengaliNumber((t.gallery_urls || []).length)}</span>
                            </span>
                          </td>

                          {/* ZIP Status */}
                          <td className="py-3 px-3.5 text-center">
                            {t.zip_path ? (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E3F5EC] text-[#14935F]"
                                title={`সংযুক্ত: ${t.zip_path}`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FDE9E7] text-[#B8322B]">
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>

                          {/* Status Toggle */}
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleThemeStatus(t)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                t.is_active
                                  ? 'bg-[#E3F5EC] text-[#14935F] hover:bg-[#c9efdd]'
                                  : 'bg-slate-100 text-[#7A819A] hover:bg-slate-200'
                              }`}
                              title="ক্লিক করে সক্রিয়/নিষ্ক্রিয় পরিবর্তন করুন"
                            >
                              {t.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </button>
                          </td>

                          <td className="py-3 px-3.5 text-[#7A819A]">
                            {t.created_at ? formatBengaliDate(t.created_at) : 'N/A'}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/theme/${t.id}`}
                                target="_blank"
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#12141C]"
                                title="সাইটে দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleEditThemeClick(t)}
                                className="p-1.5 hover:bg-slate-100 rounded text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                title="এডিট করুন"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteThemeTarget(t)}
                                className="p-1.5 hover:bg-[#FDE9E7] rounded text-[#B8322B] transition-colors cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: PAYMENTS VERIFICATION                                     */}
        {/* ================================================================ */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#12141C]">পেমেন্ট যাচাই</h1>
                <p className="text-xs text-[#7A819A] mt-0.5">
                  গ্রাহকদের জমা দেওয়া bKash ও Nagad পেমেন্ট অনুমোদন বা বাতিল করুন
                </p>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-[#7A819A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="TrxID বা নম্বর খুঁজুন..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E7F0] rounded-[10px] text-xs focus:outline-none focus:border-[#12141C]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaymentFilter('all')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                  paymentFilter === 'all'
                    ? 'bg-[#12141C] text-white'
                    : 'bg-white text-[#4A5068] border border-[#E4E7F0]'
                }`}
              >
                সব ({toBengaliNumber(payments.length)})
              </button>
              <button
                onClick={() => setPaymentFilter('pending')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                  paymentFilter === 'pending'
                    ? 'bg-[#12141C] text-white'
                    : 'bg-white text-[#4A5068] border border-[#E4E7F0]'
                }`}
              >
                অপেক্ষমাণ ({toBengaliNumber(pendingCount)})
              </button>
              <button
                onClick={() => setPaymentFilter('approved')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                  paymentFilter === 'approved'
                    ? 'bg-[#12141C] text-white'
                    : 'bg-white text-[#4A5068] border border-[#E4E7F0]'
                }`}
              >
                অনুমোদিত ({toBengaliNumber(payments.filter((p) => p.status === 'approved').length)})
              </button>
              <button
                onClick={() => setPaymentFilter('rejected')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                  paymentFilter === 'rejected'
                    ? 'bg-[#12141C] text-white'
                    : 'bg-white text-[#4A5068] border border-[#E4E7F0]'
                }`}
              >
                বাতিল ({toBengaliNumber(payments.filter((p) => p.status === 'rejected').length)})
              </button>
            </div>

            <div className="bg-white border border-[#E4E7F0] rounded-[18px] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E4E7F0] text-[#7A819A]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ইউজার ও ইমেইল</th>
                      <th className="py-3 px-4 font-semibold">মেথড</th>
                      <th className="py-3 px-4 font-semibold">প্রেরকের নম্বর</th>
                      <th className="py-3 px-4 font-semibold">TrxID</th>
                      <th className="py-3 px-4 font-semibold">পরিমাণ</th>
                      <th className="py-3 px-4 font-semibold">তারিখ</th>
                      <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                      <th className="py-3 px-4 font-semibold text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7F0]">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-sm text-[#12141C]">
                            {p.user?.full_name || 'ইউজার'}
                          </p>
                          <p className="text-[11px] text-[#7A819A]">{p.user?.email || 'N/A'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.method === 'bkash'
                                ? 'bg-[#FDEAF3] text-[#E2136E]'
                                : 'bg-[#FEF1E0] text-[#F6921E]'
                            }`}
                          >
                            {p.method === 'bkash' ? 'bKash' : 'Nagad'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium">{p.sender_number}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#12141C]">{p.trx_id}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#12141C]">
                          {formatBengaliCurrency(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-[#7A819A]">
                          {formatBengaliDate(p.created_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'approved' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E3F5EC] text-[#14935F]">
                              অনুমোদিত
                            </span>
                          )}
                          {p.status === 'pending' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF3DB] text-[#7A4B00]">
                              অপেক্ষমাণ
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDE9E7] text-[#B8322B]">
                                বাতিল
                              </span>
                              {p.admin_note && (
                                <p className="text-[10px] text-[#7A819A] mt-1 max-w-[150px] truncate" title={p.admin_note}>
                                  নোট: {p.admin_note}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApprovePayment(p)}
                                className="px-3 py-1.5 bg-[#14935F] hover:bg-[#10794e] text-white rounded-[8px] text-xs font-semibold cursor-pointer"
                              >
                                অনুমোদন
                              </button>
                              <button
                                onClick={() => openRejectDialog(p)}
                                className="px-3 py-1.5 bg-[#FDE9E7] hover:bg-[#fbd0cb] text-[#B8322B] rounded-[8px] text-xs font-semibold cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#7A819A] italic">সম্পন্ন</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: SETTINGS                                                  */}
        {/* ================================================================ */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-3xl pb-16">
            <div>
              <h1 className="text-2xl font-bold text-[#12141C]">ওয়েবসাইট সেটিংস</h1>
              <p className="text-xs text-[#7A819A] mt-0.5">
                বিকাশ/নগদ নম্বর, প্যাকেজ মূল্য, আনলক শিরোনাম ও হোম পেজের সেটআপ ভিডিও পরিচালনা করুন
              </p>
            </div>

            {settingsSaved && (
              <div className="bg-[#E3F5EC] border border-[#A7E5C7] text-[#14935F] rounded-[14px] p-4 text-xs flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-medium">সেটিংস সফলভাবে সংরক্ষিত হয়েছে! হোম পেজের তথ্য সাথে সাথে আপডেট হয়েছে।</span>
              </div>
            )}

            {/* CARD 1: GENERAL & PAYMENT SETTINGS */}
            <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E4E7F0]">
                <div className="w-10 h-10 rounded-[10px] bg-[#FDE9E7] text-[#E8473F] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#12141C]">পেমেন্ট ও আনলক সেটিংস</h2>
                  <p className="text-xs text-[#7A819A]">
                    ব্র্যান্ডের নাম, ফুল প্যাকের মূল্য, আনলক ব্যানার এবং বিকাশ ও নগদ নম্বর
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#12141C]">
                    ব্র্যান্ডের নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.brand_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brand_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px]"
                  />
                  <p className="text-[11px] text-[#7A819A]">ওয়েবসাইটের লোগো ও ফুটারের ব্র্যান্ড নাম হিসেবে প্রদর্শিত হবে।</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      ফুল প্যাকের মূল্য (টাকা)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settingsForm.price}
                      onChange={(e) => setSettingsForm({ ...settingsForm, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px] font-mono"
                    />
                    <p className="text-[11px] text-[#7A819A]">হোম পেজ ও পেমেন্ট পেজে স্বয়ংক্রিয়ভাবে আপডেট হবে।</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      আনলক ব্যানারের শিরোনাম
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.unlock_title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, unlock_title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px]"
                    />
                    <p className="text-[11px] text-[#7A819A]">হোম পেজের হিরো বাটন ও বটম ব্যানারের মূল শিরোনাম।</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      bKash পার্সোনাল নম্বর
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.bkash_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, bkash_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px] font-mono"
                    />
                    <p className="text-[11px] text-[#7A819A]">পেমেন্ট পেজে গ্রাহকদের bKash সেন্ড মানির জন্য প্রদর্শিত হবে।</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#12141C]">
                      Nagad পার্সোনাল নম্বর
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.nagad_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, nagad_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px] font-mono"
                    />
                    <p className="text-[11px] text-[#7A819A]">পেমেন্ট পেজে গ্রাহকদের Nagad সেন্ড মানির জন্য প্রদর্শিত হবে।</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#E8473F] hover:bg-[#d63b33] text-white rounded-[10px] text-xs font-semibold shadow-xs cursor-pointer min-h-[44px]"
                  >
                    পেমেন্ট সেটিংস সেভ করুন
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: SETUP VIDEO CARD */}
            <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4E7F0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <Play className="w-5 h-5 fill-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#12141C]">সেটআপ ভিডিও</h2>
                    <p className="text-xs text-[#7A819A]">
                      হোম পেজের "কীভাবে সেটআপ করবেন (ভিডিও দেখুন)" সেকশনের ভিডিও লিংক
                    </p>
                  </div>
                </div>
              </div>

              {/* Informative Help Box */}
              <div className="bg-slate-50 border border-[#E4E7F0] rounded-[12px] p-4 text-xs text-[#4A5068] space-y-1.5">
                <p className="font-semibold text-[#12141C] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#14935F]" />
                  ভিডিও ব্যবস্থাপনা সংক্রান্ত তথ্য:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[#7A819A] text-[11px]">
                  <li>কোড থেকে পূর্বের নমুনা ভিডিও (Rick Astley) সম্পূর্ণ সরিয়ে দেওয়া হয়েছে।</li>
                  <li>ভিডিও লিংক Supabase-এর settings টেবিল (id = 1) থেকে সরাসরি হোম পেজে লোড হবে।</li>
                  <li>সমর্থিত লিংক: YouTube (watch, shorts, embed, youtu.be) অথবা সরাসরি .mp4 ভিডিও লিংক।</li>
                  <li>লিংক খালি রাখলে হোম পেজের ফ্রেমটিতে সুন্দর নোটিশ ("ভিডিও শীঘ্রই আসছে") প্রদর্শিত হবে।</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#12141C]">
                    ভিডিও লিংক (settings.video_url)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... বা https://youtu.be/... বা .mp4 লিংক"
                      value={settingsForm.video_url}
                      onChange={(e) => setSettingsForm({ ...settingsForm, video_url: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 rounded-[10px] border border-[#E4E7F0] text-sm text-[#12141C] focus:outline-none focus:border-[#12141C] min-h-[44px] font-mono"
                    />
                    {settingsForm.video_url && (
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, video_url: '' })}
                        className="px-3.5 py-2 border border-[#E4E7F0] hover:bg-[#FDE9E7] hover:text-[#B8322B] text-slate-500 rounded-[10px] text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                        title="লিংক মুছে ফেলুন"
                      >
                        ক্লিয়ার করুন
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#12141C]">লাইভ প্রিভিউ (হোম পেজে যেভাবে দেখাবে):</p>
                  <div className="w-full aspect-video rounded-[14px] overflow-hidden bg-[#12141C] border border-[#E4E7F0] shadow-sm relative">
                    {(() => {
                      const embed = getAdminVideoEmbed(settingsForm.video_url);
                      if (embed.type === 'youtube' && embed.src) {
                        return (
                          <iframe
                            src={embed.src}
                            title="সেটআপ ভিডিও প্রিভিউ"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      }
                      if (embed.type === 'video' && embed.src) {
                        return (
                          <video src={embed.src} controls className="w-full h-full object-contain">
                            ভিডিও সমর্থিত নয়
                          </video>
                        );
                      }
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                          <VideoOff className="w-8 h-8 text-slate-500 mb-2" />
                          <p className="text-sm font-semibold text-slate-300">কোনো ভিডিও লিংক যুক্ত করা হয়নি</p>
                          <p className="text-xs text-slate-500 max-w-sm mt-1">
                            উপরে YouTube বা MP4 ভিডিও লিংক বসালে তাৎক্ষণিকভাবে এখানে প্রিভিউ চালু হবে।
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={savingVideo}
                    onClick={handleSaveVideoSettings}
                    className="px-6 py-2.5 bg-[#E8473F] hover:bg-[#d63b33] disabled:opacity-50 text-white rounded-[10px] text-xs font-semibold shadow-xs cursor-pointer min-h-[44px] flex items-center gap-2"
                  >
                    {savingVideo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>সেটআপ ভিডিও সেভ করুন</span>
                  </button>

                  {settingsForm.video_url && (
                    <button
                      type="button"
                      onClick={async () => {
                        setSettingsForm({ ...settingsForm, video_url: '' });
                        const success = await updateSettings({ video_url: '' });
                        if (success) {
                          setSettingsSaved(true);
                          showToast('সেটআপ ভিডিও লিংক মুছে ফেলা হয়েছে!', 'info');
                          setTimeout(() => setSettingsSaved(false), 3000);
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold text-[#B8322B] hover:bg-[#FDE9E7] rounded-[10px] transition-colors cursor-pointer"
                    >
                      ভিডিও সম্পূর্ণ সরিয়ে ফেলুন
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* DIALOG: CONFIRM DELETE THEME                                       */}
      {/* ------------------------------------------------------------------ */}
      {deleteThemeTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="w-11 h-11 rounded-full bg-[#FDE9E7] text-[#B8322B] flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#12141C]">আপনি কি নিশ্চিত?</h3>
              <p className="text-xs text-[#7A819A]">
                <strong>"{deleteThemeTarget.name}"</strong> থিমটি এবং সংশ্লিষ্ট থাম্বনেইল, গ্যালারির সব ছবি ও ZIP ফাইল চিরতরে মুছে যাবে।
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteThemeTarget(null)}
                className="px-4 py-2 border border-[#E4E7F0] rounded-lg text-xs font-semibold text-[#4A5068] hover:bg-slate-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTheme}
                className="px-5 py-2 bg-[#B8322B] hover:bg-[#992822] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DIALOG: REJECT PAYMENT                                             */}
      {/* ------------------------------------------------------------------ */}
      {rejectModalOpen && selectedPaymentForReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E7F0]">
              <h3 className="font-bold text-base text-[#12141C]">
                পেমেন্ট বাতিল করার কারণ
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#4A5068]">
                গ্রাহক TrxID: <strong className="font-mono">{selectedPaymentForReject.trx_id}</strong>
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#12141C]">
                  অ্যাডমিন নোট (গ্রাহককে দেখানো হবে)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4E7F0] text-xs focus:outline-none focus:border-[#12141C]"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-[#7A819A]">দ্রুত কারণ নির্বাচন করুন:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRejectReason('TrxID মেলেনি, সঠিক TrxID দিয়ে আবার জমা দিন।')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-[#4A5068] cursor-pointer"
                  >
                    TrxID মেলেনি
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectReason('পেমেন্টের পরিমাণ সঠিক নয়।')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-[#4A5068] cursor-pointer"
                  >
                    পরিমাণ কম
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectReason('টাকা একাউন্টে জমা হয়নি।')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-[#4A5068] cursor-pointer"
                  >
                    জমা হয়নি
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E7F0]">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-[#E4E7F0] rounded-lg text-xs font-semibold text-[#4A5068] cursor-pointer"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-[#B8322B] hover:bg-[#992822] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
