// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// API Configuration
const API_URL = "http://127.0.0.1:5000"; // Flask backend

// Check API status on load
window.addEventListener('load', checkApiStatus);

// Event Listeners
uploadBtn.addEventListener('click', () => imageInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
});

uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('active'));

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    if (e.dataTransfer.files.length) {
        imageInput.files = e.dataTransfer.files;
        handleImageSelection();
    }
});

imageInput.addEventListener('change', handleImageSelection);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
sendMessageBtn.addEventListener('click', sendMessage);
analyzeBtn.addEventListener('click', analyzeImage);

// Functions
function handleImageSelection() {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewContainer.classList.add('active');
        previewContainer.scrollIntoView({ behavior: 'smooth' });
    };
    reader.readAsDataURL(file);
}

async function analyzeImage() {
    if (!imageInput.files.length) {
        alert('Please select an image first.');
        return;
    }

    // Disable button & show loading
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="loading"></span> Analyzing...';

    addMessage('user', 'Analyzing this image for crop diseases...');
    addMessage('bot', 'Analyzing your crop image... <span class="loading"></span>');

    try {
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);

        // ✅ Correct API route
        const response = await fetch(`${API_URL}/predict`, { method: "POST", body: formData });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        // Remove loading message
        chatMessages.removeChild(chatMessages.lastChild);

        if (data.error) {
            addMessage('bot', `❌ Error: ${data.error}`);
        } else {
            let message = `
                <h3>🌿 Prediction Result</h3>
                <div class="disease-info">
                    <h4>${data.label}</h4>
                    <p><b>Confidence:</b> ${data.confidence}</p>
                    <p><b>Recommended Actions:</b></p>
                    <ul class="treatment-list">
                        ${data.remedy.actions.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <br>
                <p>Would you like more specific advice for this condition?</p>
            `;
            addMessage('bot', message);
        }
    } catch (error) {
        chatMessages.removeChild(chatMessages.lastChild);
        console.error('Error:', error);
        addMessage('bot', `❌ Request failed: ${error.message}. Please make sure the backend server is running.`);
        fallbackDemoAnalysis();
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span>Analyze Image</span>';
    }
}

function fallbackDemoAnalysis() {
    const diseases = [
        {
            name: 'Powdery Mildew',
            confidence: '92%',
            description: 'A fungal disease appearing as white powdery spots.',
            treatment: [
                'Apply sulfur-based fungicides',
                'Improve air circulation',
                'Avoid overhead watering',
                'Remove infected plant parts'
            ]
        },
        {
            name: 'Leaf Spot',
            confidence: '78%',
            description: 'Brown or black spots on leaves, often with yellow halos.',
            treatment: [
                'Apply copper-based fungicides',
                'Water at the base to keep foliage dry',
                'Space plants properly',
                'Remove infected leaves promptly'
            ]
        }
    ];

    let message = `I've analyzed your crop image and detected the following issues:<br><br>`;
    diseases.forEach(disease => {
        message += `
            <div class="disease-info">
                <h4>${disease.name} (${disease.confidence} confidence)</h4>
                <p>${disease.description}</p>
                <p><strong>Recommended Treatment:</strong></p>
                <ul class="treatment-list">
                    ${disease.treatment.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <br>
        `;
    });
    message += `Would you like more specific advice for any of these conditions?`;
    addMessage('bot', message);
}

async function checkApiStatus() {
    try {
        // ✅ Correct ping route
        const response = await fetch(`${API_URL}/ping`, { method: 'GET' });
        if (response.ok) {
            statusIndicator.classList.remove('offline');
            statusText.textContent = 'API connected';
        } else throw new Error('API not responding correctly');
    } catch {
        statusIndicator.classList.add('offline');
        statusText.textContent = 'API offline - using demo mode';
        console.warn('API is not available, running in demo mode');
    }
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    chatInput.value = '';

    setTimeout(() => {
        let response = '';
        const text = message.toLowerCase();
        if (text.includes('hello') || text.includes('hi')) response = 'Hello! How can I help with your crop health today?';
        else if (text.includes('disease') || text.includes('problem')) response = 'Upload an image of the affected plant for accurate diagnosis.';
        else if (text.includes('prevent') || text.includes('avoid')) response = 'Consider crop rotation, proper spacing, and monitoring for early signs.';
        else if (text.includes('treatment') || text.includes('cure')) response = 'Treatment depends on the disease. Upload an image for specific recommendations.';
        else if (text.includes('fertilizer') || text.includes('nutrient')) response = 'Use balanced fertilizers and test soil for deficiencies.';
        else if (text.includes('thank')) response = "You're welcome! I'm always here to help.";
        else response = 'I can help with crop disease identification. Upload an image for analysis or ask specific plant health questions.';

        addMessage('bot', response);
    }, 1000);
}

function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.innerHTML = `<p>${content}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
