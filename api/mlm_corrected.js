// ALGORITMO MLM CORRIGIDO - Implementação conforme documentação
// Busca TODOS os 614.944 registros e constrói hierarquia infinita
// NOVO: Filtro por data das indicações (created_at)

// Nova rota para lista de afiliados com níveis MLM detalhados - ALGORITMO CORRIGIDO
app.get('/api/affiliates/mlm-levels-corrected', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // NOVO: Parâmetros de filtro por data das indicações
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    console.log(`🔍 Buscando afiliados com níveis MLM CORRIGIDOS - Página: ${page}, Limit: ${limit}, Offset: ${offset}`);
    console.log(`📅 PARÂMETROS RECEBIDOS - startDate: "${startDate}", endDate: "${endDate}"`);
    
    if (startDate || endDate) {
      console.log(`📅 FILTRO POR DATA DAS INDICAÇÕES ATIVO - De: ${startDate || 'início'} Até: ${endDate || 'fim'}`);
    } else {
      console.log(`⚠️ NENHUM FILTRO DE DATA APLICADO - Buscando TODOS os registros`);
    }

    // Testar conexão com banco primeiro
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // ALGORITMO CORRIGIDO: Buscar registros tracked com filtro de data das indicações
    console.log('📊 Buscando registros tracked com filtro de data...');
    
    let allTrackedQuery = `
      SELECT 
        user_afil as affiliate_id,
        user_id as referred_user_id,
        tracked_type_id,
        created_at
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
    `;
    
    const queryParams = [];
    
    // NOVO: Adicionar filtros de data das indicações
    if (startDate) {
      queryParams.push(startDate);
      allTrackedQuery += ` AND created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate + ' 23:59:59'); // Incluir todo o dia final
      allTrackedQuery += ` AND created_at <= $${queryParams.length}`;
    }
    
    allTrackedQuery += ` ORDER BY user_afil, user_id`;

    console.log(`🔍 QUERY SQL CONSTRUÍDA:`, allTrackedQuery);
    console.log(`📋 PARÂMETROS DA QUERY:`, queryParams);

    const allTrackedResult = await pool.query(allTrackedQuery, queryParams);
    const allTrackedData = allTrackedResult.rows;
    
    console.log(`📈 Total de registros tracked encontrados (com filtro): ${allTrackedData.length}`);
    
    // Log de amostra dos dados para debug
    if (allTrackedData.length > 0) {
      console.log(`📊 AMOSTRA DOS DADOS (primeiros 3 registros):`);
      allTrackedData.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. Afiliado: ${record.affiliate_id}, Usuário: ${record.referred_user_id}, Data: ${record.created_at}`);
      });
    }
    
    if (startDate || endDate) {
      console.log(`🎯 Indicações filtradas por período: ${startDate || 'início'} até ${endDate || 'fim'}`);
    }

    // Construir hierarquia infinita conforme documentação
    const hierarchy = buildInfiniteHierarchy(allTrackedData);
    
    // Calcular estatísticas N1-N5 para cada afiliado (apenas indicações do período)
    const affiliateStats = calculateN1ToN5Stats(hierarchy, allTrackedData);
    
    // Filtrar apenas afiliados que têm indicações no período
    const affiliatesWithIndicationsInPeriod = Object.values(affiliateStats)
      .filter(affiliate => affiliate.total > 0);
    
    // Ordenar por total e paginar
    const sortedAffiliates = affiliatesWithIndicationsInPeriod
      .sort((a, b) => b.total - a.total)
      .slice(offset, offset + limit);

    // Contar total de afiliados com indicações no período
    const totalAffiliates = affiliatesWithIndicationsInPeriod.length;
    const totalPages = Math.ceil(totalAffiliates / limit);
    const totalIndications = affiliatesWithIndicationsInPeriod.reduce((sum, a) => sum + a.total, 0);

    console.log(`✅ Processados ${totalAffiliates} afiliados com indicações no período`);
    console.log(`📊 Total de indicações no período: ${totalIndications}`);

    res.json({
      status: 'success',
      data: sortedAffiliates,
      pagination: {
        page: page,
        pages: totalPages,
        total: totalAffiliates,
        limit: limit
      },
      debug: {
        total_tracked_records: allTrackedData.length,
        total_affiliates_with_indications: totalAffiliates,
        total_indications_in_period: totalIndications,
        algorithm: 'infinite_hierarchy_n1_to_n5_filtered_by_indication_date',
        date_filter: {
          start_date: startDate,
          end_date: endDate
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar afiliados MLM:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar afiliados MLM',
      error: error.message
    });
  }
});

// Função para construir hierarquia infinita conforme documentação
function buildInfiniteHierarchy(trackedData) {
  console.log('🏗️ Construindo hierarquia infinita...');
  
  const relationships = new Map(); // affiliate_id -> [referred_users]
  const userToAffiliate = new Map(); // user_id -> affiliate_id
  const allAffiliates = new Set();
  const allUsers = new Set();
  
  // Processar TODOS os dados tracked
  for (const record of trackedData) {
    const affiliateId = record.affiliate_id;
    const referredUserId = record.referred_user_id;
    
    if (!relationships.has(affiliateId)) {
      relationships.set(affiliateId, []);
    }
    relationships.get(affiliateId).push(referredUserId);
    
    userToAffiliate.set(referredUserId, affiliateId);
    allAffiliates.add(affiliateId);
    allUsers.add(referredUserId);
  }
  
  console.log(`📊 Afiliados únicos: ${allAffiliates.size}`);
  console.log(`👥 Usuários referidos únicos: ${allUsers.size}`);
  console.log(`🔗 Relacionamentos mapeados: ${relationships.size}`);
  
  return {
    relationships,
    userToAffiliate,
    allAffiliates,
    allUsers
  };
}

// Função para calcular N1-N5 por afiliado conforme documentação
function calculateN1ToN5Stats(hierarchy, trackedData) {
  console.log('🧮 Calculando estatísticas N1-N5 por afiliado...');
  
  const { relationships, userToAffiliate } = hierarchy;
  const affiliateStats = {};
  
  // Para cada afiliado, calcular seus níveis N1-N5
  for (const affiliateId of hierarchy.allAffiliates) {
    const stats = calculateAffiliateN1ToN5(affiliateId, relationships, userToAffiliate);
    affiliateStats[affiliateId] = stats;
  }
  
  return affiliateStats;
}

// Função para calcular N1-N5 de um afiliado específico
function calculateAffiliateN1ToN5(affiliateId, relationships, userToAffiliate) {
  const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // N1: Indicações DIRETAS do afiliado (apenas primeiro nível)
  const directReferrals = relationships.get(affiliateId) || [];
  levels[1] = directReferrals.length;
  
  // N2-N5: Indicações dos indicados (níveis indiretos)
  function calculateIndirectLevels(userIds, currentLevel) {
    if (currentLevel > 5 || userIds.length === 0) {
      return;
    }
    
    const nextLevelUsers = [];
    
    for (const userId of userIds) {
      // Se este usuário também é afiliado, contar suas indicações
      if (relationships.has(userId)) {
        const userReferrals = relationships.get(userId) || [];
        levels[currentLevel] += userReferrals.length;
        nextLevelUsers.push(...userReferrals);
      }
    }
    
    // Continuar para o próximo nível
    if (nextLevelUsers.length > 0 && currentLevel < 5) {
      calculateIndirectLevels(nextLevelUsers, currentLevel + 1);
    }
  }
  
  // Calcular N2-N5 a partir dos indicados diretos
  calculateIndirectLevels(directReferrals, 2);
  
  // CORREÇÃO: Total = apenas indicações DIRETAS (N1), não soma de todos os níveis
  const total = levels[1];
  
  return {
    affiliate_id: affiliateId,
    total: total, // Apenas indicações diretas
    n1: levels[1], // Indicações diretas
    n2: levels[2], // Indicações dos indicados
    n3: levels[3], // Indicações dos indicados dos indicados
    n4: levels[4], // E assim por diante...
    n5: levels[5],
    // Adicionar data de registro simulada
    registro: '2025-06-20', // Será substituída por dados reais se disponível
    cpa_pago: 0,
    rev_pago: 0,
    total_pago: 0
  };
}

