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

