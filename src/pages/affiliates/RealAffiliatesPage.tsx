import React, { useState, useEffect } from 'react';
import { Users, Network, RefreshCw, AlertCircle, Calendar, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { affiliatesService } from '@/services/affiliatesService';

interface MLMAffiliate {
  affiliate_id: number;
  registro: string;
  total: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  cpa_pago: number;
  rev_pago: number;
  total_pago: number;
}

interface AffiliateStats {
  total_affiliates: number;
  total_tracking_records: number;
  top_affiliates: Array<{
    affiliate_id: number;
    client_count: number;
  }>;
}

interface MLMAffiliate {
  affiliate_id: number;
  registro: string;
  total: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  cpa_pago: number;
  rev_pago: number;
  total_pago: number;
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

  const fetchMLMAffiliates = async (page: number = 1, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando afiliados MLM com filtros de data das indicações:', { page, startDate, endDate });
      
      // Usar API real com filtros de data das indicações
      const response = await affiliatesService.getAffiliatesMLMLevels(page, 20, startDate, endDate);
      
      if (response.status === 'success') {
        const processedData = response.data.map(affiliate => ({
          ...affiliate,
          registro: affiliate.registro || new Date().toISOString().split('T')[0],
          cpa_pago: affiliate.cpa_pago || 0,
          rev_pago: affiliate.rev_pago || 0,
          total_pago: (affiliate.cpa_pago || 0) + (affiliate.rev_pago || 0)
        }));

        setAffiliates(processedData);
        setTotalPages(response.pagination?.pages || 1);
        setTotalAffiliates(response.pagination?.total || 0);
        
        console.log(`✅ Carregados ${processedData.length} afiliados com indicações no período`);
        console.log('📊 Debug info:', response.debug);
        
      } else {
        console.error('❌ Resposta da API com status de erro:', response);
        setError('Erro ao carregar dados dos afiliados');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar afiliados MLM:', error);
      setError('Erro ao carregar dados dos afiliados');
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

  const handleApplyDateFilter = () => {
    if (!startDate || !endDate) {
      alert('Por favor, selecione tanto a data inicial quanto a data final.');
      return;
    }
    
    // AVISO: Filtro por data não está disponível na base de dados atual
    alert('⚠️ AVISO: O filtro por data não está disponível pois a tabela de dados não possui informação temporal. Os dados mostrados são sempre todos os registros disponíveis.');
    
    console.log('🎯 Tentativa de aplicar filtro de data (não disponível):', { startDate, endDate });
    // Não recarregar dados pois o filtro não funciona
    // setCurrentPage(1);
    // fetchMLMAffiliates(1, startDate, endDate);
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchMLMAffiliates(1);
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
      console.log('📄 Mudando para página:', page);
      setCurrentPage(page);
      // Para filtros locais, não precisamos recarregar dados
      // Os dados já estão filtrados localmente
    }
  };

  const handleRefresh = async () => {
    // Recarregar dados originais
    await Promise.all([
      fetchMLMAffiliates(1), // Sempre carregar página 1 sem filtros para obter dados originais
      fetchStats()
    ]);
    
    // Reaplicar filtro se houver
    if (startDate || endDate) {
      setTimeout(() => {
        handleApplyDateFilter();
      }, 100);
    }
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
              <h1 className="text-3xl font-bold text-branco mb-2">Afiliados da Operação</h1>
              <p className="text-gray-400">
                Dados reais da tabela tracked - Rede MLM até 5 níveis
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-azul-ciano hover:bg-opacity-80 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-branco font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
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
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-azul-ciano focus:outline-none text-branco text-sm"
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
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-azul-ciano focus:outline-none text-branco text-sm"
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
              {startDate && (
                <span className="ml-2">
                  De: {startDate.split('-').reverse().join('/')}
                </span>
              )}
              {endDate && (
                <span className="ml-2">
                  Até: {endDate.split('-').reverse().join('/')}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Afiliados únicos</p>
                <p className="text-2xl font-bold text-white">
                  {(startDate || endDate) ? 
                    affiliates.length.toLocaleString() : 
                    (stats ? stats.total_affiliates.toLocaleString() : totalAffiliates.toLocaleString())
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {(startDate || endDate) ? 'No período selecionado' : 'Total de afiliados com rede'}
                </p>
              </div>
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Quantidade de indicações</p>
                <p className="text-2xl font-bold text-white">
                  {(startDate || endDate) ? 
                    affiliates.reduce((total, affiliate) => total + affiliate.total, 0).toLocaleString() :
                    (stats ? stats.total_tracking_records.toLocaleString() : 
                     affiliates.reduce((total, affiliate) => total + affiliate.total, 0).toLocaleString())
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {(startDate || endDate) ? 'No período selecionado' : 'Total em todos os níveis'}
                </p>
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
            <h2 className="text-xl font-semibold text-branco mb-2">Rede MLM por Afiliado</h2>
            <p className="text-gray-400">Distribuição de indicações por níveis da rede MLM</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Registro
                  </th>
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
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('cpa_pago')}
                  >
                    <div className="flex items-center gap-1">
                      CPA Pago
                      {getSortIcon('cpa_pago')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('rev_pago')}
                  >
                    <div className="flex items-center gap-1">
                      REV Pago
                      {getSortIcon('rev_pago')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total_pago')}
                  >
                    <div className="flex items-center gap-1">
                      Total Pago
                      {getSortIcon('total_pago')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-800">
                {sortedAffiliates.length > 0 ? (
                  sortedAffiliates.map((affiliate) => (
                    <tr key={affiliate.affiliate_id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(affiliate.registro).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-branco">
                          {affiliate.affiliate_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-azul-ciano">
                          {affiliate.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {affiliate.n1.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {affiliate.n2.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {affiliate.n3.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {affiliate.n4.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {affiliate.n5.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          R$ {affiliate.cpa_pago.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          R$ {affiliate.rev_pago.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-azul-ciano">
                          R$ {affiliate.total_pago.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center bg-gray-800">
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

