let currentEmail = null;
let currentProvider = null;
let currentPage = 1;
const emailsPerPage = 50;

document.addEventListener('DOMContentLoaded', function() {
    // Show provider selection modal on page load
    document.getElementById("providerModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";
    console.log("App initialized. Ready to select email provider.");

    // Add refresh functionality
    document.querySelector('.fa-sync-alt').addEventListener('click', function() {
        this.classList.add('fa-spin');
        fetchEmails().then(() => {
            setTimeout(() => {
                this.classList.remove('fa-spin');
            }, 1000);
        }).catch(() => {
            this.classList.remove('fa-spin');
        });
    });

    // Add search functionality
    document.querySelector('.search-input').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.toLowerCase();
            searchEmails(query);
        }
    });
});

// Function to handle the "Click anywhere to continue..." process
function handleIntroClick(event) {
    // Check if the click target is the Features button or its children
    if (event.target.closest('.features-button')) {
        return; // Do nothing if the Features button is clicked
    }

    // Hide the intro page and show the provider modal or next step
    document.getElementById('introPage').style.display = 'none';
    document.getElementById('providerModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

// Add this to your main.js file

// Function to handle scroll animations for features section
function handleFeaturesScroll() {
    const featuresSection = document.getElementById('featuresSection');
    const featureCards = document.querySelectorAll('.feature-card');
    
    if (!featuresSection) return;
    
    const featuresSectionPosition = featuresSection.getBoundingClientRect().top;
    const screenPosition = window.innerHeight / 1.3;
    
    if (featuresSectionPosition < screenPosition) {
        featuresSection.classList.add('visible');
        
        // Add staggered animation to feature cards
        featureCards.forEach(card => {
            setTimeout(() => {
                card.classList.add('visible');
            }, 100);
        });
    }
}

// Modify the intro page click handler to allow scrolling instead of immediate transition
document.addEventListener('DOMContentLoaded', function() {
    const introPage = document.getElementById('introPage');
    const startButton = document.querySelector('.start-button');
    
    if (introPage) {
        // Change this to scroll to features instead of hiding intro page
        document.querySelector('.intro-continue').addEventListener('click', function() {
            const featuresSection = document.getElementById('featuresSection');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Add scroll event listener for animation triggers
        introPage.addEventListener('scroll', handleFeaturesScroll);
        
        // If start button is clicked, proceed to the app
        if (startButton) {
            startButton.addEventListener('click', function() {
                // Start the app (open provider selection)
                introPage.classList.add('fade-out');
                setTimeout(() => {
                    introPage.style.display = 'none';
                    // Show provider selection
                    document.getElementById('providerModal').style.display = 'block';
                    document.getElementById('modalOverlay').style.display = 'block';
                }, 800);
            });
        }
    }
});


// Function to handle search input
function handleSearchInput() {
    const searchInput = document.querySelector('.search-input');
    const cancelButton = document.querySelector('.cancel-button');

    // Show cancel button if there is text in the search box
    if (searchInput.value.trim() !== '') {
        cancelButton.style.display = 'block';
        searchEmails(searchInput.value.trim()); // Perform search
    } else {
        cancelButton.style.display = 'none';
        clearSearch(); // Clear search results
    }
}

// Function to clear the search
function clearSearch() {
    const searchInput = document.querySelector('.search-input');
    const cancelButton = document.querySelector('.cancel-button');

    // Clear the search input and hide the cancel button
    searchInput.value = '';
    cancelButton.style.display = 'none';

    // Return to the normal email list
    fetchEmails(currentProvider);
}

// Function to search emails
function searchEmails(query) {
    const emailList = document.getElementById('emailList');
    const emailItems = emailList.querySelectorAll('.email-item');

    if (!query || query === '') {
        // If query is empty, show all emails
        emailItems.forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }

    let foundCount = 0;

    emailItems.forEach(item => {
        const sender = item.querySelector('.email-sender').textContent.toLowerCase();
        const subject = item.querySelector('.email-subject').textContent.toLowerCase();
        const body = item.querySelector('.email-body').textContent.toLowerCase();

        if (sender.includes(query) || subject.includes(query) || body.includes(query)) {
            item.style.display = 'flex';
            foundCount++;
        } else {
            item.style.display = 'none';
        }
    });

    if (foundCount === 0) {
        if (!document.querySelector('.no-results')) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `No results found for "${query}"`;
            emailList.appendChild(noResults);
        }
    } else {
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }
    }
}

function showLoading() {
    if (document.getElementById('loading')) {
        document.getElementById('loading').style.display = 'block';
    } else {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '50%';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translate(-50%, -50%)';
        loadingDiv.style.zIndex = '1000';
        document.body.appendChild(loadingDiv);
    }
}

function hideLoading() {
    if (document.getElementById('loading')) {
        document.getElementById('loading').style.display = 'none';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
    });
}

function selectProvider(provider) {
    currentProvider = provider;
    console.log(`Selected provider: ${provider}`);
    document.getElementById("providerModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";

    if (provider === 'gmail') {
        showGmailLoginForm();
    } else if (provider === 'outlook') {
        showOutlookEmailForm();
    }
}

function showOutlookEmailForm() {
    const outlookFormHtml = `
        <div class="modal" id="outlookEmailModal">
            <h3>Outlook Configuration</h3>
            <form id="outlookEmailForm">
                <div class="form-group">
                    <label for="outlookEmail">Your Outlook Email Address</label>
                    <input type="email" id="outlookEmail" name="outlookEmail" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="login-button">Continue</button>
                </div>
                <p class="error-message" id="outlookEmailError"></p>
            </form>
        </div>
        <div class="modal-overlay" id="outlookEmailModalOverlay"></div>
    `;

    // Append the email form to the body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = outlookFormHtml;
    document.body.appendChild(tempDiv.querySelector('#outlookEmailModal'));
    document.body.appendChild(tempDiv.querySelector('#outlookEmailModalOverlay'));

    // Show the form
    document.getElementById("outlookEmailModal").style.display = "block";
    document.getElementById("outlookEmailModalOverlay").style.display = "block";

    // Add event listener for form submission
    document.getElementById("outlookEmailForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const email = document.getElementById("outlookEmail").value;

        // Validate the email
        if (!email || !email.includes('@')) {
            document.getElementById("outlookEmailError").textContent = 'Please enter a valid email address';
            return;
        }

        showLoading();
        console.log("Initializing Outlook with email:", email);

        // Send login request with just the email for Outlook
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: 'outlook',
                email: email,
                password: 'not-used-for-outlook'  // Not needed for Outlook but required by backend
            }),
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                console.log("Outlook email registered successfully");
                // Close the email modal
                document.getElementById("outlookEmailModal").style.display = "none";
                document.getElementById("outlookEmailModalOverlay").style.display = "none";

                // Fetch emails
                fetchEmails('outlook');
            } else {
                console.error("Outlook initialization failed:", data.error);
                // Show error message
                document.getElementById("outlookEmailError").textContent = data.error || 'Failed to initialize Outlook';
            }
        })
        .catch(error => {
            hideLoading();
            console.error("Outlook initialization error:", error);
            document.getElementById("outlookEmailError").textContent = 'Network error: ' + error;
        });
    });
}

function showGmailLoginForm() {
    const loginHtml = `
        <div class="modal" id="gmailLoginModal">
            <h3>Gmail Login</h3>
            <form id="gmailLoginForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">App Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="login-button">Login</button>
                </div>
                <p class="error-message" id="loginError"></p>
            </form>
        </div>
        <div class="modal-overlay" id="loginModalOverlay"></div>
    `;

    // Append the login form to the body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = loginHtml;
    document.body.appendChild(tempDiv.querySelector('#gmailLoginModal'));
    document.body.appendChild(tempDiv.querySelector('#loginModalOverlay'));

    // Show the form
    document.getElementById("gmailLoginModal").style.display = "block";
    document.getElementById("loginModalOverlay").style.display = "block";

    // Add event listener for form submission
    document.getElementById("gmailLoginForm").addEventListener("submit", function(e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        showLoading();
        console.log("Attempting Gmail login...");

        // Send login request
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: 'gmail',
                email: email,
                password: password
            }),
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.success) {
                console.log("Gmail login successful");
                // Close the login modal
                document.getElementById("gmailLoginModal").style.display = "none";
                document.getElementById("loginModalOverlay").style.display = "none";

                // Fetch emails
                fetchEmails('gmail');
            } else {
                console.error("Gmail login failed:", data.error);
                // Show error message
                document.getElementById("loginError").textContent = data.error || 'Login failed';
            }
        })
        .catch(error => {
            hideLoading();
            console.error("Gmail login error:", error);
            document.getElementById("loginError").textContent = 'Network error: ' + error;
        });
    });
}

function logout() {
    // Reset the current provider and email state
    currentProvider = null;
    currentEmail = null;

    // Clear the email list
    document.getElementById('emailList').innerHTML = '';

    // Show the provider selection modal again
    document.getElementById("providerModal").style.display = "block";
    document.getElementById("modalOverlay").style.display = "block";

    console.log("User logged out. Returning to provider selection.");
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    // Toggle the 'collapsed' class on the sidebar
    sidebar.classList.toggle('collapsed');

    // Toggle the 'expanded' class on the main content
    mainContent.classList.toggle('expanded');

    console.log("Sidebar toggled.");
}

async function fetchEmails(provider = currentProvider) {
    showLoading();
    console.log(`Fetching emails for provider: ${provider}`);
    try {
        const response = await fetch(`/fetch-emails?provider=${provider}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch emails. Status: ${response.status}, Error: ${errorText}`);
            throw new Error(`Failed to fetch emails: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log(`Successfully fetched ${result.emails.length} emails`);
            displayEmails(result.emails);
        } else {
            console.error("Failed to fetch emails:", result.error);
            throw new Error(result.error || 'Failed to fetch emails');
        }
    } catch (error) {
        console.error('Error fetching emails:', error);
        document.getElementById('emailList').innerHTML = `
            <div class="error-message">
                Failed to load emails: ${error.message}. Please try again later.
            </div>
        `;
    }
    hideLoading();
}

function displayEmails(emails) {
    const emailList = document.getElementById('emailList');
    emailList.innerHTML = '';

    if (emails.length === 0) {
        emailList.innerHTML = '<div class="no-emails">No emails found</div>';
        return;
    }

    // Sort emails by date in descending order (newest first)
    const sortedEmails = [...emails].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });

    console.log(`Displaying ${sortedEmails.length} emails`);
    sortedEmails.forEach(email => {
        // Updated sender name logic
        const senderName = email.sender_name || (email.sender && email.sender.includes('@') ? 
            email.sender.split('@')[0] : (email.sender || 'Unknown'));

        const emailItem = document.createElement('div');
        emailItem.className = 'email-item';
        emailItem.innerHTML = `
            <input type="checkbox" class="email-checkbox">
            <i class="far fa-star email-star"></i>
            <div class="email-content">
                <div class="email-sender">${senderName}</div>
                <div class="email-subject">${email.subject || 'No Subject'}</div>
                <div class="email-body">${((email.body || '').toString().substring(0, 100) || 'No content')}${(email.body && email.body.length > 100) ? '...' : ''}</div>
            </div>
            <div class="email-time">${formatDate(email.date)}</div>
        `;
        emailItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('email-checkbox') && 
                !e.target.classList.contains('email-star')) {
                showEmailDetail(email);
            }
        });
        emailList.appendChild(emailItem);
    });
}

function showEmailDetail(email) {
    currentEmail = email;
    console.log("Opening email from:", email.sender_name, "| Email:", email.sender_email || "Unknown Email");

    // Display the email content in the left section
    const emailDetail = document.getElementById('emailDetail');
    emailDetail.innerHTML = `
        <h3>${email.subject || 'No Subject'}</h3>
        <div><strong>From:</strong> ${email.sender_name || 'Unknown'} (${email.sender_email || 'Unknown Email'})</div>
        <div><strong>Date:</strong> ${formatDate(email.date)}</div>
        <div style="margin-top: 16px;">${email.body || ''}</div>
        <button onclick="generateResponse()" class="generate-response-button">Generate Response</button>
        <div id="responseActions">
            <button onclick="sendResponse()" class="send-response-button">Send Response</button>
            <span id="sentIndicator" class="sent-indicator" style="display: none;">✔️</span>
        </div>
    `;

    // Clear the response section
    document.getElementById('responseContent').innerHTML = '';

    // Hide the email list and show the split layout
    document.getElementById('emailList').style.display = 'none';
    document.getElementById('splitLayout').style.display = 'flex';
}

function closeResponse() {
    // Hide the split layout and show the email list
    document.getElementById('splitLayout').style.display = 'none';
    document.getElementById('emailList').style.display = 'block';
    currentEmail = null;
}


// Add this function to close the email detail view
function closeEmailDetail() {
    const modal = document.getElementById('emailDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    currentEmail = null; // Reset the current email

    // Reset the green tick indicator
    const sentIndicator = document.getElementById('sentIndicator');
    if (sentIndicator) {
        sentIndicator.style.display = 'none';
    }
}
// Add this function to close the response modal
function closeModal() {
    const modal = document.getElementById('responseModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Function to enable editing of the generated response
function enableEditResponse() {
    const responseContent = document.querySelector('#responseContent div[style="margin-top: 8px; white-space: pre-wrap;"]');
    if (!responseContent) {
        console.error("Cannot find response content element");
        return;
    }

    // Replace the response content with a textarea for editing
    const responseText = responseContent.textContent;
    const textarea = document.createElement('textarea');
    textarea.value = responseText;
    textarea.style.width = '100%';
    textarea.style.height = '150px';
    textarea.style.marginTop = '8px';
    responseContent.replaceWith(textarea);

    // Add a Save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.marginTop = '8px';
    saveButton.onclick = function() {
        const editedResponse = textarea.value;
        responseContent.textContent = editedResponse;
        textarea.replaceWith(responseContent);
        saveButton.remove();
    };

    const responseContainer = document.getElementById('responseContent');
    responseContainer.appendChild(saveButton);
}

// Updated sendResponse function with "Sent" message and editing
async function sendResponse() {
    if (!currentEmail) {
        console.error("Cannot send response: no email selected");
        return;
    }

    const responseContent = document.querySelector('#responseContent div[style="margin-top: 8px; white-space: pre-wrap;"]');
    if (!responseContent) {
        console.error("Cannot find response content element");
        return;
    }

    // Get the sender's email address
    const senderEmail = currentEmail.sender_email || extractEmailFromString(currentEmail.sender_raw);
    if (!senderEmail) {
        console.error("Cannot find sender's email address");
        alert("Cannot find recipient's email address");
        return;
    }

    showLoading();
    console.log(`Sending generated response via ${currentProvider} to: ${senderEmail}`);

    try {
        const response = await fetch('/send-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: currentProvider,
                originalEmail: {
                    id: currentEmail.id,
                    sender_name: currentEmail.sender_name,
                    sender_email: senderEmail,
                    sender_raw: currentEmail.sender_raw || currentEmail.sender,
                    subject: currentEmail.subject,
                    body: currentEmail.body,
                    date: currentEmail.date
                },
                subject: `Re: ${currentEmail.subject || 'No Subject'}`,
                body: responseContent.textContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send response. Status: ${response.status}, Error: ${errorText}`);
            throw new Error(`Failed to send response: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            console.log("Response sent successfully");

            // Show the green tick indicator
            const sentIndicator = document.getElementById('sentIndicator');
            if (sentIndicator) {
                sentIndicator.style.display = 'inline';

                // Hide the indicator after 3 seconds
                setTimeout(() => {
                    sentIndicator.style.display = 'none';
                }, 3000); // Hide after 3 seconds
            }

            // Close the response modal and email detail view
            closeModal();
            closeEmailDetail();

            // Refresh the email list
            fetchEmails();
        } else {
            console.error("Failed to send email:", result.error);
            throw new Error(result.error || 'Failed to send email');
        }
    } catch (error) {
        console.error('Error sending response:', error);
        alert('Failed to send response: ' + error.message);
    }

    hideLoading();
}

// Add Edit button to the generated response
function displayGeneratedResponse(data) {
    const content = document.getElementById('responseContent');
    
    const qualityScore = Math.floor(Math.random() * (96 - 80 + 1)) + 80;
    
    content.innerHTML = `
        <div>
            <strong>Detected Emotion:</strong> ${data.emotion || 'Unknown'}
        </div>
        <div style="margin-top: 16px">
            <strong>Generated Response:</strong>
            <div style="margin-top: 8px; white-space: pre-wrap;">${data.response || 'Press Generate Response Again'}</div>
        </div>
        <button onclick="enableEditResponse()" style="margin-top: 16px;">Edit</button>
    `;
}

function extractEmailFromString(str) {
    if (!str) return null;
    const matches = str.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    return matches ? matches[0] : null;
}

// Rest of your original code remains unchanged

// Star functionality
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('email-star')) {
        e.target.classList.toggle('active');
        e.target.classList.toggle('fas');
        e.target.classList.toggle('far');
        e.stopPropagation(); // Prevent event bubbling
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Show the introduction page on page load
    const introPage = document.getElementById("introPage");
    introPage.style.display = "flex";

    // Add click event to close the introduction page and show the provider modal
    introPage.addEventListener("click", function () {
        // Smoothly fade out the introduction page
        introPage.style.opacity = "0";

        // Wait for the animation to finish before hiding the page
        setTimeout(() => {
            introPage.style.display = "none";

            // Show the provider selection modal
            document.getElementById("providerModal").style.display = "block";
            document.getElementById("modalOverlay").style.display = "block";
        }, 500); // Match the duration of the fadeOut animation
    });
});

async function generateResponse() {
    if (!currentEmail) {
        console.error("Cannot generate response: no email selected");
        return;
    }

    // Clear the response content before generating a new response
    const content = document.getElementById('responseContent');
    content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Generating response...</div>';

    let emailBody = '';
    if (currentEmail && currentEmail.body) {
        emailBody = currentEmail.body.toString();
        if (currentProvider === 'outlook') {
            emailBody = emailBody.replace(/(\r\n|\n|\r)/gm, " ").trim();
        }
    }

    console.log(`Generating response for ${currentProvider} email with subject: "${currentEmail.subject}"`);
    console.log("Email body length:", emailBody.length, "First 100 chars:", emailBody.substring(0, 100));

    try {
        const response = await fetch('/generate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailBody: emailBody })
        });

        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Response text length:", responseText.length);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse response:", parseError);
            console.log("Raw response:", responseText);
            throw new Error("Server returned invalid JSON");
        }

        if (!response.ok || !data) {
            throw new Error(data?.error || `Server error: ${response.status}`);
        }

        if (!data.emotion || !data.response) {
            console.warn("Response missing expected fields:", data);
        }

        // Call the function to display the response with the Edit button
        displayGeneratedResponse(data);
    } catch (error) {
        console.error('Error generating response:', error);
        content.innerHTML = `
            <div class="error-message">
                Failed to generate response: ${error.message}
            </div>
        `;
    }
}

async function predictReply() {
    if (!currentEmail) {
        console.error("Cannot predict reply: no email selected");
        return;
    }

    const responseContent = document.querySelector('#responseContent div[style="margin-top: 8px; white-space: pre-wrap;"]');
    if (!responseContent) {
        console.error("Cannot find response content element");
        return;
    }

    // Show loading indicator in the prediction section
    const predictionSection = document.getElementById('predictionSection');
    predictionSection.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Predicting possible reply...</div>';
    predictionSection.style.display = 'block';

    try {
        const response = await fetch('/predict-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalEmail: currentEmail.body || '',
                ourResponse: responseContent.textContent || ''
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to predict reply');
        }

        // Display the prediction
        displayPrediction(data.prediction);
    } catch (error) {
        console.error('Error predicting reply:', error);
        predictionSection.innerHTML = `
            <div class="error-message">
                Click the predict reply button again
            </div>
        `;
    }
}

function displayGeneratedResponse(data) {
    const content = document.getElementById('responseContent');
    
    const qualityScore = Math.floor(Math.random() * (96 - 80 + 1)) + 80;
    
    content.innerHTML = `
        <div>
            <strong>Detected Emotion:</strong> ${data.emotion || 'Unknown'}
        </div>
        <div style="margin-top: 16px">
            <strong>Generated Response:</strong>
            <div style="margin-top: 8px; white-space: pre-wrap;">${data.response || 'Press Generate Response Again'}</div>
        </div>
        <div class="response-action-buttons" style="margin-top: 16px;">
            <button onclick="enableEditResponse()">Edit</button>
            <button onclick="predictReply()">Predict Reply</button>
        </div>
    `;
    
    // Add prediction section (initially hidden)
    if (!document.getElementById('predictionSection')) {
        const predictionSection = document.createElement('div');
        predictionSection.id = 'predictionSection';
        predictionSection.style.display = 'none';
        predictionSection.style.marginTop = '24px';
        predictionSection.style.padding = '16px';
        predictionSection.style.background = '#1e1e1e'; // Dark gray background
        predictionSection.style.color = '#ffffff'; // White text
        predictionSection.style.borderRadius = '8px';
        content.appendChild(predictionSection);
    }
}

function displayPrediction(prediction) {
    const predictionSection = document.getElementById('predictionSection');
    
    // Get probability from prediction object
    const probability = prediction.reply_probability || 0;
    
    // Create a color based on probability (green for high, yellow for medium, red for low)
    let probabilityColor = '#ff4d4d'; // Red for low
    if (probability > 70) {
        probabilityColor = '#4caf50'; // Green for high
    } else if (probability > 40) {
        probabilityColor = '#ff9800'; // Orange for medium
    }
    
    predictionSection.innerHTML = `
        <div class="prediction-header">
            <h4>Predicted Reply</h4>
            <div class="probability-indicator" style="color: ${probabilityColor}">
                <span>${probability}%</span> likely to receive a reply
            </div>
        </div>
        <div class="prediction-content">
            <div>
                ${prediction.predicted_reply || 'No prediction available'}
            </div>
        </div>
    `;
}




function renderCharts(data) {
    // Response Time Analysis Chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(responseTimeCtx, {
        type: 'line',
        data: {
            labels: data.responseTime.labels,
            datasets: [{
                label: 'Average Response Time (hours)',
                data: data.responseTime.values,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Predictive Response Probability Chart
    const responseProbabilityCtx = document.getElementById('responseProbabilityChart').getContext('2d');
    new Chart(responseProbabilityCtx, {
        type: 'bar',
        data: {
            labels: data.responseProbability.labels,
            datasets: [{
                label: 'Response Probability (%)',
                data: data.responseProbability.values,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Delivery and Bounce Report Chart
    const deliveryBounceCtx = document.getElementById('deliveryBounceChart').getContext('2d');
    new Chart(deliveryBounceCtx, {
        type: 'pie',
        data: {
            labels: ['Delivered', 'Bounced'],
            datasets: [{
                label: 'Delivery vs Bounce',
                data: [data.deliveryRate, data.bounceRate],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        }
    });

    // A/B Test Performance Chart
    const abTestCtx = document.getElementById('abTestChart').getContext('2d');
    new Chart(abTestCtx, {
        type: 'bar',
        data: {
            labels: data.abTest.labels,
            datasets: [{
                label: 'A/B Test Performance',
                data: data.abTest.values,
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Engagement Decay Report Chart
    const engagementDecayCtx = document.getElementById('engagementDecayChart').getContext('2d');
    new Chart(engagementDecayCtx, {
        type: 'line',
        data: {
            labels: data.engagementDecay.labels,
            datasets: [{
                label: 'Engagement Decay',
                data: data.engagementDecay.values,
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Audience Segmentation Chart
    const audienceSegmentationCtx = document.getElementById('audienceSegmentationChart').getContext('2d');
    new Chart(audienceSegmentationCtx, {
        type: 'doughnut',
        data: {
            labels: data.audienceSegmentation.labels,
            datasets: [{
                label: 'Audience Segmentation',
                data: data.audienceSegmentation.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        }
    });

    // Content Performance Chart
    const contentPerformanceCtx = document.getElementById('contentPerformanceChart').getContext('2d');
    new Chart(contentPerformanceCtx, {
        type: 'bar',
        data: {
            labels: data.contentPerformance.labels,
            datasets: [{
                label: 'Content Performance',
                data: data.contentPerformance.values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Sentiment & Intent Analysis Chart
    const sentimentAnalysisCtx = document.getElementById('sentimentAnalysisChart').getContext('2d');
    new Chart(sentimentAnalysisCtx, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                label: 'Sentiment Analysis',
                data: [data.sentimentAnalysis.positive, data.sentimentAnalysis.neutral, data.sentimentAnalysis.negative],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(255, 99, 132, 0.2)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        }
    });

    // Optimization & Improvement Report Chart
    const optimizationCtx = document.getElementById('optimizationChart').getContext('2d');
    new Chart(optimizationCtx, {
        type: 'bar',
        data: {
            labels: data.optimization.labels,
            datasets: [{
                label: 'Optimization & Improvement',
                data: data.optimization.values,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}



function loadDashboardData() {
    fetch('/dashboard-data')
        .then(response => response.json())
        .then(data => {
            console.log("Dashboard data loaded:", data); // Debug log
            renderCharts(data);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Modify the existing displayGeneratedResponse function to add a "Predict Reply" button

// Close modals when clicking overlay
document.addEventListener('click', function(e) {
    if (e.target.id === 'modalOverlay' || e.target.id === 'loginModalOverlay') {
        closeEmailDetail();
        closeModal();

        // Don't close provider selection modal by clicking overlay
        if (document.getElementById('providerModal').style.display === 'block') {
            return;
        }

        // Close Gmail login modal if open
        const gmailLoginModal = document.getElementById('gmailLoginModal');
        if (gmailLoginModal && gmailLoginModal.style.display === 'block') {
            gmailLoginModal.style.display = 'none';
            document.getElementById('loginModalOverlay').style.display = 'none';
        }

        // Close Outlook email modal if open
        const outlookEmailModal = document.getElementById('outlookEmailModal');
        if (outlookEmailModal && outlookEmailModal.style.display === 'block') {
            outlookEmailModal.style.display = 'none';
            document.getElementById('outlookEmailModalOverlay').style.display = 'none';
        }
    }
});