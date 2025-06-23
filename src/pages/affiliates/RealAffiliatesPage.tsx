import React, { useState, useEffect } from 'react';
import { Users, Network, RefreshCw, AlertCircle, Calendar, Filter, ChevronUp, ChevronDown, DollarSign, TrendingUp } from 'lucide-react';
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

// Enum para os tipos de visualização
enum ViewType {
  INDICACOES = 'indicacoes',
  CPA_VALIDADOS = 'cpa_validados'
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
  
  // Novo estado para controlar o tipo de visualização
  const [viewType, setViewType] = useState<ViewType>(ViewType.INDICACOES);

  const fetchMLMAffiliates = async (page: number = 1, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando afiliados MLM com filtros de data das indicações:', { page, startDate, endDate, viewType });
      
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

  const fetchCPAValidatedAffiliates = async (page: number = 1, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Buscando afiliados com CPA validados:', { page, startDate, endDate });
      
      // Usar novo método específico para CPA validados
      const response = await affiliatesService.getAffiliatesWithValidatedCPA(page, 20, startDate, endDate);
      
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
        
        console.log(`✅ Carregados ${processedData.length} afiliados com CPA validados`);
        console.log('📊 Debug info:', response.debug);
        
      } else {
        console.error('❌ Resposta da API com status de erro:', response);
        setError('Erro ao carregar dados dos afiliados com CPA validados');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar afiliados com CPA validados:', error);
      setError('Erro ao carregar dados dos afiliados com CPA validados');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📈 Buscando estatísticas...');
      
      // Usar estatísticas específicas baseadas no tipo de visualização
      const response = viewType === ViewType.CPA_VALIDADOS 
        ? await affiliatesService.getCPAStats()
        : await affiliatesService.getAffiliateStats();
      
      console.log('📊 Estatísticas recebidas:', response);
      
      if (response.status === 'success') {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      // Não definir erro aqui para não sobrescrever o erro principal
    }
  };

  const handleViewTypeChange = (newViewType: ViewType) => {
    console.log('🔄 Mudando tipo de visualização:', newViewType);
    setViewType(newViewType);
    setCurrentPage(1);
    
    // Recarregar dados baseado no tipo de visualização
    if (newViewType === ViewType.CPA_VALIDADOS) {
      fetchCPAValidatedAffiliates(1, startDate, endDate);
    } else {
      fetchMLMAffiliates(1, startDate, endDate);
    }
    
    // Recarregar estatísticas após mudança de tipo
    setTimeout(() => {
      fetchStats();
    }, 100);
  };

  const handleApplyDateFilter = () => {
    if (!startDate || !endDate) {
      alert('Por favor, selecione tanto a data inicial quanto a data final.');
      return;
    }
    
    console.log('🎯 Aplicando filtro de data:', { startDate, endDate, viewType });
    setCurrentPage(1);
    
    if (viewType === ViewType.CPA_VALIDADOS) {
      fetchCPAValidatedAffiliates(1, startDate, endDate);
    } else {
      fetchMLMAffiliates(1, startDate, endDate);
    }
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    
    if (viewType === ViewType.CPA_VALIDADOS) {
      fetchCPAValidatedAffiliates(1);
    } else {
      fetchMLMAffiliates(1);
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
      console.log('📄 Mudando para página:', page);
      setCurrentPage(page);
      
      if (viewType === ViewType.CPA_VALIDADOS) {
        fetchCPAValidatedAffiliates(page, startDate, endDate);
      } else {
        fetchMLMAffiliates(page, startDate, endDate);
      }
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Atualizando dados...');
    
    // Recarregar dados baseado no tipo de visualização atual
    if (viewType === ViewType.CPA_VALIDADOS) {
      await Promise.all([
        fetchCPAValidatedAffiliates(1, startDate, endDate),
        fetchStats()
      ]);
    } else {
      await Promise.all([
        fetchMLMAffiliates(1, startDate, endDate),
        fetchStats()
      ]);
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

  const getSortIcon = (field: keyof MLMAffiliate) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-500" />;
    }
    
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-cyan-400" /> : 
      <ChevronDown className="w-4 h-4 text-cyan-400" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-gray-400">Carregando dados dos afiliados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinza-escuro text-branco">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-branco mb-2">Afiliados da Operação</h1>
            <p className="text-gray-400">
              {viewType === ViewType.CPA_VALIDADOS 
                ? 'Dados reais de CPA validados - Rede MLM até 5 níveis'
                : 'Dados reais da tabela trackeds - Rede MLM até 5 níveis'
              }
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-azul-ciano hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Botões de Alternância */}
        <div className="mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => handleViewTypeChange(ViewType.INDICACOES)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                viewType === ViewType.INDICACOES
                  ? 'bg-azul-ciano text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Network className="w-5 h-5" />
              Indicações
            </button>
            <button
              onClick={() => handleViewTypeChange(ViewType.CPA_VALIDADOS)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                viewType === ViewType.CPA_VALIDADOS
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              CPA Validados
            </button>
          </div>
          
          {/* Indicador do tipo de visualização */}
          <div className="mt-3 text-sm text-gray-400">
            {viewType === ViewType.CPA_VALIDADOS ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>Exibindo apenas afiliados com CPA validados e pagos</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Exibindo todas as indicações por níveis da rede MLM</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-branco">Filtros de Data</h3>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-branco focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-branco focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyDateFilter}
                disabled={!startDate || !endDate}
                className="flex items-center gap-2 px-4 py-2 bg-azul-ciano hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                <Filter className="w-4 h-4" />
                Aplicar Filtro
              </button>
              <button
                onClick={handleClearDateFilter}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
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
                <p className="text-gray-400 text-sm">
                  {viewType === ViewType.CPA_VALIDADOS ? 'Afiliados com CPA' : 'Afiliados únicos'}
                </p>
                <p className="text-2xl font-bold text-white">
                  {(startDate || endDate) ? 
                    affiliates.length.toLocaleString() : 
                    (stats ? stats.total_affiliates.toLocaleString() : totalAffiliates.toLocaleString())
                  }
                </p>
                <p className="text-xs text-gray-500">
                  {viewType === ViewType.CPA_VALIDADOS 
                    ? 'Com CPA validados e pagos'
                    : (startDate || endDate) ? 'No período selecionado' : 'Total de afiliados com rede'
                  }
                </p>
              </div>
              {viewType === ViewType.CPA_VALIDADOS ? (
                <DollarSign className="w-8 h-8 text-green-400" />
              ) : (
                <Users className="w-8 h-8 text-cyan-400" />
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {viewType === ViewType.CPA_VALIDADOS ? 'Total CPA Pago' : 'Quantidade de indicações'}
                </p>
                <p className="text-2xl font-bold text-white">
                  {viewType === ViewType.CPA_VALIDADOS ? (
                    `R$ ${affiliates.reduce((total, affiliate) => total + affiliate.total_pago, 0).toFixed(2)}`
                  ) : (
                    (startDate || endDate) ? 
                      affiliates.reduce((total, affiliate) => total + affiliate.total, 0).toLocaleString() :
                      (stats ? stats.total_tracking_records.toLocaleString() : 
                       affiliates.reduce((total, affiliate) => total + affiliate.total, 0).toLocaleString())
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {viewType === ViewType.CPA_VALIDADOS 
                    ? 'Soma de todos os CPAs pagos'
                    : (startDate || endDate) ? 'No período selecionado' : 'Total em todos os níveis'
                  }
                </p>
              </div>
              {viewType === ViewType.CPA_VALIDADOS ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <Network className="w-8 h-8 text-green-400" />
              )}
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
            <h2 className="text-xl font-semibold text-branco mb-2">
              {viewType === ViewType.CPA_VALIDADOS ? 'CPA Validados por Afiliado' : 'Rede MLM por Afiliado'}
            </h2>
            <p className="text-gray-400">
              {viewType === ViewType.CPA_VALIDADOS 
                ? 'Afiliados com CPA validados e valores pagos por nível'
                : 'Distribuição de indicações por níveis da rede MLM'
              }
            </p>
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
                        <div className={`text-sm font-medium ${
                          viewType === ViewType.CPA_VALIDADOS && affiliate.cpa_pago > 0 
                            ? 'text-green-400' 
                            : 'text-gray-400'
                        }`}>
                          R$ {affiliate.cpa_pago.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          viewType === ViewType.CPA_VALIDADOS && affiliate.rev_pago > 0 
                            ? 'text-green-400' 
                            : 'text-gray-400'
                        }`}>
                          R$ {affiliate.rev_pago.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${
                          viewType === ViewType.CPA_VALIDADOS && affiliate.total_pago > 0 
                            ? 'text-green-400' 
                            : 'text-azul-ciano'
                        }`}>
                          R$ {affiliate.total_pago.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center bg-gray-800">
                      <div className="flex flex-col items-center justify-center">
                        {viewType === ViewType.CPA_VALIDADOS ? (
                          <DollarSign className="w-12 h-12 text-gray-500 mb-4" />
                        ) : (
                          <Network className="w-12 h-12 text-gray-500 mb-4" />
                        )}
                        <p className="text-gray-400 text-lg">
                          {viewType === ViewType.CPA_VALIDADOS 
                            ? 'Nenhum afiliado com CPA validado encontrado'
                            : 'Nenhum afiliado encontrado'
                          }
                        </p>
                        <p className="text-gray-500 text-sm">
                          {viewType === ViewType.CPA_VALIDADOS 
                            ? 'Não há afiliados com CPA validados no período selecionado'
                            : 'Não há afiliados com clientes na rede MLM no momento'
                          }
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
                Página {currentPage} de {totalPages} ({totalAffiliates.toLocaleString()} 
                {viewType === ViewType.CPA_VALIDADOS ? ' afiliados com CPA' : ' afiliados total'})
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

