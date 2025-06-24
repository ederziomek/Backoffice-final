import React from 'react';
import { 
  X, 
  BarChart3, 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar
} from 'lucide-react';
import { useAffiliateDashboard, useAffiliateDetails } from '../../../hooks/useAffiliates';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate,
  formatGrowthRate,
  getGrowthColor,
  getInitials
} from '../../../utils/formatters';

interface AffiliateDashboardModalProps {
  isOpen: boolean;
  affiliateId: number | null;
  onClose: () => void;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  growth?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'text-azul-ciano',
  growth 
}) => (
  <div className="bg-cinza-medio p-4 rounded-lg border border-gray-600">
    <div className="flex items-center justify-between mb-2">
      <div className={color}>
        {icon}
      </div>
      {growth !== undefined && (
        <div className={`flex items-center space-x-1 ${getGrowthColor(growth)}`}>
          {growth >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-xs font-medium">{formatGrowthRate(growth)}</span>
        </div>
      )}
    </div>
    <p className="text-xs text-gray-400 mb-1">{title}</p>
    <p className="text-xl font-bold text-branco">{value}</p>
  </div>
);

interface ActivityItemProps {
  type: string;
  description: string;
  date: string;
  value: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, description, date, value }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_referral':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'commission_paid':
        return <DollarSign className="w-4 h-4 text-green-400" />;
      case 'level_up':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-cinza-escuro rounded-lg border border-gray-600">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {getActivityIcon(type)}
        </div>
        <div>
          <p className="text-sm font-medium text-branco">{description}</p>
          <p className="text-xs text-gray-400">{formatDate(date)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-green-400">
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  );
};

const AffiliateDashboardModal: React.FC<AffiliateDashboardModalProps> = ({
  isOpen,
  affiliateId,
  onClose
}) => {
  const { data: affiliate } = useAffiliateDetails(affiliateId);
  const { data: dashboard, loading, error } = useAffiliateDashboard(affiliateId);

  // Fechar modal com ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-cinza-escuro border border-gray-600 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            {affiliate && (
              <>
                <div className="h-12 w-12 rounded-full bg-azul-ciano/20 flex items-center justify-center">
                  <span className="text-lg font-medium text-azul-ciano">
                    {getInitials(affiliate.name)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-branco">Dashboard - {affiliate.name}</h2>
                  <p className="text-gray-400">Nível {affiliate.current_level} • ID: {affiliate.id}</p>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-azul-ciano mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Erro ao carregar dashboard: {error}</p>
              </div>
            </div>
          )}

          {dashboard && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Overview Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-branco mb-4">Visão Geral</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      title="Total de Indicações"
                      value={formatNumber(dashboard.overview.total_referrals)}
                      icon={<Users className="w-6 h-6" />}
                      color="text-blue-400"
                    />
                    <MetricCard
                      title="Indicações Ativas"
                      value={formatNumber(dashboard.overview.active_referrals)}
                      icon={<Users className="w-6 h-6" />}
                      color="text-green-400"
                    />
                    <MetricCard
                      title="Comissões Totais"
                      value={formatCurrency(dashboard.overview.total_commission)}
                      icon={<DollarSign className="w-6 h-6" />}
                      color="text-yellow-400"
                    />
                    <MetricCard
                      title="Comissões Pendentes"
                      value={formatCurrency(dashboard.overview.pending_commission)}
                      icon={<Clock className="w-6 h-6" />}
                      color="text-orange-400"
                    />
                  </div>
                </div>

                {/* Performance Comparison */}
                <div>
                  <h3 className="text-lg font-semibold text-branco mb-4">Performance Mensal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-cinza-medio p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Este Mês</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Indicações:</span>
                          <span className="text-branco font-medium">
                            {dashboard.performance.this_month.referrals}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Comissões:</span>
                          <span className="text-branco font-medium">
                            {formatCurrency(dashboard.performance.this_month.commission)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-cinza-medio p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Mês Anterior</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Indicações:</span>
                          <span className="text-branco font-medium">
                            {dashboard.performance.last_month.referrals}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Comissões:</span>
                          <span className="text-branco font-medium">
                            {formatCurrency(dashboard.performance.last_month.commission)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-cinza-medio rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Taxa de Crescimento:</span>
                      <div className={`flex items-center space-x-2 ${getGrowthColor(dashboard.performance.growth_rate)}`}>
                        {dashboard.performance.growth_rate >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {formatGrowthRate(dashboard.performance.growth_rate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Network Structure */}
                <div>
                  <h3 className="text-lg font-semibold text-branco mb-4">Estrutura da Rede</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(dashboard.network).map(([level, count]) => {
                      if (level === 'total_depth') return null;
                      
                      const levelNumber = level.replace('level_', '');
                      return (
                        <div key={level} className="text-center p-4 bg-cinza-medio rounded-lg border border-gray-600">
                          <p className="text-xs text-gray-400 mb-1">Nível {levelNumber}</p>
                          <p className="text-xl font-bold text-branco">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-branco mb-4">Atividade Recente</h3>
                  {dashboard.recent_activity.length > 0 ? (
                    <div className="space-y-3">
                      {dashboard.recent_activity.map((activity, index) => (
                        <ActivityItem
                          key={index}
                          type={activity.type}
                          description={activity.description}
                          date={activity.date}
                          value={activity.value}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboardModal;

