// Serviço para conexão com banco PostgreSQL e APIs de afiliados
import axios from 'axios';

// Configuração da API base
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://backoffice-final-production.up.railway.app/api'
  : 'http://localhost:5001/api';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Interfaces
export interface Affiliate {
  affiliate_id: number;
  total_clients: number;
  min_level: number;
  max_level: number;
  status: string;
}

export interface AffiliateStats {
  total_affiliates: number;
  total_tracking_records: number;
  level_distribution: Record<string, number>;
  top_affiliates: Array<{
    affiliate_id: number;
    client_count: number;
  }>;
}

export interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export interface AffiliatesResponse {
  status: string;
  data: Affiliate[];
  pagination: PaginationInfo;
  message?: string;
}

export interface StatsResponse {
  status: string;
  stats: AffiliateStats;
  message?: string;
}

// Serviços da API
export const affiliatesService = {
  // Buscar afiliados com paginação
  async getAffiliates(page: number = 1, limit: number = 20): Promise<AffiliatesResponse> {
    try {
      const response = await api.get(`/affiliates?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar afiliados:', error);
      throw new Error('Erro de conexão com o servidor');
    }
  },

  // Buscar estatísticas dos afiliados
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await api.get('/affiliates/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Erro ao carregar estatísticas');
    }
  },

  // Buscar detalhes de um afiliado específico
  async getAffiliateDetails(affiliateId: number) {
    try {
      const response = await api.get(`/affiliates/${affiliateId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes do afiliado:', error);
      throw new Error('Erro ao carregar detalhes do afiliado');
    }
  },

  // Buscar rede de um afiliado
  async getAffiliateNetwork(affiliateId: number) {
    try {
      const response = await api.get(`/affiliates/${affiliateId}/network`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar rede do afiliado:', error);
      throw new Error('Erro ao carregar rede do afiliado');
    }
  },

  // Testar conexão com o banco
  async testConnection() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      throw new Error('Erro de conexão com o servidor');
    }
  }
};

export default affiliatesService;

