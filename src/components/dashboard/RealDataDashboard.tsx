import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity,
  Database,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { realDataService, DashboardStats, AtividadeRecente } from '@/services/realDataService';

const RealDataDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AtividadeRecente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Testar conexão primeiro
      const connectionTest = await realDataService.testDatabaseConnection();
      if (connectionTest.status === 'success') {
        setConnectionStatus('connected');
        
        // Carregar estatísticas
        const statsResponse = await realDataService.getDashboardStats();
        if (statsResponse.status === 'success' && statsResponse.stats) {
          setStats(statsResponse.stats);
        }

        // Carregar atividades recentes
        try {
          const activityResponse = await realDataService.getRecentActivity(10);
          if (activityResponse.status === 'success' && activityResponse.data) {
            setRecentActivity(activityResponse.data);
          }
        } catch (activityError) {
          console.warn('Atividades recentes não disponíveis:', activityError);
        }

      } else {
        setConnectionStatus('disconnected');
        setError('Falha na conexão com banco de dados');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setConnectionStatus('disconnected');
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-azul-ciano" />
            <p className="text-branco">Carregando dados reais da operação...</p>
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
              ? 'Conectado ao banco de dados da operação - Dados reais sendo exibidos'
              : error || 'Falha na conexão com banco de dados da operação'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Estatísticas Principais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-cinza-claro border-cinza-medio">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-branco">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-azul-ciano" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-branco">{formatNumber(stats.total_usuarios)}</div>
              <p className="text-xs text-gray-400">
                Usuários cadastrados na plataforma
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cinza-claro border-cinza-medio">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-branco">Total de Depósitos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-branco">{formatNumber(stats.total_depositos)}</div>
              <p className="text-xs text-gray-400">
                Valor: {formatCurrency(stats.valor_total_depositos)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cinza-claro border-cinza-medio">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-branco">Total de Saques</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-branco">{formatNumber(stats.total_saques)}</div>
              <p className="text-xs text-gray-400">
                Valor: {formatCurrency(stats.valor_total_saques)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cinza-claro border-cinza-medio">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-branco">Total de Apostas</CardTitle>
              <DollarSign className="h-4 w-4 text-azul-ciano" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-branco">{formatNumber(stats.total_apostas)}</div>
              <p className="text-xs text-gray-400">
                Valor: {formatCurrency(stats.valor_total_apostas)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estatísticas Adicionais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-cinza-claro border-cinza-medio">
            <CardHeader>
              <CardTitle className="text-branco">Usuários Ativos (30 dias)</CardTitle>
              <CardDescription className="text-gray-400">Usuários que fizeram apostas nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {formatNumber(stats.usuarios_ativos_30d)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cinza-claro border-cinza-medio">
            <CardHeader>
              <CardTitle className="text-branco">Resumo Financeiro</CardTitle>
              <CardDescription className="text-gray-400">Valores totais da operação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Depósitos:</span>
                <span className="font-semibold text-green-400">
                  {formatCurrency(stats.valor_total_depositos)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Saques:</span>
                <span className="font-semibold text-red-400">
                  {formatCurrency(stats.valor_total_saques)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Apostas:</span>
                <span className="font-semibold text-azul-ciano">
                  {formatCurrency(stats.valor_total_apostas)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Atividades Recentes */}
      {recentActivity.length > 0 && (
        <Card className="bg-cinza-claro border-cinza-medio">
          <CardHeader>
            <CardTitle className="text-branco">Atividades Recentes</CardTitle>
            <CardDescription className="text-gray-400">Últimas transações da operação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-cinza-medio rounded-lg bg-cinza-escuro">
                  <div className="flex items-center space-x-3">
                    <Badge variant={activity.tipo === 'deposito' ? 'default' : 'secondary'}>
                      {activity.tipo === 'deposito' ? 'Depósito' : 'Saque'}
                    </Badge>
                    <div>
                      <p className="font-medium text-branco">Usuário ID: {activity.user_id}</p>
                      <p className="text-sm text-gray-400">
                        {formatDate(activity.data)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-branco">
                      {formatCurrency(parseFloat(activity.valor))}
                    </p>
                    <Badge 
                      variant={activity.status === 'APPROVED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão para Recarregar */}
      <div className="flex justify-center">
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-azul-ciano text-cinza-escuro rounded-lg hover:bg-azul-ciano/80 flex items-center space-x-2 font-medium"
          disabled={isLoading}
        >
          <Database className="h-4 w-4" />
          <span>Recarregar Dados</span>
        </button>
      </div>
    </div>
  );
};

export default RealDataDashboard;

