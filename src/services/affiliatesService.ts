import axios from 'axios';

// Configuração da API - usando microserviço de afiliados
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://fature-affiliate-service-production.up.railway.app/api/v1'  // Microserviço de afiliados
  : 'https://fature-affiliate-service-production.up.railway.app/api/v1';

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
  id: number;
  external_id: number;
  name?: string;
  email?: string;
  status: string;
  total_clients: number;
  total_commission: number;
  created_at: string;
}

export interface MLMStats {
  affiliate_id: number;
  name?: string;
  total_network: number;
  n1_count: number;
  n2_count: number;
  n3_count: number;
  n4_count: number;
  n5_count: number;
  total_commission: number;
  last_calculated: string;
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

export interface MLMStatsResponse {
  status: string;
  data: MLMStats[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

class AffiliatesService {
  // Buscar afiliados do microserviço
  async getAffiliates(page: number = 1, per_page: number = 20): Promise<AffiliatesResponse> {
    try {
      console.log(`🔍 Buscando afiliados do microserviço - Página: ${page}, Por página: ${per_page}`);
      
      const response = await api.get(`/affiliates?page=${page}&limit=${per_page}`);
      
      console.log('📊 Resposta do microserviço de afiliados:', response.data);
      
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
      console.error('❌ Erro ao buscar afiliados do microserviço:', error);
      throw new Error('Falha ao carregar dados dos afiliados');
    }
  }

  // Buscar estatísticas MLM do microserviço
  async getAffiliateStats(): Promise<any> {
    try {
      console.log('📈 Buscando estatísticas MLM do microserviço');
      
      const response = await api.get('/mlm/stats?page=1&limit=1');
      
      console.log('📊 Estatísticas MLM:', response.data);
      
      return {
        status: response.data.status,
        data: response.data.data,
        pagination: response.data.pagination
      };

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas MLM:', error);
      throw new Error('Falha ao carregar estatísticas MLM');
    }
  }

  // Alias para compatibilidade
  async getStats(): Promise<any> {
    return this.getAffiliateStats();
  }

  // Buscar dados MLM com níveis detalhados
  async getAffiliatesMLMLevels(page: number = 1, per_page: number = 20): Promise<MLMStatsResponse> {
    try {
      console.log(`🔍 Buscando estatísticas MLM - Página: ${page}, Por página: ${per_page}`);
      
      const response = await api.get(`/mlm/stats?page=${page}&limit=${per_page}`);
      
      console.log('📊 Resposta das estatísticas MLM:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas MLM:', error);
      throw new Error('Falha ao carregar estatísticas MLM');
    }
  }

  // Buscar rede MLM de um afiliado específico
  async getMLMNetwork(affiliateId: number): Promise<any> {
    try {
      console.log(`🌐 Buscando rede MLM para afiliado: ${affiliateId}`);
      
      const response = await api.get(`/affiliates/${affiliateId}/mlm`);
      
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
      
      const response = await api.get(`/affiliates/${affiliateId}/mlm`);
      
      console.log('📋 Detalhes do afiliado:', response.data);
      
      return response.data.data;

    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do afiliado:', error);
      throw new Error('Falha ao carregar detalhes do afiliado');
    }
  }

  // Buscar rede de um afiliado (método original)
  async getAffiliateNetwork(affiliateId: number): Promise<any> {
    return this.getMLMNetwork(affiliateId);
  }

  // Sincronizar dados manualmente
  async syncAffiliates(): Promise<any> {
    try {
      console.log('🔄 Iniciando sincronização manual de afiliados...');
      
      const response = await api.post('/sync/affiliates');
      
      console.log('✅ Sincronização concluída:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw new Error('Falha na sincronização de afiliados');
    }
  }

  // Processar MLM manualmente
  async processMLM(): Promise<any> {
    try {
      console.log('🔄 Iniciando processamento MLM manual...');
      
      const response = await api.post('/mlm/process');
      
      console.log('✅ Processamento MLM concluído:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro no processamento MLM:', error);
      throw new Error('Falha no processamento MLM');
    }
  }

  // Buscar status de sincronização
  async getSyncStatus(): Promise<any> {
    try {
      console.log('📊 Buscando status de sincronização...');
      
      const response = await api.get('/sync/status');
      
      console.log('📈 Status de sincronização:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar status de sincronização:', error);
      throw new Error('Falha ao buscar status de sincronização');
    }
  }

  // Testar conexão com o microserviço
  async testConnection(): Promise<void> {
    try {
      console.log('🔗 Testando conexão com microserviço de afiliados');
      
      const response = await api.get('/../health');
      
      console.log('✅ Conexão com microserviço funcionando:', response.data);

    } catch (error) {
      console.error('❌ Erro na conexão com microserviço:', error);
      throw new Error('Falha na conexão com o microserviço');
    }
  }
}

export const affiliatesService = new AffiliatesService();
export default affiliatesService;

