import React, { useState, useEffect } from 'react';
import { Users, Network, TrendingUp, Activity } from 'lucide-react';
import { affiliatesService, Affiliate, AffiliateStats } from '@/services/affiliatesService';

const RealAffiliatesPage: React.FC = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchAffiliates = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await affiliatesService.getAffiliates(page, limit);
      
      if (response.status === 'success') {
        setAffiliates(response.data);
        setTotalPages(response.pagination.pages);
        setCurrentPage(response.pagination.page);
      } else {
        setError(response.message || 'Erro ao carregar afiliados');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await affiliatesService.getStats();
      
      if (response.status === 'success') {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const testConnection = async () => {
    try {
      await affiliatesService.testConnection();
      console.log('✅ Conexão com API funcionando');
    } catch (err) {
      console.error('❌ Erro na conexão com API:', err);
      setError('Erro de conexão com o servidor');
    }
  };

  useEffect(() => {
    testConnection();
    fetchAffiliates(1);
    fetchStats();
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchAffiliates(page);
    }
  };

  const handleRefresh = () => {
    fetchAffiliates(currentPage);
    fetchStats();
  };

  if (loading && !affiliates.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-branco mb-2">Afiliados da Operação</h1>
          <p className="text-gray-400 mb-6">Dados reais da tabela tracked - Rede MLM</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Activity className="w-8 h-8 text-azul-ciano animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando dados dos afiliados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-branco mb-2">Afiliados da Operação</h1>
          <p className="text-gray-400">Dados reais da tabela tracked - Apenas afiliados com clientes na rede MLM</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-azul-ciano text-cinza-escuro px-4 py-2 rounded-lg hover:bg-azul-ciano/80 flex items-center space-x-2 font-medium"
        >
          <Activity className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cinza-claro p-6 rounded-lg border border-cinza-medio">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Afiliados</p>
                <p className="text-2xl font-bold text-branco">{stats.total_affiliates.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Afiliados únicos com clientes</p>
              </div>
              <Users className="w-8 h-8 text-azul-ciano" />
            </div>
          </div>

          <div className="bg-cinza-claro p-6 rounded-lg border border-cinza-medio">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Registros de Tracking</p>
                <p className="text-2xl font-bold text-branco">{stats.total_tracking_records.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total de vínculos afiliado-cliente</p>
              </div>
              <Network className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-cinza-claro p-6 rounded-lg border border-cinza-medio">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Top Afiliado</p>
                <p className="text-2xl font-bold text-branco">
                  {stats.top_affiliates.length > 0 ? stats.top_affiliates[0].client_count : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.top_affiliates.length > 0 ? `ID: ${stats.top_affiliates[0].affiliate_id}` : 'Nenhum dado'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Affiliates Table */}
      <div className="bg-cinza-claro rounded-lg border border-cinza-medio overflow-hidden">
        <div className="px-6 py-4 border-b border-cinza-medio">
          <h3 className="text-lg font-semibold text-branco">Lista de Afiliados</h3>
          <p className="text-sm text-gray-400">Afiliados com clientes em sua rede MLM</p>
        </div>

        {affiliates.length === 0 ? (
          <div className="text-center py-12">
            <Network className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">Nenhum afiliado encontrado</p>
            <p className="text-gray-500 text-sm">Não há afiliados com clientes na rede MLM no momento</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cinza-medio">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID do Afiliado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total de Clientes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Níveis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinza-medio">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.affiliate_id} className="hover:bg-cinza-medio/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-branco">
                          {affiliate.affiliate_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-branco">
                          {affiliate.total_clients}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {affiliate.min_level === affiliate.max_level 
                            ? `Nível ${affiliate.min_level}`
                            : `Níveis ${affiliate.min_level}-${affiliate.max_level}`
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-azul-ciano hover:text-azul-ciano/80 mr-3">
                          Ver Rede
                        </button>
                        <button className="text-gray-400 hover:text-gray-300">
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-cinza-medio flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-cinza-medio text-gray-300 rounded hover:bg-cinza-escuro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm bg-azul-ciano text-cinza-escuro rounded">
                  {currentPage}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-cinza-medio text-gray-300 rounded hover:bg-cinza-escuro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RealAffiliatesPage;

