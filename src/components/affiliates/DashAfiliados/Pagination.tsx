import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { AffiliatesPagination } from '../../../services/affiliateService';

interface PaginationProps {
  pagination: AffiliatesPagination;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ 
  pagination, 
  onPageChange, 
  loading = false 
}) => {
  const { current_page, total_pages, total_items, items_per_page } = pagination;

  // Calcular range de itens exibidos
  const startItem = (current_page - 1) * items_per_page + 1;
  const endItem = Math.min(current_page * items_per_page, total_items);

  // Gerar números de páginas para exibir
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (total_pages <= maxVisiblePages) {
      // Se há poucas páginas, mostrar todas
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas com ellipsis
      const halfVisible = Math.floor(maxVisiblePages / 2);
      
      if (current_page <= halfVisible + 1) {
        // Início: 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
        if (maxVisiblePages < total_pages - 1) {
          pages.push('...');
        }
        if (maxVisiblePages < total_pages) {
          pages.push(total_pages);
        }
      } else if (current_page >= total_pages - halfVisible) {
        // Final: 1, ..., n-4, n-3, n-2, n-1, n
        pages.push(1);
        if (total_pages - maxVisiblePages > 1) {
          pages.push('...');
        }
        for (let i = total_pages - maxVisiblePages + 1; i <= total_pages; i++) {
          pages.push(i);
        }
      } else {
        // Meio: 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push('...');
        for (let i = current_page - 1; i <= current_page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(total_pages);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= total_pages && page !== current_page && !loading) {
      onPageChange(page);
    }
  };

  if (total_pages <= 1) {
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-cinza-medio rounded-lg border border-gray-700">
        <div className="text-sm text-gray-400">
          Mostrando {total_items} {total_items === 1 ? 'afiliado' : 'afiliados'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-cinza-medio rounded-lg border border-gray-700 gap-4">
      {/* Informações da paginação */}
      <div className="text-sm text-gray-400">
        Mostrando {startItem.toLocaleString('pt-BR')} a {endItem.toLocaleString('pt-BR')} de{' '}
        {total_items.toLocaleString('pt-BR')} afiliados
      </div>

      {/* Controles de paginação */}
      <div className="flex items-center space-x-2">
        {/* Primeira página */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={current_page === 1 || loading}
          className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Primeira página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Página anterior */}
        <button
          onClick={() => handlePageChange(current_page - 1)}
          disabled={current_page === 1 || loading}
          className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números das páginas */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:cursor-not-allowed ${
                    page === current_page
                      ? 'bg-azul-ciano text-white'
                      : 'text-gray-400 hover:text-branco hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Próxima página */}
        <button
          onClick={() => handlePageChange(current_page + 1)}
          disabled={current_page === total_pages || loading}
          className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última página */}
        <button
          onClick={() => handlePageChange(total_pages)}
          disabled={current_page === total_pages || loading}
          className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Ir para página específica */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Ir para:</span>
        <input
          type="number"
          min={1}
          max={total_pages}
          value={current_page}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= total_pages) {
              handlePageChange(page);
            }
          }}
          disabled={loading}
          className="w-16 px-2 py-1 text-sm bg-cinza-escuro border border-gray-600 rounded text-branco text-center focus:border-azul-ciano focus:ring-1 focus:ring-azul-ciano focus:outline-none disabled:opacity-50"
        />
        <span className="text-sm text-gray-400">de {total_pages}</span>
      </div>
    </div>
  );
};

export default Pagination;

