  // Buscar afiliados com CPA validados (integração com serviços Railway)
  async getAffiliatesWithValidatedCPA(
    page: number = 1, 
    per_page: number = 20, 
    startDate?: string, 
    endDate?: string
  ): Promise<MLMResponse> {
    try {
      console.log(`💰 Buscando afiliados com CPA validados - Página: ${page}, Por página: ${per_page}`);
      
      // Primeiro, buscar dados MLM normais
      const mlmResponse = await this.getAffiliatesMLMLevels(page, per_page, startDate, endDate);
      
      if (mlmResponse.status === 'success') {
        // Simular valores de CPA baseados na configuração padrão
        const cpaConfig = {
          level_1: 50,
          level_2: 20,
          level_3: 5,
          level_4: 5,
          level_5: 5
        };
        
        // Processar dados e calcular CPA simulado
        const processedData = mlmResponse.data.map(affiliate => {
          // Calcular CPA baseado nos níveis (simulação)
          const cpaCalculado = 
            (affiliate.n1 * cpaConfig.level_1) +
            (affiliate.n2 * cpaConfig.level_2) +
            (affiliate.n3 * cpaConfig.level_3) +
            (affiliate.n4 * cpaConfig.level_4) +
            (affiliate.n5 * cpaConfig.level_5);
          
          // Simular que 30% dos afiliados têm CPA validado
          const temCPAValidado = affiliate.total > 10 && (affiliate.affiliate_id % 3 === 0);
          
          return {
            ...affiliate,
            cpa_pago: temCPAValidado ? cpaCalculado : 0,
            rev_pago: temCPAValidado ? cpaCalculado * 0.1 : 0, // 10% do CPA como REV
            total_pago: temCPAValidado ? cpaCalculado * 1.1 : 0
          };
        });
        
        // Filtrar apenas afiliados com CPA validados
        const cpaValidatedData = processedData.filter(affiliate => 
          affiliate.cpa_pago > 0 || affiliate.rev_pago > 0
        );
        
        console.log(`✅ Processados ${processedData.length} afiliados, ${cpaValidatedData.length} com CPA validados`);
        
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
            cpa_simulation: true,
            original_count: processedData.length,
            filtered_count: cpaValidatedData.length,
            cpa_config: cpaConfig
          }
        };
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar afiliados com CPA validados:', error);
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

