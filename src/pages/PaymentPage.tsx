import React, { useState, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { submitPayment } from '../services/dataService';
import { formatBengaliCurrency, formatShortBengaliDate } from '../utils/bengali';
import { Copy, Check, CheckCircle2, AlertCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const { user, loading, hasApprovedPayment, userPayments, refreshPayments } = useAuth();
  const { settings } = useSettings();

  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const formAlertRef = useRef<HTMLDivElement>(null);

  // Auth guard: must be logged in
  if (!loading && !user) {
    return <Navigate to="/login?redirect=/payment" replace />;
  }

  const targetNumber = method === 'bkash'
    ? (settings.bkash_number || '01647651231')
    : (settings.nagad_number || '01647651231');

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(targetNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!senderNumber.trim()) {
      setErrorMsg('অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন।');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('অনুগ্রহ করে Transaction ID (TrxID) লিখুন।');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitPayment({
        user_id: user!.id,
        method,
        sender_number: senderNumber.trim(),
        trx_id: trxId.trim().toUpperCase(),
        amount: settings.price || 2990,
        user_info: {
          full_name: user?.full_name,
          email: user?.email,
          phone: user?.phone
        }
      });

      if (!res.success) {
        setErrorMsg(res.error || 'পেমেন্ট জমা দিতে সমস্যা হয়েছে।');
      } else {
        setSuccessMsg('পেমেন্ট সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করলেই প্যাকটি আনলক হবে।');
        setSenderNumber('');
        setTrxId('');
        await refreshPayments();

        // Smooth scroll to success message
        setTimeout(() => {
          formAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'একটি ত্রুটি ঘটেছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-8 space-y-6 sm:space-y-8 pb-16 animate-fade-in-up">
      {/* ------------------------------------------------------------------ */}
      {/* Page Title & Subtitle                                              */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight">
          পেমেন্ট করে আনলক করুন
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-[#7A819A] mt-1 font-medium leading-relaxed">
          একবার পেমেন্ট করলেই ৫০+ Laravel ওয়েবসাইট থিমের ZIP ফাইল ডাউনলোড করতে পারবেন।
        </p>
      </div>

      {/* Already Approved Notice Banner if applicable */}
      {hasApprovedPayment && (
        <div className="bg-[#E3F5EC] border border-[#A7E5C7] text-[#14935F] rounded-[16px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-[#14935F]" />
            <div>
              <p className="font-bold text-sm sm:text-base">আপনার প্যাকেজ ইতিমধ্যে আনলক করা আছে!</p>
              <p className="text-xs sm:text-sm text-[#14935F]/90 mt-0.5">
                আপনি সকল থিমের লাইভ প্রিভিউ ও ZIP ফাইল সরাসরি ডাউনলোড করতে পারেন।
              </p>
            </div>
          </div>
          <Link
            to="/#themes-section"
            className="w-full sm:w-auto text-center px-5 py-2.5 bg-[#14935F] text-white rounded-[10px] text-xs font-bold hover:bg-[#10794e] shrink-0 min-h-[44px] flex items-center justify-center"
          >
            থিম সমূহ দেখুন
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2-Column Content on desktop, Stacked on Mobile                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: 3 Steps */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          {/* STEP 1: Select Method */}
          <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#12141C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                ১
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#12141C]">
                পেমেন্ট মেথড বেছে নিন
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* bKash Card */}
              <button
                type="button"
                onClick={() => setMethod('bkash')}
                className={`p-4 rounded-[14px] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[72px] active:scale-[0.99] ${
                  method === 'bkash'
                    ? 'border-[#E2136E] bg-[#FDEAF3]'
                    : 'border-[#E4E7F0] bg-white hover:border-[#CBD2E1]'
                }`}
              >
                <div>
                  <div className="inline-block px-3 py-1 bg-[#E2136E] text-white text-xs font-bold rounded-[6px] tracking-wide mb-1.5">
                    bKash
                  </div>
                  <p className="text-xs text-[#4A5068] font-medium">
                    bKash অ্যাপ থেকে Send Money
                  </p>
                </div>
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    method === 'bkash'
                      ? 'border-[#E2136E] bg-white'
                      : 'border-[#CBD2E1]'
                  }`}
                >
                  {method === 'bkash' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
                  )}
                </div>
              </button>

              {/* Nagad Card */}
              <button
                type="button"
                onClick={() => setMethod('nagad')}
                className={`p-4 rounded-[14px] border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[72px] active:scale-[0.99] ${
                  method === 'nagad'
                    ? 'border-[#F6921E] bg-[#FEF1E0]'
                    : 'border-[#E4E7F0] bg-white hover:border-[#CBD2E1]'
                }`}
              >
                <div>
                  <div className="inline-block px-3 py-1 bg-[#F6921E] text-white text-xs font-bold rounded-[6px] tracking-wide mb-1.5">
                    Nagad
                  </div>
                  <p className="text-xs text-[#4A5068] font-medium">
                    Nagad অ্যাপ থেকে Send Money
                  </p>
                </div>
                {/* Radio Circle */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    method === 'nagad'
                      ? 'border-[#F6921E] bg-white'
                      : 'border-[#CBD2E1]'
                  }`}
                >
                  {method === 'nagad' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F6921E]" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Send Money to Number */}
          <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#12141C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                ২
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#12141C]">
                এই নম্বরে Send Money করুন
              </h2>
            </div>

            {/* Tinted Box with Large Number and Big Copy Button */}
            <div
              className={`rounded-[16px] p-4 sm:p-5 border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-colors ${
                method === 'bkash'
                  ? 'bg-[#FDEAF3]/70 border-[#FBCFE8]'
                  : 'bg-[#FEF1E0]/70 border-[#FED7AA]'
              }`}
            >
              <div>
                <p className="text-xs text-[#4A5068] font-semibold">
                  {method === 'bkash' ? 'bKash নম্বর (Personal)' : 'Nagad নম্বর (Personal)'}
                </p>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#12141C] tracking-tight mt-1 font-mono">
                  {targetNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyNumber}
                className="w-full sm:w-auto px-5 py-3 min-h-[48px] bg-white border border-[#E4E7F0] hover:border-[#12141C] active:scale-[0.98] text-[#12141C] rounded-[12px] text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#14935F]" />
                    <span className="text-[#14935F]">কপি হয়েছে ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#4A5068]" />
                    <span>নম্বর কপি</span>
                  </>
                )}
              </button>
            </div>

            {/* Amount details */}
            <div className="flex items-center justify-between pt-1 px-1 border-t border-[#E4E7F0]/60">
              <span className="text-xs sm:text-sm font-semibold text-[#4A5068]">প্রদেয় মোট পরিমাণ</span>
              <span className="text-2xl font-extrabold text-[#12141C] font-mono">
                {formatBengaliCurrency(settings.price || 2990)}
              </span>
            </div>
          </div>

          {/* STEP 3: Submission Form */}
          <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#12141C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                ৩
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#12141C]">
                পেমেন্টের তথ্য জমা দিন
              </h2>
            </div>

            <div ref={formAlertRef}>
              {errorMsg && (
                <div className="mb-4 bg-[#FDE9E7] border border-[#F8B4B4] text-[#B8322B] rounded-xl p-3.5 text-xs sm:text-sm flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 bg-[#E3F5EC] border border-[#A7E5C7] text-[#14935F] rounded-xl p-3.5 text-xs sm:text-sm flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sender Number Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sender_number"
                  className="block text-xs sm:text-sm font-semibold text-[#12141C]"
                >
                  যে নম্বর থেকে টাকা পাঠিয়েছেন <span className="text-[#E8473F]">*</span>
                </label>
                <input
                  id="sender_number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="w-full px-4 py-3 min-h-[52px] rounded-[12px] border border-[#E4E7F0] bg-white text-base text-[#12141C] placeholder:text-slate-400 focus:outline-none focus:border-[#12141C] focus:ring-1 focus:ring-[#12141C] transition-colors font-mono"
                  required
                />
              </div>

              {/* TrxID Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="trx_id"
                  className="block text-xs sm:text-sm font-semibold text-[#12141C]"
                >
                  Transaction ID (TrxID) <span className="text-[#E8473F]">*</span>
                </label>
                <input
                  id="trx_id"
                  type="text"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="যেমন: 9A7B3C2D1E"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 min-h-[52px] rounded-[12px] border border-[#E4E7F0] bg-white text-base text-[#12141C] placeholder:text-slate-400 focus:outline-none focus:border-[#12141C] focus:ring-1 focus:ring-[#12141C] uppercase font-mono transition-colors"
                  required
                />
                <p className="text-[11px] text-[#7A819A]">
                  একই TrxID পূর্বে ব্যবহার করা হয়ে থাকলে পুনরায় গ্রহণযোগ্য হবে না।
                </p>
              </div>

              {/* Submit CTA (Min 52px height) */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 min-h-[52px] bg-[#E8473F] hover:bg-[#d63b33] active:scale-[0.98] disabled:opacity-60 text-white rounded-[12px] font-bold text-base transition-colors cursor-pointer shadow-sm text-center flex items-center justify-center gap-2 mt-2"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>{submitting ? 'যাচাই করা হচ্ছে...' : 'পেমেন্ট জমা দিন'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Payment History (Stacked below on mobile) */}
        <div className="lg:col-span-4 w-full">
          <div className="bg-white border border-[#E4E7F0] rounded-[18px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#12141C]">
              আপনার পেমেন্ট ইতিহাস
            </h2>

            {userPayments.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#7A819A] bg-slate-50 rounded-xl p-4 border border-[#E4E7F0]">
                এখনো কোনো পেমেন্ট রেকর্ড নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {userPayments.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-[14px] border border-[#E4E7F0] bg-white space-y-2 hover:border-[#CBD2E1] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm sm:text-base text-[#12141C]">
                          {p.method === 'bkash' ? 'bKash' : 'Nagad'} · {formatBengaliCurrency(p.amount)}
                        </span>

                        {/* Status Badge */}
                        {p.status === 'approved' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E3F5EC] text-[#14935F]">
                            অনুমোদিত
                          </span>
                        )}
                        {p.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF3DB] text-[#7A4B00]">
                            যাচাই চলছে
                          </span>
                        )}
                        {p.status === 'rejected' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDE9E7] text-[#B8322B]">
                            বাতিল
                          </span>
                        )}
                      </div>

                      {/* TrxID & Date */}
                      <p className="text-xs text-[#7A819A] font-mono">
                        TrxID: {p.trx_id} · {formatShortBengaliDate(p.created_at)}
                      </p>

                      {/* Admin Note if Rejected */}
                      {p.status === 'rejected' && p.admin_note && (
                        <div className="mt-2 p-2.5 bg-[#F6F7FB] border border-[#E4E7F0] rounded-lg text-xs text-[#4A5068]">
                          <span className="font-semibold text-[#B8322B]">অ্যাডমিনের নোট:</span>{' '}
                          {p.admin_note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
