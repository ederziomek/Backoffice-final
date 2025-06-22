// ALGORITMO MLM CORRIGIDO - Versão Final
// Corrige o problema do filtro de período na página Afiliados2

const express = require('express');
const { Pool } = require('pg');

// Endpoint corrigido para afiliados MLM com filtro de período funcionando
app.get('/api/affiliates/mlm-levels-corrected', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Parâmetros de filtro por data das indicações
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    console.log(`🔍 Buscando afiliados MLM CORRIGIDOS - Página: ${page}, Limit: ${limit}`);
    console.log(`📅 Filtro de data: ${startDate || 'sem início'} até ${endDate || 'sem fim'}`);

    // Testar conexão
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // CORREÇÃO 1: Query base para buscar todas as indicações
    let baseQuery = `
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
    let dateFilterApplied = false;
    
    // CORREÇÃO 2: Aplicar filtro de data apenas se fornecido
    if (startDate) {
      queryParams.push(startDate + ' 00:00:00');
      baseQuery += ` AND created_at >= $${queryParams.length}`;
      dateFilterApplied = true;
    }
    
    if (endDate) {
      queryParams.push(endDate + ' 23:59:59');
      baseQuery += ` AND created_at <= $${queryParams.length}`;
      dateFilterApplied = true;
    }
    
    baseQuery += ` ORDER BY user_afil, user_id`;

    console.log(`🔍 Query SQL: ${baseQuery}`);
    console.log(`📋 Parâmetros: ${JSON.stringify(queryParams)}`);

    // Buscar dados filtrados
    const trackedResult = await pool.query(baseQuery, queryParams);
    const trackedData = trackedResult.rows;
    
    console.log(`📈 Registros encontrados com filtro: ${trackedData.length}`);

    // CORREÇÃO 3: Se não há filtro de data, buscar estatísticas gerais
    let totalStatsQuery = `
      SELECT 
        COUNT(DISTINCT user_afil) as total_affiliates,
        COUNT(*) as total_indications
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
    `;

    const totalStatsResult = await pool.query(totalStatsQuery);
    const totalStats = totalStatsResult.rows[0];

    // CORREÇÃO 4: Construir hierarquia MLM correta
    const affiliateStats = buildCorrectMLMHierarchy(trackedData);
    
    // CORREÇÃO 5: Filtrar apenas afiliados com indicações no período (se filtro aplicado)
    const filteredAffiliates = Object.values(affiliateStats)
      .filter(affiliate => affiliate.total > 0)
      .sort((a, b) => b.total - a.total);

    // Paginar resultados
    const paginatedAffiliates = filteredAffiliates.slice(offset, offset + limit);
    const totalPages = Math.ceil(filteredAffiliates.length / limit);

    // CORREÇÃO 6: Calcular estatísticas corretas
    const totalIndicationsInPeriod = filteredAffiliates.reduce((sum, a) => sum + a.total, 0);
    const totalAffiliatesInPeriod = filteredAffiliates.length;

    console.log(`✅ Resultado final:`);
    console.log(`   - Afiliados com indicações no período: ${totalAffiliatesInPeriod}`);
    console.log(`   - Total de indicações no período: ${totalIndicationsInPeriod}`);
    console.log(`   - Filtro de data aplicado: ${dateFilterApplied ? 'SIM' : 'NÃO'}`);

    res.json({
      status: 'success',
      data: paginatedAffiliates,
      pagination: {
        page: page,
        pages: totalPages,
        total: totalAffiliatesInPeriod,
        limit: limit
      },
      debug: {
        total_tracked_records: trackedData.length,
        total_affiliates_with_indications: totalAffiliatesInPeriod,
        total_indications_in_period: totalIndicationsInPeriod,
        algorithm: 'corrected_mlm_with_proper_date_filter',
        date_filter_applied: dateFilterApplied,
        date_filter: {
          start_date: startDate,
          end_date: endDate
        },
        // Estatísticas gerais (sem filtro)
        general_stats: {
          total_affiliates: parseInt(totalStats.total_affiliates),
          total_indications: parseInt(totalStats.total_indications)
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

// CORREÇÃO 7: Função corrigida para construir hierarquia MLM
function buildCorrectMLMHierarchy(trackedData) {
  console.log('🏗️ Construindo hierarquia MLM corrigida...');
  
  // Mapear relacionamentos diretos
  const directRelationships = new Map(); // affiliate_id -> [user_ids]
  const userToAffiliate = new Map(); // user_id -> affiliate_id
  
  // Processar dados tracked
  for (const record of trackedData) {
    const affiliateId = record.affiliate_id;
    const userId = record.referred_user_id;
    
    if (!directRelationships.has(affiliateId)) {
      directRelationships.set(affiliateId, new Set());
    }
    directRelationships.get(affiliateId).add(userId);
    userToAffiliate.set(userId, affiliateId);
  }
  
  const affiliateStats = {};
  
  // Para cada afiliado, calcular N1-N5
  for (const [affiliateId, directUsers] of directRelationships) {
    const stats = calculateCorrectN1ToN5(affiliateId, directRelationships, userToAffiliate);
    affiliateStats[affiliateId] = stats;
  }
  
  console.log(`📊 Processados ${Object.keys(affiliateStats).length} afiliados`);
  return affiliateStats;
}

// CORREÇÃO 8: Função corrigida para calcular N1-N5
function calculateCorrectN1ToN5(affiliateId, directRelationships, userToAffiliate) {
  const levels = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // N1: Indicações diretas do afiliado
  const n1Users = directRelationships.get(affiliateId) || new Set();
  levels[1] = n1Users.size;
  
  // N2: Indicações dos usuários N1 que também são afiliados
  const n2Users = new Set();
  for (const userId of n1Users) {
    if (directRelationships.has(userId)) {
      const userReferrals = directRelationships.get(userId) || new Set();
      for (const referral of userReferrals) {
        n2Users.add(referral);
      }
    }
  }
  levels[2] = n2Users.size;
  
  // N3: Indicações dos usuários N2 que também são afiliados
  const n3Users = new Set();
  for (const userId of n2Users) {
    if (directRelationships.has(userId)) {
      const userReferrals = directRelationships.get(userId) || new Set();
      for (const referral of userReferrals) {
        n3Users.add(referral);
      }
    }
  }
  levels[3] = n3Users.size;
  
  // N4: Indicações dos usuários N3 que também são afiliados
  const n4Users = new Set();
  for (const userId of n3Users) {
    if (directRelationships.has(userId)) {
      const userReferrals = directRelationships.get(userId) || new Set();
      for (const referral of userReferrals) {
        n4Users.add(referral);
      }
    }
  }
  levels[4] = n4Users.size;
  
  // N5: Indicações dos usuários N4 que também são afiliados
  const n5Users = new Set();
  for (const userId of n4Users) {
    if (directRelationships.has(userId)) {
      const userReferrals = directRelationships.get(userId) || new Set();
      for (const referral of userReferrals) {
        n5Users.add(referral);
      }
    }
  }
  levels[5] = n5Users.size;
  
  // CORREÇÃO PRINCIPAL: Total = soma de todos os níveis
  const total = levels[1] + levels[2] + levels[3] + levels[4] + levels[5];
  
  return {
    affiliate_id: affiliateId,
    total: total, // CORRIGIDO: soma de N1+N2+N3+N4+N5
    n1: levels[1],
    n2: levels[2],
    n3: levels[3],
    n4: levels[4],
    n5: levels[5],
    registro: '2025-06-20', // Data padrão
    cpa_pago: 0,
    rev_pago: 0,
    total_pago: 0
  };
}

module.exports = {
  buildCorrectMLMHierarchy,
  calculateCorrectN1ToN5
};

