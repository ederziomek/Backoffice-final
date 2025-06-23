import axios from 'axios';

// URLs dos microserviços Railway
const RAILWAY_SERVICES = {
  CONFIG: 'https://fature-config-service-production.up.railway.app',
  COMMISSION: 'https://fature-commission-service-production.up.railway.app',
  MLM: 'https://fature-mlm-service-v2-production.up.railway.app',
  DATA: 'https://fature-data-service-v2-production.up.railway.app'
};

// Configuração do axios para Railway
const railwayApi = axios.create({
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    // TODO: Adicionar API Key quando disponível
    // 'X-API-Key': process.env.RAILWAY_API_KEY
  },
});

// Interfaces para configurações CPA
export interface CpaLevelConfig {
  level: number;
  value: number;
}

export interface ValidationCriteria {
  id: string;
  type: 'deposit' | 'bets' | 'ggr';
  value: number;
  enabled: boolean;
}

export interface ValidationGroup {
  id: string;
  name: string;
  criteria: ValidationCriteria[];
  operator: 'AND' | 'OR';
}

export interface CpaValidationRule {
  id: string;
  name: string;
  description: string;
  groups: ValidationGroup[];
  groupOperator: 'AND' | 'OR';
  active: boolean;
}

export interface CpaConfiguration {
  levels: CpaLevelConfig[];
  totalAmount: number;
  validationRules: CpaValidationRule[];
  activeRule?: CpaValidationRule;
}

export interface CpaCommissionData {
  affiliateId: number;
  level: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  validatedAt?: string;
  paidAt?: string;
}

class CpaConfigService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 2 * 60 * 1000; // 2 minutos

  // Cache helper
  private getCacheKey(method: string): string {
    return `cpa_config_${method}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Usando configurações CPA do cache:', key);
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Buscar configurações CPA do Railway Config Service
  async getCpaConfiguration(): Promise<CpaConfiguration> {
    const cacheKey = this.getCacheKey('configuration');
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('⚙️ Buscando configurações CPA do Railway Config Service...');
      
      // Tentar buscar configurações do Railway
      const response = await railwayApi.get(`${RAILWAY_SERVICES.CONFIG}/api/v1/cpa/config`);
      
      if (response.data && response.data.success) {
        const config = response.data.data;
        this.setCachedData(cacheKey, config);
        console.log('✅ Configurações CPA carregadas do Railway:', config);
        return config;
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar configurações CPA do Railway:', error);
    }

    // Fallback para configurações baseadas na interface do usuário
    const defaultConfig: CpaConfiguration = {
      levels: [
        { level: 1, value: 50.00 }, // Baseado na imagem: R$ 50
        { level: 2, value: 20.00 }, // Baseado na imagem: R$ 20
        { level: 3, value: 5.00 },  // Baseado na imagem: R$ 5
        { level: 4, value: 5.00 },  // Baseado na imagem: R$ 5
        { level: 5, value: 5.00 }   // Baseado na imagem: R$ 5
      ],
      totalAmount: 85.00, // Baseado na imagem: R$ 85
      validationRules: [
        {
          id: 'rule_flexible_1',
          name: 'Modelo Flexível (Padrão)',
          description: '(Depósito 30 E Apostas 10) OU (Depósito 30 E GGR 25)',
          groups: [
            {
              id: 'group_1',
              name: 'Grupo 1: Depósito + Apostas',
              criteria: [
                { id: 'dep_1', type: 'deposit', value: 30.00, enabled: true },
                { id: 'bet_1', type: 'bets', value: 10, enabled: true },
                { id: 'ggr_1', type: 'ggr', value: 0, enabled: false }
              ],
              operator: 'AND'
            },
            {
              id: 'group_2',
              name: 'Grupo 2: Depósito + GGR',
              criteria: [
                { id: 'dep_2', type: 'deposit', value: 30.00, enabled: true },
                { id: 'bet_2', type: 'bets', value: 0, enabled: false },
                { id: 'ggr_2', type: 'ggr', value: 25.00, enabled: true }
              ],
              operator: 'AND'
            }
          ],
          groupOperator: 'OR',
          active: true
        }
      ]
    };

    // Definir regra ativa
    defaultConfig.activeRule = defaultConfig.validationRules.find(rule => rule.active);

    this.setCachedData(cacheKey, defaultConfig);
    console.log('🔄 Usando configurações CPA padrão (fallback):', defaultConfig);
    
    return defaultConfig;
  }

  // Buscar comissões CPA validadas do Commission Service
  async getValidatedCpaCommissions(affiliateId?: number, startDate?: string, endDate?: string): Promise<CpaCommissionData[]> {
    try {
      console.log('💰 Buscando comissões CPA validadas do Railway Commission Service...');
      
      let url = `${RAILWAY_SERVICES.COMMISSION}/commissions/cpa`;
      const params = new URLSearchParams();
      
      if (affiliateId) params.append('affiliate_id', affiliateId.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await railwayApi.get(url);
      
      if (response.data && response.data.success) {
        console.log('✅ Comissões CPA carregadas do Railway:', response.data.data);
        return response.data.data;
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar comissões CPA do Railway:', error);
    }

    // Fallback: retornar array vazio
    console.log('🔄 Usando fallback para comissões CPA (array vazio)');
    return [];
  }

  // Buscar dados MLM do MLM Service
  async getMlmData(page: number = 1, limit: number = 20, startDate?: string, endDate?: string): Promise<any> {
    try {
      console.log('🌐 Buscando dados MLM do Railway MLM Service...');
      
      let url = `${RAILWAY_SERVICES.MLM}/api/v1/mlm/affiliates`;
      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      url += `?${params.toString()}`;
      
      const response = await railwayApi.get(url);
      
      if (response.data && response.data.success) {
        console.log('✅ Dados MLM carregados do Railway:', response.data);
        return response.data;
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados MLM do Railway:', error);
    }

    // Fallback: retornar estrutura vazia
    return {
      success: false,
      data: [],
      pagination: { page: 1, pages: 1, total: 0, limit }
    };
  }

  // Buscar estatísticas do Data Service
  async getCpaStats(startDate?: string, endDate?: string): Promise<any> {
    try {
      console.log('📊 Buscando estatísticas CPA do Railway Data Service...');
      
      let url = `${RAILWAY_SERVICES.DATA}/api/v1/analytics/cpa-stats`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await railwayApi.get(url);
      
      if (response.data && response.data.success) {
        console.log('✅ Estatísticas CPA carregadas do Railway:', response.data.data);
        return response.data.data;
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas CPA do Railway:', error);
    }

    // Fallback: retornar estatísticas vazias
    return {
      total_affiliates_with_cpa: 0,
      total_cpa_paid: 0,
      total_rev_paid: 0,
      total_paid: 0,
      average_cpa_per_affiliate: 0
    };
  }

  // Buscar apenas valores por nível
  async getCpaLevelValues(): Promise<CpaLevelConfig[]> {
    try {
      const config = await this.getCpaConfiguration();
      return config.levels;
    } catch (error) {
      console.error('❌ Erro ao buscar valores CPA por nível:', error);
      
      // Fallback para valores padrão baseados na interface
      return [
        { level: 1, value: 50.00 },
        { level: 2, value: 20.00 },
        { level: 3, value: 5.00 },
        { level: 4, value: 5.00 },
        { level: 5, value: 5.00 }
      ];
    }
  }

  // Buscar regras de validação ativas
  async getActiveValidationRule(): Promise<CpaValidationRule | null> {
    try {
      const config = await this.getCpaConfiguration();
      return config.activeRule || null;
    } catch (error) {
      console.error('❌ Erro ao buscar regra de validação ativa:', error);
      return null;
    }
  }

  // Validar se um jogador atende aos critérios CPA
  async validatePlayerForCpa(playerData: {
    totalDeposit: number;
    totalBets: number;
    totalGgr: number;
  }): Promise<boolean> {
    try {
      const activeRule = await this.getActiveValidationRule();
      
      if (!activeRule) {
        console.log('⚠️ Nenhuma regra de validação CPA ativa');
        return false;
      }

      console.log('🔍 Validando jogador com regra:', activeRule.name);
      console.log('📊 Dados do jogador:', playerData);

      // Avaliar cada grupo
      const groupResults = activeRule.groups.map(group => {
        const criteriaResults = group.criteria
          .filter(criteria => criteria.enabled)
          .map(criteria => {
            let result = false;
            
            switch (criteria.type) {
              case 'deposit':
                result = playerData.totalDeposit >= criteria.value;
                break;
              case 'bets':
                result = playerData.totalBets >= criteria.value;
                break;
              case 'ggr':
                result = playerData.totalGgr >= criteria.value;
                break;
            }
            
            console.log(`  ${criteria.type}: ${result} (${playerData[criteria.type === 'deposit' ? 'totalDeposit' : criteria.type === 'bets' ? 'totalBets' : 'totalGgr']} >= ${criteria.value})`);
            return result;
          });

        // Aplicar operador do grupo (AND/OR)
        const groupResult = group.operator === 'AND' 
          ? criteriaResults.every(r => r)
          : criteriaResults.some(r => r);
          
        console.log(`  Grupo "${group.name}": ${groupResult} (${group.operator})`);
        return groupResult;
      });

      // Aplicar operador entre grupos (AND/OR)
      const finalResult = activeRule.groupOperator === 'AND'
        ? groupResults.every(r => r)
        : groupResults.some(r => r);

      console.log(`✅ Resultado final da validação CPA: ${finalResult} (${activeRule.groupOperator})`);
      return finalResult;
      
    } catch (error) {
      console.error('❌ Erro na validação CPA:', error);
      return false;
    }
  }

  // Testar conectividade com os serviços Railway
  async testRailwayServices(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [serviceName, serviceUrl] of Object.entries(RAILWAY_SERVICES)) {
      try {
        console.log(`🔍 Testando ${serviceName}: ${serviceUrl}`);
        
        // Testar diferentes endpoints de health
        const healthEndpoints = ['/health', '/api/v1/health', '/api/health'];
        let connected = false;
        
        for (const endpoint of healthEndpoints) {
          try {
            const response = await railwayApi.get(`${serviceUrl}${endpoint}`);
            if (response.status === 200) {
              connected = true;
              console.log(`✅ ${serviceName} conectado via ${endpoint}`);
              break;
            }
          } catch (endpointError) {
            // Continuar tentando outros endpoints
          }
        }
        
        results[serviceName] = connected;
        if (!connected) {
          console.log(`❌ ${serviceName} não conectado`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao testar ${serviceName}:`, error);
        results[serviceName] = false;
      }
    }
    
    return results;
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache de configurações CPA limpo');
  }
}

export const cpaConfigService = new CpaConfigService();
export default cpaConfigService;

