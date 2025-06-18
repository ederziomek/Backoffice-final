import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { realDataService, Usuario } from '@/services/realDataService';

const RealUsersTable: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadUsuarios();
  }, [currentPage]);

  const loadUsuarios = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Testar conexão primeiro
      const connectionTest = await realDataService.testDatabaseConnection();
      if (connectionTest.status === 'success') {
        setConnectionStatus('connected');
        
        // Carregar usuários
        const response = await realDataService.getUsuarios(currentPage, ITEMS_PER_PAGE);
        if (response.status === 'success' && response.data) {
          setUsuarios(response.data);
          
          if (response.pagination) {
            setTotalPages(response.pagination.pages);
            setTotalUsuarios(response.pagination.total);
          }
        } else {
          setError('Falha ao carregar usuários');
        }
      } else {
        setConnectionStatus('disconnected');
        setError('Falha na conexão com banco de dados');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setConnectionStatus('disconnected');
      setError('Erro ao carregar dados dos usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadUsuarios();
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      // Para busca, vamos filtrar localmente por enquanto
      // Em produção, implementar busca no backend
      const filteredUsers = usuarios.filter(user => 
        user.user_id.toString().includes(searchTerm)
      );
      
      if (filteredUsers.length === 0) {
        setError(`Nenhum usuário encontrado com ID contendo "${searchTerm}"`);
      } else {
        setUsuarios(filteredUsers);
      }
    } catch (error) {
      setError('Erro ao buscar usuários');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadUsuarios();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-azul-ciano" />
            <p className="text-branco">Carregando usuários da operação...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Alert className={`${connectionStatus === 'connected' ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
        <div className="flex items-center">
          {connectionStatus === 'connected' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className="ml-2 text-branco">
            {connectionStatus === 'connected' 
              ? `Conectado ao banco da operação - Total: ${formatNumber(totalUsuarios)} usuários`
              : error || 'Falha na conexão com banco de dados da operação'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Filtros e Busca */}
      <Card className="bg-cinza-claro border-cinza-medio">
        <CardHeader>
          <CardTitle className="text-branco flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por ID do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-cinza-escuro border-cinza-medio text-branco"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-azul-ciano text-cinza-escuro hover:bg-azul-ciano/80"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Aplicar Filtros'}
              </Button>
              {searchTerm && (
                <Button 
                  onClick={handleClearSearch}
                  variant="outline"
                  className="border-cinza-medio text-branco hover:bg-cinza-medio"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-cinza-claro border-cinza-medio">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-branco">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-azul-ciano" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-branco">{formatNumber(totalUsuarios)}</div>
            <p className="text-xs text-gray-400">
              Usuários cadastrados na plataforma
            </p>
          </CardContent>
        </Card>

        <Card className="bg-cinza-claro border-cinza-medio">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-branco">Página Atual</CardTitle>
            <Calendar className="h-4 w-4 text-azul-ciano" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-branco">{currentPage} de {formatNumber(totalPages)}</div>
            <p className="text-xs text-gray-400">
              Exibindo {ITEMS_PER_PAGE} usuários por página
            </p>
          </CardContent>
        </Card>

        <Card className="bg-cinza-claro border-cinza-medio">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-branco">Status da Conexão</CardTitle>
            {connectionStatus === 'connected' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-branco">
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-gray-400">
              {connectionStatus === 'connected' ? 'Conectado ao banco da operação' : 'Falha na conexão'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card className="bg-cinza-claro border-cinza-medio">
        <CardHeader>
          <CardTitle className="text-branco">Lista de Usuários</CardTitle>
          <CardDescription className="text-gray-400">
            Dados reais dos usuários cadastrados na operação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-500 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-branco">{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cinza-medio">
                  <th className="text-left py-3 px-4 font-medium text-gray-300">ID do Usuário</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Data de Cadastro</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario, index) => (
                  <tr key={usuario.user_id} className="border-b border-cinza-medio hover:bg-cinza-medio/50">
                    <td className="py-3 px-4 text-branco font-medium">{usuario.user_id}</td>
                    <td className="py-3 px-4 text-gray-300">{formatDate(usuario.register_date)}</td>
                    <td className="py-3 px-4">
                      <Badge variant="default" className="bg-green-600 text-white">
                        Ativo
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-azul-ciano text-azul-ciano hover:bg-azul-ciano hover:text-cinza-escuro">
                          Ver Detalhes
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-white">
                          Histórico
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Exibindo {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalUsuarios)} de {formatNumber(totalUsuarios)} usuários
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="border-cinza-medio text-branco hover:bg-cinza-medio"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <span className="text-sm text-gray-300 px-3">
                Página {currentPage} de {formatNumber(totalPages)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="border-cinza-medio text-branco hover:bg-cinza-medio"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botão para Recarregar */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={loadUsuarios}
              disabled={isLoading}
              className="bg-azul-ciano text-cinza-escuro hover:bg-azul-ciano/80"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealUsersTable;

