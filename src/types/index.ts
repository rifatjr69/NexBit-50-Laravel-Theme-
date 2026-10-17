export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string;
  gallery_urls?: string[];
  preview_url: string;
  zip_path: string;
  is_active: boolean;
  accent_color?: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  method: 'bkash' | 'nagad';
  sender_number: string;
  trx_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  created_at: string;
  reviewed_at?: string;
  user?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export interface Settings {
  id: number;
  bkash_number: string;
  nagad_number: string;
  price: number;
  unlock_title: string;
  video_url: string;
  brand_name: string;
}
