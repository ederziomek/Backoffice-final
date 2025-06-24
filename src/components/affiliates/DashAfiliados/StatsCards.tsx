import React from 'react';
import { Users, Target, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatGrowthRate, getGrowthColor } from '../../../utils/formatters';
import { AffiliateStats } from '../../../services/affiliateService';

interface StatsCardsProps {
  data: AffiliateStats | null;
  loading: boolean;
  error: string | null;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  growth?: number;
  loading?: boolean;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  growth, 
  loading = false,
  color = 'text-azul-ciano'
}) => {
  return (
    <div className="bg-cinza-medio rounded-lg p-6 border border-gray-700 hover:border-azul-ciano/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          {loading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-azul-ciano" />
              <span className="text-gray-400">Carregando...</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-branco mb-2">{value}</p>
          )}
          {growth !== undefined && !loading && (
            <div className={`flex items-center space-x-1 ${getGrowthColor(growth)}`}>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{formatGrowthRate(growth)}</span>
              <span className="text-xs text-gray-400">este mês</span>
            </div>
          )}
        </div>
        <div className={`${color} opacity-80`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const StatsCards: React.FC<StatsCardsProps> = ({ data, loading, error }) => {
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="col-span-full bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-center">Erro ao carregar estatísticas: {error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total de Afiliados',
      value: data ? formatNumber(data.totals.total_affiliates) : '0',
      icon: <Users className="w-8 h-8" />,
      growth: data?.growth.growth_rate,
      color: 'text-blue-400'
    },
    {
      title: 'Total de Indicações',
      value: data ? formatNumber(data.totals.total_referrals) : '0',
      icon: <Target className="w-8 h-8" />,
      growth: data ? (data.growth.new_referrals_this_month / data.totals.total_referrals) * 100 : undefined,
      color: 'text-green-400'
    },
    {
      title: 'Comissões Pagas',
      value: data ? formatCurrency(data.totals.total_commission_paid) : 'R$ 0,00',
      icon: <DollarSign className="w-8 h-8" />,
      growth: data?.growth.growth_rate,
      color: 'text-yellow-400'
    },
    {
      title: 'Média de Indicações',
      value: data ? data.performance.average_referrals_per_affiliate.toFixed(1) : '0.0',
      icon: <TrendingUp className="w-8 h-8" />,
      growth: data?.growth.growth_rate,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          growth={stat.growth}
          loading={loading}
          color={stat.color}
        />
      ))}
    </div>
  );
};

export default StatsCards;

