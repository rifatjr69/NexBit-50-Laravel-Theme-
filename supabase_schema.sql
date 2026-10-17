-- ==============================================================================
-- Nexbit Live - Complete Supabase Database Setup Script
-- ==============================================================================
-- এই স্ক্রিপ্টটি Supabase Dashboard-এর "SQL Editor"-এ গিয়ে পুরোটা পেস্ট করে "Run" করুন।
-- এতে প্রয়োজনীয় সব টেবিল, RLS সিকিউরিটি পলিসি, অটো-প্রোফাইল ট্রিগার, 
-- স্টোরেজ বাকেট এবং প্রাথমিক ডাটা (থিম ও সেটিংস) একসাথেই তৈরি হয়ে যাবে।
-- ==============================================================================

-- ১. প্রয়োজনীয় এক্সটেনশন সক্রিয় করা
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ২. Profiles টেবিল তৈরি (ইউজার ও অ্যাডমিন রোল)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৩. Themes টেবিল তৈরি (Laravel থিম সমূহ)
CREATE TABLE IF NOT EXISTS public.themes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'ই-কমার্স',
    thumbnail_url TEXT,
    preview_url TEXT,
    zip_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    accent_color TEXT DEFAULT '#E8473F',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ৪. Payments টেবিল তৈরি (bKash ও Nagad পেমেন্ট ট্র্যাকিং)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('bkash', 'nagad')),
    sender_number TEXT NOT NULL,
    trx_id TEXT NOT NULL UNIQUE,
    amount NUMERIC NOT NULL DEFAULT 2990,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ৫. Settings টেবিল তৈরি (id সবসময় ১ থাকবে)
CREATE TABLE IF NOT EXISTS public.settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    bkash_number TEXT NOT NULL DEFAULT '01647651231',
    nagad_number TEXT NOT NULL DEFAULT '01647651231',
    price NUMERIC NOT NULL DEFAULT 2990,
    unlock_title TEXT NOT NULL DEFAULT '৫০+ Laravel ওয়েবসাইট আনলক করুন',
    video_url TEXT DEFAULT '',
    brand_name TEXT NOT NULL DEFAULT 'Nexbit Live'
);

-- ==============================================================================
-- ৬. ডিফল্ট সেটিংস ও প্রারম্ভিক থিম ডাটা ইনসার্ট
-- ==============================================================================

INSERT INTO public.settings (id, bkash_number, nagad_number, price, unlock_title, video_url, brand_name)
VALUES (1, '01647651231', '01647651231', 2990, '৫০+ Laravel ওয়েবসাইট আনলক করুন', '', 'Nexbit Live')
ON CONFLICT (id) DO NOTHING;

-- প্রাথমিক ৮টি থিম ইনসার্ট
INSERT INTO public.themes (id, name, category, description, thumbnail_url, preview_url, zip_path, is_active, accent_color)
VALUES 
    ('theme-1', 'শপোরা', 'ই-কমার্স', 'আধুনিক ই-কমার্স Laravel থিম। সম্পূর্ণ কার্ট, চেকআউট, পেমেন্ট গেটওয়ে এবং ইনভয়েস সিস্টেম সমন্বিত।', 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/martfury-multivendor-marketplace-laravel-ecommerce/full_screen_preview/28169996', 'themes/shopora-v2.1.zip', true, '#E8473F'),
    ('theme-2', 'ফোলিও প্রো', 'পোর্টফোলিও', 'ফ্রিল্যান্সার ও ক্রিয়েটিভ এজেন্সির জন্য আলট্রা ক্লিন পোর্টফোলিও Laravel থিম। ডার্ক ও লাইট মোড।', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/elias-react-laravel-personal-portfolio-template/full_screen_preview/35650170', 'themes/folio-pro-v1.4.zip', true, '#3B66D6'),
    ('theme-3', 'বিজনেসলাইন', 'ব্যবসা', 'কর্পোরেট কোম্পানি ও পরামর্শক প্রতিষ্ঠানের জন্য দ্রুতগতির প্রফেশনাল Laravel বিজনেস টেমপ্লেট।', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/finano-consulting-business-laravel-template/full_screen_preview/32578149', 'themes/businessline-v3.0.zip', true, '#15803D'),
    ('theme-4', 'ক্লিনিকেয়ার', 'স্বাস্থ্যসেবা', 'হাসপাতাল, ডেন্টাল ক্লিনিক ও ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং সিস্টেমের জন্য ফুলস্ট্যাক থিম।', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/medikit-hospital-management-laravel-system/full_screen_preview/29983451', 'themes/clinicare-v2.0.zip', true, '#0E7490'),
    ('theme-5', 'ফুডহাট', 'রেস্টুরেন্ট', 'অনলাইন খাবার অর্ডার, টেবিল বুকিং ও কিচেন ড্যাশবোর্ড সহ চমৎকার রেস্তোরাঁ Laravel সমাধান।', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/foody-online-food-delivery-laravel-application/full_screen_preview/31209384', 'themes/foodhut-v1.8.zip', true, '#D97706'),
    ('theme-6', 'এডুস্পেস', 'শিক্ষা', 'অনলাইন কোর্স, লাইভ ক্লাস ও লার্নিং ম্যানেজমেন্ট সিস্টেম (LMS) পরিচালনার জন্য স্বয়ংসম্পূর্ণ থিম।', 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/educal-online-education-course-laravel-lms/full_screen_preview/34981120', 'themes/eduspace-v2.4.zip', true, '#7C3AED'),
    ('theme-7', 'নিউজপোস্ট', 'ব্লগ ও নিউজ', 'সংবাদ পোর্টাল, অনলাইন ম্যাগাজিন ও ভাইরাল ব্লগের জন্য বিজ্ঞাপন-বান্ধব ও উচ্চগতির থিম।', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/newsmag-newspaper-magazine-laravel-theme/full_screen_preview/28491823', 'themes/newspost-v3.2.zip', true, '#1E293B'),
    ('theme-8', 'এস্টেটভিউ', 'রিয়েল এস্টেট', 'প্রপার্টি লিস্টিং, রিয়েল এস্টেট এজেন্ট পোর্টাল এবং উন্নত সার্চ ও ম্যাপ ফিল্টারিং সুবিধা।', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80', 'https://preview.themeforest.net/item/findhouse-real-estate-laravel-system/full_screen_preview/30129845', 'themes/estateview-v1.6.zip', true, '#BE185D')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ৭. Supabase Auth থেকে Profiles-এ স্বয়ংক্রিয় ডাটা সিঙ্ক ট্রিগার
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ৮. Row Level Security (RLS) সক্রিয় ও পলিসি কনফিগারেশন
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- হেল্পার ফাংশন: বর্তমান ইউজার অ্যাডমিন কি না যাচাই
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Profiles Policies ---
CREATE POLICY "Public profiles are viewable by everyone or owner"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

-- --- Themes Policies ---
CREATE POLICY "Active themes viewable by everyone"
ON public.themes FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can insert themes"
ON public.themes FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update themes"
ON public.themes FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete themes"
ON public.themes FOR DELETE
USING (public.is_admin());

-- --- Payments Policies ---
CREATE POLICY "Users can view own payments or admin view all"
ON public.payments FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Authenticated users can submit payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update payments"
ON public.payments FOR UPDATE
USING (public.is_admin());

-- --- Settings Policies ---
CREATE POLICY "Anyone can view settings"
ON public.settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can update settings"
ON public.settings FOR UPDATE
USING (public.is_admin());

-- ==============================================================================
-- ৯. Storage বাকেট তৈরি (theme-images ও theme-zips)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('theme-images', 'theme-images', true),
    ('theme-zips', 'theme-zips', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public read for theme images"
ON storage.objects FOR SELECT
USING (bucket_id = 'theme-images');

CREATE POLICY "Admins can upload theme images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'theme-images' AND public.is_admin());

CREATE POLICY "Admins can upload theme zips"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'theme-zips' AND public.is_admin());

CREATE POLICY "Users with approved payments can read theme zips"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'theme-zips' AND (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.payments 
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  )
);
