import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'db.json');
const seedPath = path.join(__dirname, 'db_seed.json');

// Create a seed file on startup if it doesn't exist
if (fs.existsSync(dbPath) && !fs.existsSync(seedPath)) {
  fs.copyFileSync(dbPath, seedPath);
}

// Helper to read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return null;
  }
};

// Helper to write DB
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
};

// GET entire DB
app.get('/api/db', (req, res) => {
  const db = readDB();
  if (db) {
    res.json(db);
  } else {
    res.status(500).json({ error: "Database read failed" });
  }
});

// POST save entire DB (Admin backup/sync)
app.post('/api/save', (req, res) => {
  const success = writeDB(req.body);
  if (success) {
    res.json({ success: true, message: "Database saved successfully" });
  } else {
    res.status(500).json({ error: "Database write failed" });
  }
});

// POST reset DB to seed values
app.post('/api/reset', (req, res) => {
  try {
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, dbPath);
      const db = readDB();
      res.json({ success: true, message: "Database reset successful", db });
    } else {
      res.status(500).json({ error: "Seed database not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Reset failed", details: err.message });
  }
});

// POST create/update apartment
app.post('/api/apartments', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const newApt = req.body;
  const existingIdx = db.apartments.findIndex(a => a.id === newApt.id);
  
  if (existingIdx !== -1) {
    db.apartments[existingIdx] = newApt;
  } else {
    db.apartments.push(newApt);
  }

  writeDB(db);
  res.json({ success: true, apartment: newApt });
});

// POST create/update resident
app.post('/api/residents', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const resident = req.body;
  const existingIdx = db.residents.findIndex(r => r.id === resident.id);
  
  if (existingIdx !== -1) {
    db.residents[existingIdx] = { ...db.residents[existingIdx], ...resident };
  } else {
    db.residents.push(resident);
  }

  writeDB(db);
  res.json({ success: true, resident });
});

// POST change resident password
app.post('/api/residents/change-password', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const { id, password } = req.body;
  const resident = db.residents.find(r => r.id === id);

  if (!resident) {
    return res.status(404).json({ error: "Resident not found" });
  }

  resident.password = password;
  resident.isPasswordChanged = true;

  writeDB(db);
  res.json({ success: true, resident });
});

// POST add transaction
app.post('/api/transactions', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const transaction = req.body;
  db.transactions.unshift(transaction); // Add to beginning

  writeDB(db);
  res.json({ success: true, transaction });
});

// GET active polls
app.get('/api/polls', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });
  res.json(db.polls || []);
});

// POST create poll
app.post('/api/polls', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const newPoll = req.body;
  if (!db.polls) db.polls = [];
  
  const idx = db.polls.findIndex(p => p.id === newPoll.id);
  if (idx !== -1) {
    db.polls[idx] = newPoll;
  } else {
    db.polls.unshift(newPoll);
  }

  writeDB(db);
  res.json({ success: true, poll: newPoll });
});

// POST vote on a poll
app.post('/api/polls/:id/vote', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const { id } = req.params;
  const { residentId, option } = req.body;

  if (!db.polls) db.polls = [];
  const poll = db.polls.find(p => p.id === id);

  if (!poll) {
    return res.status(404).json({ error: "Poll not found" });
  }

  if (!poll.votes) poll.votes = {};
  poll.votes[residentId] = option;

  writeDB(db);
  res.json({ success: true, poll });
});

// GET all tickets (Arıza kayıtları)
app.get('/api/tickets', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });
  res.json(db.tickets || []);
});

// POST create ticket (Sakin açar)
app.post('/api/tickets', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const newTicket = req.body;
  if (!db.tickets) db.tickets = [];
  
  db.tickets.unshift(newTicket);

  writeDB(db);
  res.json({ success: true, ticket: newTicket });
});

// PUT update ticket status/assignee (Admin günceller)
app.put('/api/tickets/:id', (req, res) => {
  const db = readDB();
  if (!db) return res.status(500).json({ error: "DB read error" });

  const { id } = req.params;
  const updatedFields = req.body;

  if (!db.tickets) db.tickets = [];
  const ticketIdx = db.tickets.findIndex(t => t.id === id);

  if (ticketIdx === -1) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  db.tickets[ticketIdx] = {
    ...db.tickets[ticketIdx],
    ...updatedFields
  };

  writeDB(db);
  res.json({ success: true, ticket: db.tickets[ticketIdx] });
});

app.listen(PORT, () => {
  console.log(`AtibayCRM local API backend is running on http://localhost:${PORT}`);
});
