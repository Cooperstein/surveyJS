// Import required libraries
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
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

// --- Function to Create Database Table on Startup ---
const createTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS survey_results (
      id SERIAL PRIMARY KEY,
      survey_name VARCHAR(100),
      survey_language VARCHAR(10),
      survey_data JSONB,
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

// --- Routes ---

// Catch-all route to serve the main HTML file for any survey path
app.get('/survey/:surveyName/:lang', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to dynamically get a survey definition JSON file
app.get('/api/surveys/:surveyName/:lang', async (req, res) => {
  try {
    const { surveyName, lang } = req.params;
    const filePath = path.join(__dirname, 'surveys', surveyName, `${lang}.json`);
    
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error(`Survey not found: ${req.path}`, error.code);
    res.status(404).json({ message: 'The requested survey could not be found.' });
  }
});

// API endpoint to save completed survey results
app.post('/api/save-survey', async (req, res) => {
  const { survey_name, survey_language, survey_data } = req.body;

  const insertQuery = `
    INSERT INTO survey_results (survey_name, survey_language, survey_data)
    VALUES ($1, $2, $3)
    RETURNING id;`;
  try {
    const result = await pool.query(insertQuery, [survey_name, survey_language, survey_data]);
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