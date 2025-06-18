const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Rota para buscar afiliados
app.get('/api/affiliates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Query para buscar afiliados com clientes
    const affiliatesQuery = `
      SELECT 
        affiliate_id,
        COUNT(DISTINCT client_id) as total_clients,
        MIN(level) as min_level,
        MAX(level) as max_level,
        'Ativo' as status
      FROM tracked 
      WHERE affiliate_id IS NOT NULL 
        AND client_id IS NOT NULL
      GROUP BY affiliate_id
      HAVING COUNT(DISTINCT client_id) > 0
      ORDER BY total_clients DESC
      LIMIT $1 OFFSET $2
    `;

    // Query para contar total de afiliados
    const countQuery = `
      SELECT COUNT(DISTINCT affiliate_id) as total
      FROM tracked 
      WHERE affiliate_id IS NOT NULL 
        AND client_id IS NOT NULL
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

// Rota para estatísticas dos afiliados
app.get('/api/affiliates/stats', async (req, res) => {
  try {
    // Total de afiliados únicos
    const totalAffiliatesQuery = `
      SELECT COUNT(DISTINCT affiliate_id) as total_affiliates
      FROM tracked 
      WHERE affiliate_id IS NOT NULL AND client_id IS NOT NULL
    `;

    // Total de registros de tracking
    const totalTrackingQuery = `
      SELECT COUNT(*) as total_tracking_records
      FROM tracked 
      WHERE affiliate_id IS NOT NULL AND client_id IS NOT NULL
    `;

    // Distribuição por níveis
    const levelDistributionQuery = `
      SELECT 
        level,
        COUNT(*) as count
      FROM tracked 
      WHERE affiliate_id IS NOT NULL AND client_id IS NOT NULL
      GROUP BY level
      ORDER BY level
    `;

    // Top 5 afiliados
    const topAffiliatesQuery = `
      SELECT 
        affiliate_id,
        COUNT(DISTINCT client_id) as client_count
      FROM tracked 
      WHERE affiliate_id IS NOT NULL AND client_id IS NOT NULL
      GROUP BY affiliate_id
      ORDER BY client_count DESC
      LIMIT 5
    `;

    const [totalAffiliates, totalTracking, levelDistribution, topAffiliates] = await Promise.all([
      pool.query(totalAffiliatesQuery),
      pool.query(totalTrackingQuery),
      pool.query(levelDistributionQuery),
      pool.query(topAffiliatesQuery)
    ]);

    // Processar distribuição por níveis
    const levelDist = {};
    levelDistribution.rows.forEach(row => {
      levelDist[`Nível ${row.level}`] = parseInt(row.count);
    });

    res.json({
      status: 'success',
      stats: {
        total_affiliates: parseInt(totalAffiliates.rows[0].total_affiliates),
        total_tracking_records: parseInt(totalTracking.rows[0].total_tracking_records),
        level_distribution: levelDist,
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

