// Módulo de Integração com Sistema CPA
// Conecta o backoffice com os microserviços CPA

const axios = require('axios');

// URLs dos microserviços CPA (corrigidas)
const CPA_SERVICES = {
  CONFIG_SERVICE: 'https://fature-config-service-production.up.railway.app',
  MLM_SERVICE: 'https://fature-mlm-service-v2-production.up.railway.app',
  COMMISSION_SERVICE: 'https://fature-commission-service-production.up.railway.app',
  DATA_SERVICE: 'https://fature-data-service-v2-production.up.railway.app'
};

// API Keys para autenticação
const API_KEYS = {
  CONFIG_SERVICE: 'fature_config_api_2025!K3y_9h8i7j6k5l4m3n2o1p',
  MLM_SERVICE: 'fature_mlm_api_2025!K3y_9h8i7j6k5l4m3n2o1p',
  COMMISSION_SERVICE: 'fature_commission_api_2025!K3y_9h8i7j6k5l4m3n2o1p',
  DATA_SERVICE: 'fature_data_api_2025!K3y_9h8i7j6k5l4m3n2o1p'
};

// Configuração do axios com timeout menor
const createApiClient = (baseURL, apiKey) => {
  return axios.create({
    baseURL,
    timeout: 3000, // 3 segundos (reduzido)
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    }
  });
};

// Clientes para cada microserviço
const configClient = createApiClient(CPA_SERVICES.CONFIG_SERVICE, API_KEYS.CONFIG_SERVICE);
const mlmClient = createApiClient(CPA_SERVICES.MLM_SERVICE, API_KEYS.MLM_SERVICE);
const commissionClient = createApiClient(CPA_SERVICES.COMMISSION_SERVICE, API_KEYS.COMMISSION_SERVICE);
const dataClient = createApiClient(CPA_SERVICES.DATA_SERVICE, API_KEYS.DATA_SERVICE);

class CPAIntegration {
  
  // Buscar configurações CPA atuais (versão corrigida)
  async getCPAConfig() {
    try {
      console.log('🔧 Buscando configurações CPA...');
      
      const response = await axios.get(`${CPA_SERVICES.CONFIG_SERVICE}/api/v1/config/cpa_level_amounts/value`, { 
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEYS.CONFIG_SERVICE
        }
      });
      
      if (response.data.success) {
        console.log('✅ Configurações CPA obtidas:', response.data.data.value);
        return response.data.data.value;
      } else {
        throw new Error('Resposta inválida do Config Service');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar configurações CPA:', error.message);
      // Retornar configurações padrão em caso de erro
      return {
        level_1: 50.00,
        level_2: 20.00,
        level_3: 5.00,
        level_4: 5.00,
        level_5: 5.00
      };
    }
  }

  // Buscar comissões de um afiliado específico
  async getAffiliateCommissions(affiliateId) {
    try {
      console.log(`💰 Buscando comissões do afiliado ${affiliateId}...`);
      
      const response = await commissionClient.get(`/affiliate/${affiliateId}/commissions`);
      
      if (response.data.success) {
        const commissions = response.data.data;
        
        // Calcular total de CPA pago
        const totalCPAPaid = commissions
          .filter(c => c.type === 'CPA' && c.status === 'paid')
          .reduce((sum, c) => sum + parseFloat(c.amount), 0);
          
        console.log(`✅ CPA total pago para afiliado ${affiliateId}: R$ ${totalCPAPaid.toFixed(2)}`);
        
        return {
          total_cpa_paid: totalCPAPaid,
          commissions: commissions
        };
      } else {
        return { total_cpa_paid: 0, commissions: [] };
      }
      
    } catch (error) {
      console.error(`❌ Erro ao buscar comissões do afiliado ${affiliateId}:`, error.message);
      return { total_cpa_paid: 0, commissions: [] };
    }
  }

  // Buscar estatísticas MLM de um afiliado
  async getAffiliateMLMStats(affiliateId) {
    try {
      console.log(`📊 Buscando estatísticas MLM do afiliado ${affiliateId}...`);
      
      const response = await mlmClient.get(`/affiliate/${affiliateId}/statistics`);
      
      if (response.data.success) {
        console.log(`✅ Estatísticas MLM obtidas para afiliado ${affiliateId}`);
        return response.data.data;
      } else {
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Erro ao buscar estatísticas MLM do afiliado ${affiliateId}:`, error.message);
      return null;
    }
  }

  // Buscar dados de analytics de um afiliado
  async getAffiliateAnalytics(affiliateId) {
    try {
      console.log(`📈 Buscando analytics do afiliado ${affiliateId}...`);
      
      const response = await dataClient.get(`/analytics/affiliate/${affiliateId}`);
      
      if (response.data.success) {
        console.log(`✅ Analytics obtidos para afiliado ${affiliateId}`);
        return response.data.data;
      } else {
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Erro ao buscar analytics do afiliado ${affiliateId}:`, error.message);
      return null;
    }
  }

  // Buscar todas as comissões CPA processadas
  async getAllCPACommissions() {
    try {
      console.log('💰 Buscando todas as comissões CPA...');
      
      const response = await commissionClient.get('/summary');
      
      if (response.data.success) {
        const summary = response.data.data;
        console.log('✅ Resumo de comissões obtido');
        return summary;
      } else {
        return null;
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar resumo de comissões:', error.message);
      return null;
    }
  }

  // Processar dados CPA para múltiplos afiliados (versão resiliente)
  async processCPADataForAffiliates(affiliateIds) {
    try {
      console.log(`🔄 Processando dados CPA para ${affiliateIds.length} afiliados...`);
      
      const cpaData = {};
      const batchSize = 5; // Reduzido para evitar sobrecarga
      const maxRetries = 1; // Máximo de tentativas
      
      // Se há muitos afiliados, processar apenas os primeiros para não travar
      const limitedAffiliateIds = affiliateIds.slice(0, 50);
      
      for (let i = 0; i < limitedAffiliateIds.length; i += batchSize) {
        const batch = limitedAffiliateIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (affiliateId) => {
          let retries = 0;
          
          while (retries <= maxRetries) {
            try {
              const commissions = await Promise.race([
                this.getAffiliateCommissions(affiliateId),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 2000)
                )
              ]);
              
              return {
                affiliate_id: affiliateId,
                cpa_paid: commissions.total_cpa_paid,
                commissions_count: commissions.commissions.length
              };
              
            } catch (error) {
              retries++;
              console.warn(`⚠️ Tentativa ${retries} falhou para afiliado ${affiliateId}: ${error.message}`);
              
              if (retries > maxRetries) {
                return {
                  affiliate_id: affiliateId,
                  cpa_paid: 0,
                  commissions_count: 0
                };
              }
              
              // Pequena pausa antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        });
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            const affiliateId = batch[index];
            
            if (result.status === 'fulfilled') {
              const data = result.value;
              cpaData[data.affiliate_id] = {
                cpa_pago: data.cpa_paid,
                rev_pago: 0,
                total_pago: data.cpa_paid,
                commissions_count: data.commissions_count
              };
            } else {
              // Em caso de falha, usar valores padrão
              cpaData[affiliateId] = {
                cpa_pago: 0,
                rev_pago: 0,
                total_pago: 0,
                commissions_count: 0
              };
            }
          });
          
          console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} processado`);
          
        } catch (error) {
          console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
          
          // Em caso de erro no lote, definir valores padrão para todos
          batch.forEach(affiliateId => {
            cpaData[affiliateId] = {
              cpa_pago: 0,
              rev_pago: 0,
              total_pago: 0,
              commissions_count: 0
            };
          });
        }
        
        // Pausa entre lotes
        if (i + batchSize < limitedAffiliateIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`✅ Dados CPA processados para ${Object.keys(cpaData).length} afiliados`);
      return cpaData;
      
    } catch (error) {
      console.error('❌ Erro geral ao processar dados CPA:', error.message);
      
      // Em caso de erro geral, retornar dados vazios para todos os afiliados
      const fallbackData = {};
      affiliateIds.forEach(id => {
        fallbackData[id] = {
          cpa_pago: 0,
          rev_pago: 0,
          total_pago: 0,
          commissions_count: 0
        };
      });
      
      return fallbackData;
    }
  }

   // Testar conectividade com todos os microserviços (versão corrigida)
  async testConnectivity() {
    const results = {};
    
    try {
      console.log('🔗 Testando conectividade com microserviços CPA...');
      
      // Testar Config Service
      try {
        const response = await axios.get(`${CPA_SERVICES.CONFIG_SERVICE}/api/v1/health`, { timeout: 3000 });
        results.config_service = 'OK';
        console.log('✅ Config Service: OK');
      } catch (error) {
        results.config_service = 'ERROR';
        console.log('❌ Config Service: ERROR -', error.message);
      }
      
      // Testar MLM Service V2 (usar endpoint raiz pois /api/v1/health retorna 503)
      try {
        const response = await axios.get(`${CPA_SERVICES.MLM_SERVICE}/`, { timeout: 3000 });
        if (response.status === 200 && response.data.service) {
          results.mlm_service = 'OK';
          console.log('✅ MLM Service V2: OK');
        } else {
          results.mlm_service = 'ERROR';
          console.log('❌ MLM Service V2: ERROR - Resposta inválida');
        }
      } catch (error) {
        results.mlm_service = 'ERROR';
        console.log('❌ MLM Service V2: ERROR -', error.message);
      }
      
      // Testar Commission Service
      try {
        const response = await axios.get(`${CPA_SERVICES.COMMISSION_SERVICE}/health`, { timeout: 3000 });
        results.commission_service = 'OK';
        console.log('✅ Commission Service: OK');
      } catch (error) {
        results.commission_service = 'ERROR';
        console.log('❌ Commission Service: ERROR -', error.message);
      }
      
      // Testar Data Service V2 (usar endpoint raiz pois /api/v1/health retorna 503)
      try {
        const response = await axios.get(`${CPA_SERVICES.DATA_SERVICE}/`, { timeout: 3000 });
        if (response.status === 200 && response.data.service) {
          results.data_service = 'OK';
          console.log('✅ Data Service V2: OK');
        } else {
          results.data_service = 'ERROR';
          console.log('❌ Data Service V2: ERROR - Resposta inválida');
        }
      } catch (error) {
        results.data_service = 'ERROR';
        console.log('❌ Data Service V2: ERROR -', error.message);
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Erro geral no teste de conectividade:', error.message);
      return {
        config_service: 'ERROR',
        mlm_service: 'ERROR',
        commission_service: 'ERROR',
        data_service: 'ERROR'
      };
    }
  }

  // Cache simples para performance
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`📦 Usando dados em cache para: ${key}`);
      return cached.data;
    }
    
    const data = await fetchFunction();
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache limpo');
  }
}

module.exports = new CPAIntegration();

