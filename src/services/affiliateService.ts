import axios from 'axios';

// URLs base das APIs
const API_GATEWAY_URL = 'https://fature-api-gateway-production.up.railway.app';
const AFFILIATE_SERVICE_URL = 'https://fature-affiliate-service-production-87ff.up.railway.app';

// Configuração do axios
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
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

// Dados mockados para fallback
const mockAffiliates: Affiliate[] = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    document: '123.456.789-00',
    status: 'active',
    created_at: '2025-01-15',
    last_login: '2025-06-24',
    total_referrals: 45,
    total_commission: 2500.00,
    current_level: 3,
    conversion_rate: 12.5,
    verified: true,
    banking: {
      bank: 'Banco do Brasil',
      agency: '1234-5',
      account: '67890-1',
      pix_key: 'joao.silva@email.com'
    }
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '(11) 88888-8888',
    document: '987.654.321-00',
    status: 'active',
    created_at: '2025-02-10',
    last_login: '2025-06-23',
    total_referrals: 32,
    total_commission: 1800.00,
    current_level: 2,
    conversion_rate: 15.3,
    verified: true,
    banking: {
      bank: 'Itaú',
      agency: '5678-9',
      account: '12345-6',
      pix_key: '11988888888'
    }
  },
  {
    id: 3,
    name: 'Carlos Lima',
    email: 'carlos.lima@email.com',
    phone: '(11) 77777-7777',
    document: '456.789.123-00',
    status: 'inactive',
    created_at: '2025-03-05',
    last_login: '2025-06-20',
    total_referrals: 18,
    total_commission: 950.00,
    current_level: 1,
    conversion_rate: 8.7,
    verified: false
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 66666-6666',
    document: '789.123.456-00',
    status: 'active',
    created_at: '2024-12-20',
    last_login: '2025-06-24',
    total_referrals: 156,
    total_commission: 7800.00,
    current_level: 5,
    conversion_rate: 22.1,
    verified: true,
    banking: {
      bank: 'Santander',
      agency: '9876-5',
      account: '54321-0',
      pix_key: 'ana.costa@email.com'
    }
  },
  {
    id: 5,
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '(11) 55555-5555',
    document: '321.654.987-00',
    status: 'active',
    created_at: '2025-01-30',
    last_login: '2025-06-22',
    total_referrals: 67,
    total_commission: 3350.00,
    current_level: 4,
    conversion_rate: 18.9,
    verified: true
  }
];

const mockStats: AffiliateStats = {
  totals: {
    total_affiliates: 48261,
    active_affiliates: 42150,
    total_referrals: 614944,
    total_commission_paid: 15623800.00
  },
  growth: {
    new_affiliates_this_month: 1250,
    new_referrals_this_month: 8940,
    growth_rate: 12.5
  },
  performance: {
    average_referrals_per_affiliate: 12.7,
    average_commission_per_affiliate: 323.50,
    top_performer_referrals: 156
  }
};

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

      const response = await apiClient.get(`${API_GATEWAY_URL}/api/v1/affiliates?${queryString}`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, usando dados mockados');
      
      // Filtrar dados mockados baseado nos parâmetros
      let filteredAffiliates = [...mockAffiliates];
      
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredAffiliates = filteredAffiliates.filter(
          affiliate => 
            affiliate.name.toLowerCase().includes(searchLower) ||
            affiliate.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (params.status && params.status !== 'all') {
        filteredAffiliates = filteredAffiliates.filter(
          affiliate => affiliate.status === params.status
        );
      }
      
      // Simular paginação
      const page = params.page || 1;
      const limit = params.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAffiliates = filteredAffiliates.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          affiliates: paginatedAffiliates,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(filteredAffiliates.length / limit),
            total_items: filteredAffiliates.length,
            items_per_page: limit
          }
        }
      };
    }
  },

  // Detalhes de um afiliado
  async getAffiliateDetails(id: number): Promise<{ success: boolean; data: { affiliate: Affiliate } }> {
    try {
      const response = await apiClient.get(`${API_GATEWAY_URL}/api/v1/affiliates/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, usando dados mockados');
      
      const affiliate = mockAffiliates.find(a => a.id === id);
      if (!affiliate) {
        throw new Error('Afiliado não encontrado');
      }
      
      return {
        success: true,
        data: { affiliate }
      };
    }
  },

  // Estrutura MLM
  async getMLMStructure(id: number): Promise<{ success: boolean; data: MLMStructure }> {
    try {
      const response = await apiClient.get(`${API_GATEWAY_URL}/api/v1/affiliates/${id}/mlm-structure`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, usando dados mockados');
      
      const affiliate = mockAffiliates.find(a => a.id === id);
      if (!affiliate) {
        throw new Error('Afiliado não encontrado');
      }
      
      // Gerar estrutura MLM mockada baseada no nível do afiliado
      const mockMLM: MLMStructure = {
        affiliate_id: id,
        structure: {
          level_1: {
            count: Math.floor(affiliate.total_referrals * 0.4),
            commission_value: 50.00,
            total_commission: Math.floor(affiliate.total_referrals * 0.4) * 50,
            affiliates: [
              { id: 101, name: 'Referido 1', referrals: 8, commission: 50.00 },
              { id: 102, name: 'Referido 2', referrals: 12, commission: 50.00 }
            ]
          },
          level_2: {
            count: Math.floor(affiliate.total_referrals * 0.35),
            commission_value: 20.00,
            total_commission: Math.floor(affiliate.total_referrals * 0.35) * 20
          },
          level_3: {
            count: Math.floor(affiliate.total_referrals * 0.25),
            commission_value: 5.00,
            total_commission: Math.floor(affiliate.total_referrals * 0.25) * 5
          }
        },
        totals: {
          total_network: affiliate.total_referrals,
          total_commission: affiliate.total_commission,
          network_depth: affiliate.current_level
        }
      };
      
      return {
        success: true,
        data: mockMLM
      };
    }
  },

  // Dashboard do afiliado
  async getAffiliateDashboard(id: number): Promise<{ success: boolean; data: AffiliateDashboard }> {
    try {
      const response = await apiClient.get(`${API_GATEWAY_URL}/api/v1/affiliates/${id}/dashboard`);
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
      const response = await apiClient.get(`${API_GATEWAY_URL}/api/v1/affiliates/stats`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, usando dados mockados');
      
      return {
        success: true,
        data: mockStats
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
      const response = await apiClient.get(`${API_GATEWAY_URL}/api/v1/affiliates/ranking`);
      return response.data;
    } catch (error) {
      console.warn('API não disponível, usando dados mockados');
      
      const sortedAffiliates = [...mockAffiliates]
        .sort((a, b) => b.total_commission - a.total_commission)
        .map((affiliate, index) => ({
          position: index + 1,
          affiliate_id: affiliate.id,
          name: affiliate.name,
          total_referrals: affiliate.total_referrals,
          total_commission: affiliate.total_commission,
          level: affiliate.current_level
        }));
      
      return {
        success: true,
        data: {
          ranking: sortedAffiliates,
          user_position: {
            affiliate_id: 1,
            position: 2,
            total_affiliates: mockAffiliates.length
          }
        }
      };
    }
  }
};

export default affiliateService;

