// Windows 11 OS Clone - Main Entry Point
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the Windows 11 OS
    console.log('🖥️ Windows 11 Clone - System Starting...');
    
    // Set up initial system state
    initializeSystem();
    
    // Set up lock screen functionality
    setupLockScreen();
    
    // Show welcome notification after system loads
    setTimeout(() => {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'System Ready',
                message: 'Welcome to Windows 11 Clone! All systems are operational.',
                type: 'success',
                icon: '🖥️'
            });
        }
    }, 3000);
});

function initializeSystem() {
    // Initialize core components (they initialize themselves when DOM loads)
    console.log('✅ Core components initialized');
    
    // Set initial theme
    const settings = window.storage.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Apply saved accent color
    if (settings.accentColor) {
        document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    }
    
    // Update system info
    updateSystemInfo();
    
    console.log('🎉 Windows 11 Clone - System Ready!');
}

function setupLockScreen() {
    const lockScreen = document.getElementById('lockScreen');
    const lockPassword = document.getElementById('lockPassword');
    const lockSubmit = document.getElementById('lockSubmit');
    
    if (!lockScreen || !lockPassword || !lockSubmit) return;
    
    // Handle password input
    lockPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            unlockSystem();
        }
    });
    
    // Handle unlock button
    lockSubmit.addEventListener('click', unlockSystem);
    
    function unlockSystem() {
        const password = lockPassword.value;
        
        // Simple password check (in real app, this would be more secure)
        if (password === '' || password === 'user' || password === 'password') {
            lockScreen.classList.add('hidden');
            lockPassword.value = '';
            
            // Show welcome notification
            setTimeout(() => {
                if (window.notificationManager) {
                    window.notificationManager.show({
                        title: 'Welcome Back',
                        message: 'You have successfully logged in to your system.',
                        type: 'success',
                        icon: '👋'
                    });
                }
            }, 500);
        } else {
            // Wrong password animation
            lockPassword.style.animation = 'shake 0.5s';
            setTimeout(() => {
                lockPassword.style.animation = '';
                lockPassword.value = '';
            }, 500);
        }
    }
}

function updateSystemInfo() {
    // Update username display
    const settings = window.storage.getSettings();
    const userElements = document.querySelectorAll('#startUserName, #lockUserName');
    userElements.forEach(el => {
        if (el) el.textContent = settings.username || 'User';
    });
}

// Add shake animation for wrong password
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;

// Inject shake animation
const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Global error handler
window.addEventListener('error', (e) => {
    console.error('System Error:', e.error);
    if (window.notificationManager) {
        window.notificationManager.show({
            title: 'System Error',
            message: 'An unexpected error occurred.',
            type: 'error',
            icon: '⚠️'
        });
    }
});

// Service worker registration for offline capability (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        console.log('Service Worker registration failed');
    });
}