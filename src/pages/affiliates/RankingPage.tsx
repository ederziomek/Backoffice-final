import React, { useCallback, useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, DollarSign } from 'lucide-react';

// Dados mockados para teste
const mockRankingData = {
  ranking: [
    {
      position: 1,
      affiliate_id: 4,
      name: 'Ana Costa',
      total_referrals: 156,
      total_commission: 7800.00,
      level: 5
    },
    {
      position: 2,
      affiliate_id: 5,
      name: 'Pedro Oliveira',
      total_referrals: 67,
      total_commission: 3350.00,
      level: 4
    },
    {
      position: 3,
      affiliate_id: 1,
      name: 'João Silva',
      total_referrals: 45,
      total_commission: 2500.00,
      level: 3
    },
    {
      position: 4,
      affiliate_id: 2,
      name: 'Maria Santos',
      total_referrals: 32,
      total_commission: 1800.00,
      level: 2
    },
    {
      position: 5,
      affiliate_id: 3,
      name: 'Carlos Lima',
      total_referrals: 18,
      total_commission: 950.00,
      level: 1
    }
  ],
  user_position: {
    affiliate_id: 1,
    position: 3,
    total_affiliates: 5
  }
};

const RankingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rankingData, setRankingData] = useState<typeof mockRankingData | null>(null);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setRankingData(mockRankingData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setRankingData(mockRankingData);
      setLoading(false);
    }, 1000);
  }, []);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-black';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-branco mb-2">Ranking de Afiliados</h1>
            <p className="text-gray-400">
              Classificação dos melhores afiliados por performance
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-azul-ciano"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-branco mb-2">Ranking de Afiliados</h1>
          <p className="text-gray-400">
            Classificação dos melhores afiliados por performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards de estatísticas do ranking */}
      {rankingData?.user_position && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cinza-claro rounded-lg p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-azul-ciano mr-3" />
              <div>
                <p className="text-sm text-gray-400">Sua Posição</p>
                <p className="text-2xl font-bold text-branco">
                  #{rankingData.user_position.position}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-cinza-claro rounded-lg p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Total de Afiliados</p>
                <p className="text-2xl font-bold text-branco">
                  {rankingData.user_position.total_affiliates.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-cinza-claro rounded-lg p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-sm text-gray-400">Top Performer</p>
                <p className="text-2xl font-bold text-branco">
                  R$ {rankingData.ranking[0]?.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de ranking */}
      <div className="bg-cinza-claro rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-cinza-medio">
          <h2 className="text-xl font-semibold text-branco">Top Afiliados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cinza-medio">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Afiliado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Indicações
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Comissão Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nível
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinza-medio">
              {rankingData?.ranking.map((affiliate) => (
                <tr 
                  key={affiliate.affiliate_id}
                  className={`hover:bg-cinza-medio transition-colors ${
                    rankingData.user_position?.affiliate_id === affiliate.affiliate_id 
                      ? 'bg-blue-900/20 border-l-4 border-azul-ciano' 
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(affiliate.position)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(affiliate.position)}`}>
                        #{affiliate.position}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-azul-ciano to-blue-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {affiliate.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-branco">
                          {affiliate.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          ID: {affiliate.affiliate_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-branco font-medium">
                      {affiliate.total_referrals.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      indicações
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-branco font-medium">
                      R$ {affiliate.total_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-400">
                      total acumulado
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      affiliate.level >= 5 ? 'bg-purple-100 text-purple-800' :
                      affiliate.level >= 4 ? 'bg-blue-100 text-blue-800' :
                      affiliate.level >= 3 ? 'bg-green-100 text-green-800' :
                      affiliate.level >= 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Nível {affiliate.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="bg-cinza-claro rounded-lg p-6">
        <h3 className="text-lg font-semibold text-branco mb-4">Como funciona o ranking?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-branco mb-2">Critérios de classificação:</h4>
            <ul className="space-y-1">
              <li>• Comissão total acumulada</li>
              <li>• Número de indicações ativas</li>
              <li>• Nível atual no sistema MLM</li>
              <li>• Performance mensal</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-branco mb-2">Atualização:</h4>
            <ul className="space-y-1">
              <li>• Ranking atualizado em tempo real</li>
              <li>• Dados sincronizados a cada 5 minutos</li>
              <li>• Histórico mantido por 12 meses</li>
              <li>• Premiações mensais para top 10</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPage;

