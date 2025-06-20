// Endpoint para verificar dados da tabela tracked
app.get('/api/database/tracked-info', async (req, res) => {
  try {
    console.log('🔍 Verificando informações da tabela tracked...');

    // Query para contar TODOS os registros tracked
    const totalQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT user_afil) as unique_affiliates,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as oldest_record,
        MAX(created_at) as newest_record
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
        tracked_type_id,
        created_at
      FROM tracked 
      WHERE tracked_type_id = 1 
        AND user_afil IS NOT NULL 
        AND user_id IS NOT NULL
      ORDER BY created_at DESC
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
        unique_users: parseInt(totalData.unique_users),
        oldest_record: totalData.oldest_record,
        newest_record: totalData.newest_record
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

