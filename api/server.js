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

// Fallback para React Router - deve vir DEPOIS das rotas da API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
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

