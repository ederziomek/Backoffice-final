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
      message: 'Conexão com banco de dados OK',
      timestamp: result.rows[0].now
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

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota para buscar afiliados com dados 100% reais
app.get('/api/affiliates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

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
    console.error('Erro ao buscar afiliados:', error);
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

    res.json({
      status: 'success',
      stats: {
        total_affiliates: parseInt(totalAffiliates.rows[0].total_affiliates),
        total_tracking_records: parseInt(totalTracking.rows[0].total_tracking_records),
        top_affiliates: topAffiliates.rows.map(row => ({
          affiliate_id: row.affiliate_id,
          client_count: parseInt(row.client_count)
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar estatísticas',
      error: error.message
    });
  }
});

// Rota para detalhes de um afiliado específico
app.get('/api/affiliates/:id', async (req, res) => {
  try {
    const affiliateId = req.params.id;

    const detailsQuery = `
      SELECT 
        affiliate_id,
        COUNT(DISTINCT client_id) as total_clients,
        MIN(level) as min_level,
        MAX(level) as max_level,
        COUNT(*) as total_records,
        MIN(created_at) as first_client,
        MAX(created_at) as last_client
      FROM tracked 
      WHERE affiliate_id = $1 AND client_id IS NOT NULL
      GROUP BY affiliate_id
    `;

    const result = await pool.query(detailsQuery, [affiliateId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Afiliado não encontrado'
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes do afiliado:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar detalhes do afiliado',
      error: error.message
    });
  }
});

// Rota para rede de um afiliado
app.get('/api/affiliates/:id/network', async (req, res) => {
  try {
    const affiliateId = req.params.id;

    const networkQuery = `
      SELECT 
        client_id,
        level,
        created_at
      FROM tracked 
      WHERE affiliate_id = $1 AND client_id IS NOT NULL
      ORDER BY level, created_at
    `;

    const result = await pool.query(networkQuery, [affiliateId]);

    res.json({
      status: 'success',
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Erro ao buscar rede do afiliado:', error);
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

    res.json({
      status: 'success',
      affiliate_id: affiliateId,
      network: networkByLevel,
      stats: levelStats,
      total_network_size: networkResult.rows.length,
      max_levels: Math.max(...statsResult.rows.map(r => r.level))
    });

  } catch (error) {
    console.error('Erro ao buscar rede MLM:', error);
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

    // Query para buscar afiliados e calcular níveis MLM
    const affiliatesMLMQuery = `
      WITH RECURSIVE affiliate_levels AS (
        -- Nível 0: Afiliados principais
        SELECT 
          t.user_afil as affiliate_id,
          t.user_id as client_id,
          0 as level,
          ARRAY[t.user_afil] as path
        FROM tracked t
        WHERE t.user_afil IS NOT NULL 
          AND t.user_id IS NOT NULL
          AND t.tracked_type_id = '1'
        
        UNION ALL
        
        -- Níveis 1-5: Clientes que se tornaram afiliados
        SELECT 
          t.user_afil as affiliate_id,
          t.user_id as client_id,
          al.level + 1 as level,
          al.path || t.user_afil as path
        FROM tracked t
        INNER JOIN affiliate_levels al ON t.user_afil = al.client_id
        WHERE al.level < 5
          AND t.user_id IS NOT NULL
          AND t.tracked_type_id = '1'
          AND NOT (t.user_afil = ANY(al.path))
      ),
      affiliate_stats AS (
        SELECT 
          affiliate_id,
          COUNT(CASE WHEN level = 0 THEN 1 END) as total_direct,
          COUNT(CASE WHEN level = 1 THEN 1 END) as n1,
          COUNT(CASE WHEN level = 2 THEN 1 END) as n2,
          COUNT(CASE WHEN level = 3 THEN 1 END) as n3,
          COUNT(CASE WHEN level = 4 THEN 1 END) as n4,
          COUNT(CASE WHEN level = 5 THEN 1 END) as n5,
          COUNT(*) as total_network
        FROM affiliate_levels
        GROUP BY affiliate_id
      )
      SELECT 
        affiliate_id,
        total_direct + n1 + n2 + n3 + n4 + n5 as total,
        n1,
        n2,
        n3,
        n4,
        n5
      FROM affiliate_stats
      WHERE total_direct > 0
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
        AND tracked_type_id = '1'
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
      message: 'Erro ao buscar afiliados com níveis MLM',
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
});

module.exports = app;

