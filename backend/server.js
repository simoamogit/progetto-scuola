const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Inizializza il database SQLite
const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) {
    console.error("Errore nell'apertura del database", err.message);
  } else {
    console.log("Database collegato con successo!");
    db.run(`CREATE TABLE IF NOT EXISTS verifiche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      materia TEXT,
      data TEXT,
      ora TEXT,
      descrizione TEXT
    )`);
  }
});

// Endpoint per aggiungere una verifica
app.post('/verifiche', (req, res) => {
  const { materia, data, ora, descrizione } = req.body;
  const query = `INSERT INTO verifiche (materia, data, ora, descrizione) VALUES (?, ?, ?, ?)`;
  db.run(query, [materia, data, ora, descrizione], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, materia, data, ora, descrizione });
  });
});

// Endpoint per ottenere tutte le verifiche
app.get('/verifiche', (req, res) => {
  db.all("SELECT * FROM verifiche", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// In production, serve il frontend statico
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});