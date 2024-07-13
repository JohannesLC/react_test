// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE contacts (name TEXT, email TEXT, message TEXT)");
});

// Route to handle form submission
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  const stmt = db.prepare("INSERT INTO contacts VALUES (?, ?, ?)");
  stmt.run(name, email, message, (err) => {
    if (err) {
      res.status(500).send("Error inserting data");
    } else {
      res.status(200).send("Data inserted successfully");
    }
  });
  stmt.finalize();
});


app.get('/api/contacts', (req, res) => {
    db.all("SELECT * FROM contacts", [], (err, rows) => {
      if (err) {
        res.status(500).send("Error retrieving data");
      } else {
        res.json(rows);
      }
    });
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
