package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	_ "github.com/lib/pq"
)

const PORT = 3000

var (
	db *sql.DB
	sc *securecookie.SecureCookie
)

// Counterbalancing setup
var (
	feedbackSurveys = []string{"customer-feedback-a", "customer-feedback-b"}
	nextFeedbackIndex = 0
	pollSurveys = []string{"new-feature-poll-a", "new-feature-poll-b"}
	nextPollIndex = 0
	employeeSurveys = []string{"employee-satisfaction-a", "employee-satisfaction-b"}
	nextEmployeeIndex = 0
	
	feedbackMutex sync.Mutex
	pollMutex sync.Mutex
	employeeMutex sync.Mutex
)

func createTables() error {
	createResultsTable := `
		CREATE TABLE IF NOT EXISTS survey_results (
			id SERIAL PRIMARY KEY,
			survey_name VARCHAR(100),
			survey_language VARCHAR(10),
			survey_data JSONB,
			submitted_at TIMESTAMPTZ DEFAULT NOW()
		);`
	
	createImpressionsTable := `
		CREATE TABLE IF NOT EXISTS survey_impressions (
			id SERIAL PRIMARY KEY,
			survey_name VARCHAR(100),
			survey_language VARCHAR(10),
			impression_time TIMESTAMPTZ DEFAULT NOW()
		);`
	
	_, err := db.Exec(createResultsTable)
	if err != nil {
		return fmt.Errorf("error creating results table: %v", err)
	}
	
	_, err = db.Exec(createImpressionsTable)
	if err != nil {
		return fmt.Errorf("error creating impressions table: %v", err)
	}
	
	log.Println("Database tables created successfully")
	return nil
}

func logImpression(surveyName, surveyLanguage string) error {
	query := `INSERT INTO survey_impressions (survey_name, survey_language) VALUES ($1, $2)`
	_, err := db.Exec(query, surveyName, surveyLanguage)
	if err != nil {
		return fmt.Errorf("error logging impression: %v", err)
	}
	log.Printf("Logged impression for: %s in %s", surveyName, surveyLanguage)
	return nil
}

func getNextSurvey(surveys []string, currentIndex *int, mutex *sync.Mutex) string {
	mutex.Lock()
	defer mutex.Unlock()
	
	survey := surveys[*currentIndex]
	*currentIndex = (*currentIndex + 1) % len(surveys)
	return survey
}

func feedbackHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lang := vars["lang"]
	if lang == "" {
		lang = "en"
	}
	
	cookieName := fmt.Sprintf("feedbackAssignment-%s", lang)
	cookie, err := r.Cookie(cookieName)
	
	if err == nil && cookie.Value != "" {
		http.Redirect(w, r, fmt.Sprintf("/survey/%s/%s", cookie.Value, lang), http.StatusSeeOther)
		return
	}
	
	assignedSurvey := getNextSurvey(feedbackSurveys, &nextFeedbackIndex, &feedbackMutex)
	
	if err := logImpression(assignedSurvey, lang); err != nil {
		log.Printf("Error logging impression: %v", err)
	}
	
	encoded, _ := sc.Encode(cookieName, assignedSurvey)
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    encoded,
		MaxAge:   900,
		HttpOnly: true,
		Path:     "/",
	})
	
	http.Redirect(w, r, fmt.Sprintf("/survey/%s/%s", assignedSurvey, lang), http.StatusSeeOther)
}

func pollHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lang := vars["lang"]
	if lang == "" {
		lang = "en"
	}
	
	cookieName := fmt.Sprintf("pollAssignment-%s", lang)
	cookie, err := r.Cookie(cookieName)
	
	if err == nil && cookie.Value != "" {
		http.Redirect(w, r, fmt.Sprintf("/survey/%s/%s", cookie.Value, lang), http.StatusSeeOther)
		return
	}
	
	assignedSurvey := getNextSurvey(pollSurveys, &nextPollIndex, &pollMutex)
	
	if err := logImpression(assignedSurvey, lang); err != nil {
		log.Printf("Error logging impression: %v", err)
	}
	
	encoded, _ := sc.Encode(cookieName, assignedSurvey)
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    encoded,
		MaxAge:   900,
		HttpOnly: true,
		Path:     "/",
	})
	
	http.Redirect(w, r, fmt.Sprintf("/survey/%s/%s", assignedSurvey, lang), http.StatusSeeOther)
}

func employeeHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lang := vars["lang"]
	if lang == "" {
		lang = "en"
	}
	
	cookieName := fmt.Sprintf("employeeSurveyAssignment-%s", lang)
	cookie, err := r.Cookie(cookieName)
	
	if err == nil && cookie.Value != "" {
		http.Redirect(w, r, fmt.Sprintf("/survey/%s/%s", cookie.Value, lang), http.StatusSeeOther)
		return
	}
	
	assignedSurvey := getNextSurvey(employeeSurveys, &nextEmployeeIndex, &employeeMutex)
	
	if err := logImpression(assignedSurvey, lang); err != nil {
		log.Printf("Error logging impression: %v", err)
	}
	
	encoded, _ := sc.Encode(cookieName, assignedSurvey)
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    encoded,
		MaxAge:   900,
		HttpOnly: true,
		Path:     "/",
	})
	
	http.Redirect(w, r, fmt.Sprintf("/survey/%s/%s", assignedSurvey, lang), http.StatusSeeOther)
}

func surveyHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "src/public/index.html")
}

func getSurveyHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	surveyName := vars["surveyName"]
	lang := vars["lang"]
	
	filePath := filepath.Join("src", "surveys", surveyName, fmt.Sprintf("%s.json", lang))
	
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "Survey not found", http.StatusNotFound)
		return
	}
	
	http.ServeFile(w, r, filePath)
}

func saveSurveyHandler(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		SurveyName     string          `json:"survey_name"`
		SurveyLanguage string          `json:"survey_language"`
		SurveyData     json.RawMessage `json:"survey_data"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	query := `
		INSERT INTO survey_results (survey_name, survey_language, survey_data)
		VALUES ($1, $2, $3)
		RETURNING id;`
	
	var id int
	err := db.QueryRow(query, requestBody.SurveyName, requestBody.SurveyLanguage, requestBody.SurveyData).Scan(&id)
	if err != nil {
		log.Printf("Error saving survey: %v", err)
		http.Error(w, "Error saving survey data", http.StatusInternalServerError)
		return
	}
	
	log.Printf("Survey saved with ID: %d", id)
	
	response := map[string]string{"message": "Survey saved successfully!"}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy", "service": "surveyjs-go"})
}

func main() {
	log.Println("Starting SurveyJS Go Backend...")
	
	// Initialize secure cookie
	sc = securecookie.New([]byte("your-secret-key"), nil)
	
	// Database connection
	connStr := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"))
	
	log.Printf("Connecting to database: %s@%s/%s", 
		os.Getenv("POSTGRES_USER"), 
		os.Getenv("POSTGRES_HOST"), 
		os.Getenv("POSTGRES_DB"))
	
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error opening database:", err)
	}
	defer db.Close()
	
	// Test connection
	if err = db.Ping(); err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	log.Println("Database connection successful")
	
	// Create tables
	if err = createTables(); err != nil {
		log.Fatal("Error creating tables:", err)
	}
	
	// Setup router
	r := mux.NewRouter()
	
	// Health check
	r.HandleFunc("/health", healthHandler).Methods("GET")
	
	// API routes
	r.HandleFunc("/feedback/{lang:[a-z]{2}}", feedbackHandler).Methods("GET")
	r.HandleFunc("/feedback", feedbackHandler).Methods("GET")
	r.HandleFunc("/poll/{lang:[a-z]{2}}", pollHandler).Methods("GET")
	r.HandleFunc("/poll", pollHandler).Methods("GET")
	r.HandleFunc("/employee/{lang:[a-z]{2}}", employeeHandler).Methods("GET")
	r.HandleFunc("/employee", employeeHandler).Methods("GET")
	r.HandleFunc("/survey/{surveyName}/{lang}", surveyHandler).Methods("GET")
	r.HandleFunc("/api/surveys/{surveyName}/{lang}", getSurveyHandler).Methods("GET")
	r.HandleFunc("/api/save-survey", saveSurveyHandler).Methods("POST")
	
	// Static files
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("src/public")))
	
	log.Printf("Server starting on port %d", PORT)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", PORT), r))
}
