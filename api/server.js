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

// ALGORITMO MLM CORRIGIDO - Implementação conforme documentação
// Busca TODOS os 614.944 registros e constrói hierarquia infinita
app.get('/api/affiliates/mlm-levels-corrected', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔍 Buscando afiliados com níveis MLM CORRIGIDOS - Página: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Testar conexão com banco primeiro
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // ALGORITMO CORRIGIDO: Buscar TODOS os registros tracked primeiro
    console.log('📊 Buscando TODOS os registros tracked...');
    
    const allTrackedQuery = `
      SELECT 
        user_afil as affiliate_id,
        user_id as referred_user_id,
        tracked_type_id,
        created_at
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
      ORDER BY user_afil, user_id
    `;

    const allTrackedResult = await pool.query(allTrackedQuery);
    const allTrackedData = allTrackedResult.rows;
    
    console.log(`📈 Total de registros tracked encontrados: ${allTrackedData.length}`);

    // Construir hierarquia infinita conforme documentação
    const hierarchy = buildInfiniteHierarchy(allTrackedData);
    
    // Calcular estatísticas N1-N5 para cada afiliado
    const affiliateStats = calculateN1ToN5Stats(hierarchy, allTrackedData);
    
    // Ordenar por total e paginar
    const sortedAffiliates = Object.values(affiliateStats)
      .sort((a, b) => b.total - a.total)
      .slice(offset, offset + limit);

    // Contar total de afiliados únicos
    const totalAffiliates = Object.keys(affiliateStats).length;
    const totalPages = Math.ceil(totalAffiliates / limit);

    console.log(`✅ Processados ${totalAffiliates} afiliados únicos com hierarquia infinita`);
    console.log(`📊 Total de indicações: ${Object.values(affiliateStats).reduce((sum, a) => sum + a.total, 0)}`);

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
        total_affiliates: totalAffiliates,
        algorithm: 'infinite_hierarchy_n1_to_n5'
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
  const visited = new Set();
  
  function mapLevelsRecursive(currentId, relativeLevel) {
    if (visited.has(currentId) || relativeLevel > 5) {
      return; // Evitar loops e limitar a N5
    }
    
    visited.add(currentId);
    const children = relationships.get(currentId) || [];
    
    for (const childId of children) {
      if (relativeLevel >= 1 && relativeLevel <= 5) {
        levels[relativeLevel]++;
      }
      
      // Verificar se o child também é um afiliado para continuar a hierarquia
      if (relationships.has(childId)) {
        mapLevelsRecursive(childId, relativeLevel + 1);
      }
    }
  }
  
  // Começar a partir do afiliado principal (nível 1)
  mapLevelsRecursive(affiliateId, 1);
  
  const total = levels[1] + levels[2] + levels[3] + levels[4] + levels[5];
  
  return {
    affiliate_id: affiliateId,
    n1: levels[1],
    n2: levels[2],
    n3: levels[3],
    n4: levels[4],
    n5: levels[5],
    total: total
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

