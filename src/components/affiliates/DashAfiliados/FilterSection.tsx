import React, { useState, useCallback } from 'react';
import { Search, Filter, X, Download, UserPlus } from 'lucide-react';
import { useDebounce } from '../../../hooks/useAffiliates';
import { STATUS_OPTIONS, PAGINATION_OPTIONS } from '../../../utils/constants';

interface FilterSectionProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onLimitChange: (limit: number) => void;
  onExport?: () => void;
  onAddAffiliate?: () => void;
  currentSearch: string;
  currentStatus: string;
  currentLimit: number;
  totalItems: number;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  onSearchChange,
  onStatusChange,
  onLimitChange,
  onExport,
  onAddAffiliate,
  currentSearch,
  currentStatus,
  currentLimit,
  totalItems
}) => {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  // Aplicar busca quando o valor debounced mudar
  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    onSearchChange('');
  }, [onSearchChange]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(e.target.value);
  }, [onStatusChange]);

  const handleLimitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onLimitChange(Number(e.target.value));
  }, [onLimitChange]);

  return (
    <div className="bg-cinza-medio rounded-lg p-6 border border-gray-700 mb-6">
      {/* Header com título e ações */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-branco mb-1">Gestão de Afiliados</h2>
          <p className="text-gray-400 text-sm">
            {totalItems.toLocaleString('pt-BR')} afiliados encontrados
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          {onAddAffiliate && (
            <button
              onClick={onAddAffiliate}
              className="flex items-center justify-center px-4 py-2 bg-azul-ciano text-white rounded-lg hover:bg-azul-ciano/80 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Afiliado
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Campo de busca */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buscar Afiliado
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-10 py-2 bg-cinza-escuro border border-gray-600 rounded-lg text-branco placeholder-gray-400 focus:border-azul-ciano focus:ring-1 focus:ring-azul-ciano focus:outline-none"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-branco"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filtro de status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={currentStatus}
              onChange={handleStatusChange}
              className="w-full pl-10 pr-4 py-2 bg-cinza-escuro border border-gray-600 rounded-lg text-branco focus:border-azul-ciano focus:ring-1 focus:ring-azul-ciano focus:outline-none appearance-none"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Itens por página */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Itens por página
          </label>
          <select
            value={currentLimit}
            onChange={handleLimitChange}
            className="w-full px-4 py-2 bg-cinza-escuro border border-gray-600 rounded-lg text-branco focus:border-azul-ciano focus:ring-1 focus:ring-azul-ciano focus:outline-none appearance-none"
          >
            {PAGINATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros ativos */}
      {(currentSearch || currentStatus !== 'all') && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-600">
          <span className="text-sm text-gray-400">Filtros ativos:</span>
          
          {currentSearch && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-azul-ciano/20 text-azul-ciano border border-azul-ciano/30">
              Busca: "{currentSearch}"
              <button
                onClick={clearSearch}
                className="ml-2 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {currentStatus !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
              Status: {STATUS_OPTIONS.find(opt => opt.value === currentStatus)?.label}
              <button
                onClick={() => onStatusChange('all')}
                className="ml-2 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;

