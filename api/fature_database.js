const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco de dados SQLite
const dbPath = path.join(__dirname, 'fature_database.sqlite');

class FatureDatabase {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  // Inicializar tabelas necessárias
  initializeTables() {
    // Tabela para armazenar informações dos afiliados
    const createAffiliatesTable = `
      CREATE TABLE IF NOT EXISTS affiliates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_afil INTEGER UNIQUE NOT NULL,
        registration_date DATETIME,
        name TEXT,
        email TEXT,
        total_indications INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tabela para armazenar indicações com datas
    const createIndicationsTable = `
      CREATE TABLE IF NOT EXISTS indications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        affiliate_id INTEGER NOT NULL,
        user_afil INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        indication_date DATETIME NOT NULL,
        level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
      )
    `;

    // Índices para melhor performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_affiliates_user_afil ON affiliates(user_afil)',
      'CREATE INDEX IF NOT EXISTS idx_indications_affiliate_id ON indications(affiliate_id)',
      'CREATE INDEX IF NOT EXISTS idx_indications_date ON indications(indication_date)',
      'CREATE INDEX IF NOT EXISTS idx_indications_user_afil ON indications(user_afil)'
    ];

    this.db.serialize(() => {
      this.db.run(createAffiliatesTable);
      this.db.run(createIndicationsTable);
      
      createIndexes.forEach(indexQuery => {
        this.db.run(indexQuery);
      });
    });

    console.log('✅ Banco de dados Fature inicializado');
  }

  // Inserir ou atualizar afiliado
  upsertAffiliate(userAfil, registrationDate, name = null, email = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO affiliates (user_afil, registration_date, name, email, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_afil) DO UPDATE SET
          registration_date = COALESCE(excluded.registration_date, registration_date),
          name = COALESCE(excluded.name, name),
          email = COALESCE(excluded.email, email),
          updated_at = CURRENT_TIMESTAMP
      `;

      this.db.run(query, [userAfil, registrationDate, name, email], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Inserir indicação
  insertIndication(userAfil, userId, indicationDate, level = 1) {
    return new Promise((resolve, reject) => {
      // Primeiro buscar o affiliate_id
      this.db.get('SELECT id FROM affiliates WHERE user_afil = ?', [userAfil], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const affiliateId = row ? row.id : null;
        
        const query = `
          INSERT INTO indications (affiliate_id, user_afil, user_id, indication_date, level)
          VALUES (?, ?, ?, ?, ?)
        `;

        this.db.run(query, [affiliateId, userAfil, userId, indicationDate, level], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      });
    });
  }

  // Buscar afiliados com filtro de data
  getAffiliatesWithDateFilter(startDate = null, endDate = null, page = 1, limit = 20) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let params = [];

      if (startDate && endDate) {
        whereClause = 'WHERE i.indication_date BETWEEN ? AND ?';
        params = [startDate, endDate];
      }

      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          a.user_afil,
          a.registration_date,
          a.name,
          COUNT(i.id) as total_indications,
          COUNT(CASE WHEN i.level = 1 THEN 1 END) as n1,
          COUNT(CASE WHEN i.level = 2 THEN 1 END) as n2,
          COUNT(CASE WHEN i.level = 3 THEN 1 END) as n3,
          COUNT(CASE WHEN i.level = 4 THEN 1 END) as n4,
          COUNT(CASE WHEN i.level = 5 THEN 1 END) as n5
        FROM affiliates a
        LEFT JOIN indications i ON a.user_afil = i.user_afil ${whereClause}
        GROUP BY a.user_afil, a.registration_date, a.name
        HAVING total_indications > 0
        ORDER BY total_indications DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Contar total de afiliados com filtro
  countAffiliatesWithDateFilter(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let params = [];

      if (startDate && endDate) {
        whereClause = 'WHERE i.indication_date BETWEEN ? AND ?';
        params = [startDate, endDate];
      }

      const query = `
        SELECT COUNT(DISTINCT a.user_afil) as total
        FROM affiliates a
        LEFT JOIN indications i ON a.user_afil = i.user_afil ${whereClause}
        WHERE EXISTS (
          SELECT 1 FROM indications i2 
          WHERE i2.user_afil = a.user_afil ${whereClause.replace('i.', 'i2.')}
        )
      `;

      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
  }

  // Fechar conexão
  close() {
    this.db.close();
  }
}

module.exports = FatureDatabase;

