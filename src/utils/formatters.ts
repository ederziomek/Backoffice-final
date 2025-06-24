// Formatação de moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatação de números
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Formatação de porcentagem
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// Formatação de data
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Formatação de data e hora
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Formatação de telefone brasileiro
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// Formatação de CPF
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
};

// Formatação de nome (primeira letra maiúscula)
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Formatação de status
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    verified: 'Verificado',
    unverified: 'Não Verificado',
  };
  
  return statusMap[status] || status;
};

// Formatação de nível MLM
export const formatLevel = (level: number): string => {
  return `Nível ${level}`;
};

// Formatação de tempo relativo (ex: "há 2 dias")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Hoje';
  } else if (diffInDays === 1) {
    return 'Ontem';
  } else if (diffInDays < 7) {
    return `Há ${diffInDays} dias`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `Há ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `Há ${months} mês${months > 1 ? 'es' : ''}`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `Há ${years} ano${years > 1 ? 's' : ''}`;
  }
};

// Truncar texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Gerar iniciais do nome
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar CPF
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};

// Gerar cor baseada no status
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: 'text-green-500',
    inactive: 'text-red-500',
    pending: 'text-yellow-500',
    verified: 'text-blue-500',
    unverified: 'text-gray-500',
  };
  
  return colorMap[status] || 'text-gray-500';
};

// Gerar cor de fundo baseada no status
export const getStatusBgColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
    unverified: 'bg-gray-100 text-gray-800',
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Gerar cor baseada no nível
export const getLevelColor = (level: number): string => {
  const colors = [
    'text-gray-500',    // Nível 0
    'text-blue-500',    // Nível 1
    'text-green-500',   // Nível 2
    'text-yellow-500',  // Nível 3
    'text-orange-500',  // Nível 4
    'text-red-500',     // Nível 5
    'text-purple-500',  // Nível 6+
  ];
  
  return colors[Math.min(level, colors.length - 1)];
};

// Gerar cor de fundo baseada no nível
export const getLevelBgColor = (level: number): string => {
  const colors = [
    'bg-gray-100 text-gray-800',       // Nível 0
    'bg-blue-100 text-blue-800',       // Nível 1
    'bg-green-100 text-green-800',     // Nível 2
    'bg-yellow-100 text-yellow-800',   // Nível 3
    'bg-orange-100 text-orange-800',   // Nível 4
    'bg-red-100 text-red-800',         // Nível 5
    'bg-purple-100 text-purple-800',   // Nível 6+
  ];
  
  return colors[Math.min(level, colors.length - 1)];
};

// Calcular taxa de crescimento
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Formatar taxa de crescimento
export const formatGrowthRate = (rate: number): string => {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
};

// Obter ícone de crescimento
export const getGrowthIcon = (rate: number): string => {
  if (rate > 0) return '📈';
  if (rate < 0) return '📉';
  return '➡️';
};

// Obter cor de crescimento
export const getGrowthColor = (rate: number): string => {
  if (rate > 0) return 'text-green-500';
  if (rate < 0) return 'text-red-500';
  return 'text-gray-500';
};

