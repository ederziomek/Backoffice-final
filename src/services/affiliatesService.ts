import axios from 'axios';

// Configuração da API base - usando API local com dados reais
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // API local no mesmo servidor
  : 'http://localhost:5001/api';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para consultas do banco
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

// Interfaces para dados reais
export interface Affiliate {
  affiliate_id: number;
  total_clients: number;
  min_level: number;
  max_level: number;
  status: string;
  total_records?: number;
}

export interface AffiliateStats {
  total_affiliates: number;
  total_tracking_records: number;
  top_affiliates: Array<{
    affiliate_id: number;
    client_count: number;
  }>;
}

export interface MLMNetwork {
  affiliate_id: number;
  network: Record<string, Array<{
    affiliate_id: number;
    client_id: number;
  }>>;
  stats: Record<string, {
    level: number;
    clients_count: number;
    affiliates_count: number;
  }>;
  total_network_size: number;
  max_levels: number;
}

export interface AffiliatesResponse {
  affiliates: Affiliate[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

class AffiliatesService {
  // Buscar afiliados com dados 100% reais do banco PostgreSQL
  async getAffiliates(page: number = 1, per_page: number = 20): Promise<AffiliatesResponse> {
    try {
      console.log(`🔍 Buscando afiliados reais - Página: ${page}, Por página: ${per_page}`);
      
      const response = await api.get(`/affiliates?page=${page}&limit=${per_page}`);
      
      console.log('📊 Resposta da API local (dados reais):', response.data);
      
      return {
        affiliates: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          pages: 1,
          total: 0,
          limit: per_page
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar afiliados reais:', error);
      throw new Error('Falha ao carregar dados dos afiliados');
    }
  }

  // Buscar estatísticas com dados 100% reais
  async getAffiliateStats(): Promise<AffiliateStats> {
    try {
      console.log('📈 Buscando estatísticas reais dos afiliados');
      
      const response = await api.get('/affiliates/stats');
      
      console.log('📊 Estatísticas reais:', response.data);
      
      return response.data.stats;

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao carregar estatísticas');
    }
  }

  // Buscar rede MLM até 5 níveis com dados 100% reais
  async getMLMNetwork(affiliateId: number): Promise<MLMNetwork> {
    try {
      console.log(`🌐 Buscando rede MLM real para afiliado: ${affiliateId}`);
      
      const response = await api.get(`/affiliates/${affiliateId}/mlm-network`);
      
      console.log('🔗 Rede MLM real:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar rede MLM:', error);
      throw new Error('Falha ao carregar rede MLM');
    }
  }

  // Buscar detalhes de um afiliado específico
  async getAffiliateDetails(affiliateId: number): Promise<any> {
    try {
      console.log(`👤 Buscando detalhes do afiliado: ${affiliateId}`);
      
      const response = await api.get(`/affiliates/${affiliateId}`);
      
      console.log('📋 Detalhes do afiliado:', response.data);
      
      return response.data.data;

    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do afiliado:', error);
      throw new Error('Falha ao carregar detalhes do afiliado');
    }
  }

  // Buscar rede de um afiliado (método original)
  async getAffiliateNetwork(affiliateId: number): Promise<any> {
    try {
      console.log(`🔗 Buscando rede do afiliado: ${affiliateId}`);
      
      const response = await api.get(`/affiliates/${affiliateId}/network`);
      
      console.log('🌐 Rede do afiliado:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar rede do afiliado:', error);
      throw new Error('Falha ao carregar rede do afiliado');
    }
  }
}

export const affiliatesService = new AffiliatesService();
export default affiliatesService;

