📧 AI-Powered Email Assistant
An intelligent email client that helps you generate, edit, and send professional email responses using AI. It also predicts possible replies to your emails, making communication faster and more efficient.

✨ Features
Multi-Provider Support: Works with Gmail and Outlook

AI-Generated Responses: Automatically generates professional email replies

Response Prediction: Predicts possible replies to your emails with probabilities

Emotion Analysis: Detects the emotional tone of incoming emails

Edit & Send: Customize AI-generated responses before sending

Clean UI: Intuitive interface with a modern design

🛠️ Tech Stack
Frontend: HTML, CSS, JavaScript

Backend: Python (Flask)

AI Models: Ollama (Mistral) for response generation and prediction

Ml Models: Sentiment Analysis using RF

Email Protocols: IMAP (for fetching), SMTP (for sending)

🚀 Setup & Installation
Prerequisites
Python 3.8+

Ollama installed and running (ollama pull mistral)

Node.js (optional, for frontend tooling)

Steps
Clone the repository:
git clone https://github.com/your-username/email-assistant.git
cd email-assistant

Set up a Python virtual environment:
python -m venv venv
source venv/bin/activate (for Linux/Mac)
venv\Scripts\activate (for Windows)

Install dependencies:
pip install -r requirements.txt

Create a .env file by copying the example:
cp .env.example .env

Edit the .env file with your email credentials (for Gmail, use an App Password).

Start the Flask server:
python app.py

Open your browser and navigate to:
http://localhost:5000

📖 Usage Guide
Select Your Email Provider: Choose between Gmail or Outlook

Log In:

For Gmail: Enter your email and app password

For Outlook: Enter your email address

View Emails: See your most recent emails in the inbox

Generate a Response: Click on an email, then click "Generate Response"

View Predictions: See predicted replies for the current response

Edit & Send: Make final edits to the response and click "Send Response"

🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.

Steps to Contribute:

Fork the repository

Create a new branch
git checkout -b feature-branch

Commit your changes
git commit -m "Add new feature"

Push to your branch
git push origin feature-branch

Open a pull request
