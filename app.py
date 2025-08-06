from flask import Flask, render_template, jsonify, request, url_for, redirect, session, flash
from flask_cors import CORS
from flask_session import Session
import asyncio
import os
from dotenv import load_dotenv
from functools import wraps
from datetime import timedelta, datetime
from services.email_fetcher import EmailFetcher
from services.email_sender import EmailSender
from services.response_generator import FastEmailResponseGenerator
import re
import secrets
import json
from services.response_predictor import ResponsePredictor
from textblob import TextBlob

load_dotenv()

# Generate a random secret key if not in .env
if not os.getenv('SECRET_KEY'):
    os.environ['SECRET_KEY'] = secrets.token_hex(16)

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.permanent_session_lifetime = timedelta(days=1)
Session(app)
CORS(app)

# Dictionary to store EmailFetcher instances
email_fetchers = {}

# Initialize services as None
email_fetcher = None
email_sender = None
response_generator = FastEmailResponseGenerator()

def init_email_services(email, password, provider):
    """Initialize email services with provided credentials"""
    global email_fetcher, email_sender
    
    if provider == 'gmail':
        email_fetcher = EmailFetcher(email, password)
        email_sender = EmailSender(email, password, provider='gmail')
    elif provider == 'outlook':
        email_fetcher = EmailFetcher(email, password, provider='outlook')
        email_sender = EmailSender(email, password, provider='outlook')
    
    return email_sender is not None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'email' not in session:
            print("No email in session, redirecting to login")
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    print(f"Accessing index page")
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    if request.is_json:
        data = request.json
        provider = data.get('provider')
        email = data.get('email')
        password = data.get('password')
    else:
        provider = request.form.get('provider')
        email = request.form.get('email')
        password = request.form.get('password')
    
    print(f"Login attempt with provider: {provider}, email: {email}")
    
    try:
        # Create a new EmailFetcher instance
        fetcher = EmailFetcher(email, password, provider)
        
        # Test the connection
        if not fetcher.test_connection():
            return jsonify({'success': False, 'error': 'Invalid credentials', 'message': f"Failed to connect to {provider}. Please check your credentials."})
        
        # Store the fetcher in our dictionary
        user_key = f"{email}_{provider}"
        email_fetchers[user_key] = fetcher
        
        if provider == 'gmail':
            if init_email_services(email, password, provider):
                session.permanent = True
                session['provider'] = provider
                session['email'] = email
                session['password'] = password
                session['logged_in'] = True
                print("Gmail login successful")
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': 'Failed to initialize email services'})
        elif provider == 'outlook':
            if init_email_services(email, password, provider):
                session.permanent = True
                session['provider'] = provider
                session['email'] = email
                session['password'] = password
                session['logged_in'] = True
                print("Outlook access granted with email:", email)
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': 'Failed to initialize email services'})
        else:
            return jsonify({'success': False, 'error': 'Invalid provider'})
    except Exception as e:
        import traceback
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e), 'message': f"Login failed: {str(e)}"})
    
response_predictor = ResponsePredictor()

@app.route('/predict-reply', methods=['POST'])
def predict_reply():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Authentication required'})
    
    data = request.json
    original_email = data.get('originalEmail', '')
    our_response = data.get('ourResponse', '')
    
    if not original_email or not our_response:
        return jsonify({
            'success': False, 
            'error': 'Both original email and our response are required'
        })
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        prediction = loop.run_until_complete(
            response_predictor.predict_reply(original_email, our_response)
        )
        loop.close()
        return jsonify({
            'success': True,
            'prediction': prediction
        })
    except Exception as e:
        print(f"Error predicting reply: {e}")
        loop.close()
        return jsonify({
            'success': False, 
            'error': str(e)
        })

@app.route('/fetch-emails')
def fetch_emails():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Authentication required', 'message': 'You are not logged in'})
    
    provider = session.get('provider')
    email = session.get('email')
    
    print(f"Fetching received emails...")
    
    # Get the stored fetcher using the unique key
    user_key = f"{email}_{provider}"
    fetcher = email_fetchers.get(user_key)
    
    # Check if we have a fetcher or fall back to global fetcher
    if fetcher:
        current_fetcher = fetcher
    elif email_fetcher:
        current_fetcher = email_fetcher
    else:
        print(f"Error: No EmailFetcher found for {user_key}")
        return jsonify({'success': False, 'error': 'Session expired. Please login again.', 'message': 'Session expired. Please login again.'})
    
    try:
        emails = current_fetcher.fetch_emails()
        print(f"Successfully fetched {len(emails)} received emails")
        return jsonify({'success': True, 'emails': emails})
    except Exception as e:
        print(f"Error fetching emails: {e}")
        return jsonify({'success': False, 'error': str(e), 'message': f"Failed to load emails: {str(e)}. Please try again later."})

@app.route('/generate-response', methods=['POST'])
def generate_response():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Authentication required'})
    
    data = request.json
    email_body = data.get('emailBody', '')
    
    if not email_body:
        return jsonify({'success': False, 'error': 'No email body provided'})
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        response = loop.run_until_complete(response_generator.generate_response(email_body))
        loop.close()
        return jsonify(response)
    except Exception as e:
        print(f"Error generating response: {e}")
        loop.close()
        return jsonify({'success': False, 'error': str(e)})

@app.route('/send-response', methods=['POST'])
def send_response():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Authentication required'})
    
    if not email_sender:
        provider = session.get('provider')
        email = session.get('email')
        password = session.get('password')
        
        if all([provider, email, password]):
            init_email_services(email, password, provider)
        
        if not email_sender:
            return jsonify({'success': False, 'error': 'Email sender not initialized'})
    
    data = request.json
    print("Received data in /send-response:", data)  # Debug log
    
    to_address = None
    if 'originalEmail' in data:
        original_email = data['originalEmail']
        print("Original email object:", original_email)  # Debug log
        
        # Try to extract the sender's email from the original email object
        to_address = original_email.get('sender_email')  # This is the key used in the fetched email data
        
        # If sender_email is not found, try to extract it from sender_raw
        if not to_address and 'sender_raw' in original_email:
            print("Extracting email from sender_raw:", original_email['sender_raw'])  # Debug log
            match = re.search(r'<([^>]+@[^>]+)>', original_email['sender_raw'])
            if match:
                to_address = match.group(1)
    
    if not to_address:
        to_address = data.get('to')
    
    print("Final to_address:", to_address)  # Debug log
    
    subject = data.get('subject', '')
    body = data.get('body', '')
    
    missing_fields = []
    if not to_address:
        missing_fields.append('to')
    if not subject:
        missing_fields.append('subject')
    if not body:
        missing_fields.append('body')
    
    if missing_fields:
        return jsonify({
            'success': False,
            'error': f"Missing required fields: {', '.join(missing_fields)}"
        })
    
    try:
        print(f"Attempting to send email to: {to_address}")
        success, message = email_sender.send_email(
            to=to_address,
            subject=subject,
            body=body
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Email sent successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            })
            
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })
        
@app.route('/dashboard-data')
def dashboard_data():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'error': 'Authentication required'})

    provider = session.get('provider')
    email = session.get('email')
    password = session.get('password')

    try:
        user_key = f"{email}_{provider}"
        fetcher = email_fetchers.get(user_key)

        if not fetcher:
            return jsonify({'success': False, 'error': 'Session expired. Please login again.'})

        emails = fetcher.fetch_emails()
        print("Emails for Dashboard:", emails)  # Debugging: Print emails being used for the dashboard

        # Calculate dashboard metrics
        response_times = [calculate_response_time(email['date']) for email in emails if 'date' in email]
        sentiment_analysis = calculate_sentiment_analysis(emails)
        delivery_rate, bounce_rate = calculate_delivery_bounce_rates(emails)
        engagement_decay = calculate_engagement_decay(emails)
        audience_segmentation = calculate_audience_segmentation(emails)
        content_performance = calculate_content_performance(emails)
        ab_test_performance = calculate_ab_test_performance(emails)
        optimization_report = calculate_optimization_report(emails)

        data = {
            "responseTime": {
                "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
                "values": response_times
            },
            "responseProbability": {
                "labels": ["Email 1", "Email 2", "Email 3"],
                "values": [80, 60, 90]
            },
            "deliveryRate": delivery_rate,
            "bounceRate": bounce_rate,
            "abTest": {
                "labels": ["Version A", "Version B"],
                "values": ab_test_performance
            },
            "engagementDecay": {
                "labels": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
                "values": engagement_decay
            },
            "audienceSegmentation": {
                "labels": ["Group A", "Group B", "Group C"],
                "values": audience_segmentation
            },
            "contentPerformance": {
                "labels": ["Post 1", "Post 2", "Post 3"],
                "values": content_performance
            },
            "sentimentAnalysis": {
                "positive": sentiment_analysis['positive'],
                "neutral": sentiment_analysis['neutral'],
                "negative": sentiment_analysis['negative']
            },
            "optimization": {
                "labels": ["Strategy 1", "Strategy 2", "Strategy 3"],
                "values": optimization_report
            }
        }

        print("Dashboard Data:", data)  # Debugging: Print final dashboard data
        return jsonify(data)

    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        return jsonify({'success': False, 'error': str(e)})

def calculate_response_time(email_date):
    # Convert email_date to a datetime object
    email_datetime = datetime.strptime(email_date, "%Y-%m-%d %H:%M:%S")
    current_time = datetime.now()
    response_time = (current_time - email_datetime).total_seconds() / 3600  # Convert to hours
    return response_time

def calculate_sentiment_analysis(emails):
    positive = 0
    neutral = 0
    negative = 0

    for email in emails:
        body = email.get('body', '')
        blob = TextBlob(body)
        sentiment = blob.sentiment.polarity

        if sentiment > 0:
            positive += 1
        elif sentiment == 0:
            neutral += 1
        else:
            negative += 1

    total = positive + neutral + negative
    if total > 0:
        positive_percent = (positive / total) * 100
        neutral_percent = (neutral / total) * 100
        negative_percent = (negative / total) * 100
    else:
        positive_percent = 0
        neutral_percent = 0
        negative_percent = 0

    return {
        'positive': positive_percent,
        'neutral': neutral_percent,
        'negative': negative_percent
    }

def calculate_delivery_bounce_rates(emails):
    return 100, 0

def calculate_engagement_decay(emails):
    engagement = [0, 0, 0, 0, 0]  # Engagement over 5 days

    for email in emails:
        if 'date' in email:
            email_date = datetime.strptime(email['date'], "%Y-%m-%d %H:%M:%S")
            days_old = (datetime.now() - email_date).days

            # Simulate engagement decay: older emails have less engagement
            for i in range(5):
                if days_old <= i:
                    engagement[i] += 1  # Emails less than or equal to i days old are still engaging

    return engagement

def calculate_audience_segmentation(emails):
    group_a = 0
    group_b = 0
    group_c = 0

    for email in emails:
        opens = email.get('opens', 0)
        if opens > 5:
            group_a += 1
        elif opens > 2:
            group_b += 1
        else:
            group_c += 1

    total = group_a + group_b + group_c
    if total > 0:
        group_a_percent = (group_a / total) * 100
        group_b_percent = (group_b / total) * 100
        group_c_percent = (group_c / total) * 100
    else:
        group_a_percent = 0
        group_b_percent = 0
        group_c_percent = 0

    return [group_a_percent, group_b_percent, group_c_percent]

def calculate_content_performance(emails):
    performance = [0, 0, 0]  # Performance of 3 different content types

    for email in emails:
        body_length = len(email.get('body', ''))
        subject_length = len(email.get('subject', ''))
        total_length = body_length + subject_length

        # Categorize emails based on content length
        if total_length < 100:
            performance[0] += 1  # Short emails
        elif total_length < 500:
            performance[1] += 1  # Medium emails
        else:
            performance[2] += 1  # Long emails

    return performance

def calculate_ab_test_performance(emails):
    import random
    version_a = 0
    version_b = 0

    for email in emails:
        # Randomly assign emails to version A or B
        version = random.choice(['A', 'B'])
        if version == 'A':
            version_a += 1
        else:
            version_b += 1

    total = version_a + version_b
    if total > 0:
        version_a_percent = (version_a / total) * 100
        version_b_percent = (version_b / total) * 100
    else:
        version_a_percent = 0
        version_b_percent = 0

    return [version_a_percent, version_b_percent]

def calculate_optimization_report(emails):
    strategy_1 = 0
    strategy_2 = 0
    strategy_3 = 0

    for email in emails:
        if 'date' in email:
            email_date = datetime.strptime(email['date'], "%Y-%m-%d %H:%M:%S")
            response_time = (datetime.now() - email_date).total_seconds() / 3600  # Response time in hours

            # Categorize emails based on response time
            if response_time < 1:
                strategy_1 += 1  # Fast response (optimized)
            elif response_time < 24:
                strategy_2 += 1  # Medium response
            else:
                strategy_3 += 1  # Slow response (needs improvement)

    total = strategy_1 + strategy_2 + strategy_3
    if total > 0:
        strategy_1_percent = (strategy_1 / total) * 100
        strategy_2_percent = (strategy_2 / total) * 100
        strategy_3_percent = (strategy_3 / total) * 100
    else:
        strategy_1_percent = 0
        strategy_2_percent = 0
        strategy_3_percent = 0

    return [strategy_1_percent, strategy_2_percent, strategy_3_percent]

@app.route('/logout')
def logout():
    # Clean up the fetcher if it exists
    if session.get('email') and session.get('provider'):
        user_key = f"{session['email']}_{session['provider']}"
        if user_key in email_fetchers:
            del email_fetchers[user_key]
    
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True)