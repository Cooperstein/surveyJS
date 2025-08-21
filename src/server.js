// Import required libraries
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');

// --- Express App Setup ---
const app = express();
const PORT = 3000;

// --- Counterbalancing Setup ---
const feedbackSurveys = ['customer-feedback-a', 'customer-feedback-b'];
let nextFeedbackIndex = 0;
const pollSurveys = ['new-feature-poll-a', 'new-feature-poll-b'];
let nextPollIndex = 0;
const employeeSurveys = ['employee-satisfaction-a', 'employee-satisfaction-b'];
let nextEmployeeIndex = 0;

// --- PostgreSQL Connection Setup ---
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  port: 5432,
});

// --- Function to Create Tables ---
const createTables = async () => {
  const createResultsTableQuery = `
    CREATE TABLE IF NOT EXISTS survey_results (
      id SERIAL PRIMARY KEY,
      survey_name VARCHAR(100),
      survey_language VARCHAR(10),
      survey_data JSONB,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );`;
  const createImpressionsTableQuery = `
    CREATE TABLE IF NOT EXISTS survey_impressions (
      id SERIAL PRIMARY KEY,
      survey_name VARCHAR(100),
      survey_language VARCHAR(10),
      impression_time TIMESTAMPTZ DEFAULT NOW()
    );`;
  try {
    await pool.query(createResultsTableQuery);
    await pool.query(createImpressionsTableQuery);
    console.log('Database tables are ready.');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helper function to log impressions ---
async function logImpression(surveyName, surveyLanguage) {
  try {
    const insertImpressionQuery = 'INSERT INTO survey_impressions (survey_name, survey_language) VALUES ($1, $2)';
    await pool.query(insertImpressionQuery, [surveyName, surveyLanguage]);
    console.log(`Logged impression for: ${surveyName} in ${surveyLanguage}`);
  } catch (error) {
    console.error('Error logging impression:', error);
  }
}

// --- Routes ---

// Route for the Customer Feedback A/B test
app.get('/feedback/:lang?', async (req, res) => {
  const lang = req.params.lang || 'en';
  const cookieName = `feedbackAssignment-${lang}`;
  if (req.cookies[cookieName]) {
    res.redirect(`/survey/${req.cookies[cookieName]}/${lang}`);
  } else {
    const assignedSurvey = feedbackSurveys[nextFeedbackIndex];
    nextFeedbackIndex = (nextFeedbackIndex + 1) % feedbackSurveys.length;
    await logImpression(assignedSurvey, lang); // <-- FIX APPLIED HERE
    res.cookie(cookieName, assignedSurvey, { maxAge: 900000, httpOnly: true });
    res.redirect(`/survey/${assignedSurvey}/${lang}`);
  }
});

// Route for the New Feature Poll A/B test
app.get('/poll/:lang?', async (req, res) => {
  const lang = req.params.lang || 'en';
  const cookieName = `pollAssignment-${lang}`;
  if (req.cookies[cookieName]) {
    res.redirect(`/survey/${req.cookies[cookieName]}/${lang}`);
  } else {
    const assignedSurvey = pollSurveys[nextPollIndex];
    nextPollIndex = (nextPollIndex + 1) % pollSurveys.length;
    await logImpression(assignedSurvey, lang); // <-- FIX APPLIED HERE
    res.cookie(cookieName, assignedSurvey, { maxAge: 900000, httpOnly: true });
    res.redirect(`/survey/${assignedSurvey}/${lang}`);
  }
});

// Route for EMPLOYEES
app.get('/employee/:lang?', async (req, res) => {
  const lang = req.params.lang || 'en';
  const cookieName = `employeeSurveyAssignment-${lang}`;
  if (req.cookies[cookieName]) {
    res.redirect(`/survey/${req.cookies[cookieName]}/${lang}`);
  } else {
    const assignedSurvey = employeeSurveys[nextEmployeeIndex];
    nextEmployeeIndex = (nextEmployeeIndex + 1) % employeeSurveys.length;
    await logImpression(assignedSurvey, lang); // <-- FIX APPLIED HERE
    res.cookie(cookieName, assignedSurvey, { maxAge: 900000, httpOnly: true });
    res.redirect(`/survey/${assignedSurvey}/${lang}`);
  }
});

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
  createTables();
});