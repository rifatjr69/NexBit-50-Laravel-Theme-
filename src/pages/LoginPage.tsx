import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, signUp } = useAuth();
  const { settings } = useSettings();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirectPath = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'লগইন ব্যর্থ হয়েছে।');
        } else {
          navigate(redirectPath, { replace: true });
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, fullName, phone);
        if (!res.success) {
          setErrorMsg(res.error || 'সাইন আপ ব্যর্থ হয়েছে।');
        } else {
          navigate(redirectPath, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'একটি সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@nexbit.live');
      setPassword('admin123');
      await login('admin@nexbit.live', 'admin123');
      navigate('/admin');
    } else {
      setEmail('user@nexbit.live');
      setPassword('user123');
      await login('user@nexbit.live', 'user123');
      navigate(redirectPath);
    }
  };

  return (
    <div className="min-h-[80dvh] flex flex-col justify-center items-center py-8 sm:py-12 px-3 sm:px-6 animate-fade-in-up">
      <div className="w-full max-w-md space-y-5 sm:space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#12141C] flex items-center justify-center text-white font-bold text-xl shadow-sm">
              N
            </div>
            <span className="text-2xl font-extrabold text-[#12141C] tracking-tight">
              {settings.brand_name || 'Nexbit Live'}
            </span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-[#12141C]">
            {mode === 'login' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7A819A] mt-1 font-medium">
            {mode === 'login'
              ? '৫০+ Laravel ওয়েবসাইট থিম এক্সেস করতে লগইন করুন'
              : 'মাত্র এক মিনিটের মধ্যে রেজিস্ট্রেশন সম্পন্ন করুন'}
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white border border-[#E4E7F0] rounded-[20px] p-5 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
          {/* Tabs: Login vs Sign Up (Min 48px touch targets) */}
          <div className="grid grid-cols-2 p-1 bg-[#F1F3F9] rounded-[12px] gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-3 min-h-[48px] rounded-[10px] text-sm font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#12141C] shadow-xs'
                  : 'text-[#4A5068] hover:text-[#12141C]'
              }`}
            >
              লগইন
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`py-3 min-h-[48px] rounded-[10px] text-sm font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#12141C] shadow-xs'
                  : 'text-[#4A5068] hover:text-[#12141C]'
              }`}
            >
              নতুন অ্যাকাউন্ট
            </button>
          </div>

          {errorMsg && (
            <div className="bg-[#FDE9E7] border border-[#F9C3BE] text-[#B8322B] rounded-xl p-3 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-[#12141C]">
                  আপনার পূর্ণ নাম <span className="text-[#E8473F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="যেমন: মোঃ সাকিব হাসান"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 min-h-[52px] rounded-[12px] border border-[#E4E7F0] text-base text-[#12141C] placeholder:text-slate-400 focus:outline-none focus:border-[#12141C] focus:ring-1 focus:ring-[#12141C] transition-all bg-white"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-[#12141C]">
                ইমেইল এড্রেস <span className="text-[#E8473F]">*</span>
              </label>
              <input
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 min-h-[52px] rounded-[12px] border border-[#E4E7F0] text-base text-[#12141C] placeholder:text-slate-400 focus:outline-none focus:border-[#12141C] focus:ring-1 focus:ring-[#12141C] transition-all bg-white font-sans"
              />
            </div>

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-[#12141C]">
                  ফোন নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 min-h-[52px] rounded-[12px] border border-[#E4E7F0] text-base text-[#12141C] placeholder:text-slate-400 focus:outline-none focus:border-[#12141C] focus:ring-1 focus:ring-[#12141C] transition-all bg-white font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-semibold text-[#12141C]">
                  পাসওয়ার্ড <span className="text-[#E8473F]">*</span>
                </label>
                {mode === 'login' && (
                  <span className="text-xs text-[#7A819A]">পাসওয়ার্ড ভুলে গেছেন?</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 pr-12 py-3 min-h-[52px] rounded-[12px] border border-[#E4E7F0] text-base text-[#12141C] placeholder:text-slate-400 focus:outline-none focus:border-[#12141C] focus:ring-1 focus:ring-[#12141C] transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 min-h-[52px] bg-[#E8473F] hover:bg-[#d63b33] active:scale-[0.98] text-white rounded-[12px] font-bold text-base transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{mode === 'login' ? 'লগইন করুন' : 'অ্যাকাউন্ট খুলুন'}</span>
            </button>
          </form>

          {/* Instant Demo Accounts Helper */}
          <div className="pt-4 border-t border-[#E4E7F0] space-y-2.5">
            <p className="text-[11px] sm:text-xs text-[#7A819A] text-center font-medium">
              দ্রুত টেস্ট করতে নিচের যেকোনো বাটনে ট্যাপ করুন:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="py-2.5 px-3 min-h-[48px] bg-slate-50 hover:bg-slate-100 border border-[#E4E7F0] rounded-[10px] text-xs font-semibold text-[#12141C] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>সাধারণ ইউজার</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2.5 px-3 min-h-[48px] bg-slate-50 hover:bg-slate-100 border border-[#E4E7F0] rounded-[10px] text-xs font-semibold text-[#12141C] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#14935F]" />
                <span>অ্যাডমিন ডেমো</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
