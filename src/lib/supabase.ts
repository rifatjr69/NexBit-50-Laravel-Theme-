import { createClient } from '@supabase/supabase-js';
import { Theme, Payment, Settings, Profile } from '../types';

/**
 * ==============================================================================
 * Supabase Client Configuration
 * ==============================================================================
 * To connect to your real Supabase project:
 * 1. Add your Project URL to VITE_SUPABASE_URL in your .env file
 * 2. Add your anon public key to VITE_SUPABASE_ANON_KEY in your .env file
 * 
 * Note: Never expose your service_role secret key in frontend code!
 * ==============================================================================
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Create real client if configured, otherwise provide dummy URL so createClient does not throw
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-app.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key'
);

// Initial settings
export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  bkash_number: '01647651231',
  nagad_number: '01647651231',
  price: 2990,
  unlock_title: '৫০+ Laravel ওয়েবসাইট আনলক করুন',
  video_url: '',
  brand_name: 'Nexbit Live'
};

// Initial 8 themes matching the reference pictures
export const INITIAL_THEMES: Theme[] = [
  {
    id: 'theme-1',
    name: 'শপোরা',
    category: 'ই-কমার্স',
    description: 'আধুনিক ই-কমার্স Laravel থিম। সম্পূর্ণ কার্ট, চেকআউট, পেমেন্ট গেটওয়ে এবং ইনভয়েস সিস্টেম সমন্বিত।',
    thumbnail_url: 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/martfury-multivendor-marketplace-laravel-ecommerce/full_screen_preview/28169996',
    zip_path: 'themes/shopora-v2.1.zip',
    is_active: true,
    accent_color: '#E8473F',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'theme-2',
    name: 'ফোলিও প্রো',
    category: 'পোর্টফোলিও',
    description: 'ফ্রিল্যান্সার ও ক্রিয়েটিভ এজেন্সির জন্য আলট্রা ক্লিন পোর্টফোলিও Laravel থিম। ডার্ক ও লাইট মোড।',
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/elias-react-laravel-personal-portfolio-template/full_screen_preview/35650170',
    zip_path: 'themes/folio-pro-v1.4.zip',
    is_active: true,
    accent_color: '#3B66D6',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'theme-3',
    name: 'বিজনেসলাইন',
    category: 'ব্যবসা',
    description: 'কর্পোরেট কোম্পানি ও পরামর্শক প্রতিষ্ঠানের জন্য দ্রুতগতির প্রফেশনাল Laravel বিজনেস টেমপ্লেট।',
    thumbnail_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/finano-consulting-business-laravel-template/full_screen_preview/32578149',
    zip_path: 'themes/businessline-v3.0.zip',
    is_active: true,
    accent_color: '#15803D',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'theme-4',
    name: 'ক্লিনিকেয়ার',
    category: 'স্বাস্থ্যসেবা',
    description: 'হাসপাতাল, ডেন্টাল ক্লিনিক ও ডাক্তার অ্যাপয়েন্টমেন্ট বুকিং সিস্টেমের জন্য ফুলস্ট্যাক থিম।',
    thumbnail_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/medikit-hospital-management-laravel-system/full_screen_preview/29983451',
    zip_path: 'themes/clinicare-v2.0.zip',
    is_active: true,
    accent_color: '#0E7490',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: 'theme-5',
    name: 'ফুডহাট',
    category: 'রেস্টুরেন্ট',
    description: 'অনলাইন খাবার অর্ডার, টেবিল বুকিং ও কিচেন ড্যাশবোর্ড সহ চমৎকার রেস্তোরাঁ Laravel সমাধান।',
    thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/foody-online-food-delivery-laravel-application/full_screen_preview/31209384',
    zip_path: 'themes/foodhut-v1.8.zip',
    is_active: true,
    accent_color: '#D97706',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'theme-6',
    name: 'এডুস্পেস',
    category: 'শিক্ষা',
    description: 'অনলাইন কোর্স, লাইভ ক্লাস ও লার্নিং ম্যানেজমেন্ট সিস্টেম (LMS) পরিচালনার জন্য স্বয়ংসম্পূর্ণ থিম।',
    thumbnail_url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/educal-online-education-course-laravel-lms/full_screen_preview/34981120',
    zip_path: 'themes/eduspace-v2.4.zip',
    is_active: true,
    accent_color: '#7C3AED',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'theme-7',
    name: 'নিউজপোস্ট',
    category: 'ব্লগ ও নিউজ',
    description: 'সংবাদ পোর্টাল, অনলাইন ম্যাগাজিন ও ভাইরাল ব্লগের জন্য বিজ্ঞাপন-বান্ধব ও উচ্চগতির থিম।',
    thumbnail_url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/newsmag-newspaper-magazine-laravel-theme/full_screen_preview/28491823',
    zip_path: 'themes/newspost-v3.2.zip',
    is_active: true,
    accent_color: '#1E293B',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'theme-8',
    name: 'এস্টেটভিউ',
    category: 'রিয়েল এস্টেট',
    description: 'প্রপার্টি লিস্টিং, রিয়েল এস্টেট এজেন্ট পোর্টাল এবং উন্নত সার্চ ও ম্যাপ ফিল্টারিং সুবিধা।',
    thumbnail_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
    ],
    preview_url: 'https://preview.themeforest.net/item/findhouse-real-estate-laravel-system/full_screen_preview/30129845',
    zip_path: 'themes/estateview-v1.6.zip',
    is_active: true,
    accent_color: '#BE185D',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Initial mock payments matching the 3 sample payments from reference image 3
export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    user_id: 'user-demo-1',
    method: 'bkash',
    sender_number: '01711223344',
    trx_id: '9A7B3C2D1E',
    amount: 2990,
    status: 'approved',
    created_at: new Date('2024-10-12T14:30:00Z').toISOString(),
    reviewed_at: new Date('2024-10-12T15:00:00Z').toISOString(),
    user: {
      full_name: 'সাকিব আল হাসান',
      email: 'sakib@example.com',
      phone: '01711223344'
    }
  },
  {
    id: 'pay-2',
    user_id: 'user-demo-2',
    method: 'nagad',
    sender_number: '01899887766',
    trx_id: '5K2M8P4Q7R',
    amount: 2990,
    status: 'pending',
    created_at: new Date('2024-10-16T18:20:00Z').toISOString(),
    user: {
      full_name: 'তানভীর আহমেদ',
      email: 'tanveer@example.com',
      phone: '01899887766'
    }
  },
  {
    id: 'pay-3',
    user_id: 'user-demo-3',
    method: 'bkash',
    sender_number: '01655443322',
    trx_id: '3X9Y1Z6W2V',
    amount: 2990,
    status: 'rejected',
    admin_note: 'TrxID মেলেনি, সঠিক TrxID দিয়ে আবার জমা দিন।',
    created_at: new Date('2024-10-10T11:15:00Z').toISOString(),
    reviewed_at: new Date('2024-10-10T11:45:00Z').toISOString(),
    user: {
      full_name: 'রাশেদ খান',
      email: 'rashed@example.com',
      phone: '01655443322'
    }
  }
];

// Seed profiles
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'admin-1',
    full_name: 'অ্যাডমিন',
    email: 'admin@nexbit.live',
    phone: '01647651231',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-demo-1',
    full_name: 'ইউজারের নাম',
    email: 'user@nexbit.live',
    phone: '01711223344',
    role: 'user',
    created_at: new Date().toISOString()
  }
];
