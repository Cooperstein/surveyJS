const surveyJson = {
    elements: [{
      name: "FirstName",
      title: "Enter your first name:",
      type: "text"
    }, {
      name: "LastName",
      title: "Enter your last name:",
      type: "text"
    }, {
      name: "satisfaction-score",
      title: "How satisfied are you with our service?",
      type: "rating",
      rateMin: 1,
      rateMax: 5,
      minRateDescription: "Not Satisfied",
      maxRateDescription: "Very Satisfied"
    }]
  };
  
  async function sendDataToServer(survey) {
    await fetch('/api/save-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey.data)
    });
  }
  
  const survey = new Survey.Model(surveyJson);
  survey.onComplete.add(sendDataToServer);
  $("#surveyContainer").Survey({ model: survey });