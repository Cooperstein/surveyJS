// Import required libraries
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

// --- Express App Setup ---
const app = express();
const PORT = 3000;

// --- PostgreSQL Connection Setup ---
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: 5432,
});

// --- Function to Create Table ---
const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS survey_results (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      satisfaction_score INTEGER,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );`;
  try {
    await pool.query(createTableQuery);
    console.log('Table "survey_results" is ready.');
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
};

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint ---
app.post('/api/save-survey', async (req, res) => {
  const { FirstName, LastName, 'satisfaction-score': satisfactionScore } = req.body;
  const insertQuery = `
    INSERT INTO survey_results (first_name, last_name, satisfaction_score)
    VALUES ($1, $2, $3)
    RETURNING id;`;
  try {
    const result = await pool.query(insertQuery, [FirstName, LastName, satisfactionScore]);
    console.log(`Successfully saved survey with ID: ${result.rows[0].id}`);
    res.status(201).json({ message: 'Survey data saved successfully!' });
  } catch (error) {
    console.error('Error saving to PostgreSQL:', error);
    res.status(500).json({ message: 'Error saving survey data.' });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  createTable();
});