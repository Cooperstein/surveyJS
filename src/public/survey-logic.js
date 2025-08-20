// This main function runs as soon as the page loads
async function loadAndRenderSurvey() {
  try {
    // 1. Get the path from the browser's URL, e.g., "/survey/customer-feedback/es"
    const path = window.location.pathname;
    // Split the path into parts: ["", "survey", "customer-feedback", "es"]
    const pathParts = path.split('/');

    // 2. Validate the URL and extract the survey name and language
    if (pathParts.length < 4 || pathParts[1] !== 'survey') {
      throw new Error("Invalid survey URL. It should be in the format /survey/survey-name/language.");
    }
    const surveyName = pathParts[2];
    const language = pathParts[3];

    // 3. Fetch the correct survey JSON from our backend API
    const response = await fetch(`/api/surveys/${surveyName}/${language}`);
    if (!response.ok) {
      throw new Error(`Survey not found. The server responded with a ${response.status} error.`);
    }
    const surveyJson = await response.json();

    // 4. This function sends the completed survey data back to the server
    async function sendDataToServer(survey) {
      const surveyResult = {
        survey_name: surveyName,
        survey_language: language,
        survey_data: survey.data
      };
      await fetch('/api/save-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyResult)
      });
      // Show a thank you message upon completion
      document.getElementById('surveyContainer').innerHTML = '<h1>Thank you for your feedback!</h1>';
    }

    // 5. Create and render the SurveyJS survey model
    const survey = new Survey.Model(surveyJson);
    survey.onComplete.add(sendDataToServer);
    $("#surveyContainer").Survey({ model: survey });

  } catch (error) {
    // 6. If anything goes wrong, display an error message
    console.error('Failed to load survey:', error);
    document.getElementById('surveyContainer').innerHTML = `<h2>Sorry, this survey could not be loaded.</h2><p>${error.message}</p>`;
  }
}

// Run the main function
loadAndRenderSurvey();