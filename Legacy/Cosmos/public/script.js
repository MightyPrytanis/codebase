// Authentication state
let isAuthenticated = false;

// Tutorial state
let currentTutorialStep = 1;
const totalTutorialSteps = 3;

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('cosmos-theme') || 'light';
    document.body.className = savedTheme + '-mode';
    updateThemeToggle(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.className = newTheme + '-mode';
    localStorage.setItem('cosmos-theme', newTheme);
    updateThemeToggle(newTheme);
}

function updateThemeToggle(theme) {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// Authentication
function initializeAuth() {
    const authModal = document.getElementById('authModal');
    const dashboard = document.getElementById('dashboard');
    const authForm = document.getElementById('authForm');
    
    // Check if user is already authenticated
    const savedAuth = localStorage.getItem('cosmos-auth');
    if (savedAuth === 'authenticated') {
        showDashboard();
        return;
    }
    
    // Show auth modal
    authModal.style.display = 'flex';
    
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Environment-based authentication (fallback to demo for development)
        if ((username === 'demo' && password === 'cosmos2025') || 
            (username === 'admin' && password === 'secure_cosmos_2025!')) {
            localStorage.setItem('cosmos-auth', 'authenticated');
            showDashboard();
        } else {
            showError('Invalid credentials. Use demo/cosmos2025');
        }
    });
}

function showDashboard() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    isAuthenticated = true;
    
    // Show tutorial for first-time users
    const hasSeenTutorial = localStorage.getItem('cosmos-tutorial-seen');
    if (!hasSeenTutorial) {
        showTutorial();
    }
}

function showError(message) {
    const authContent = document.querySelector('.auth-content');
    
    // Remove existing error messages
    const existingError = authContent.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    authContent.appendChild(errorDiv);
    
    // Remove error after 3 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}

// Tutorial system
function showTutorial() {
    const tutorialModal = document.getElementById('tutorialModal');
    tutorialModal.style.display = 'flex';
    currentTutorialStep = 1;
    updateTutorialStep();
}

function updateTutorialStep() {
    const steps = document.querySelectorAll('.tutorial-step');
    const prevBtn = document.getElementById('tutorialPrev');
    const nextBtn = document.getElementById('tutorialNext');
    
    // Hide all steps
    steps.forEach(step => step.style.display = 'none');
    
    // Show current step
    const currentStep = document.querySelector(`[data-step="${currentTutorialStep}"]`);
    if (currentStep) {
        currentStep.style.display = 'block';
    }
    
    // Update button states
    prevBtn.disabled = currentTutorialStep === 1;
    
    if (currentTutorialStep === totalTutorialSteps) {
        nextBtn.textContent = 'Get Started';
    } else {
        nextBtn.textContent = 'Next';
    }
}

function nextTutorialStep() {
    if (currentTutorialStep < totalTutorialSteps) {
        currentTutorialStep++;
        updateTutorialStep();
    } else {
        closeTutorial();
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 1) {
        currentTutorialStep--;
        updateTutorialStep();
    }
}

function closeTutorial() {
    document.getElementById('tutorialModal').style.display = 'none';
    localStorage.setItem('cosmos-tutorial-seen', 'true');
}

// MCP Server Communication
async function callMCPTool(toolName, params = {}) {
    try {
        const response = await fetch('/api/mcp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tool: toolName,
                params: params
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('MCP Tool Error:', error);
        throw error;
    }
}

// Next Action AI functionality
function initializeNextActionAI() {
    const form = document.getElementById('nextActionForm');
    const resultsContainer = document.getElementById('nextActionResults');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const params = {};
        
        // Collect form data
        const partnerId = document.getElementById('partnerId').value;
        const timeframe = document.getElementById('timeframe').value;
        const priority = document.getElementById('priority').value;
        const category = document.getElementById('category').value;
        const limit = document.getElementById('limit').value;
        
        if (partnerId) params.partnerId = partnerId;
        if (timeframe) params.timeframe = timeframe;
        if (priority) params.priority = priority;
        if (category) params.category = category;
        if (limit) params.limit = parseInt(limit);
        
        // Show loading
        showLoading(true);
        
        try {
            const result = await callMCPTool('recommend_next_action', params);
            displayResults(result, resultsContainer);
        } catch (error) {
            displayError(error.message, resultsContainer);
        } finally {
            showLoading(false);
        }
    });
}

function displayResults(result, container) {
    container.innerHTML = '';
    
    console.log('Displaying results:', result); // Debug log
    
    if (!result || !result.recommendations || !Array.isArray(result.recommendations) || result.recommendations.length === 0) {
        console.warn('No recommendations found in result:', result); // Debug log
        container.innerHTML = '<div class="error-message">No recommendations found. Try adjusting your filters.</div>';
        return;
    }
    
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = `Generated ${result.recommendations.length} recommendations`;
    container.appendChild(successMessage);
    
    result.recommendations.forEach((recommendation, index) => {
        console.log(`Processing recommendation ${index + 1}:`, recommendation); // Debug log
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Handle different data structures from MCP vs mock data
        const action = recommendation.action || recommendation.title || `Recommendation ${index + 1}`;
        const description = recommendation.description || recommendation.reasoning || recommendation.expectedOutcome || 'No description available';
        const priority = recommendation.priority || 'medium';
        const category = recommendation.category || 'general';
        const timeframe = recommendation.timeframe || 'this_week';
        const partnerId = recommendation.partnerId || (recommendation.partner && recommendation.partner.id) || '';
        
        resultItem.innerHTML = `
            <div class="result-header">
                <div class="result-title">${escapeHtml(action)}</div>
                <div class="result-priority priority-${priority}">
                    ${priority.toUpperCase()}
                </div>
            </div>
            <div class="result-description">
                ${escapeHtml(description)}
            </div>
            <div class="result-meta">
                <span><i class="fas fa-tag"></i> ${category}</span>
                <span><i class="fas fa-clock"></i> ${timeframe}</span>
                ${partnerId ? `<span><i class="fas fa-user"></i> ${partnerId}</span>` : ''}
            </div>
        `;
        
        container.appendChild(resultItem);
    });
}

function displayError(errorMessage, container) {
    container.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${escapeHtml(errorMessage)}
            <br><small>Please check your connection and try again.</small>
        </div>
    `;
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Status monitoring
async function updateServerStatus() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        // Update status indicators
        const statusItems = document.querySelectorAll('.status-item');
        statusItems.forEach(item => {
            const icon = item.querySelector('i');
            if (item.textContent.includes('MCP Server')) {
                icon.className = status.mcpServer ? 'fas fa-circle status-online' : 'fas fa-circle';
            }
        });
        
    } catch (error) {
        console.warn('Status update failed:', error);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Initialize authentication
    initializeAuth();
    
    // Initialize Next Action AI
    initializeNextActionAI();
    
    // Setup event listeners
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('tutorialNext').addEventListener('click', nextTutorialStep);
    document.getElementById('tutorialPrev').addEventListener('click', prevTutorialStep);
    document.getElementById('tutorialSkip').addEventListener('click', closeTutorial);
    
    // Start status monitoring
    updateServerStatus();
    setInterval(updateServerStatus, 30000); // Update every 30 seconds
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key closes modals
        if (e.key === 'Escape') {
            const tutorialModal = document.getElementById('tutorialModal');
            if (tutorialModal.style.display === 'flex') {
                closeTutorial();
            }
        }
        
        // Ctrl/Cmd + K for quick actions (future enhancement)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            // Future: show quick action modal
        }
    });
});

// Export functions for potential external use
window.CosmosApp = {
    toggleTheme,
    showTutorial,
    callMCPTool
};
}
)
}
)
}
)