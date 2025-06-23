import axios from 'axios';

// URLs dos serviços CPA no Railway
const CPA_SERVICES = {
  CONFIG_SERVICE: 'https://fature-config-service-production.up.railway.app',
  MLM_SERVICE: 'https://fature-mlm-service-v2-production.up.railway.app',
  COMMISSION_SERVICE: 'https://fature-commission-service-production.up.railway.app',
  DATA_SERVICE: 'https://fature-data-service-v2-production.up.railway.app'
};

// API Keys dos serviços CPA
const CPA_API_KEYS = {
  CONFIG_SERVICE: 'fature_config_api_2025!K3y_9h8i7j6k5l4m3n2o1p',
  MLM_SERVICE: 'fature_mlm_api_2025!K3y_9h8i7j6k5l4m3n2o1p',
  COMMISSION_SERVICE: 'fature_commission_api_2025!K3y_9h8i7j6k5l4m3n2o1p',
  DATA_SERVICE: 'fature_data_api_2025!K3y_9h8i7j6k5l4m3n2o1p'
};

// Interfaces para dados CPA
export interface CPAConfig {
  level_1: number;
  level_2: number;
  level_3: number;
  level_4: number;
  level_5: number;
}

export interface CPAValidation {
  affiliate_id: number;
  level: number;
  amount: number;
  validated_at: string;
  status: 'pending' | 'validated' | 'paid';
}

export interface CPAAffiliate {
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
  cpa_validations: CPAValidation[];
}

export interface CPAResponse {
  status: string;
  data: CPAAffiliate[];
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  debug?: any;
}

class CPAService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  // Configurar axios com timeout e headers
  private createAxiosInstance(service: keyof typeof CPA_SERVICES) {
    return axios.create({
      baseURL: CPA_SERVICES[service],
      timeout: 10000, // 10 segundos
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CPA_API_KEYS[service]
      }
    });
  }

  // Cache helper
  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Usando dados do cache:', key);
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Buscar configurações CPA
  async getCPAConfig(): Promise<CPAConfig> {
    const cacheKey = this.getCacheKey('cpa_config', {});
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('⚙️ Buscando configurações CPA...');
      
      const configService = this.createAxiosInstance('CONFIG_SERVICE');
      const response = await configService.get('/api/v1/config/cpa_level_amounts/value');
      
      const config = response.data.value || {
        level_1: 50,
        level_2: 20,
        level_3: 5,
        level_4: 5,
        level_5: 5
      };

      this.setCachedData(cacheKey, config);
      console.log('✅ Configurações CPA carregadas:', config);
      
      return config;
    } catch (error) {
      console.error('❌ Erro ao buscar configurações CPA:', error);
      
      // Fallback para valores padrão
      const defaultConfig = {
        level_1: 50,
        level_2: 20,
        level_3: 5,
        level_4: 5,
        level_5: 5
      };
      
      console.log('🔄 Usando configurações padrão:', defaultConfig);
      return defaultConfig;
    }
  }

  // Buscar afiliados com CPA validados
  async getCPAValidatedAffiliates(
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ): Promise<CPAResponse> {
    const cacheKey = this.getCacheKey('cpa_validated', { page, limit, startDate, endDate });
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('💰 Buscando afiliados com CPA validados...');
      
      const commissionService = this.createAxiosInstance('COMMISSION_SERVICE');
      
      // Construir parâmetros da query
      let queryParams = `page=${page}&limit=${limit}`;
      if (startDate) queryParams += `&start_date=${startDate}`;
      if (endDate) queryParams += `&end_date=${endDate}`;
      
      const response = await commissionService.get(`/api/v1/commission/validated?${queryParams}`);
      
      if (response.data.status === 'success') {
        this.setCachedData(cacheKey, response.data);
        console.log(`✅ Carregados ${response.data.data.length} afiliados com CPA validados`);
        return response.data;
      } else {
        throw new Error('Resposta inválida do serviço de comissões');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar CPA validados:', error);
      
      // Fallback: retornar estrutura vazia
      const fallbackResponse: CPAResponse = {
        status: 'error',
        data: [],
        pagination: {
          page: 1,
          pages: 1,
          total: 0,
          limit: limit
        },
        debug: {
          error: 'Serviço CPA indisponível',
          fallback: true
        }
      };
      
      return fallbackResponse;
    }
  }

  // Calcular CPA para um afiliado específico
  async calculateCPAForAffiliate(affiliateId: number): Promise<any> {
    try {
      console.log(`🧮 Calculando CPA para afiliado: ${affiliateId}`);
      
      const mlmService = this.createAxiosInstance('MLM_SERVICE');
      const response = await mlmService.post('/api/v1/commission/calculate', {
        affiliate_id: affiliateId
      });
      
      console.log('✅ CPA calculado:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao calcular CPA:', error);
      throw new Error('Falha ao calcular CPA');
    }
  }

  // Simular distribuição CPA
  async simulateCPADistribution(affiliateId: number, cpaAmount: number): Promise<any> {
    try {
      console.log(`🎯 Simulando distribuição CPA: ${affiliateId} - R$ ${cpaAmount}`);
      
      const mlmService = this.createAxiosInstance('MLM_SERVICE');
      const response = await mlmService.post('/api/v1/commission/simulate', {
        affiliateId,
        cpaAmount
      });
      
      console.log('✅ Simulação CPA:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro na simulação CPA:', error);
      throw new Error('Falha na simulação CPA');
    }
  }

  // Buscar dados de CPA por período
  async getCPADataByPeriod(startDate: string, endDate: string): Promise<any> {
    const cacheKey = this.getCacheKey('cpa_period', { startDate, endDate });
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📊 Buscando dados CPA por período: ${startDate} - ${endDate}`);
      
      const dataService = this.createAxiosInstance('DATA_SERVICE');
      const response = await dataService.get(`/api/v1/data/cpa-period?start_date=${startDate}&end_date=${endDate}`);
      
      this.setCachedData(cacheKey, response.data);
      console.log('✅ Dados CPA por período:', response.data);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados CPA por período:', error);
      throw new Error('Falha ao buscar dados CPA por período');
    }
  }

  // Testar conectividade com todos os serviços CPA
  async testCPAServices(): Promise<any> {
    const results = {
      config_service: 'unknown',
      mlm_service: 'unknown',
      commission_service: 'unknown',
      data_service: 'unknown'
    };

    // Testar Config Service
    try {
      const configService = this.createAxiosInstance('CONFIG_SERVICE');
      await configService.get('/api/v1/health');
      results.config_service = 'ok';
      console.log('✅ Config Service: OK');
    } catch (error) {
      results.config_service = 'error';
      console.log('❌ Config Service: ERROR');
    }

    // Testar MLM Service
    try {
      const mlmService = this.createAxiosInstance('MLM_SERVICE');
      await mlmService.get('/api/v1/health');
      results.mlm_service = 'ok';
      console.log('✅ MLM Service: OK');
    } catch (error) {
      results.mlm_service = 'error';
      console.log('❌ MLM Service: ERROR');
    }

    // Testar Commission Service
    try {
      const commissionService = this.createAxiosInstance('COMMISSION_SERVICE');
      await commissionService.get('/api/v1/health');
      results.commission_service = 'ok';
      console.log('✅ Commission Service: OK');
    } catch (error) {
      results.commission_service = 'error';
      console.log('❌ Commission Service: ERROR');
    }

    // Testar Data Service
    try {
      const dataService = this.createAxiosInstance('DATA_SERVICE');
      await dataService.get('/api/v1/health');
      results.data_service = 'ok';
      console.log('✅ Data Service: OK');
    } catch (error) {
      results.data_service = 'error';
      console.log('❌ Data Service: ERROR');
    }

    return {
      status: 'success',
      connectivity: results,
      timestamp: new Date().toISOString()
    };
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache CPA limpo');
  }
}

export const cpaService = new CPAService();
export default cpaService;

