import React, { useState, useEffect } from 'react';
import { Users, Network, RefreshCw, AlertCircle, Calendar, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { affiliatesService } from '@/services/affiliatesService';

interface MLMAffiliate {
  affiliate_id: number;
  total: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
}

interface AffiliateStats {
  total_affiliates: number;
  total_tracking_records: number;
  top_affiliates: Array<{
    affiliate_id: number;
    client_count: number;
  }>;
}

interface MLMResponse {
  status: string;
  data: MLMAffiliate[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

const RealAffiliatesPage: React.FC = () => {
  const [affiliates, setAffiliates] = useState<MLMAffiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAffiliates, setTotalAffiliates] = useState(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortField, setSortField] = useState<keyof MLMAffiliate | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const limit = 20;

  const fetchMLMAffiliates = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Buscando afiliados MLM - Página: ${page}`);
      
      const response: MLMResponse = await affiliatesService.getAffiliatesMLMLevels(page, limit);
      
      console.log('📊 Dados MLM recebidos:', response);
      
      if (response.status === 'success') {
        setAffiliates(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setCurrentPage(response.pagination?.page || 1);
        setTotalAffiliates(response.pagination?.total || 0);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar afiliados MLM:', err);
      setError(err instanceof Error ? err.message : 'Falha ao carregar estatísticas MLM');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📈 Buscando estatísticas...');
      
      const response = await affiliatesService.getAffiliateStats();
      
      console.log('📊 Estatísticas recebidas:', response);
      
      if (response.status === 'success') {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      // Não definir erro aqui para não sobrescrever o erro principal
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
    const loadData = async () => {
      await testConnection();
      await Promise.all([
        fetchMLMAffiliates(1),
        fetchStats()
      ]);
    };
    
    loadData();
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchMLMAffiliates(page);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchMLMAffiliates(currentPage),
      fetchStats()
    ]);
  };

  const handleApplyDateFilter = () => {
    // Nota: A API atual não suporta filtros de data
    // Esta funcionalidade será implementada quando a API for atualizada
    console.log('Filtro de data aplicado:', { startDate, endDate });
    // Por enquanto, apenas recarrega os dados
    setCurrentPage(1);
    fetchMLMAffiliates(1);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchMLMAffiliates(1);
  };

  const handleSort = (field: keyof MLMAffiliate) => {
    let direction: 'asc' | 'desc' = 'desc';
    
    if (sortField === field && sortDirection === 'desc') {
      direction = 'asc';
    }
    
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedAffiliates = React.useMemo(() => {
    if (!sortField) return affiliates;
    
    return [...affiliates].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [affiliates, sortField, sortDirection]);

  const getSortIcon = (field: keyof MLMAffiliate) => {
    if (sortField !== field) {
      return <ChevronDown className="w-4 h-4 text-gray-500" />;
    }
    
    return sortDirection === 'desc' 
      ? <ChevronDown className="w-4 h-4 text-azul-ciano" />
      : <ChevronUp className="w-4 h-4 text-azul-ciano" />;
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

        {/* Date Filters */}
        <div className="mb-8 p-4 bg-cinza-claro rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-azul-ciano" />
            <h3 className="text-lg font-semibold text-branco">Filtros de Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                Data Inicial
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-cinza-escuro border border-gray-700 rounded-lg focus:border-azul-ciano focus:outline-none text-branco text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                Data Final
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-cinza-escuro border border-gray-700 rounded-lg focus:border-azul-ciano focus:outline-none text-branco text-sm"
                />
              </div>
            </div>
            <div>
              <button
                onClick={handleApplyDateFilter}
                className="w-full px-4 py-2 bg-azul-ciano hover:bg-opacity-80 text-branco font-medium rounded-lg transition-colors"
              >
                Aplicar Filtro
              </button>
            </div>
            <div>
              <button
                onClick={handleClearDateFilter}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-branco font-medium rounded-lg transition-colors"
              >
                Limpar Filtro
              </button>
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-3 text-sm text-gray-400">
              <span className="font-medium">Período selecionado:</span>
              {startDate && <span className="ml-2">De: {new Date(startDate).toLocaleDateString('pt-BR')}</span>}
              {endDate && <span className="ml-2">Até: {new Date(endDate).toLocaleDateString('pt-BR')}</span>}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Afiliados únicos</p>
                <p className="text-2xl font-bold text-white">
                  {stats ? stats.total_affiliates.toLocaleString() : totalAffiliates.toLocaleString()}
                </p>
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
                  {stats ? stats.total_tracking_records.toLocaleString() : 
                   affiliates.reduce((total, affiliate) => total + affiliate.total, 0).toLocaleString()}
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
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </div>
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
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center gap-1">
                      Total
                      {getSortIcon('total')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('n1')}
                  >
                    <div className="flex items-center gap-1">
                      N1
                      {getSortIcon('n1')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('n2')}
                  >
                    <div className="flex items-center gap-1">
                      N2
                      {getSortIcon('n2')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('n3')}
                  >
                    <div className="flex items-center gap-1">
                      N3
                      {getSortIcon('n3')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('n4')}
                  >
                    <div className="flex items-center gap-1">
                      N4
                      {getSortIcon('n4')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('n5')}
                  >
                    <div className="flex items-center gap-1">
                      N5
                      {getSortIcon('n5')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedAffiliates.length > 0 ? (
                  sortedAffiliates.map((affiliate) => (
                    <tr key={affiliate.affiliate_id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {affiliate.affiliate_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-azul-ciano">
                          {affiliate.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-branco">
                          {affiliate.n1.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-branco">
                          {affiliate.n2.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-branco">
                          {affiliate.n3.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-branco">
                          {affiliate.n4.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-branco">
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

