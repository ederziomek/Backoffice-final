import React from 'react';
import { X, Users, DollarSign, TrendingUp, Network, ChevronDown, ChevronRight } from 'lucide-react';
import { useMLMStructure, useAffiliateDetails } from '../../../hooks/useAffiliates';
import { formatCurrency, formatNumber, getInitials } from '../../../utils/formatters';
import { MLMLevel } from '../../../services/affiliateService';

interface MLMStructureModalProps {
  isOpen: boolean;
  affiliateId: number | null;
  onClose: () => void;
}

interface LevelCardProps {
  level: string;
  data: MLMLevel;
  isExpanded: boolean;
  onToggle: () => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ level, data, isExpanded, onToggle }) => {
  const levelNumber = parseInt(level.replace('level_', ''));
  const levelColors = [
    'border-blue-500 bg-blue-500/10',
    'border-green-500 bg-green-500/10',
    'border-yellow-500 bg-yellow-500/10',
    'border-orange-500 bg-orange-500/10',
    'border-red-500 bg-red-500/10',
  ];
  
  const colorClass = levelColors[levelNumber - 1] || 'border-gray-500 bg-gray-500/10';

  return (
    <div className={`border rounded-lg p-4 ${colorClass}`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <h3 className="text-lg font-semibold text-branco">
              Nível {levelNumber}
            </h3>
          </div>
          <span className="text-sm text-gray-400">
            ({data.count} afiliados)
          </span>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-400">Comissão Total</p>
          <p className="text-lg font-semibold text-branco">
            {formatCurrency(data.total_commission)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <Users className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-sm text-gray-400">Afiliados</p>
          <p className="text-xl font-bold text-branco">{data.count}</p>
        </div>
        
        <div className="text-center">
          <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-sm text-gray-400">Por Indicação</p>
          <p className="text-xl font-bold text-branco">
            {formatCurrency(data.commission_value)}
          </p>
        </div>
        
        <div className="text-center">
          <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-sm text-gray-400">Total Ganho</p>
          <p className="text-xl font-bold text-branco">
            {formatCurrency(data.total_commission)}
          </p>
        </div>
      </div>

      {isExpanded && data.affiliates && data.affiliates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Afiliados neste nível:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.affiliates.map((affiliate) => (
              <div 
                key={affiliate.id}
                className="flex items-center justify-between p-3 bg-cinza-escuro rounded-lg border border-gray-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-azul-ciano/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-azul-ciano">
                      {getInitials(affiliate.name)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-branco">{affiliate.name}</p>
                    <p className="text-xs text-gray-400">
                      {affiliate.referrals} indicações
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-branco">
                    {formatCurrency(affiliate.commission)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MLMStructureModal: React.FC<MLMStructureModalProps> = ({
  isOpen,
  affiliateId,
  onClose
}) => {
  const [expandedLevels, setExpandedLevels] = React.useState<Set<string>>(new Set(['level_1']));
  
  const { data: affiliate } = useAffiliateDetails(affiliateId);
  const { data: mlmData, loading, error } = useMLMStructure(affiliateId);

  const toggleLevel = (level: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

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
            <Network className="w-8 h-8 text-azul-ciano" />
            <div>
              <h2 className="text-xl font-semibold text-branco">Estrutura MLM</h2>
              {affiliate && (
                <p className="text-gray-400">{affiliate.name} - ID: {affiliate.id}</p>
              )}
            </div>
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
                <p className="text-gray-400">Carregando estrutura MLM...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Erro ao carregar estrutura: {error}</p>
              </div>
            </div>
          )}

          {mlmData && (
            <>
              {/* Summary */}
              <div className="p-6 border-b border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Total na Rede</p>
                    <p className="text-2xl font-bold text-branco">
                      {formatNumber(mlmData.totals.total_network)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Comissões Totais</p>
                    <p className="text-2xl font-bold text-branco">
                      {formatCurrency(mlmData.totals.total_commission)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Profundidade da Rede</p>
                    <p className="text-2xl font-bold text-branco">
                      {mlmData.totals.network_depth} níveis
                    </p>
                  </div>
                </div>
              </div>

              {/* Levels */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {Object.entries(mlmData.structure).map(([level, data]) => (
                    <LevelCard
                      key={level}
                      level={level}
                      data={data}
                      isExpanded={expandedLevels.has(level)}
                      onToggle={() => toggleLevel(level)}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-600 bg-cinza-medio">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Sistema de comissões: R$ 50 (Nível 1) • R$ 20 (Nível 2) • R$ 5 (Níveis 3-5)
                  </div>
                  <button
                    onClick={() => setExpandedLevels(new Set(Object.keys(mlmData.structure)))}
                    className="text-sm text-azul-ciano hover:text-azul-ciano/80 transition-colors"
                  >
                    Expandir Todos
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLMStructureModal;

