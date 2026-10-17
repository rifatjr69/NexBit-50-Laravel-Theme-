import { supabase, isSupabaseConfigured, DEFAULT_SETTINGS, INITIAL_THEMES, INITIAL_PAYMENTS, INITIAL_PROFILES } from '../lib/supabase';
import { Theme, Payment, Settings, Profile } from '../types';

// Local storage keys for persistent mock data when Supabase is not yet connected
const STORAGE_KEYS = {
  SETTINGS: 'nexbit_settings',
  THEMES: 'nexbit_themes',
  PAYMENTS: 'nexbit_payments',
  PROFILES: 'nexbit_profiles',
  AUTH_USER_ID: 'nexbit_current_user_id'
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
}

// Initialize mock storage if empty
// Initialize mock storage if empty or migrate
export function initMockStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  } else {
    // Purge old hardcoded sample Rick Astley video if previously cached
    try {
      const stored = getLocalData<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      if (stored && stored.video_url && stored.video_url.includes('dQw4w9WgXcQ')) {
        stored.video_url = '';
        setLocalData(STORAGE_KEYS.SETTINGS, stored);
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.THEMES)) {
    setLocalData(STORAGE_KEYS.THEMES, INITIAL_THEMES);
  } else {
    // Migrate gallery_urls for initial themes if missing
    try {
      const stored = getLocalData<Theme[]>(STORAGE_KEYS.THEMES, []);
      let changed = false;
      const updated = stored.map((t) => {
        if (!t.gallery_urls || t.gallery_urls.length === 0) {
          const match = INITIAL_THEMES.find((init) => init.id === t.id);
          if (match?.gallery_urls) {
            changed = true;
            return { ...t, gallery_urls: match.gallery_urls };
          }
        }
        return t;
      });
      if (changed) {
        setLocalData(STORAGE_KEYS.THEMES, updated);
      }
    } catch {
      // ignore
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    setLocalData(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    setLocalData(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }
}

// -----------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------
export async function fetchSettings(): Promise<Settings> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (!error && data) {
        return {
          ...DEFAULT_SETTINGS,
          ...data
        };
      }
    } catch (e) {
      console.warn('Supabase settings query error, falling back to local', e);
    }
  }
  return getLocalData<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await fetchSettings();
  const updated: Settings = { ...current, ...updates, id: 1 };

  if (isSupabaseConfigured) {
    try {
      // First try update query which conforms with RLS UPDATE policy on settings
      const { data: updateData, error: updateErr } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', 1)
        .select()
        .single();
      if (!updateErr && updateData) {
        setLocalData(STORAGE_KEYS.SETTINGS, updateData);
        return updateData;
      }

      // If update returned error or row 1 doesn't exist yet, attempt upsert
      const { data, error } = await supabase
        .from('settings')
        .upsert(updated)
        .select()
        .single();
      if (!error && data) {
        setLocalData(STORAGE_KEYS.SETTINGS, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase settings upsert error, falling back to local', e);
    }
  }

  setLocalData(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// -----------------------------------------------------------------------------
// Themes
// -----------------------------------------------------------------------------
export async function fetchThemes(includeInactive = false): Promise<Theme[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('themes').select('*').order('created_at', { ascending: false });
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase themes query error, falling back to local', e);
    }
  }

  const themes = getLocalData<Theme[]>(STORAGE_KEYS.THEMES, INITIAL_THEMES);
  if (!includeInactive) {
    return themes.filter((t) => t.is_active);
  }
  return themes;
}

export async function fetchThemeById(id: string): Promise<Theme | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase theme by id error, falling back to local', e);
    }
  }

  const themes = getLocalData<Theme[]>(STORAGE_KEYS.THEMES, INITIAL_THEMES);
  return themes.find((t) => t.id === id) || null;
}

export async function createTheme(themeData: Omit<Theme, 'id' | 'created_at'>): Promise<Theme> {
  const newTheme: Theme = {
    ...themeData,
    id: 'theme-' + Date.now(),
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert([newTheme])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase create theme error, falling back to local', e);
    }
  }

  const themes = getLocalData<Theme[]>(STORAGE_KEYS.THEMES, INITIAL_THEMES);
  const updated = [newTheme, ...themes];
  setLocalData(STORAGE_KEYS.THEMES, updated);
  return newTheme;
}

export async function updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase update theme error, falling back to local', e);
    }
  }

  const themes = getLocalData<Theme[]>(STORAGE_KEYS.THEMES, INITIAL_THEMES);
  const index = themes.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updatedTheme = { ...themes[index], ...updates };
  themes[index] = updatedTheme;
  setLocalData(STORAGE_KEYS.THEMES, themes);
  return updatedTheme;
}

export async function deleteTheme(id: string): Promise<boolean> {
  // First fetch theme to clean up storage assets if possible
  const themeToDelete = await fetchThemeById(id);

  if (isSupabaseConfigured) {
    try {
      // Remove DB row
      const { error } = await supabase.from('themes').delete().eq('id', id);

      // Attempt to clean up storage files
      if (themeToDelete) {
        if (themeToDelete.thumbnail_url) {
          const imagePath = extractStoragePathFromUrl(themeToDelete.thumbnail_url, 'theme-images');
          if (imagePath) {
            await supabase.storage.from('theme-images').remove([imagePath]);
          }
        }
        if (themeToDelete.gallery_urls && themeToDelete.gallery_urls.length > 0) {
          const galleryPaths = themeToDelete.gallery_urls
            .map((url) => extractStoragePathFromUrl(url, 'theme-images'))
            .filter(Boolean) as string[];
          if (galleryPaths.length > 0) {
            await supabase.storage.from('theme-images').remove(galleryPaths);
          }
        }
        if (themeToDelete.zip_path) {
          await supabase.storage.from('theme-zips').remove([themeToDelete.zip_path]);
        }
      }

      if (!error) return true;
    } catch (e) {
      console.warn('Supabase delete theme error, falling back to local', e);
    }
  }

  const themes = getLocalData<Theme[]>(STORAGE_KEYS.THEMES, INITIAL_THEMES);
  const filtered = themes.filter((t) => t.id !== id);
  setLocalData(STORAGE_KEYS.THEMES, filtered);
  return true;
}

// -----------------------------------------------------------------------------
// Storage Helpers
// -----------------------------------------------------------------------------

function extractStoragePathFromUrl(url: string, bucket: string): string | null {
  try {
    const marker = `/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(url.substring(idx + marker.length).split('?')[0]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Upload Gallery Image to public 'theme-images' bucket
 * Path: gallery/{theme_id}/{timestamp}-{filename}
 */
export async function uploadThemeGalleryFile(
  file: File,
  themeId: string = 'new'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'শুধুমাত্র JPG, PNG অথবা WEBP ফরম্যাটের ছবি আপলোড করা যাবে।' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।' };
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanPath = `gallery/${themeId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.storage
        .from('theme-images')
        .upload(cleanPath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        return { success: false, error: `গ্যালারি ছবি আপলোড ব্যর্থ: ${error.message}` };
      }

      const { data } = supabase.storage.from('theme-images').getPublicUrl(cleanPath);
      return { success: true, url: data.publicUrl };
    } catch (e: any) {
      return { success: false, error: e.message || 'গ্যালারি ছবি আপলোডে সমস্যা হয়েছে।' };
    }
  }

  // Fallback for local preview: Convert to base64 Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'ছবি রিড করতে সমস্যা হয়েছে।' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload Theme Thumbnail to public 'theme-images' bucket
 */
export async function uploadThemeThumbnailFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  // Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'শুধুমাত্র JPG, PNG অথবা WEBP ফরম্যাটের ছবি আপলোড করা যাবে।' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।' };
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanFileName = `theme_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.storage
        .from('theme-images')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
      }

      const { data } = supabase.storage.from('theme-images').getPublicUrl(cleanFileName);
      return { success: true, url: data.publicUrl };
    } catch (e: any) {
      return { success: false, error: e.message || 'ছবি আপলোডে সমস্যা হয়েছে।' };
    }
  }

  // Fallback for local preview: Convert to base64 Data URL so it previews and saves permanently
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'ছবি রিড করতে সমস্যা হয়েছে।' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload Theme ZIP to private 'theme-zips' bucket.
 * Returns only the internal path (e.g. 'themes/theme_1700000_abc.zip'), NEVER a public URL.
 */
export async function uploadThemeZipFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; path?: string; error?: string }> {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return { success: false, error: 'শুধুমাত্র .zip ফাইল আপলোড করতে পারবেন।' };
  }

  const cleanFileName = `themes/theme_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.zip`;

  // Simulate progress callback
  if (onProgress) {
    let p = 15;
    onProgress(p);
    const interval = setInterval(() => {
      p += 25;
      if (p >= 90) {
        clearInterval(interval);
        onProgress(90);
      } else {
        onProgress(p);
      }
    }, 150);
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.storage
        .from('theme-zips')
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (onProgress) onProgress(100);

      if (error) {
        return { success: false, error: `ZIP ফাইল আপলোড ব্যর্থ: ${error.message}` };
      }

      // Return ONLY the path
      return { success: true, path: cleanFileName };
    } catch (e: any) {
      return { success: false, error: e.message || 'ZIP আপলোডে ত্রুটি ঘটেছে।' };
    }
  }

  // Local mode simulation
  if (onProgress) setTimeout(() => onProgress(100), 600);
  return { success: true, path: cleanFileName };
}

/**
 * Delete a file from storage if updated or cancelled
 */
export async function removeStorageFile(bucket: 'theme-images' | 'theme-zips', pathOrUrl: string): Promise<void> {
  if (!isSupabaseConfigured || !pathOrUrl) return;
  try {
    const path = bucket === 'theme-images'
      ? (extractStoragePathFromUrl(pathOrUrl, bucket) || pathOrUrl)
      : pathOrUrl;

    if (path) {
      await supabase.storage.from(bucket).remove([path]);
    }
  } catch (e) {
    console.warn('Storage cleanup warning:', e);
  }
}

// -----------------------------------------------------------------------------
// Payments
// -----------------------------------------------------------------------------
export async function fetchAllPayments(): Promise<Payment[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, profiles(full_name, email, phone)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((p) => ({
          ...p,
          user: p.profiles
            ? {
                full_name: p.profiles.full_name,
                email: p.profiles.email,
                phone: p.profiles.phone
              }
            : undefined
        }));
      }
    } catch (e) {
      console.warn('Supabase all payments query error, falling back to local', e);
    }
  }

  return getLocalData<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
}

export async function fetchUserPayments(userId: string): Promise<Payment[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase user payments query error, falling back to local', e);
    }
  }

  const all = getLocalData<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  return all.filter((p) => p.user_id === userId);
}

export async function submitPayment(paymentInput: {
  user_id: string;
  method: 'bkash' | 'nagad';
  sender_number: string;
  trx_id: string;
  amount: number;
  user_info?: { full_name?: string; email?: string; phone?: string };
}): Promise<{ success: boolean; error?: string; payment?: Payment }> {
  const trimmedTrxId = paymentInput.trx_id.trim().toUpperCase();

  // Check duplicate trx_id
  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('trx_id', trimmedTrxId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'এই TrxID আগেই জমা দেওয়া হয়েছে।' };
      }

      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            user_id: paymentInput.user_id,
            method: paymentInput.method,
            sender_number: paymentInput.sender_number.trim(),
            trx_id: trimmedTrxId,
            amount: paymentInput.amount,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, payment: data };
    } catch (e: any) {
      console.warn('Supabase payment insert error, falling back to local', e);
    }
  }

  // Local check
  const allPayments = getLocalData<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  const exists = allPayments.some((p) => p.trx_id.toUpperCase() === trimmedTrxId);
  if (exists) {
    return { success: false, error: 'এই TrxID আগেই জমা দেওয়া হয়েছে।' };
  }

  const newPayment: Payment = {
    id: 'pay-' + Date.now(),
    user_id: paymentInput.user_id,
    method: paymentInput.method,
    sender_number: paymentInput.sender_number.trim(),
    trx_id: trimmedTrxId,
    amount: paymentInput.amount,
    status: 'pending',
    created_at: new Date().toISOString(),
    user: paymentInput.user_info
  };

  allPayments.unshift(newPayment);
  setLocalData(STORAGE_KEYS.PAYMENTS, allPayments);
  return { success: true, payment: newPayment };
}

export async function updatePaymentStatus(
  paymentId: string,
  status: 'approved' | 'rejected',
  admin_note?: string
): Promise<Payment | null> {
  const reviewed_at = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status,
          reviewed_at,
          ...(admin_note !== undefined ? { admin_note } : {})
        })
        .eq('id', paymentId)
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase update payment error, falling back to local', e);
    }
  }

  const all = getLocalData<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  const index = all.findIndex((p) => p.id === paymentId);
  if (index === -1) return null;

  all[index] = {
    ...all[index],
    status,
    reviewed_at,
    admin_note: status === 'rejected' ? admin_note : all[index].admin_note
  };

  setLocalData(STORAGE_KEYS.PAYMENTS, all);
  return all[index];
}

// -----------------------------------------------------------------------------
// Signed ZIP URL
// -----------------------------------------------------------------------------
export async function getSignedZipUrl(zipPath: string): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .storage
        .from('theme-zips')
        .createSignedUrl(zipPath, 60);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch (e) {
      console.warn('Supabase signed URL error, generating local blob link', e);
    }
  }

  // Simulated instant downloadable blob with readme for evaluation preview
  const sampleReadme = `Nexbit Live - প্রিমিয়াম Laravel থিম প্যাকেজ
=========================================
থিমের পাথ: ${zipPath}
ডাউনলোডের সময়: ${new Date().toLocaleString()}
লাইসেন্স: ১ বার ক্রয়ে আজীবন ব্যবহার

ইনস্টলেশন নির্দেশিকা:
1. সার্ভার cPanel বা VPS-এ ফাইল আপলোড করে unzip করুন।
2. root ডিরেক্টরিতে .env ফাইল তৈরি করে DB_DATABASE, DB_USERNAME, DB_PASSWORD কনফিগার করুন।
3. টার্মিনালে রান করুন:
   composer install
   php artisan key:generate
   php artisan migrate --seed
   php artisan storage:link
4. আপনার সাইট লাইভ হয়ে যাবে!

সাপোর্ট ও যোগাযোগ: 01647651231
Nexbit Live (সর্বস্বত্ব সংরক্ষিত)
`;
  const blob = new Blob([sampleReadme], { type: 'application/octet-stream' });
  return URL.createObjectURL(blob);
}
