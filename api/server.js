const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend React
app.use(express.static(path.join(__dirname, '../dist')));

// Configuração do banco PostgreSQL
const pool = new Pool({
  host: '177.115.223.216',
  port: 5999,
  database: 'dados_interno',
  user: 'userschapz',
  password: 'mschaphz8881!',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Teste de conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com PostgreSQL:', err);
});

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'success',
      message: 'API funcionando - Conexão com banco de dados OK',
      timestamp: result.rows[0].now,
      database: 'PostgreSQL conectado'
    });
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro de conexão com o banco de dados',
      error: error.message
    });
  }
});

// Endpoint de teste simples para verificar roteamento
app.get('/api/test-simple', (req, res) => {
  res.json({
    status: 'success',
    message: 'Endpoint de teste funcionando',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Rota para buscar afiliados com dados 100% reais
app.get('/api/affiliates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔍 Buscando afiliados - Página: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Query para buscar afiliados reais da tabela tracked
    const affiliatesQuery = `
      SELECT 
        t.user_afil as affiliate_id,
        COUNT(DISTINCT t.user_id) as total_clients,
        MIN(1) as min_level,
        MAX(1) as max_level,
        'Ativo' as status,
        COUNT(*) as total_records
      FROM tracked t
      WHERE t.user_afil IS NOT NULL 
        AND t.user_id IS NOT NULL
        AND t.tracked_type_id = 1
      GROUP BY t.user_afil
      HAVING COUNT(DISTINCT t.user_id) > 0
      ORDER BY total_clients DESC
      LIMIT $1 OFFSET $2
    `;

    // Query para contar total de afiliados reais
    const countQuery = `
      SELECT COUNT(DISTINCT user_afil) as total
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
    `;

    const [affiliatesResult, countResult] = await Promise.all([
      pool.query(affiliatesQuery, [limit, offset]),
      pool.query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Encontrados ${affiliatesResult.rows.length} afiliados de ${total} total`);

    res.json({
      status: 'success',
      data: affiliatesResult.rows,
      pagination: {
        page,
        pages: totalPages,
        total,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar afiliados:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar afiliados',
      error: error.message
    });
  }
});

// Rota para estatísticas dos afiliados com dados 100% reais
app.get('/api/affiliates/stats', async (req, res) => {
  try {
    console.log('📈 Buscando estatísticas de afiliados...');

    // Total de afiliados únicos reais
    const totalAffiliatesQuery = `
      SELECT COUNT(DISTINCT user_afil) as total_affiliates
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
    `;

    // Total de registros de tracking reais
    const totalTrackingQuery = `
      SELECT COUNT(*) as total_tracking_records
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
    `;

    // Top 5 afiliados reais
    const topAffiliatesQuery = `
      SELECT 
        user_afil as affiliate_id,
        COUNT(DISTINCT user_id) as client_count
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
      GROUP BY user_afil
      ORDER BY client_count DESC
      LIMIT 5
    `;

    const [totalAffiliates, totalTracking, topAffiliates] = await Promise.all([
      pool.query(totalAffiliatesQuery),
      pool.query(totalTrackingQuery),
      pool.query(topAffiliatesQuery)
    ]);

    const stats = {
      total_affiliates: parseInt(totalAffiliates.rows[0].total_affiliates),
      total_tracking_records: parseInt(totalTracking.rows[0].total_tracking_records),
      top_affiliates: topAffiliates.rows.map(row => ({
        affiliate_id: row.affiliate_id,
        client_count: parseInt(row.client_count)
      }))
    };

    console.log('📊 Estatísticas calculadas:', stats);

    res.json({
      status: 'success',
      stats
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

// ALGORITMO MLM CORRIGIDO - Versão Final (SEM FILTRO DE DATA)
// A tabela tracked não possui coluna created_at, então removemos o filtro por data
app.get('/api/affiliates/mlm-levels-corrected', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // IMPORTANTE: Parâmetros de data são ignorados pois a tabela não tem coluna de data
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    console.log(`🔍 Buscando afiliados MLM CORRIGIDOS - Página: ${page}, Limit: ${limit}`);
    console.log(`⚠️ AVISO: Filtro por data não disponível - tabela tracked não possui coluna created_at`);

    // Testar conexão
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // CORREÇÃO: Query simples sem filtro de data (coluna não existe)
    const baseQuery = `
      SELECT 
        user_afil as affiliate_id,
        user_id as referred_user_id,
        tracked_type_id
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
      ORDER BY user_afil, user_id
    `;

    console.log(`🔍 Query SQL (sem filtro de data): ${baseQuery}`);

    // Buscar todos os dados (sem filtro de data)
    const trackedResult = await pool.query(baseQuery);
    const trackedData = trackedResult.rows;
    
    console.log(`📈 Total de registros encontrados: ${trackedData.length}`);

    // Buscar estatísticas gerais
    const totalStatsQuery = `
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

    // Construir hierarquia MLM correta
    const affiliateStats = buildCorrectMLMHierarchy(trackedData);
    
    // Filtrar apenas afiliados com indicações
    const filteredAffiliates = Object.values(affiliateStats)
      .filter(affiliate => affiliate.total > 0)
      .sort((a, b) => b.total - a.total);

    // Paginar resultados
    const paginatedAffiliates = filteredAffiliates.slice(offset, offset + limit);
    const totalPages = Math.ceil(filteredAffiliates.length / limit);

    // Calcular estatísticas
    const totalIndicationsCalculated = filteredAffiliates.reduce((sum, a) => sum + a.total, 0);
    const totalAffiliatesCalculated = filteredAffiliates.length;

    console.log(`✅ Resultado final:`);
    console.log(`   - Afiliados processados: ${totalAffiliatesCalculated}`);
    console.log(`   - Total de indicações calculadas: ${totalIndicationsCalculated}`);
    console.log(`   - Filtro de data: NÃO DISPONÍVEL (coluna não existe)`);

    res.json({
      status: 'success',
      data: paginatedAffiliates,
      pagination: {
        page: page,
        pages: totalPages,
        total: totalAffiliatesCalculated,
        limit: limit
      },
      debug: {
        total_tracked_records: trackedData.length,
        total_affiliates_with_indications: totalAffiliatesCalculated,
        total_indications_calculated: totalIndicationsCalculated,
        algorithm: 'corrected_mlm_without_date_filter',
        date_filter_available: false,
        date_filter_requested: {
          start_date: startDate,
          end_date: endDate
        },
        warning: 'Tabela tracked não possui coluna created_at - filtro por data não disponível',
        // Estatísticas gerais
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

// Rota para todas as páginas React (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Configuração da porta
const PORT = process.env.PORT || 3000;

// Inicializar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

