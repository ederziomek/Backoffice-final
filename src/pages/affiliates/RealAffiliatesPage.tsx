import React, { useState, useEffect } from 'react';
import { Users, Network, RefreshCw } from 'lucide-react';
import { affiliatesService } from '@/services/affiliatesService';

interface MLMAffiliate {
  affiliate_id: number;
  total: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  name?: string;
  last_calculated?: string;
}

interface MLMResponse {
  status: string;
  data: any[]; // Usar any para flexibilidade
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

const RealAffiliatesPage: React.FC = () => {
  const [affiliates, setAffiliates] = useState<MLMAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAffiliates, setTotalAffiliates] = useState(0);
  const limit = 20;

  const fetchMLMAffiliates = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Buscando afiliados MLM - Página: ${page}`);
      
      const response: MLMResponse = await affiliatesService.getAffiliatesMLMLevels(page, limit);
      
      console.log('📊 Dados MLM recebidos:', response);
      
      if (response.status === 'success') {
        // Mapear dados do microserviço para o formato esperado
        const mappedData = response.data.map(item => ({
          affiliate_id: item.affiliate_id,
          total: item.total_network,
          n1: item.n1_count,
          n2: item.n2_count,
          n3: item.n3_count,
          n4: item.n4_count,
          n5: item.n5_count,
          name: item.name,
          last_calculated: item.last_calculated
        }));
        
        setAffiliates(mappedData);
        setTotalPages(response.pagination?.pages || 1);
        setCurrentPage(response.pagination?.page || 1);
        setTotalAffiliates(response.pagination?.total || 0);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar afiliados MLM:', err);
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('🔗 Testando conexão...');
      await affiliatesService.testConnection();
      console.log('✅ Conexão com API funcionando');
    } catch (err) {
      console.error('❌ Erro na conexão com API:', err);
      setError('Erro de conexão com o servidor');
    }
  };

  useEffect(() => {
    testConnection();
    fetchMLMAffiliates(1);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchMLMAffiliates(page);
    }
  };

  const handleRefresh = () => {
    fetchMLMAffiliates(currentPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <span className="ml-3 text-lg">Carregando dados reais dos afiliados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Afiliados da Operação</h1>
              <p className="text-gray-400">
                Dados reais da tabela tracked - Rede MLM até 5 níveis
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Afiliados únicos</p>
                <p className="text-2xl font-bold text-white">{totalAffiliates.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total de afiliados com rede</p>
              </div>
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Quantidade de indicações</p>
                <p className="text-2xl font-bold text-white">
                  {affiliates.reduce((total, affiliate) => total + affiliate.total, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total em todos os níveis</p>
              </div>
              <Network className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* MLM Affiliates Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-2">Rede MLM por Afiliado</h2>
            <p className="text-gray-400">Distribuição de indicações por níveis da rede MLM</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    N1
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    N2
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    N3
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    N4
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    N5
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {affiliates.length > 0 ? (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.affiliate_id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {affiliate.affiliate_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-cyan-400">
                          {affiliate.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-400">
                          {affiliate.n1.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-400">
                          {affiliate.n2.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-purple-400">
                          {affiliate.n3.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-yellow-400">
                          {affiliate.n4.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-400">
                          {affiliate.n5.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Network className="w-12 h-12 text-gray-500 mb-4" />
                        <p className="text-gray-400 text-lg">Nenhum afiliado encontrado</p>
                        <p className="text-gray-500 text-sm">
                          Não há afiliados com clientes na rede MLM no momento
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Página {currentPage} de {totalPages} ({totalAffiliates.toLocaleString()} afiliados total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealAffiliatesPage;

