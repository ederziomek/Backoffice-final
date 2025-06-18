// Serviço para integração com dados reais da operação
import axios from 'axios';

// URL do serviço de dados reais
const DATA_SERVICE_URL = 'http://localhost:5001';

// Configuração do axios
const api = axios.create({
  baseURL: DATA_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interfaces para dados reais
export interface Usuario {
  user_id: number;
  register_date: string;
}

export interface Deposito {
  id: string;
  user_id: number;
  amount: string;
  status: string;
  data_deposito: string;
}

export interface Saque {
  id: string;
  user_id: number;
  valor: string;
  status: string;
  data_saques: string;
}

export interface Aposta {
  casino_id: string;
  user_id: number;
  game_name: string;
  balance_type: string;
  status: string;
  bet_amount: string;
  earned_value: string;
  played_date: string;
}

export interface DashboardStats {
  total_usuarios: number;
  total_depositos: number;
  total_saques: number;
  total_apostas: number;
  valor_total_depositos: number;
  valor_total_saques: number;
  valor_total_apostas: number;
  usuarios_ativos_30d: number;
}

export interface AtividadeRecente {
  tipo: 'deposito' | 'saque';
  id: string;
  user_id: number;
  valor: string;
  data: string;
  status: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  timestamp: string;
  pagination?: PaginationInfo;
  stats?: T;
}

// Serviço principal para dados reais
export const realDataService = {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Testar conexão com banco
  async testDatabaseConnection() {
    try {
      const response = await api.get('/api/database/test');
      return response.data;
    } catch (error) {
      console.error('Database test failed:', error);
      throw error;
    }
  },

  // Obter estatísticas do dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Obter usuários
  async getUsuarios(page: number = 1, limit: number = 50): Promise<ApiResponse<Usuario[]>> {
    try {
      const response = await api.get(`/api/cadastros?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      throw error;
    }
  },

  // Obter depósitos
  async getDepositos(page: number = 1, limit: number = 50): Promise<ApiResponse<Deposito[]>> {
    try {
      const response = await api.get(`/api/depositos?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching depositos:', error);
      throw error;
    }
  },

  // Obter saques
  async getSaques(page: number = 1, limit: number = 50): Promise<ApiResponse<Saque[]>> {
    try {
      const response = await api.get(`/api/saques?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching saques:', error);
      throw error;
    }
  },

  // Obter apostas
  async getApostas(page: number = 1, limit: number = 50): Promise<ApiResponse<Aposta[]>> {
    try {
      const response = await api.get(`/api/apostas?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching apostas:', error);
      throw error;
    }
  },

  // Obter atividades recentes
  async getRecentActivity(limit: number = 20): Promise<ApiResponse<AtividadeRecente[]>> {
    try {
      const response = await api.get(`/api/dashboard/recent-activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },
};

// Função para verificar status do serviço
export const checkServiceHealth = async () => {
  try {
    const health = await realDataService.healthCheck();
    const dbTest = await realDataService.testDatabaseConnection();
    
    return {
      service_status: health.status === 'ok' ? 'healthy' : 'unhealthy',
      database_status: dbTest.status === 'success' ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service_status: 'unhealthy',
      database_status: 'disconnected',
      error: error,
      timestamp: new Date().toISOString()
    };
  }
};

export default realDataService;

