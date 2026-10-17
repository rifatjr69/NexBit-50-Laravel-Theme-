const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '';
  return val.toString().replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

export function formatBengaliCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '৳০';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '৳০';
  
  // Format with thousand separator
  const formattedWithCommas = num.toLocaleString('en-IN');
  return `৳${toBengaliNumber(formattedWithCommas)}`;
}

const bengaliMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function formatBengaliDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  const day = toBengaliNumber(date.getDate());
  const month = bengaliMonths[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());
  
  return `${day} ${month}, ${year}`;
}

export function formatShortBengaliDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  const day = toBengaliNumber(date.getDate());
  const month = bengaliMonths[date.getMonth()];
  return `${day} ${month}`;
}
