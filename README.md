# 📧 AI-Powered Email Assistant

An intelligent email client that helps you generate, edit, and send professional email responses using AI. It also predicts possible replies to your emails, making communication faster and more efficient.

---

## ✨ Features

- **Multi-Provider Support** – Works with Gmail and Outlook  
- **AI-Generated Responses** – Automatically generates professional email replies  
- **Response Prediction** – Predicts possible replies to your emails with probabilities  
- **Emotion Analysis** – Detects the emotional tone of incoming emails  
- **Edit & Send** – Customize AI-generated responses before sending  
- **Clean UI** – Intuitive interface with a modern design

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Python (Flask)  
- **AI Models**: Ollama (Mistral)
- **ML Models**: Random forest (Sentiment Analysis)   
- **Email Protocols**: IMAP (fetching), SMTP (sending)

---

## 🚀 Setup & Installation

### Prerequisites

- Python 3.8 or higher  
- [Ollama](https://ollama.com) installed and running (`ollama pull mistral`)  
- Node.js (optional – for frontend tooling)

### Steps

1. **Clone the repository**

    ```
    git clone https://github.com/your-username/email-assistant.git
    cd email-assistant
    ```

2. **Create and activate a virtual environment**

    ```
    python -m venv venv
    source venv/bin/activate      # for Linux/Mac
    venv\Scripts\activate         # for Windows
    ```

3. **Install dependencies**

    ```
    pip install -r requirements.txt
    ```

4. **Set up environment variables**

    Copy the example file:

    ```
    cp .env.example .env
    ```

    Then edit `.env` and fill in your credentials (use App Password for Gmail):

    ```
    SECRET_KEY=your-secret-key-here
    GMAIL_EMAIL=your-email@gmail.com
    GMAIL_PASSWORD=your-app-password
    ```

5. **Run the Flask server**

    ```
    python app.py
    ```

6. **Open your browser**

    Navigate to `http://localhost:5000`

---

## 📖 Usage Guide

1. **Select Email Provider**  
   Choose between Gmail or Outlook.

2. **Log In**  
   - Gmail: Enter your email and app password  
   - Outlook: Enter your email address

3. **View Emails**  
   Your inbox displays the latest emails.

4. **Generate Response**  
   Click an email → click “Generate Response” to get AI-generated reply.

5. **View Predictions**  
   Shows likely replies the recipient might send.

6. **Edit & Send**  
   Review and modify the response → click “Send Response”

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

### Steps

1. Fork the repository  
2. Create a new branch: `git checkout -b feature-branch`  
3. Commit your changes: `git commit -m "Add feature"`  
4. Push to GitHub: `git push origin feature-branch`  
5. Open a Pull Request


