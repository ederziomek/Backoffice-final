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
  registro: string;
  total: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  cpa_pago: number;
  rev_pago: number;
  total_pago: number;
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
  debug?: {
    total_tracked_records: number;
    total_affiliates_with_indications: number;
    total_indications_in_period: number;
    algorithm: string;
    date_filter?: {
      start_date?: string;
      end_date?: string;
    };
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
  async getAffiliatesMLMLevels(
    page: number = 1, 
    per_page: number = 20, 
    startDate?: string, 
    endDate?: string
  ): Promise<MLMResponse> {
    try {
      console.log(`🔍 Buscando afiliados MLM CORRIGIDOS da API local - Página: ${page}, Por página: ${per_page}`);
      
      // Construir parâmetros da query
      let queryParams = `page=${page}&limit=${per_page}`;
      
      if (startDate) {
        queryParams += `&start_date=${startDate}`;
        console.log(`📅 Filtro data inicial: ${startDate}`);
      }
      
      if (endDate) {
        queryParams += `&end_date=${endDate}`;
        console.log(`📅 Filtro data final: ${endDate}`);
      }
      
      // USAR ENDPOINT CORRIGIDO que processa indicações por período
      const response = await api.get(`/affiliates/mlm-levels-corrected?${queryParams}`);
      
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
        let fallbackParams = `page=${page}&limit=${per_page}`;
        if (startDate) fallbackParams += `&start_date=${startDate}`;
        if (endDate) fallbackParams += `&end_date=${endDate}`;
        
        const fallbackResponse = await api.get(`/affiliates/mlm-levels?${fallbackParams}`);
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

  // Buscar afiliados com CPA validados (integração com serviços Railway)
  async getAffiliatesWithValidatedCPA(
    page: number = 1, 
    per_page: number = 20, 
    startDate?: string, 
    endDate?: string
  ): Promise<MLMResponse> {
    try {
      console.log(`💰 Buscando afiliados com CPA validados - Página: ${page}, Por página: ${per_page}`);
      
      // Construir parâmetros da query
      let queryParams = `page=${page}&limit=${per_page}`;
      
      if (startDate) {
        queryParams += `&start_date=${startDate}`;
        console.log(`📅 Filtro data inicial: ${startDate}`);
      }
      
      if (endDate) {
        queryParams += `&end_date=${endDate}`;
        console.log(`📅 Filtro data final: ${endDate}`);
      }
      
      // Usar endpoint específico para CPA validados
      const response = await api.get(`/affiliates/cpa-validated?${queryParams}`);
      
      console.log('📊 Resposta dos afiliados com CPA validados:', response.data);
      
      return {
        status: response.data.status,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          pages: 1,
          total: 0,
          limit: per_page
        },
        debug: response.data.debug
      };

    } catch (error) {
      console.error('❌ Erro ao buscar afiliados com CPA validados:', error);
      
      // Fallback: filtrar dados MLM existentes por CPA > 0
      console.log('🔄 Usando fallback: filtrando dados MLM por CPA > 0...');
      try {
        const mlmResponse = await this.getAffiliatesMLMLevels(page, per_page, startDate, endDate);
        
        if (mlmResponse.status === 'success') {
          // Filtrar apenas afiliados com CPA validados
          const cpaValidatedData = mlmResponse.data.filter(affiliate => 
            affiliate.cpa_pago > 0 || affiliate.rev_pago > 0
          );
          
          return {
            status: 'success',
            data: cpaValidatedData,
            pagination: {
              page: 1,
              pages: Math.ceil(cpaValidatedData.length / per_page),
              total: cpaValidatedData.length,
              limit: per_page
            },
            debug: {
              ...mlmResponse.debug,
              fallback: true,
              filtered_by_cpa: true,
              original_count: mlmResponse.data.length,
              filtered_count: cpaValidatedData.length
            }
          };
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback também:', fallbackError);
      }
      
      // Se tudo falhar, retornar estrutura vazia
      return {
        status: 'error',
        data: [],
        pagination: {
          page: 1,
          pages: 1,
          total: 0,
          limit: per_page
        },
        debug: {
          error: 'Falha ao carregar dados de CPA validados',
          fallback_failed: true
        }
      };
    }
  }

  // Buscar estatísticas de CPA
  async getCPAStats(): Promise<any> {
    try {
      console.log('📈 Buscando estatísticas de CPA...');
      
      const response = await api.get('/affiliates/cpa-stats');
      
      console.log('📊 Estatísticas de CPA:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas de CPA:', error);
      
      // Fallback: calcular estatísticas básicas dos dados MLM
      try {
        const mlmResponse = await this.getAffiliatesMLMLevels(1, 1000); // Buscar mais dados para estatísticas
        
        if (mlmResponse.status === 'success') {
          const cpaAffiliates = mlmResponse.data.filter(affiliate => 
            affiliate.cpa_pago > 0 || affiliate.rev_pago > 0
          );
          
          const totalCPAPago = cpaAffiliates.reduce((sum, affiliate) => sum + affiliate.cpa_pago, 0);
          const totalREVPago = cpaAffiliates.reduce((sum, affiliate) => sum + affiliate.rev_pago, 0);
          
          return {
            status: 'success',
            stats: {
              total_affiliates_with_cpa: cpaAffiliates.length,
              total_cpa_paid: totalCPAPago,
              total_rev_paid: totalREVPago,
              total_paid: totalCPAPago + totalREVPago,
              average_cpa_per_affiliate: cpaAffiliates.length > 0 ? totalCPAPago / cpaAffiliates.length : 0
            },
            debug: {
              fallback: true,
              calculated_from_mlm_data: true
            }
          };
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback de estatísticas:', fallbackError);
      }
      
      // Retornar estatísticas vazias se tudo falhar
      return {
        status: 'error',
        stats: {
          total_affiliates_with_cpa: 0,
          total_cpa_paid: 0,
          total_rev_paid: 0,
          total_paid: 0,
          average_cpa_per_affiliate: 0
        },
        debug: {
          error: 'Falha ao carregar estatísticas de CPA'
        }
      };
    }
  }
}

export const affiliatesService = new AffiliatesService();
export default affiliatesService;

