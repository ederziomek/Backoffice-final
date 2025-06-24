import React from 'react';
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Network, 
  BarChart3, 
  Phone, 
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Affiliate } from '../../../services/affiliateService';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  getStatusBgColor, 
  getLevelBgColor,
  getInitials
} from '../../../utils/formatters';

interface AffiliatesTableProps {
  data: Affiliate[];
  loading: boolean;
  error: string | null;
  onViewDetails: (id: number) => void;
  onEditAffiliate: (id: number) => void;
  onViewMLM: (id: number) => void;
  onViewDashboard: (id: number) => void;
}

interface ActionMenuProps {
  affiliate: Affiliate;
  onViewDetails: (id: number) => void;
  onEditAffiliate: (id: number) => void;
  onViewMLM: (id: number) => void;
  onViewDashboard: (id: number) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  affiliate,
  onViewDetails,
  onEditAffiliate,
  onViewMLM,
  onViewDashboard
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: 'Ver Detalhes',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => {
        onViewDetails(affiliate.id);
        setIsOpen(false);
      }
    },
    {
      label: 'Editar',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => {
        onEditAffiliate(affiliate.id);
        setIsOpen(false);
      }
    },
    {
      label: 'Estrutura MLM',
      icon: <Network className="w-4 h-4" />,
      onClick: () => {
        onViewMLM(affiliate.id);
        setIsOpen(false);
      }
    },
    {
      label: 'Dashboard',
      icon: <BarChart3 className="w-4 h-4" />,
      onClick: () => {
        onViewDashboard(affiliate.id);
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-cinza-escuro border border-gray-600 rounded-lg shadow-lg z-10">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:text-branco hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AffiliatesTable: React.FC<AffiliatesTableProps> = ({
  data,
  loading,
  error,
  onViewDetails,
  onEditAffiliate,
  onViewMLM,
  onViewDashboard
}) => {
  if (loading) {
    return (
      <div className="bg-cinza-medio rounded-lg border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-azul-ciano mr-3" />
          <span className="text-gray-400">Carregando afiliados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-cinza-medio rounded-lg border border-red-500/30">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-400 mr-3" />
          <span className="text-red-400">Erro ao carregar afiliados: {error}</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-cinza-medio rounded-lg border border-gray-700">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-gray-400 mr-3" />
          <span className="text-gray-400">Nenhum afiliado encontrado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cinza-medio rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cinza-escuro border-b border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Afiliado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Indicações
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Comissões
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Nível
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Cadastro
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((affiliate) => (
              <tr 
                key={affiliate.id} 
                className="hover:bg-gray-700/30 transition-colors"
              >
                {/* Afiliado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-azul-ciano/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-azul-ciano">
                          {getInitials(affiliate.name)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-branco">
                        {affiliate.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        ID: {affiliate.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contato */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-300">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {affiliate.email}
                    </div>
                    {affiliate.phone && (
                      <div className="flex items-center text-sm text-gray-300">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {formatPhone(affiliate.phone)}
                      </div>
                    )}
                  </div>
                </td>

                {/* Indicações */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-branco font-medium">
                    {affiliate.total_referrals}
                  </div>
                  {affiliate.conversion_rate && (
                    <div className="text-xs text-gray-400">
                      {affiliate.conversion_rate.toFixed(1)}% conversão
                    </div>
                  )}
                </td>

                {/* Comissões */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-branco font-medium">
                    {formatCurrency(affiliate.total_commission)}
                  </div>
                </td>

                {/* Nível */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBgColor(affiliate.current_level)}`}>
                    Nível {affiliate.current_level}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(affiliate.status)}`}>
                    {affiliate.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                  {affiliate.verified && (
                    <div className="text-xs text-green-400 mt-1">
                      ✓ Verificado
                    </div>
                  )}
                </td>

                {/* Cadastro */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {formatDate(affiliate.created_at)}
                  </div>
                  {affiliate.last_login && (
                    <div className="text-xs text-gray-400">
                      Último login: {formatDate(affiliate.last_login)}
                    </div>
                  )}
                </td>

                {/* Ações */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <ActionMenu
                    affiliate={affiliate}
                    onViewDetails={onViewDetails}
                    onEditAffiliate={onEditAffiliate}
                    onViewMLM={onViewMLM}
                    onViewDashboard={onViewDashboard}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AffiliatesTable;

