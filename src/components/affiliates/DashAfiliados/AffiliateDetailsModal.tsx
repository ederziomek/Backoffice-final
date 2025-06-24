import React from 'react';
import { X, User, Mail, Phone, Calendar, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { useAffiliateDetails } from '../../../hooks/useAffiliates';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  formatCPF,
  getInitials,
  getStatusBgColor,
  getLevelBgColor
} from '../../../utils/formatters';

interface AffiliateDetailsModalProps {
  isOpen: boolean;
  affiliateId: number | null;
  onClose: () => void;
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-azul-ciano text-white'
        : 'text-gray-400 hover:text-branco hover:bg-gray-700'
    }`}
  >
    {label}
  </button>
);

const AffiliateDetailsModal: React.FC<AffiliateDetailsModalProps> = ({
  isOpen,
  affiliateId,
  onClose
}) => {
  const [activeTab, setActiveTab] = React.useState('personal');
  const { data: affiliate, loading, error } = useAffiliateDetails(affiliateId);

  // Fechar modal com ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-cinza-escuro border border-gray-600 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-4">
            {affiliate && (
              <>
                <div className="h-12 w-12 rounded-full bg-azul-ciano/20 flex items-center justify-center">
                  <span className="text-lg font-medium text-azul-ciano">
                    {getInitials(affiliate.name)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-branco">{affiliate.name}</h2>
                  <p className="text-gray-400">ID: {affiliate.id}</p>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-branco hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-azul-ciano mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando detalhes...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Erro ao carregar detalhes: {error}</p>
              </div>
            </div>
          )}

          {affiliate && (
            <>
              {/* Tabs */}
              <div className="flex space-x-2 p-6 border-b border-gray-600">
                <Tab
                  label="Informações Pessoais"
                  isActive={activeTab === 'personal'}
                  onClick={() => setActiveTab('personal')}
                />
                <Tab
                  label="Performance"
                  isActive={activeTab === 'performance'}
                  onClick={() => setActiveTab('performance')}
                />
                <Tab
                  label="Dados Bancários"
                  isActive={activeTab === 'banking'}
                  onClick={() => setActiveTab('banking')}
                />
                <Tab
                  label="Histórico"
                  isActive={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                />
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'personal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-branco mb-4">Dados Pessoais</h3>
                      
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Nome Completo</p>
                          <p className="text-branco">{affiliate.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p className="text-branco">{affiliate.email}</p>
                        </div>
                      </div>

                      {affiliate.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-400">Telefone</p>
                            <p className="text-branco">{formatPhone(affiliate.phone)}</p>
                          </div>
                        </div>
                      )}

                      {affiliate.document && (
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-400">CPF</p>
                            <p className="text-branco">{formatCPF(affiliate.document)}</p>
                          </div>
                        </div>
                      )}

                      {affiliate.birth_date && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-400">Data de Nascimento</p>
                            <p className="text-branco">{formatDate(affiliate.birth_date)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-branco mb-4">Status da Conta</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Status</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(affiliate.status)}`}>
                            {affiliate.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Verificado</span>
                          <div className="flex items-center space-x-2">
                            {affiliate.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className={affiliate.verified ? 'text-green-400' : 'text-red-400'}>
                              {affiliate.verified ? 'Sim' : 'Não'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Nível Atual</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelBgColor(affiliate.current_level)}`}>
                            Nível {affiliate.current_level}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Membro desde</span>
                          <span className="text-branco">{formatDate(affiliate.created_at)}</span>
                        </div>

                        {affiliate.last_login && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Último login</span>
                            <span className="text-branco">{formatDate(affiliate.last_login)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-cinza-medio p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Total de Indicações</h4>
                      <p className="text-2xl font-bold text-branco">{affiliate.total_referrals}</p>
                    </div>

                    <div className="bg-cinza-medio p-4 rounded-lg border border-gray-600">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Comissões Totais</h4>
                      <p className="text-2xl font-bold text-branco">{formatCurrency(affiliate.total_commission)}</p>
                    </div>

                    {affiliate.conversion_rate && (
                      <div className="bg-cinza-medio p-4 rounded-lg border border-gray-600">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Taxa de Conversão</h4>
                        <p className="text-2xl font-bold text-branco">{affiliate.conversion_rate.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'banking' && (
                  <div className="space-y-4">
                    {affiliate.banking ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Banco</h4>
                          <p className="text-branco">{affiliate.banking.bank}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Agência</h4>
                          <p className="text-branco">{affiliate.banking.agency}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Conta</h4>
                          <p className="text-branco">{affiliate.banking.account}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Chave PIX</h4>
                          <p className="text-branco">{affiliate.banking.pix_key}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Dados bancários não informados</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Histórico de atividades em desenvolvimento</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateDetailsModal;

