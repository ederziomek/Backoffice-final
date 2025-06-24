import React, { useCallback } from 'react';
import { useAffiliates, useAffiliateStats, useModal } from '../../hooks/useAffiliates';
import StatsCards from '../../components/affiliates/DashAfiliados/StatsCards';
import FilterSection from '../../components/affiliates/DashAfiliados/FilterSection';
import AffiliatesTable from '../../components/affiliates/DashAfiliados/AffiliatesTable';
import Pagination from '../../components/affiliates/DashAfiliados/Pagination';
import AffiliateDetailsModal from '../../components/affiliates/DashAfiliados/AffiliateDetailsModal';
import MLMStructureModal from '../../components/affiliates/DashAfiliados/MLMStructureModal';
import AffiliateDashboardModal from '../../components/affiliates/DashAfiliados/AffiliateDashboardModal';

const DashAffiliatesPage: React.FC = () => {
  // Hooks para dados
  const {
    data: affiliatesData,
    loading: affiliatesLoading,
    error: affiliatesError,
    params,
    updateParams,
    refetch: refetchAffiliates
  } = useAffiliates({
    page: 1,
    limit: 50,
    search: '',
    status: 'all'
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useAffiliateStats();

  // Hooks para modais
  const detailsModal = useModal();
  const mlmModal = useModal();
  const dashboardModal = useModal();

  // Handlers para filtros
  const handleSearchChange = useCallback((search: string) => {
    updateParams({ search, page: 1 });
  }, [updateParams]);

  const handleStatusChange = useCallback((status: string) => {
    updateParams({ status: status as 'active' | 'inactive' | 'all', page: 1 });
  }, [updateParams]);

  const handleLimitChange = useCallback((limit: number) => {
    updateParams({ limit, page: 1 });
  }, [updateParams]);

  const handlePageChange = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  // Handlers para ações da tabela
  const handleViewDetails = useCallback((id: number) => {
    detailsModal.openModal(id);
  }, [detailsModal]);

  const handleEditAffiliate = useCallback((id: number) => {
    // Navegar para página de edição (implementar depois)
    console.log('Editar afiliado:', id);
  }, []);

  const handleViewMLM = useCallback((id: number) => {
    mlmModal.openModal(id);
  }, [mlmModal]);

  const handleViewDashboard = useCallback((id: number) => {
    dashboardModal.openModal(id);
  }, [dashboardModal]);

  // Handlers para ações gerais
  const handleExport = useCallback(() => {
    // Implementar exportação
    console.log('Exportar dados');
  }, []);

  const handleAddAffiliate = useCallback(() => {
    // Navegar para página de criação (implementar depois)
    console.log('Adicionar afiliado');
  }, []);

  const handleRefresh = useCallback(() => {
    refetchAffiliates();
    refetchStats();
  }, [refetchAffiliates, refetchStats]);

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-branco mb-2">Dash Afiliados</h1>
          <p className="text-gray-400">
            Gestão completa do sistema CPA com dados em tempo real
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={handleRefresh}
            disabled={affiliatesLoading || statsLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {affiliatesLoading || statsLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <StatsCards 
        data={statsData}
        loading={statsLoading}
        error={statsError}
      />

      {/* Seção de filtros */}
      <FilterSection
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onLimitChange={handleLimitChange}
        onExport={handleExport}
        onAddAffiliate={handleAddAffiliate}
        currentSearch={params.search || ''}
        currentStatus={params.status || 'all'}
        currentLimit={params.limit || 50}
        totalItems={affiliatesData?.data.pagination.total_items || 0}
      />

      {/* Tabela de afiliados */}
      <AffiliatesTable
        data={affiliatesData?.data.affiliates || []}
        loading={affiliatesLoading}
        error={affiliatesError}
        onViewDetails={handleViewDetails}
        onEditAffiliate={handleEditAffiliate}
        onViewMLM={handleViewMLM}
        onViewDashboard={handleViewDashboard}
      />

      {/* Paginação */}
      {affiliatesData?.data.pagination && (
        <Pagination
          pagination={affiliatesData.data.pagination}
          onPageChange={handlePageChange}
          loading={affiliatesLoading}
        />
      )}

      {/* Modais */}
      <AffiliateDetailsModal
        isOpen={detailsModal.isOpen}
        affiliateId={detailsModal.selectedId}
        onClose={detailsModal.closeModal}
      />
      
      <MLMStructureModal
        isOpen={mlmModal.isOpen}
        affiliateId={mlmModal.selectedId}
        onClose={mlmModal.closeModal}
      />
      
      <AffiliateDashboardModal
        isOpen={dashboardModal.isOpen}
        affiliateId={dashboardModal.selectedId}
        onClose={dashboardModal.closeModal}
      />
    </div>
  );
};

export default DashAffiliatesPage;

