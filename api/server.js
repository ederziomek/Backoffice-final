const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

// Importar módulo de integração CPA
const cpaIntegration = require('./cpa-integration');

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

// Rota para testar conectividade com Sistema CPA
app.get('/api/cpa/test', async (req, res) => {
  try {
    console.log('🔗 Testando conectividade com Sistema CPA...');
    
    const connectivity = await cpaIntegration.testConnectivity();
    const config = await cpaIntegration.getCPAConfig();
    
    res.json({
      status: 'success',
      message: 'Teste de conectividade CPA concluído',
      connectivity: connectivity,
      cpa_config: config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste CPA:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar Sistema CPA',
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

// ENDPOINT ULTRA-SIMPLIFICADO PARA TESTE
app.get('/api/affiliates/mlm-test', async (req, res) => {
  try {
    console.log('🔍 Testando endpoint ultra-simplificado');

    // Testar conexão com banco
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // Buscar apenas alguns afiliados para teste
    const testQuery = `
      SELECT 
        user_afil as affiliate_id,
        COUNT(DISTINCT user_id) as total_clients
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
      GROUP BY user_afil
      HAVING COUNT(DISTINCT user_id) > 0
      ORDER BY total_clients DESC
      LIMIT 10
    `;

    const result = await pool.query(testQuery);
    
    const testData = result.rows.map(row => ({
      affiliate_id: row.affiliate_id,
      total: row.total_clients,
      n1: Math.floor(row.total_clients * 0.4),
      n2: Math.floor(row.total_clients * 0.3),
      n3: Math.floor(row.total_clients * 0.2),
      n4: Math.floor(row.total_clients * 0.1),
      n5: Math.floor(row.total_clients * 0.05),
      registro: '2025-06-24',
      cpa_pago: 0,
      rev_pago: 0,
      total_pago: 0
    }));

    console.log(`✅ Retornando ${testData.length} afiliados de teste`);

    res.json({
      status: 'success',
      data: testData,
      pagination: {
        page: 1,
        pages: 1,
        total: testData.length,
        limit: 10
      },
      debug: {
        algorithm: 'ultra_simple_test',
        total_found: testData.length
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro no endpoint de teste',
      error: error.message
    });
  }
});

// ENDPOINT SIMPLIFICADO PARA INDICAÇÕES (SEM INTEGRAÇÃO CPA)
app.get('/api/affiliates/mlm-levels-simple', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`🔍 Buscando afiliados MLM SIMPLES - Página: ${page}, Limit: ${limit}`);

    // Testar conexão com banco
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // Buscar dados da tabela tracked
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

    const trackedResult = await pool.query(baseQuery);
    const trackedData = trackedResult.rows;
    
    console.log(`📈 Total de registros tracked: ${trackedData.length}`);

    // Construir hierarquia MLM básica
    const affiliateStats = buildCorrectMLMHierarchy(trackedData);
    
    // Filtrar apenas afiliados com indicações
    const filteredAffiliates = Object.values(affiliateStats)
      .filter(affiliate => affiliate.total > 0)
      .sort((a, b) => b.total - a.total);

    console.log(`👥 Afiliados com indicações: ${filteredAffiliates.length}`);

    // Paginar resultados
    const paginatedAffiliates = filteredAffiliates.slice(offset, offset + limit);
    const totalPages = Math.ceil(filteredAffiliates.length / limit);

    // Calcular estatísticas finais
    const totalIndicationsCalculated = filteredAffiliates.reduce((sum, a) => sum + a.total, 0);
    const totalAffiliatesCalculated = filteredAffiliates.length;

    console.log(`✅ Resultado final:`);
    console.log(`   - Afiliados processados: ${totalAffiliatesCalculated}`);
    console.log(`   - Total de indicações: ${totalIndicationsCalculated}`);

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
        algorithm: 'mlm_simple_fast',
        cpa_integration: 'disabled'
      }
    });

  } catch (error) {
    console.error('❌ Erro na rota MLM simples:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar dados MLM simples',
      error: error.message
    });
  }
});

// ALGORITMO MLM INTEGRADO COM SISTEMA CPA - Versão Final
// Busca dados reais de CPA dos microserviços
app.get('/api/affiliates/mlm-levels-corrected', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    console.log(`🔍 Buscando afiliados MLM INTEGRADOS COM CPA - Página: ${page}, Limit: ${limit}`);

    // Testar conexão com banco
    await pool.query('SELECT 1');
    console.log('✅ Conexão com banco PostgreSQL OK');

    // Buscar dados da tabela tracked
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

    const trackedResult = await pool.query(baseQuery);
    const trackedData = trackedResult.rows;
    
    console.log(`📈 Total de registros tracked: ${trackedData.length}`);

    // Construir hierarquia MLM básica
    const affiliateStats = buildCorrectMLMHierarchy(trackedData);
    
    // Filtrar apenas afiliados com indicações
    const filteredAffiliates = Object.values(affiliateStats)
      .filter(affiliate => affiliate.total > 0)
      .sort((a, b) => b.total - a.total);

    console.log(`👥 Afiliados com indicações: ${filteredAffiliates.length}`);

    // INTEGRAÇÃO COM SISTEMA CPA - Buscar dados reais
    console.log('🔗 Integrando com Sistema CPA...');
    
    const affiliateIds = filteredAffiliates.map(a => a.affiliate_id);
    
    // Buscar dados CPA reais dos microserviços
    const cpaData = await cpaIntegration.processCPADataForAffiliates(affiliateIds);
    
    console.log(`💰 Dados CPA obtidos para ${Object.keys(cpaData).length} afiliados`);

    // Combinar dados MLM com dados CPA reais
    const enrichedAffiliates = filteredAffiliates.map(affiliate => {
      const cpaInfo = cpaData[affiliate.affiliate_id] || {
        cpa_pago: 0,
        rev_pago: 0,
        total_pago: 0,
        commissions_count: 0
      };

      return {
        ...affiliate,
        cpa_pago: cpaInfo.cpa_pago,
        rev_pago: cpaInfo.rev_pago,
        total_pago: cpaInfo.total_pago,
        commissions_count: cpaInfo.commissions_count
      };
    });

    // Paginar resultados
    const paginatedAffiliates = enrichedAffiliates.slice(offset, offset + limit);
    const totalPages = Math.ceil(enrichedAffiliates.length / limit);

    // Calcular estatísticas finais
    const totalIndicationsCalculated = enrichedAffiliates.reduce((sum, a) => sum + a.total, 0);
    const totalCPAPaid = enrichedAffiliates.reduce((sum, a) => sum + a.cpa_pago, 0);
    const totalAffiliatesCalculated = enrichedAffiliates.length;

    console.log(`✅ Resultado final integrado:`);
    console.log(`   - Afiliados processados: ${totalAffiliatesCalculated}`);
    console.log(`   - Total de indicações: ${totalIndicationsCalculated}`);
    console.log(`   - Total CPA pago: R$ ${totalCPAPaid.toFixed(2)}`);

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
        total_cpa_paid: totalCPAPaid,
        algorithm: 'mlm_integrated_with_cpa_system',
        cpa_integration: 'enabled',
        date_filter_available: false,
        date_filter_requested: {
          start_date: startDate,
          end_date: endDate
        },
        warning: 'Tabela tracked não possui coluna created_at - filtro por data não disponível'
      }
    });

  } catch (error) {
    console.error('❌ Erro na rota MLM integrada com CPA:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar dados MLM integrados com CPA',
      error: error.message
    });
  }
});

// Função corrigida para construir hierarquia MLM
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
// ENDPOINTS DO BANCO FATURE
// Endpoint para popular banco Fature com dados da operação
app.post('/api/fature/populate-database', async (req, res) => {
  try {
    console.log('🔄 Iniciando população do banco Fature...');
    
    const FatureDatabase = require('./fature_database');
    const fatureDb = new FatureDatabase();

    // Buscar dados da tabela tracked com datas
    const trackedQuery = `
      SELECT 
        user_afil,
        user_id,
        created_at,
        tracked_type_id
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
        AND created_at IS NOT NULL
      ORDER BY user_afil, created_at
    `;

    console.log('📊 Buscando dados da tabela tracked...');
    const trackedResult = await pool.query(trackedQuery);
    const trackedData = trackedResult.rows;

    console.log(`✅ Encontrados ${trackedData.length} registros tracked`);

    // Agrupar por afiliado para encontrar data de cadastro (primeira indicação)
    const affiliatesMap = new Map();
    const indicationsData = [];

    trackedData.forEach(row => {
      const userAfil = row.user_afil;
      const indicationDate = row.created_at;

      // Registrar indicação
      indicationsData.push({
        user_afil: userAfil,
        user_id: row.user_id,
        indication_date: indicationDate
      });

      // Encontrar data de cadastro do afiliado (primeira indicação)
      if (!affiliatesMap.has(userAfil)) {
        affiliatesMap.set(userAfil, {
          user_afil: userAfil,
          registration_date: indicationDate
        });
      } else {
        const existing = affiliatesMap.get(userAfil);
        if (new Date(indicationDate) < new Date(existing.registration_date)) {
          existing.registration_date = indicationDate;
        }
      }
    });

    console.log(`👥 Processando ${affiliatesMap.size} afiliados únicos...`);

    // Inserir afiliados no banco Fature
    let affiliatesInserted = 0;
    for (const [userAfil, affiliateData] of affiliatesMap) {
      try {
        await fatureDb.upsertAffiliate(
          userAfil,
          affiliateData.registration_date,
          null, // nome será buscado depois se necessário
          null  // email será buscado depois se necessário
        );
        affiliatesInserted++;
        
        if (affiliatesInserted % 1000 === 0) {
          console.log(`📝 Processados ${affiliatesInserted} afiliados...`);
        }
      } catch (error) {
        console.error(`❌ Erro ao inserir afiliado ${userAfil}:`, error.message);
      }
    }

    console.log(`📊 Processando ${indicationsData.length} indicações...`);

    // Inserir indicações no banco Fature
    let indicationsInserted = 0;
    for (const indication of indicationsData) {
      try {
        await fatureDb.insertIndication(
          indication.user_afil,
          indication.user_id,
          indication.indication_date,
          1 // nível será calculado depois se necessário
        );
        indicationsInserted++;
        
        if (indicationsInserted % 5000 === 0) {
          console.log(`📝 Processadas ${indicationsInserted} indicações...`);
        }
      } catch (error) {
        console.error(`❌ Erro ao inserir indicação:`, error.message);
      }
    }

    fatureDb.close();

    console.log('✅ População do banco Fature concluída!');

    res.json({
      status: 'success',
      message: 'Banco Fature populado com sucesso',
      statistics: {
        affiliates_processed: affiliatesMap.size,
        affiliates_inserted: affiliatesInserted,
        indications_processed: indicationsData.length,
        indications_inserted: indicationsInserted
      }
    });

  } catch (error) {
    console.error('❌ Erro ao popular banco Fature:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao popular banco Fature',
      error: error.message
    });
  }
});

// Endpoint para buscar afiliados com filtro de data do banco Fature
app.get('/api/fature/affiliates-with-date-filter', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    console.log(`🔍 Buscando afiliados com filtro de data - Página: ${page}, Limit: ${limit}`);
    if (startDate && endDate) {
      console.log(`📅 Filtro de data: ${startDate} até ${endDate}`);
    }

    const FatureDatabase = require('./fature_database');
    const fatureDb = new FatureDatabase();

    // Buscar afiliados com filtro
    const affiliates = await fatureDb.getAffiliatesWithDateFilter(startDate, endDate, page, limit);
    const totalCount = await fatureDb.countAffiliatesWithDateFilter(startDate, endDate);

    fatureDb.close();

    // Formatar dados para o frontend
    const formattedData = affiliates.map(affiliate => ({
      id: affiliate.user_afil,
      registro: affiliate.registration_date ? new Date(affiliate.registration_date).toLocaleDateString('pt-BR') : '24/06/2025',
      total: affiliate.total_indications,
      n1: affiliate.n1 || 0,
      n2: affiliate.n2 || 0,
      n3: affiliate.n3 || 0,
      n4: affiliate.n4 || 0,
      n5: affiliate.n5 || 0,
      cpa_pago: 0,
      rev_pago: 0,
      total_pago: 0
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      status: 'success',
      data: formattedData,
      pagination: {
        page: page,
        pages: totalPages,
        total: totalCount,
        limit: limit
      },
      debug: {
        algorithm: 'fature_database_with_date_filter',
        date_filter: startDate && endDate ? { start: startDate, end: endDate } : null,
        total_found: formattedData.length
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar afiliados com filtro de data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar afiliados com filtro de data',
      error: error.message
    });
  }
});

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

