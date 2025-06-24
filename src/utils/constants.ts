// Constantes da aplicação Dash Afiliados

// URLs das APIs
export const API_URLS = {
  GATEWAY: 'https://fature-api-gateway-production.up.railway.app',
  AFFILIATE_SERVICE: 'https://fature-affiliate-service-production-87ff.up.railway.app',
} as const;

// Status dos afiliados
export const AFFILIATE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
} as const;

// Opções de status para filtros
export const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'pending', label: 'Pendente' },
] as const;

// Níveis MLM
export const MLM_LEVELS = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
} as const;

// Valores de comissão por nível
export const COMMISSION_VALUES = {
  [MLM_LEVELS.LEVEL_1]: 50.00,
  [MLM_LEVELS.LEVEL_2]: 20.00,
  [MLM_LEVELS.LEVEL_3]: 5.00,
  [MLM_LEVELS.LEVEL_4]: 5.00,
  [MLM_LEVELS.LEVEL_5]: 5.00,
} as const;

// Opções de paginação
export const PAGINATION_OPTIONS = [
  { value: 10, label: '10 por página' },
  { value: 25, label: '25 por página' },
  { value: 50, label: '50 por página' },
  { value: 100, label: '100 por página' },
] as const;

// Configurações padrão de paginação
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 50,
  MAX_VISIBLE_PAGES: 5,
} as const;

// Tipos de atividade
export const ACTIVITY_TYPES = {
  NEW_REFERRAL: 'new_referral',
  COMMISSION_PAID: 'commission_paid',
  LEVEL_UP: 'level_up',
  PROFILE_UPDATE: 'profile_update',
  LOGIN: 'login',
  WITHDRAWAL: 'withdrawal',
} as const;

// Labels dos tipos de atividade
export const ACTIVITY_LABELS = {
  [ACTIVITY_TYPES.NEW_REFERRAL]: 'Nova Indicação',
  [ACTIVITY_TYPES.COMMISSION_PAID]: 'Comissão Paga',
  [ACTIVITY_TYPES.LEVEL_UP]: 'Subiu de Nível',
  [ACTIVITY_TYPES.PROFILE_UPDATE]: 'Perfil Atualizado',
  [ACTIVITY_TYPES.LOGIN]: 'Login Realizado',
  [ACTIVITY_TYPES.WITHDRAWAL]: 'Saque Realizado',
} as const;

// Ícones dos tipos de atividade
export const ACTIVITY_ICONS = {
  [ACTIVITY_TYPES.NEW_REFERRAL]: '👥',
  [ACTIVITY_TYPES.COMMISSION_PAID]: '💰',
  [ACTIVITY_TYPES.LEVEL_UP]: '📈',
  [ACTIVITY_TYPES.PROFILE_UPDATE]: '✏️',
  [ACTIVITY_TYPES.LOGIN]: '🔐',
  [ACTIVITY_TYPES.WITHDRAWAL]: '💸',
} as const;

// Cores dos status
export const STATUS_COLORS = {
  [AFFILIATE_STATUS.ACTIVE]: {
    text: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200',
  },
  [AFFILIATE_STATUS.INACTIVE]: {
    text: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-200',
  },
  [AFFILIATE_STATUS.PENDING]: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
  },
  [AFFILIATE_STATUS.VERIFIED]: {
    text: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  [AFFILIATE_STATUS.UNVERIFIED]: {
    text: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
  },
} as const;

// Cores dos níveis MLM
export const LEVEL_COLORS = {
  1: {
    text: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
  },
  2: {
    text: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200',
  },
  3: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
  },
  4: {
    text: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
  },
  5: {
    text: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-200',
  },
} as const;

// Configurações de debounce
export const DEBOUNCE_DELAYS = {
  SEARCH: 500,
  FILTER: 300,
  RESIZE: 100,
} as const;

// Configurações de timeout
export const TIMEOUTS = {
  API_REQUEST: 10000,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION: 300,
} as const;

// Breakpoints responsivos
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Configurações de tabela
export const TABLE_CONFIG = {
  MIN_COLUMN_WIDTH: 100,
  MAX_ROWS_PER_PAGE: 100,
  STICKY_HEADER: true,
  SORTABLE_COLUMNS: ['name', 'email', 'total_referrals', 'total_commission', 'created_at'],
} as const;

// Configurações de modal
export const MODAL_CONFIG = {
  MAX_WIDTH: '90vw',
  MAX_HEIGHT: '90vh',
  OVERLAY_OPACITY: 0.5,
  ANIMATION_DURATION: 300,
} as const;

// Configurações de gráficos
export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    TERTIARY: '#F59E0B',
    QUATERNARY: '#EF4444',
    QUINARY: '#8B5CF6',
  },
  ANIMATION_DURATION: 1000,
  GRID_COLOR: '#E5E7EB',
  TEXT_COLOR: '#6B7280',
} as const;

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  API_UNAVAILABLE: 'Serviço temporariamente indisponível.',
  INVALID_DATA: 'Dados inválidos fornecidos.',
  UNAUTHORIZED: 'Acesso não autorizado.',
  NOT_FOUND: 'Recurso não encontrado.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado.',
} as const;

// Mensagens de sucesso padrão
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Dados carregados com sucesso.',
  DATA_SAVED: 'Dados salvos com sucesso.',
  DATA_UPDATED: 'Dados atualizados com sucesso.',
  DATA_DELETED: 'Dados excluídos com sucesso.',
} as const;

// Configurações de validação
export const VALIDATION_RULES = {
  EMAIL: {
    REQUIRED: true,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Email inválido',
  },
  PHONE: {
    REQUIRED: false,
    PATTERN: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    MESSAGE: 'Telefone inválido',
  },
  CPF: {
    REQUIRED: false,
    PATTERN: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    MESSAGE: 'CPF inválido',
  },
  NAME: {
    REQUIRED: true,
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    MESSAGE: 'Nome deve ter entre 2 e 100 caracteres',
  },
} as const;

// Configurações de cache
export const CACHE_CONFIG = {
  AFFILIATES_TTL: 5 * 60 * 1000, // 5 minutos
  STATS_TTL: 10 * 60 * 1000, // 10 minutos
  RANKING_TTL: 15 * 60 * 1000, // 15 minutos
} as const;

// Configurações de exportação
export const EXPORT_CONFIG = {
  FORMATS: ['csv', 'xlsx', 'pdf'],
  MAX_RECORDS: 10000,
  FILENAME_PREFIX: 'afiliados_',
  DATE_FORMAT: 'YYYY-MM-DD',
} as const;

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  POSITION: 'top-right',
  AUTO_CLOSE: 5000,
  HIDE_PROGRESS_BAR: false,
  CLOSE_ON_CLICK: true,
  PAUSE_ON_HOVER: true,
} as const;

// Configurações de tema
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    ACCENT: '#F59E0B',
    DANGER: '#EF4444',
    WARNING: '#F59E0B',
    SUCCESS: '#10B981',
    INFO: '#3B82F6',
    DARK: '#1F2937',
    LIGHT: '#F9FAFB',
  },
  FONTS: {
    PRIMARY: 'Inter, sans-serif',
    SECONDARY: 'Roboto, sans-serif',
  },
  SHADOWS: {
    SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
} as const;

