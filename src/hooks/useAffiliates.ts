import { useState, useEffect, useCallback } from 'react';
import affiliateService, { 
  Affiliate, 
  AffiliatesResponse, 
  MLMStructure, 
  AffiliateDashboard, 
  AffiliateStats 
} from '../services/affiliateService';

// Hook para lista de afiliados com paginação e filtros
export const useAffiliates = (initialParams: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
} = {}) => {
  const [data, setData] = useState<AffiliatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState(initialParams);

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await affiliateService.getAffiliates(params);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar afiliados');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const updateParams = useCallback((newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refetch = useCallback(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  return {
    data,
    loading,
    error,
    params,
    updateParams,
    refetch
  };
};

// Hook para detalhes de um afiliado específico
export const useAffiliateDetails = (id: number | null) => {
  const [data, setData] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliateDetails = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await affiliateService.getAffiliateDetails(id);
      setData(response.data.affiliate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do afiliado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAffiliateDetails();
  }, [fetchAffiliateDetails]);

  const refetch = useCallback(() => {
    fetchAffiliateDetails();
  }, [fetchAffiliateDetails]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Hook para estrutura MLM de um afiliado
export const useMLMStructure = (id: number | null) => {
  const [data, setData] = useState<MLMStructure | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMLMStructure = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await affiliateService.getMLMStructure(id);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estrutura MLM');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMLMStructure();
  }, [fetchMLMStructure]);

  const refetch = useCallback(() => {
    fetchMLMStructure();
  }, [fetchMLMStructure]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Hook para dashboard de um afiliado
export const useAffiliateDashboard = (id: number | null) => {
  const [data, setData] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliateDashboard = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await affiliateService.getAffiliateDashboard(id);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard do afiliado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAffiliateDashboard();
  }, [fetchAffiliateDashboard]);

  const refetch = useCallback(() => {
    fetchAffiliateDashboard();
  }, [fetchAffiliateDashboard]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Hook para estatísticas gerais
export const useAffiliateStats = () => {
  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliateStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await affiliateService.getAffiliateStats();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliateStats();
  }, [fetchAffiliateStats]);

  const refetch = useCallback(() => {
    fetchAffiliateStats();
  }, [fetchAffiliateStats]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Hook para ranking de afiliados
export const useAffiliateRanking = () => {
  const [data, setData] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliateRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await affiliateService.getAffiliateRanking();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliateRanking();
  }, [fetchAffiliateRanking]);

  const refetch = useCallback(() => {
    fetchAffiliateRanking();
  }, [fetchAffiliateRanking]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Hook para modal state management
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const openModal = useCallback((id?: number) => {
    if (id) setSelectedId(id);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedId(null);
  }, []);

  return {
    isOpen,
    selectedId,
    openModal,
    closeModal
  };
};

// Hook para debounce (útil para busca)
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

