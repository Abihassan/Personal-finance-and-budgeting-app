// All monetary values stored as integers (paise). Divide by 100 here only.
export const fmtINR = (paise: number, compact = false): string => {
  const rupees = paise / 100;
  if (compact) {
    if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
    if (rupees >= 100_000)    return `₹${(rupees / 100_000).toFixed(1)}L`;
    if (rupees >= 1_000)      return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
};

export const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtShortDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const fmtMonth = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short' });
};

export const fmtPct = (value: number, decimals = 1): string =>
  `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;

export const fmtCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

// Convert rupees input string to paise integer for API
export const rupeesToPaise = (rupeesStr: string): number =>
  Math.round(parseFloat(rupeesStr || '0') * 100);

export const paiseToRupeesStr = (paise: number): string =>
  (paise / 100).toFixed(2);
