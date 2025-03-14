const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Configurazione della connessione al database PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Funzione per creare la tabella se non esiste
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verifiche (
        id SERIAL PRIMARY KEY,
        materia TEXT NOT NULL,
        data DATE NOT NULL,
        ora TIME NOT NULL,
        descrizione TEXT
      )
    `);
    console.log("✅ Tabella 'verifiche' pronta!");
  } catch (err) {
    console.error("❌ Errore nella creazione della tabella:", err.message);
  }
};

// Creazione tabella all'avvio
createTable();

// Endpoint per aggiungere una verifica
app.post('/verifiche', async (req, res) => {
  const { materia, data, ora, descrizione } = req.body;
  
  if (!materia || !data || !ora) {
    return res.status(400).json({ error: "Materia, data e ora sono obbligatori." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO verifiche (materia, data, ora, descrizione) VALUES ($1, $2, $3, $4) RETURNING *',
      [materia, data, ora, descrizione]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Errore nell'inserimento:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint per ottenere tutte le verifiche
app.get('/verifiche', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM verifiche ORDER BY data, ora');
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Errore nella query:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Servire il frontend statico in produzione
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
});