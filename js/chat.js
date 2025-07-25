document.addEventListener("DOMContentLoaded", () => {
    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sidePanel = document.getElementById('side-panel');
    const overlay = document.getElementById('main-content-overlay');
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    const fileUploadInput = document.getElementById('file-upload');

    // --- API Configuration ---
    // 🔴 WARNING: Your API key is visible in this file.
    // For production, use a backend server to protect your key.
    const API_KEY = 'AIzaSyA-iQkatOgUla31LSZjAXTXr2K13YiloZc';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + API_KEY;
    
    // --- Theme Switcher ---
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            themeSwitch.checked = false;
        } else {
            document.body.classList.remove('light-theme');
            themeSwitch.checked = true;
        }
    };

    const currentTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(currentTheme);

    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- Menu / Side Panel ---
    const toggleMenu = () => {
        sidePanel.classList.toggle('show');
        overlay.classList.toggle('show');
    };

    menuBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // --- Chat Form Handling ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (userMessage) {
            appendMessage('user', userMessage);
            userInput.value = '';
            userInput.style.height = 'auto'; // Reset height
            showTypingIndicator();
            getAIResponse(userMessage);
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });

    // --- File Upload ---
    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // For now, just show a message.
            // Gemini vision requires a different payload structure.
            appendMessage('user', `(Uploaded file: ${file.name}) - Vision API not fully implemented in this demo.`);
            // In a real app, you would read the file as base64 and send to vision model.
        }
    });

    // --- Core Chat Functions ---
    const appendMessage = (sender, text) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const avatar = document.createElement('img');
        avatar.classList.add('avatar');
        avatar.src = sender === 'ai' ? 'https://i.ibb.co/6g6y5Vz/ai-icon.png' : 'path/to/user-icon.png';
        avatar.alt = sender;

        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.innerText = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(textDiv);
        chatLog.appendChild(messageDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    };

    const showTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'ai-message', 'typing-indicator');
        typingDiv.innerHTML = `
            <img src="https://i.ibb.co/6g6y5Vz/ai-icon.png" alt="AI" class="avatar">
            <div class="text">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>`;
        chatLog.appendChild(typingDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    };

    const getAIResponse = async (prompt) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const aiText = data.candidates[0].content.parts[0].text;
            
            removeTypingIndicator();
            appendMessage('ai', aiText.trim());

        } catch (error) {
            console.error("Error fetching AI response:", error);
            removeTypingIndicator();
            appendMessage('ai', `Sorry, something went wrong. Please check the console for errors. (Hint: Is the API key valid and enabled?)`);
        }
    };
});