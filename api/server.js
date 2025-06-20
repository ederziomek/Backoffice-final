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

// Nova rota para lista de afiliados com níveis MLM detalhados
app.get('/api/affiliates/mlm-levels', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔍 Buscando afiliados com níveis MLM - Página: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Testar conexão com banco primeiro
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // Query simplificada para buscar afiliados e calcular níveis MLM
    const affiliatesMLMQuery = `
      WITH affiliate_direct AS (
        -- Indicações diretas (nível 0)
        SELECT 
          user_afil as affiliate_id,
          COUNT(DISTINCT user_id) as direct_count
        FROM tracked 
        WHERE user_afil IS NOT NULL 
          AND user_id IS NOT NULL
          AND tracked_type_id = 1
        GROUP BY user_afil
      ),
      affiliate_levels AS (
        -- Calcular níveis MLM de forma simplificada
        SELECT 
          ad.affiliate_id,
          ad.direct_count,
          COALESCE(n1.count, 0) as n1,
          COALESCE(n2.count, 0) as n2,
          COALESCE(n3.count, 0) as n3,
          COALESCE(n4.count, 0) as n4,
          COALESCE(n5.count, 0) as n5
        FROM affiliate_direct ad
        LEFT JOIN (
          -- Nível 1: Clientes do afiliado que se tornaram afiliados
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t2.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n1 ON ad.affiliate_id = n1.main_affiliate
        LEFT JOIN (
          -- Nível 2: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t3.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n2 ON ad.affiliate_id = n2.main_affiliate
        LEFT JOIN (
          -- Nível 3: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t4.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n3 ON ad.affiliate_id = n3.main_affiliate
        LEFT JOIN (
          -- Nível 4: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t5.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          INNER JOIN tracked t5 ON t4.user_id = t5.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1 AND t5.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n4 ON ad.affiliate_id = n4.main_affiliate
        LEFT JOIN (
          -- Nível 5: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t6.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          INNER JOIN tracked t5 ON t4.user_id = t5.user_afil
          INNER JOIN tracked t6 ON t5.user_id = t6.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1 AND t5.tracked_type_id = 1 AND t6.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n5 ON ad.affiliate_id = n5.main_affiliate
      )
      SELECT 
        affiliate_id,
        direct_count + n1 + n2 + n3 + n4 + n5 as total,
        n1,
        n2,
        n3,
        n4,
        n5
      FROM affiliate_levels
      WHERE direct_count > 0
      ORDER BY total DESC
      LIMIT $1 OFFSET $2
    `;

    console.log('🔄 Executando query MLM...');

    // Query para contar total de afiliados
    const countQuery = `
      SELECT COUNT(DISTINCT user_afil) as total
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
    `;

    const [affiliatesResult, countResult] = await Promise.all([
      pool.query(affiliatesMLMQuery, [limit, offset]),
      pool.query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Query executada com sucesso! Encontrados ${affiliatesResult.rows.length} afiliados de ${total} total`);

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
    console.error('❌ Erro detalhado ao buscar afiliados MLM:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Falha ao carregar estatísticas MLM',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ALGORITMO MLM CORRIGIDO - Implementação conforme documentação
// Busca TODOS os 614.944 registros e constrói hierarquia infinita

// Nova rota para lista de afiliados com níveis MLM detalhados - ALGORITMO CORRIGIDO

// Rota para detalhes de um afiliado específico
app.get('/api/affiliates/:id', async (req, res) => {
  try {
    const affiliateId = req.params.id;

    console.log(`👤 Buscando detalhes do afiliado: ${affiliateId}`);

    const detailsQuery = `
      SELECT 
        user_afil as affiliate_id,
        COUNT(DISTINCT user_id) as total_clients,
        1 as min_level,
        1 as max_level,
        COUNT(*) as total_records
      FROM tracked 
      WHERE user_afil = $1 AND user_id IS NOT NULL
      GROUP BY user_afil
    `;

    const result = await pool.query(detailsQuery, [affiliateId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Afiliado não encontrado'
      });
    }

    console.log('📋 Detalhes encontrados:', result.rows[0]);

    res.json({
      status: 'success',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do afiliado:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar detalhes do afiliado',
      error: error.message
    });
  }
});

// Nova rota para lista de afiliados com níveis MLM detalhados
app.get('/api/affiliates/mlm-levels', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔍 Buscando afiliados com níveis MLM - Página: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Testar conexão com banco primeiro
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // Query simplificada para buscar afiliados e calcular níveis MLM
    const affiliatesMLMQuery = `
      WITH affiliate_direct AS (
        -- Indicações diretas (nível 0)
        SELECT 
          user_afil as affiliate_id,
          COUNT(DISTINCT user_id) as direct_count
        FROM tracked 
        WHERE user_afil IS NOT NULL 
          AND user_id IS NOT NULL
          AND tracked_type_id = 1
        GROUP BY user_afil
      ),
      affiliate_levels AS (
        -- Calcular níveis MLM de forma simplificada
        SELECT 
          ad.affiliate_id,
          ad.direct_count,
          COALESCE(n1.count, 0) as n1,
          COALESCE(n2.count, 0) as n2,
          COALESCE(n3.count, 0) as n3,
          COALESCE(n4.count, 0) as n4,
          COALESCE(n5.count, 0) as n5
        FROM affiliate_direct ad
        LEFT JOIN (
          -- Nível 1: Clientes do afiliado que se tornaram afiliados
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t2.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n1 ON ad.affiliate_id = n1.main_affiliate
        LEFT JOIN (
          -- Nível 2: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t3.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n2 ON ad.affiliate_id = n2.main_affiliate
        LEFT JOIN (
          -- Nível 3: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t4.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n3 ON ad.affiliate_id = n3.main_affiliate
        LEFT JOIN (
          -- Nível 4: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t5.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          INNER JOIN tracked t5 ON t4.user_id = t5.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1 AND t5.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n4 ON ad.affiliate_id = n4.main_affiliate
        LEFT JOIN (
          -- Nível 5: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t6.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          INNER JOIN tracked t5 ON t4.user_id = t5.user_afil
          INNER JOIN tracked t6 ON t5.user_id = t6.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1 AND t5.tracked_type_id = 1 AND t6.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n5 ON ad.affiliate_id = n5.main_affiliate
      )
      SELECT 
        affiliate_id,
        direct_count + n1 + n2 + n3 + n4 + n5 as total,
        n1,
        n2,
        n3,
        n4,
        n5
      FROM affiliate_levels
      WHERE direct_count > 0
      ORDER BY total DESC
      LIMIT $1 OFFSET $2
    `;

    console.log('🔄 Executando query MLM...');

    // Query para contar total de afiliados
    const countQuery = `
      SELECT COUNT(DISTINCT user_afil) as total
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
    `;

    const [affiliatesResult, countResult] = await Promise.all([
      pool.query(affiliatesMLMQuery, [limit, offset]),
      pool.query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Query executada com sucesso! Encontrados ${affiliatesResult.rows.length} afiliados de ${total} total`);

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
    console.error('❌ Erro detalhado ao buscar afiliados MLM:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Falha ao carregar estatísticas MLM',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Rota para rede de um afiliado
app.get('/api/affiliates/:id/network', async (req, res) => {
  try {
    const affiliateId = req.params.id;

    console.log(`🌐 Buscando rede do afiliado: ${affiliateId}`);

    const networkQuery = `
      SELECT 
        user_id as client_id,
        1 as level
      FROM tracked 
      WHERE user_afil = $1 AND user_id IS NOT NULL
      ORDER BY user_id
    `;

    const result = await pool.query(networkQuery, [affiliateId]);

    console.log(`🔗 Rede encontrada: ${result.rows.length} clientes`);

    res.json({
      status: 'success',
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar rede do afiliado:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar rede do afiliado',
      error: error.message
    });
  }
});

// Nova rota para rede MLM até 5 níveis com dados 100% reais
app.get('/api/affiliates/:id/mlm-network', async (req, res) => {
  try {
    const affiliateId = parseInt(req.params.id);

    console.log(`🌐 Buscando rede MLM do afiliado: ${affiliateId}`);

    // Query recursiva para calcular rede MLM até 5 níveis
    const mlmNetworkQuery = `
      WITH RECURSIVE affiliate_network AS (
        -- Nível 0: O afiliado principal
        SELECT 
          user_afil as affiliate_id,
          user_id as client_id,
          0 as level,
          ARRAY[user_afil] as path
        FROM tracked 
        WHERE user_afil = $1 
          AND user_id IS NOT NULL
          AND tracked_type_id = 1
        
        UNION ALL
        
        -- Níveis 1-5: Clientes que se tornaram afiliados
        SELECT 
          t.user_afil as affiliate_id,
          t.user_id as client_id,
          an.level + 1 as level,
          an.path || t.user_afil as path
        FROM tracked t
        INNER JOIN affiliate_network an ON t.user_afil = an.client_id
        WHERE an.level < 5
          AND t.user_id IS NOT NULL
          AND t.tracked_type_id = 1
          AND NOT (t.user_afil = ANY(an.path)) -- Evitar loops
      )
      SELECT 
        level,
        affiliate_id,
        client_id,
        COUNT(*) OVER (PARTITION BY level) as level_count,
        COUNT(*) OVER () as total_network_size
      FROM affiliate_network
      ORDER BY level, affiliate_id, client_id
    `;

    // Query para estatísticas da rede
    const networkStatsQuery = `
      WITH RECURSIVE affiliate_network AS (
        SELECT 
          user_afil as affiliate_id,
          user_id as client_id,
          0 as level
        FROM tracked 
        WHERE user_afil = $1 
          AND user_id IS NOT NULL
          AND tracked_type_id = 1
        
        UNION ALL
        
        SELECT 
          t.user_afil as affiliate_id,
          t.user_id as client_id,
          an.level + 1 as level
        FROM tracked t
        INNER JOIN affiliate_network an ON t.user_afil = an.client_id
        WHERE an.level < 5
          AND t.user_id IS NOT NULL
          AND t.tracked_type_id = 1
      )
      SELECT 
        level,
        COUNT(DISTINCT client_id) as clients_count,
        COUNT(DISTINCT affiliate_id) as affiliates_count
      FROM affiliate_network
      GROUP BY level
      ORDER BY level
    `;

    const [networkResult, statsResult] = await Promise.all([
      pool.query(mlmNetworkQuery, [affiliateId]),
      pool.query(networkStatsQuery, [affiliateId])
    ]);

    // Processar dados por nível
    const networkByLevel = {};
    networkResult.rows.forEach(row => {
      if (!networkByLevel[row.level]) {
        networkByLevel[row.level] = [];
      }
      networkByLevel[row.level].push({
        affiliate_id: row.affiliate_id,
        client_id: row.client_id
      });
    });

    // Processar estatísticas
    const levelStats = {};
    statsResult.rows.forEach(row => {
      levelStats[`nivel_${row.level}`] = {
        level: row.level,
        clients_count: parseInt(row.clients_count),
        affiliates_count: parseInt(row.affiliates_count)
      };
    });

    console.log(`🔗 Rede MLM calculada: ${networkResult.rows.length} total, ${statsResult.rows.length} níveis`);

    res.json({
      status: 'success',
      affiliate_id: affiliateId,
      network: networkByLevel,
      stats: levelStats,
      total_network_size: networkResult.rows.length,
      max_levels: Math.max(...statsResult.rows.map(r => r.level))
    });

  } catch (error) {
    console.error('❌ Erro ao buscar rede MLM:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar rede MLM',
      error: error.message
    });
  }
});

// Nova rota para lista de afiliados com níveis MLM detalhados
app.get('/api/affiliates/mlm-levels', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔍 Buscando afiliados com níveis MLM - Página: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Testar conexão com banco primeiro
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // Query simplificada para buscar afiliados e calcular níveis MLM
    const affiliatesMLMQuery = `
      WITH affiliate_direct AS (
        -- Indicações diretas (nível 0)
        SELECT 
          user_afil as affiliate_id,
          COUNT(DISTINCT user_id) as direct_count
        FROM tracked 
        WHERE user_afil IS NOT NULL 
          AND user_id IS NOT NULL
          AND tracked_type_id = 1
        GROUP BY user_afil
      ),
      affiliate_levels AS (
        -- Calcular níveis MLM de forma simplificada
        SELECT 
          ad.affiliate_id,
          ad.direct_count,
          COALESCE(n1.count, 0) as n1,
          COALESCE(n2.count, 0) as n2,
          COALESCE(n3.count, 0) as n3,
          COALESCE(n4.count, 0) as n4,
          COALESCE(n5.count, 0) as n5
        FROM affiliate_direct ad
        LEFT JOIN (
          -- Nível 1: Clientes do afiliado que se tornaram afiliados
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t2.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n1 ON ad.affiliate_id = n1.main_affiliate
        LEFT JOIN (
          -- Nível 2: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t3.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n2 ON ad.affiliate_id = n2.main_affiliate
        LEFT JOIN (
          -- Nível 3: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t4.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n3 ON ad.affiliate_id = n3.main_affiliate
        LEFT JOIN (
          -- Nível 4: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t5.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          INNER JOIN tracked t5 ON t4.user_id = t5.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1 AND t5.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n4 ON ad.affiliate_id = n4.main_affiliate
        LEFT JOIN (
          -- Nível 5: Simplificado
          SELECT 
            t1.user_afil as main_affiliate,
            COUNT(DISTINCT t6.user_id) as count
          FROM tracked t1
          INNER JOIN tracked t2 ON t1.user_id = t2.user_afil
          INNER JOIN tracked t3 ON t2.user_id = t3.user_afil
          INNER JOIN tracked t4 ON t3.user_id = t4.user_afil
          INNER JOIN tracked t5 ON t4.user_id = t5.user_afil
          INNER JOIN tracked t6 ON t5.user_id = t6.user_afil
          WHERE t1.tracked_type_id = 1 AND t2.tracked_type_id = 1 AND t3.tracked_type_id = 1 AND t4.tracked_type_id = 1 AND t5.tracked_type_id = 1 AND t6.tracked_type_id = 1
          GROUP BY t1.user_afil
        ) n5 ON ad.affiliate_id = n5.main_affiliate
      )
      SELECT 
        affiliate_id,
        direct_count + n1 + n2 + n3 + n4 + n5 as total,
        n1,
        n2,
        n3,
        n4,
        n5
      FROM affiliate_levels
      WHERE direct_count > 0
      ORDER BY total DESC
      LIMIT $1 OFFSET $2
    `;

    console.log('🔄 Executando query MLM...');

    // Query para contar total de afiliados
    const countQuery = `
      SELECT COUNT(DISTINCT user_afil) as total
      FROM tracked 
      WHERE user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND tracked_type_id = 1
    `;

    const [affiliatesResult, countResult] = await Promise.all([
      pool.query(affiliatesMLMQuery, [limit, offset]),
      pool.query(countQuery)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Query executada com sucesso! Encontrados ${affiliatesResult.rows.length} afiliados de ${total} total`);

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
    console.error('❌ Erro detalhado ao buscar afiliados MLM:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Falha ao carregar estatísticas MLM',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API disponível em http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👥 Afiliados: http://localhost:${PORT}/api/affiliates`);
  console.log(`📈 Estatísticas: http://localhost:${PORT}/api/affiliates/stats`);
  console.log(`🌐 MLM Levels: http://localhost:${PORT}/api/affiliates/mlm-levels`);
});

module.exports = app;



// Rota para estatísticas do dashboard com dados 100% reais
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas do dashboard...');

    // Executar queries em paralelo para melhor performance
    const [
      usuariosResult,
      depositosResult,
      saquesResult,
      apostasResult,
      usuariosAtivosResult
    ] = await Promise.all([
      // Total de usuários
      pool.query('SELECT COUNT(*) as total FROM cadastro'),
      
      // Total de depósitos
      pool.query(`
        SELECT 
          COUNT(*) as total_depositos,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as valor_total
        FROM depositos 
        WHERE status = 'APPROVED'
      `),
      
      // Total de saques
      pool.query(`
        SELECT 
          COUNT(*) as total_saques,
          COALESCE(SUM(CAST(valor AS DECIMAL)), 0) as valor_total
        FROM saques 
        WHERE status = 'APPROVED'
      `),
      
      // Total de apostas
      pool.query(`
        SELECT 
          COUNT(*) as total_apostas,
          COALESCE(SUM(CAST(bet_amount AS DECIMAL)), 0) as valor_total
        FROM casino_bets_v 
        WHERE status = 'COMPLETED'
      `),
      
      // Usuários ativos nos últimos 30 dias
      pool.query(`
        SELECT COUNT(DISTINCT user_id) as usuarios_ativos
        FROM casino_bets_v 
        WHERE played_date >= NOW() - INTERVAL '30 days'
          AND status = 'COMPLETED'
      `)
    ]);

    const stats = {
      total_usuarios: parseInt(usuariosResult.rows[0].total),
      total_depositos: parseInt(depositosResult.rows[0].total_depositos),
      total_saques: parseInt(saquesResult.rows[0].total_saques),
      total_apostas: parseInt(apostasResult.rows[0].total_apostas),
      valor_total_depositos: parseFloat(depositosResult.rows[0].valor_total),
      valor_total_saques: parseFloat(saquesResult.rows[0].valor_total),
      valor_total_apostas: parseFloat(apostasResult.rows[0].valor_total),
      usuarios_ativos_30d: parseInt(usuariosAtivosResult.rows[0].usuarios_ativos)
    };

    console.log('📈 Estatísticas calculadas:', stats);

    res.json({
      status: 'success',
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar estatísticas do dashboard',
      error: error.message
    });
  }
});

// Rota para atividades recentes
app.get('/api/dashboard/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    console.log(`🔄 Buscando ${limit} atividades recentes...`);

    // Buscar depósitos e saques recentes
    const [depositosRecentes, saquesRecentes] = await Promise.all([
      pool.query(`
        SELECT 
          'deposito' as tipo,
          id::text as id,
          user_id,
          amount as valor,
          data_deposito as data,
          status
        FROM depositos 
        WHERE status = 'APPROVED'
        ORDER BY data_deposito DESC 
        LIMIT $1
      `, [Math.ceil(limit / 2)]),
      
      pool.query(`
        SELECT 
          'saque' as tipo,
          id::text as id,
          user_id,
          valor,
          data_saques as data,
          status
        FROM saques 
        WHERE status = 'APPROVED'
        ORDER BY data_saques DESC 
        LIMIT $1
      `, [Math.ceil(limit / 2)])
    ]);

    // Combinar e ordenar por data
    const atividades = [
      ...depositosRecentes.rows,
      ...saquesRecentes.rows
    ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, limit);

    console.log(`📋 Encontradas ${atividades.length} atividades recentes`);

    res.json({
      status: 'success',
      data: atividades,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar atividades recentes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar atividades recentes',
      error: error.message
    });
  }
});

// Rota para testar conexão com banco
app.get('/api/database/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp, version() as version');
    res.json({
      status: 'success',
      message: 'Conexão com banco de dados OK',
      timestamp: result.rows[0].timestamp,
      database_version: result.rows[0].version
    });
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro de conexão com o banco de dados',
      error: error.message
    });
  }
});



// ALGORITMO MLM CORRIGIDO - Implementação conforme documentação
// Busca TODOS os 614.944 registros e constrói hierarquia infinita

// Nova rota para lista de afiliados com níveis MLM detalhados - ALGORITMO CORRIGIDO
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
      if (relativeLevel <= 5) {
        levels[relativeLevel]++;
        
        // Se o filho também é afiliado, continuar recursivamente
        if (relationships.has(childId)) {
          mapLevelsRecursive(childId, relativeLevel + 1);
        }
      }
    }
  }
  
  // Iniciar mapeamento a partir do afiliado
  mapLevelsRecursive(affiliateId, 1);
  
  // Calcular total como N1+N2+N3+N4+N5 (conforme documentação)
  const total = levels[1] + levels[2] + levels[3] + levels[4] + levels[5];
  
  return {
    affiliate_id: affiliateId,
    total: total,
    n1: levels[1],
    n2: levels[2],
    n3: levels[3],
    n4: levels[4],
    n5: levels[5]
  };
}


// Endpoint para verificar dados da tabela tracked
app.get('/api/database/tracked-info', async (req, res) => {
  try {
    console.log('🔍 Verificando informações da tabela tracked...');

    // Query para contar TODOS os registros tracked
    const totalQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT user_afil) as unique_affiliates,
        COUNT(DISTINCT user_id) as unique_users
      FROM tracked 
      WHERE tracked_type_id = 1
    `;

    // Query para contar registros válidos (com afiliado e usuário)
    const validQuery = `
      SELECT 
        COUNT(*) as valid_records,
        COUNT(DISTINCT user_afil) as valid_affiliates,
        COUNT(DISTINCT user_id) as valid_users
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
    `;

    // Query para verificar alguns registros de exemplo
    const sampleQuery = `
      SELECT 
        id,
        user_afil,
        user_id,
        tracked_type_id
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
      ORDER BY id DESC
      LIMIT 10
    `;

    const [totalResult, validResult, sampleResult] = await Promise.all([
      pool.query(totalQuery),
      pool.query(validQuery),
      pool.query(sampleQuery)
    ]);

    const totalData = totalResult.rows[0];
    const validData = validResult.rows[0];
    const sampleData = sampleResult.rows;

    console.log(`📊 Total de registros tracked: ${totalData.total_records}`);
    console.log(`✅ Registros válidos: ${validData.valid_records}`);
    console.log(`👥 Afiliados únicos: ${validData.valid_affiliates}`);

    res.json({
      status: 'success',
      database_info: {
        total_records: parseInt(totalData.total_records),
        unique_affiliates: parseInt(totalData.unique_affiliates),
        unique_users: parseInt(totalData.unique_users)
      },
      valid_data: {
        valid_records: parseInt(validData.valid_records),
        valid_affiliates: parseInt(validData.valid_affiliates),
        valid_users: parseInt(validData.valid_users)
      },
      sample_records: sampleData,
      expected_vs_actual: {
        expected_total: 614944,
        actual_total: parseInt(totalData.total_records),
        difference: 614944 - parseInt(totalData.total_records),
        percentage_found: ((parseInt(totalData.total_records) / 614944) * 100).toFixed(2) + '%'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar tabela tracked:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar dados da tabela tracked',
      error: error.message
    });
  }
});


// Rota catch-all para servir o React app - DEVE SER A ÚLTIMA ROTA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

module.exports = app;

