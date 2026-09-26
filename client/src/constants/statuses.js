export const DOCUMENT_STATUSES = {
  DRAFT: 'draft',
  READY: 'ready',
  PICKED: 'picked',
  PACKED: 'packed',
  DONE: 'done',
  CANCELED: 'canceled',
};

export const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  ready: 'bg-amber-100 text-amber-800 border-amber-300',
  picked: 'bg-blue-100 text-blue-800 border-blue-300',
  packed: 'bg-purple-100 text-purple-800 border-purple-300',
  done: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  canceled: 'bg-rose-100 text-rose-800 border-rose-300',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  inactive: 'bg-slate-100 text-slate-600 border-slate-300',
  low: 'bg-amber-100 text-amber-800 border-amber-300',
  critical: 'bg-rose-100 text-rose-800 border-rose-300',
  info: 'bg-sky-100 text-sky-800 border-sky-300',
};

export const CUSTOMER_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
};

export const TIER_COLORS = {
  bronze: 'bg-amber-50 text-amber-700 border-amber-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  platinum: 'bg-indigo-100 text-indigo-800 border-indigo-300',
};
