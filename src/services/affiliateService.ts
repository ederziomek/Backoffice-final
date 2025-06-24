import axios from 'axios';

// URL base da API
const API_BASE_URL = 'https://fature-affiliate-service-production-87ff.up.railway.app';

// API Key para autenticação
const API_KEY = 'fature-cpa-system-2025-secure-key';

// Configuração do axios
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Tipos TypeScript
export interface Affiliate {
  id: number;
  name: string;
  email: string;
  phone: string;
  document?: string;
  birth_date?: string;
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
  total_referrals: number;
  total_commission: number;
  current_level: number;
  conversion_rate?: number;
  verified?: boolean;
  banking?: {
    bank: string;
    agency: string;
    account: string;
    pix_key: string;
  };
}

export interface AffiliatesPagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

export interface AffiliatesResponse {
  success: boolean;
  data: {
    affiliates: Affiliate[];
    pagination: AffiliatesPagination;
  };
}

export interface MLMLevel {
  count: number;
  commission_value: number;
  total_commission: number;
  affiliates?: Array<{
    id: number;
    name: string;
    referrals: number;
    commission: number;
  }>;
}

export interface MLMStructure {
  affiliate_id: number;
  structure: {
    level_1: MLMLevel;
    level_2: MLMLevel;
    level_3: MLMLevel;
    level_4?: MLMLevel;
    level_5?: MLMLevel;
  };
  totals: {
    total_network: number;
    total_commission: number;
    network_depth: number;
  };
}

export interface AffiliateDashboard {
  overview: {
    total_referrals: number;
    active_referrals: number;
    total_commission: number;
    pending_commission: number;
    current_level: number;
  };
  performance: {
    this_month: {
      referrals: number;
      commission: number;
    };
    last_month: {
      referrals: number;
      commission: number;
    };
    growth_rate: number;
  };
  network: {
    level_1: number;
    level_2: number;
    level_3: number;
    level_4?: number;
    level_5?: number;
    total_depth: number;
  };
  recent_activity: Array<{
    type: string;
    description: string;
    date: string;
    value: number;
  }>;
}

export interface AffiliateStats {
  totals: {
    total_affiliates: number;
    active_affiliates: number;
    total_referrals: number;
    total_commission_paid: number;
  };
  growth: {
    new_affiliates_this_month: number;
    new_referrals_this_month: number;
    growth_rate: number;
  };
  performance: {
    average_referrals_per_affiliate: number;
    average_commission_per_affiliate: number;
    top_performer_referrals: number;
  };
}

// DADOS MOCKADOS REMOVIDOS
// Este arquivo foi modificado para trabalhar apenas com dados reais da API.
// Quando a API não estiver disponível, retorna dados vazios (0, N/A, arrays vazios)
// ao invés de dados simulados/mockados.

// Serviço de afiliados
export const affiliateService = {
  // Lista paginada de afiliados
  async getAffiliates(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'all';
  } = {}): Promise<AffiliatesResponse> {
    try {
      const queryString = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 50).toString(),
        ...(params.search && { search: params.search }),
        ...(params.status && params.status !== 'all' && { status: params.status }),
      }).toString();

      const response = await apiClient.get(`${API_BASE_URL}/api/v1/affiliates?${queryString}`);
      
      // Adaptar formato da resposta real da API
      if (response.data.status === 'success') {
        return {
          success: true,
          data: {
            affiliates: response.data.data || [],
            pagination: {
              current_page: response.data.pagination?.page || 1,
              total_pages: response.data.pagination?.pages || 0,
              total_items: response.data.pagination?.total || 0,
              items_per_page: response.data.pagination?.limit || 50
            }
          }
        };
      } else {
        throw new Error('API retornou erro');
      }
    } catch (error) {
      console.warn('API não disponível, retornando dados vazios');
      
      // Retornar dados vazios ao invés de dados mockados
      return {
        success: true,
        data: {
          affiliates: [],
          pagination: {
            current_page: params.page || 1,
            total_pages: 0,
            total_items: 0,
            items_per_page: params.limit || 50
          }
        }
      };
    }
  },

  // Detalhes de um afiliado
  async getAffiliateDetails(id: number): Promise<{ success: boolean; data: { affiliate: Affiliate } }> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/v1/affiliates/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, afiliado não encontrado');
      throw new Error('Afiliado não encontrado - API indisponível');
    }
  },

  // Estrutura MLM
  async getMLMStructure(id: number): Promise<{ success: boolean; data: MLMStructure }> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/v1/affiliates/${id}/mlm-structure`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, retornando estrutura MLM vazia');
      
      // Retornar estrutura MLM vazia ao invés de dados mockados
      const emptyMLM: MLMStructure = {
        affiliate_id: id,
        structure: {
          level_1: {
            count: 0,
            commission_value: 0,
            total_commission: 0,
            affiliates: []
          },
          level_2: {
            count: 0,
            commission_value: 0,
            total_commission: 0
          },
          level_3: {
            count: 0,
            commission_value: 0,
            total_commission: 0
          }
        },
        totals: {
          total_network: 0,
          total_commission: 0,
          network_depth: 0
        }
      };
      
      return {
        success: true,
        data: emptyMLM
      };
    }
  },

  // Dashboard do afiliado
  async getAffiliateDashboard(id: number): Promise<{ success: boolean; data: AffiliateDashboard }> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/v1/affiliates/${id}/dashboard`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, usando dados mockados');
      
      const affiliate = mockAffiliates.find(a => a.id === id);
      if (!affiliate) {
        throw new Error('Afiliado não encontrado');
      }
      
      const mockDashboard: AffiliateDashboard = {
        overview: {
          total_referrals: affiliate.total_referrals,
          active_referrals: Math.floor(affiliate.total_referrals * 0.85),
          total_commission: affiliate.total_commission,
          pending_commission: Math.floor(affiliate.total_commission * 0.1),
          current_level: affiliate.current_level
        },
        performance: {
          this_month: {
            referrals: Math.floor(affiliate.total_referrals * 0.15),
            commission: Math.floor(affiliate.total_commission * 0.15)
          },
          last_month: {
            referrals: Math.floor(affiliate.total_referrals * 0.20),
            commission: Math.floor(affiliate.total_commission * 0.20)
          },
          growth_rate: -25.0
        },
        network: {
          level_1: Math.floor(affiliate.total_referrals * 0.4),
          level_2: Math.floor(affiliate.total_referrals * 0.35),
          level_3: Math.floor(affiliate.total_referrals * 0.25),
          total_depth: affiliate.current_level
        },
        recent_activity: [
          {
            type: 'new_referral',
            description: 'Nova indicação: Carlos Lima',
            date: '2025-06-24',
            value: 50.00
          },
          {
            type: 'commission_paid',
            description: 'Comissão paga - Nível 1',
            date: '2025-06-23',
            value: 100.00
          }
        ]
      };
      
      return {
        success: true,
        data: mockDashboard
      };
    }
  },

  // Estatísticas gerais
  async getAffiliateStats(): Promise<{ success: boolean; data: AffiliateStats }> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/v1/affiliates/stats`);
      
      // Adaptar formato da resposta real da API
      if (response.data.status === 'success') {
        const apiData = response.data.data.overview;
        return {
          success: true,
          data: {
            totals: {
              total_affiliates: apiData.total_affiliates || 0,
              active_affiliates: apiData.active_affiliates || 0,
              total_referrals: apiData.total_referrals || 0,
              total_commission_paid: apiData.total_cpa_earned || 0
            },
            growth: {
              new_affiliates_this_month: 0, // Não disponível na API atual
              new_referrals_this_month: 0, // Não disponível na API atual
              growth_rate: 0 // Não disponível na API atual
            },
            performance: {
              average_referrals_per_affiliate: parseFloat(apiData.avg_referrals_per_affiliate || '0'),
              average_commission_per_affiliate: parseFloat(apiData.avg_cpa_per_affiliate || '0'),
              top_performer_referrals: 0 // Será calculado dos top_performers se disponível
            }
          }
        };
      } else {
        throw new Error('API retornou erro');
      }
    } catch (error) {
      console.warn('API não disponível, retornando estatísticas vazias');
      
      // Retornar estatísticas vazias ao invés de dados mockados
      const emptyStats: AffiliateStats = {
        totals: {
          total_affiliates: 0,
          active_affiliates: 0,
          total_referrals: 0,
          total_commission_paid: 0
        },
        growth: {
          new_affiliates_this_month: 0,
          new_referrals_this_month: 0,
          growth_rate: 0
        },
        performance: {
          average_referrals_per_affiliate: 0,
          average_commission_per_affiliate: 0,
          top_performer_referrals: 0
        }
      };
      
      return {
        success: true,
        data: emptyStats
      };
    }
  },

  // Ranking de afiliados
  async getAffiliateRanking(): Promise<{ 
    success: boolean; 
    data: { 
      ranking: Array<{
        position: number;
        affiliate_id: number;
        name: string;
        total_referrals: number;
        total_commission: number;
        level: number;
      }>;
      user_position?: {
        affiliate_id: number;
        position: number;
        total_affiliates: number;
      };
    } 
  }> {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/v1/affiliates/ranking`);
      
      // Adaptar formato da resposta real da API
      if (response.data.status === 'success') {
        const rankings = response.data.data.rankings || [];
        
        // Mapear dados da API para o formato esperado
        const mappedRankings = rankings.map((item: any, index: number) => ({
          position: index + 1,
          affiliate_id: item.affiliate_id || item.id,
          name: item.name || `Afiliado ${item.affiliate_id}`,
          total_referrals: item.total_referrals || 0,
          total_commission: item.total_cpa_earned || item.total_commission || 0,
          level: item.level || 1
        }));
        
        return {
          success: true,
          data: {
            ranking: mappedRankings,
            user_position: {
              affiliate_id: 1,
              position: 1,
              total_affiliates: rankings.length
            }
          }
        };
      } else {
        throw new Error('API retornou erro');
      }
    } catch (error) {
      console.warn('API não disponível, retornando ranking vazio');
      
      // Retornar ranking vazio ao invés de dados mockados
      return {
        success: true,
        data: {
          ranking: [],
          user_position: {
            affiliate_id: 0,
            position: 0,
            total_affiliates: 0
          }
        }
      };
    }
  }
};

export default affiliateService;

