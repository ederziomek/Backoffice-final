// Utilitário para formatação de valores monetários no padrão brasileiro
// XXX.XXX,XX

export const formatCurrency = (value: number | string): string => {
  // Converter para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verificar se é um número válido
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  // Formatar no padrão brasileiro
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

export const formatNumber = (value: number | string): string => {
  // Converter para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verificar se é um número válido
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Formatar número com separadores de milhares
  return new Intl.NumberFormat('pt-BR').format(numValue);
};

// Função para formatar valores monetários sem o símbolo R$
export const formatCurrencyValue = (value: number | string): string => {
  const formatted = formatCurrency(value);
  return formatted.replace('R$', '').trim();
};

