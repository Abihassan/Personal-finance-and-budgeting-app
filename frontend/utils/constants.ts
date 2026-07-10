// ─── Palette ────────────────────────────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  bg: '#0A0A1A',
  bgCard: '#12122A',
  bgCardAlt: '#1A1A35',
  bgInput: '#1E1E3A',

  // Brand gradients (purple → cyan)
  purple: '#7C3AED',
  purpleLight: '#9D6EF8',
  cyan: '#00BCD4',
  cyanLight: '#4DD6E8',

  // Semantic
  income: '#10D9A0',
  expense: '#F472B6',
  warning: '#FBBF24',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8B8BA8',
  textMuted: '#4A4A6A',

  // Border
  border: '#2A2A4A',
  borderLight: '#3A3A5A',
} as const;

// Gradient arrays for LinearGradient
export const GRADIENTS = {
  brand: ['#7C3AED', '#00BCD4'] as [string, string],
  brandDiag: ['#9D6EF8', '#00BCD4'] as [string, string],
  card: ['#1A1A35', '#12122A'] as [string, string],
  income: ['#10D9A0', '#059669'] as [string, string],
  expense: ['#F472B6', '#DB2777'] as [string, string],
  purple: ['#7C3AED', '#5B21B6'] as [string, string],
  dark: ['#1E1E3A', '#0A0A1A'] as [string, string],
} as const;

// ─── Icon assets ────────────────────────────────────────────────────────────
// Real PNG icon set (replaces the earlier emoji / vector-icon placeholders).
// Each entry is a static require() — the only correct way to reference local
// images in React Native/Expo (dynamic string paths are NOT supported by the
// bundler).
export const ICONS = {
  catFood:          require('../assets/icons/cat-food.png'),
  catTransport:     require('../assets/icons/cat-transport.png'),
  catShopping:      require('../assets/icons/cat-shopping.png'),
  catHealth:        require('../assets/icons/cat-health.png'),
  catEntertainment: require('../assets/icons/cat-entertainment.png'),
  catUtilities:     require('../assets/icons/cat-utilities.png'),
  catRent:          require('../assets/icons/cat-rent.png'),
  catEducation:     require('../assets/icons/cat-education.png'),
  catTravel:        require('../assets/icons/cat-travel.png'),
  catGroceries:      require('../assets/icons/cat-groceries.png'),
  catSubscriptions: require('../assets/icons/cat-subscriptions.png'),
  catFitness:       require('../assets/icons/cat-fitness.png'),
  catInsurance:     require('../assets/icons/cat-insurance.png'),
  catSalary:        require('../assets/icons/cat-salary.png'),
  catFreelance:     require('../assets/icons/cat-freelance.png'),
  catOther:         require('../assets/icons/cat-other.png'),

  invStocks:        require('../assets/icons/inv-stocks.png'),
  invMutualFund:    require('../assets/icons/inv-mutualfund.png'),
  invCrypto:        require('../assets/icons/inv-crypto.png'),
  invGold:          require('../assets/icons/inv-gold.png'),
  invFd:            require('../assets/icons/inv-fd.png'),
  invEtf:           require('../assets/icons/inv-etf.png'),

  toggleAsset:      require('../assets/icons/toggle-asset.png'),
  toggleLiability:  require('../assets/icons/toggle-liability.png'),
  toggleExpense:    require('../assets/icons/toggle-expense.png'),
  toggleIncome:     require('../assets/icons/toggle-income.png'),

  statusSuccess:    require('../assets/icons/status-success.png'),
  statusFail:       require('../assets/icons/status-fail.png'),

  tipEmergency:     require('../assets/icons/tip-emergency.png'),
  tipAllocation:    require('../assets/icons/tip-allocation.png'),
  tipSip:           require('../assets/icons/tip-sip.png'),
  tipInsurance:     require('../assets/icons/tip-insurance.png'),

  emptySpend:       require('../assets/icons/empty-spend.png'),
  aiSparkle:        require('../assets/icons/ai-sparkle.png'),
} as const;

// ─── Categories ─────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'food',          label: 'Food',          icon: ICONS.catFood,          color: '#F59E0B' },
  { id: 'transport',     label: 'Transport',     icon: ICONS.catTransport,     color: '#3B82F6' },
  { id: 'shopping',      label: 'Shopping',      icon: ICONS.catShopping,      color: '#EC4899' },
  { id: 'health',        label: 'Health',        icon: ICONS.catHealth,        color: '#10B981' },
  { id: 'entertainment', label: 'Entertainment', icon: ICONS.catEntertainment, color: '#8B5CF6' },
  { id: 'utilities',     label: 'Utilities',     icon: ICONS.catUtilities,     color: '#F59E0B' },
  { id: 'rent',          label: 'Rent',          icon: ICONS.catRent,          color: '#EF4444' },
  { id: 'education',     label: 'Education',     icon: ICONS.catEducation,     color: '#06B6D4' },
  { id: 'travel',        label: 'Travel',        icon: ICONS.catTravel,        color: '#84CC16' },
  { id: 'groceries',     label: 'Groceries',     icon: ICONS.catGroceries,     color: '#F97316' },
  { id: 'subscriptions', label: 'Subscriptions', icon: ICONS.catSubscriptions, color: '#A855F7' },
  { id: 'fitness',       label: 'Fitness',       icon: ICONS.catFitness,       color: '#14B8A6' },
  { id: 'insurance',     label: 'Insurance',     icon: ICONS.catInsurance,     color: '#6366F1' },
  { id: 'salary',        label: 'Salary',        icon: ICONS.catSalary,        color: '#10D9A0' },
  { id: 'freelance',     label: 'Freelance',     icon: ICONS.catFreelance,     color: '#00BCD4' },
  { id: 'other',         label: 'Other',         icon: ICONS.catOther,         color: '#8B8BA8' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export const getCategoryById = (id: string) =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

// Investment types
export const INVESTMENT_TYPES = [
  { id: 'stocks',   label: 'Stocks',      icon: ICONS.invStocks },
  { id: 'mf',       label: 'Mutual Fund', icon: ICONS.invMutualFund },
  { id: 'crypto',   label: 'Crypto',      icon: ICONS.invCrypto },
  { id: 'gold',     label: 'Gold',        icon: ICONS.invGold },
  { id: 'fd',       label: 'Fixed Dep',   icon: ICONS.invFd },
  { id: 'etf',      label: 'ETF',         icon: ICONS.invEtf },
] as const;

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const QK = {
  accounts:    ['accounts']             as const,
  txs:         (type?: string) => type ? ['txs', type] : ['txs'],
  budgets:     ['budgets']             as const,
  investments: ['investments']         as const,
  breakdown:   ['breakdown']           as const,
  transfers:   ['transfers']           as const,
  netWorth:    (period: string) => ['net-worth', period] as const,
} as const;

// ─── Misc ────────────────────────────────────────────────────────────────────
export const STALE_TIME = 30_000; // 30 seconds
export const NET_WORTH_PERIODS = ['1W', '1M', '3M', '1Y'] as const;
export type NetWorthPeriod = typeof NET_WORTH_PERIODS[number];
