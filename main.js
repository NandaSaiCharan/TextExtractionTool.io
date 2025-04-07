// Image preview
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const resultText = document.getElementById('resultText');

// Load saved data when page loads
window.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
});

// Handle image upload and preview
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageData = e.target.result;
            imagePreview.innerHTML = `<img src="${imageData}" alt="Preview">`;
            // Save image data
            saveToLocalStorage('lastImage', imageData);
        }
        reader.readAsDataURL(file);
    }
});

// Extract text from image
async function extractImageText() {
    const img = imagePreview.querySelector('img');
    if (!img) {
        alert('Please upload an image first');
        return;
    }

    resultText.value = 'Processing...';
    try {
        const result = await Tesseract.recognize(img.src, 'eng');
        resultText.value = result.data.text;
        // Don't save automatically after extraction
    } catch (error) {
        resultText.value = 'Error processing image: ' + error.message;
    }
}

// Save edited text
function saveEditedText() {
    const currentText = resultText.value;
    if (currentText.trim() !== '') {
        saveExtractedText('edited', currentText);
        alert('Text saved successfully!');
    }
}

// Copy extracted text to clipboard
function copyText() {
    resultText.select();
    document.execCommand('copy');
    alert('Text copied to clipboard!');
}

// Save data to localStorage
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Save extracted text with timestamp
function saveExtractedText(source, text) {
    const extractionData = {
        id: Date.now().toString(),
        text,
        timestamp: new Date().toISOString(),
        source
    };

    // Get existing extractions or initialize new array
    let extractions = JSON.parse(localStorage.getItem('extractions') || '[]');
    extractions.push(extractionData);
    
    // Keep only last 10 extractions to manage storage space
    if (extractions.length > 10) {
        extractions = extractions.slice(-10);
    }

    saveToLocalStorage('extractions', JSON.stringify(extractions));
    saveToLocalStorage('lastExtractedText', text);
    displayExtractionHistory();
}

// Load saved data
function loadSavedData() {
    // Load last image
    const lastImage = localStorage.getItem('lastImage');
    if (lastImage) {
        imagePreview.innerHTML = `<img src="${lastImage}" alt="Preview">`;
    }

    // Load last extracted text
    const lastText = localStorage.getItem('lastExtractedText');
    if (lastText) {
        resultText.value = lastText;
    }

    // Display extraction history
    displayExtractionHistory();
}

// Edit history item
function editHistoryItem(id) {
    let extractions = JSON.parse(localStorage.getItem('extractions') || '[]');
    const item = extractions.find(extraction => extraction.id === id);
    if (item) {
        resultText.value = item.text;
        resultText.focus();
    }
}

// Delete history item
function deleteHistoryItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        let extractions = JSON.parse(localStorage.getItem('extractions') || '[]');
        extractions = extractions.filter(extraction => extraction.id !== id);
        saveToLocalStorage('extractions', JSON.stringify(extractions));
        displayExtractionHistory();
    }
}

// Clear all history
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        saveToLocalStorage('extractions', '[]');
        displayExtractionHistory();
    }
}

// Display extraction history
function displayExtractionHistory() {
    const extractions = JSON.parse(localStorage.getItem('extractions') || '[]');
    const historyContainer = document.getElementById('extractionHistory');
    
    if (historyContainer) {
        historyContainer.innerHTML = extractions.map(extraction => `
            <div class="history-item">
                <div class="history-item-header">
                    <strong>${new Date(extraction.timestamp).toLocaleString()}</strong>
                    <div class="history-item-actions">
                        <button onclick="editHistoryItem('${extraction.id}')" class="action-button edit">Edit</button>
                        <button onclick="deleteHistoryItem('${extraction.id}')" class="action-button delete">Delete</button>
                    </div>
                </div>
                <p>Source: ${extraction.source}</p>
                <p class="history-text">${extraction.text.substring(0, 100)}${extraction.text.length > 100 ? '...' : ''}</p>
            </div>
        `).join('');
    }
}