import axios from 'axios';

// Configuração da API - usando API local do backoffice
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // API local do backoffice em produção
  : '/api'; // API local do backoffice em desenvolvimento

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
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
  total_records: number;
}

export interface MLMAffiliate {
  affiliate_id: number;
  total: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
}

export interface AffiliateStats {
  total_affiliates: number;
  total_tracking_records: number;
  top_affiliates: Array<{
    affiliate_id: number;
    client_count: number;
  }>;
}

export interface AffiliatesResponse {
  status: string;
  data: Affiliate[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface MLMResponse {
  status: string;
  data: MLMAffiliate[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface StatsResponse {
  status: string;
  stats: AffiliateStats;
}

class AffiliatesService {
  // Buscar afiliados da API local
  async getAffiliates(page: number = 1, per_page: number = 20): Promise<AffiliatesResponse> {
    try {
      console.log(`🔍 Buscando afiliados da API local - Página: ${page}, Por página: ${per_page}`);
      
      const response = await api.get(`/affiliates?page=${page}&limit=${per_page}`);
      
      console.log('📊 Resposta da API local de afiliados:', response.data);
      
      return {
        status: response.data.status,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          pages: 1,
          total: 0,
          limit: per_page
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar afiliados da API local:', error);
      throw new Error('Falha ao carregar dados dos afiliados');
    }
  }

  // Buscar estatísticas de afiliados da API local
  async getAffiliateStats(): Promise<StatsResponse> {
    try {
      console.log('📈 Buscando estatísticas de afiliados da API local');
      
      const response = await api.get('/affiliates/stats');
      
      console.log('📊 Estatísticas de afiliados:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de afiliados:', error);
      throw new Error('Falha ao carregar estatísticas de afiliados');
    }
  }

  // Alias para compatibilidade
  async getStats(): Promise<StatsResponse> {
    return this.getAffiliateStats();
  }

  // Buscar dados MLM com níveis detalhados da API local - ALGORITMO CORRIGIDO
  async getAffiliatesMLMLevels(page: number = 1, per_page: number = 20): Promise<MLMResponse> {
    try {
      console.log(`🔍 Buscando afiliados MLM CORRIGIDOS da API local - Página: ${page}, Por página: ${per_page}`);
      
      // USAR ENDPOINT CORRIGIDO que processa todos os 614.944 registros
      const response = await api.get(`/affiliates/mlm-levels-corrected?page=${page}&limit=${per_page}`);
      
      console.log('📊 Resposta dos afiliados MLM CORRIGIDOS:', response.data);
      
      return {
        status: response.data.status,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          pages: 1,
          total: 0,
          limit: per_page
        }
      };

    } catch (error) {
      console.error('❌ Erro ao buscar afiliados MLM corrigidos:', error);
      // Fallback para endpoint antigo se o corrigido falhar
      console.log('🔄 Tentando endpoint antigo como fallback...');
      try {
        const fallbackResponse = await api.get(`/affiliates/mlm-levels?page=${page}&limit=${per_page}`);
        return {
          status: fallbackResponse.data.status,
          data: fallbackResponse.data.data || [],
          pagination: fallbackResponse.data.pagination || {
            page: 1,
            pages: 1,
            total: 0,
            limit: per_page
          }
        };
      } catch (fallbackError) {
        console.error('❌ Erro no fallback também:', fallbackError);
        throw new Error('Falha ao carregar estatísticas MLM');
      }
    }
  }

  // Buscar rede MLM de um afiliado específico
  async getMLMNetwork(affiliateId: number): Promise<any> {
    try {
      console.log(`🌐 Buscando rede MLM para afiliado: ${affiliateId}`);
      
      const response = await api.get(`/affiliates/${affiliateId}/mlm-network`);
      
      console.log('🔗 Rede MLM:', response.data);
      
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
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do afiliado:', error);
      throw new Error('Falha ao carregar detalhes do afiliado');
    }
  }

  // Buscar rede de um afiliado (método original)
  async getAffiliateNetwork(affiliateId: number): Promise<any> {
    try {
      console.log(`🌐 Buscando rede do afiliado: ${affiliateId}`);
      
      const response = await api.get(`/affiliates/${affiliateId}/network`);
      
      console.log('🔗 Rede do afiliado:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar rede do afiliado:', error);
      throw new Error('Falha ao carregar rede do afiliado');
    }
  }

  // Testar conexão com a API local
  async testConnection(): Promise<void> {
    try {
      console.log('🔗 Testando conexão com API local');
      
      const response = await api.get('/health');
      
      console.log('✅ Conexão com API local funcionando:', response.data);

    } catch (error) {
      console.error('❌ Erro na conexão com API local:', error);
      throw new Error('Falha na conexão com a API local');
    }
  }
}

export const affiliatesService = new AffiliatesService();
export default affiliatesService;

