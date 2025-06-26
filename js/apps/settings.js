// Settings Application
class SettingsApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.activeCategory = 'appearance';
        this.settings = window.storage.getSettings();
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadCategory(this.activeCategory);
    }

    render() {
        this.container.innerHTML = `
            <div class="settings-app">
                <div class="settings-sidebar">
                    <div class="settings-category ${this.activeCategory === 'appearance' ? 'active' : ''}" data-category="appearance">
                        <span>🎨</span> Personalization
                    </div>
                    <div class="settings-category ${this.activeCategory === 'system' ? 'active' : ''}" data-category="system">
                        <span>🖥️</span> System
                    </div>
                    <div class="settings-category ${this.activeCategory === 'display' ? 'active' : ''}" data-category="display">
                        <span>📺</span> Display
                    </div>
                    <div class="settings-category ${this.activeCategory === 'sound' ? 'active' : ''}" data-category="sound">
                        <span>🔊</span> Sound
                    </div>
                    <div class="settings-category ${this.activeCategory === 'network' ? 'active' : ''}" data-category="network">
                        <span>🌐</span> Network
                    </div>
                    <div class="settings-category ${this.activeCategory === 'accounts' ? 'active' : ''}" data-category="accounts">
                        <span>👤</span> Accounts
                    </div>
                    <div class="settings-category ${this.activeCategory === 'privacy' ? 'active' : ''}" data-category="privacy">
                        <span>🔒</span> Privacy
                    </div>
                    <div class="settings-category ${this.activeCategory === 'storage' ? 'active' : ''}" data-category="storage">
                        <span>💾</span> Storage
                    </div>
                    <div class="settings-category ${this.activeCategory === 'about' ? 'active' : ''}" data-category="about">
                        <span>ℹ️</span> About
                    </div>
                </div>
                
                <div class="settings-content">
                    <div id="settingsContent">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Category navigation
        this.container.querySelectorAll('.settings-category').forEach(category => {
            category.addEventListener('click', () => {
                const categoryName = category.dataset.category;
                this.setActiveCategory(categoryName);
            });
        });
    }

    setActiveCategory(category) {
        this.activeCategory = category;
        
        // Update sidebar active state
        this.container.querySelectorAll('.settings-category').forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
        
        this.loadCategory(category);
    }

    loadCategory(category) {
        const content = this.container.querySelector('#settingsContent');
        
        switch (category) {
            case 'appearance':
                content.innerHTML = this.renderAppearanceSettings();
                this.setupAppearanceEventListeners();
                break;
            case 'system':
                content.innerHTML = this.renderSystemSettings();
                this.setupSystemEventListeners();
                break;
            case 'display':
                content.innerHTML = this.renderDisplaySettings();
                this.setupDisplayEventListeners();
                break;
            case 'sound':
                content.innerHTML = this.renderSoundSettings();
                this.setupSoundEventListeners();
                break;
            case 'network':
                content.innerHTML = this.renderNetworkSettings();
                break;
            case 'accounts':
                content.innerHTML = this.renderAccountsSettings();
                this.setupAccountsEventListeners();
                break;
            case 'privacy':
                content.innerHTML = this.renderPrivacySettings();
                this.setupPrivacyEventListeners();
                break;
            case 'storage':
                content.innerHTML = this.renderStorageSettings();
                break;
            case 'about':
                content.innerHTML = this.renderAboutSettings();
                break;
            default:
                content.innerHTML = '<div>Settings category not found</div>';
        }
    }

    renderAppearanceSettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">Personalization</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Theme</strong>
                            <div>Choose your system theme</div>
                        </div>
                        <div class="settings-control">
                            <select id="themeSelect">
                                <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
                                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Accent Color</strong>
                            <div>Choose your accent color</div>
                        </div>
                        <div class="settings-control">
                            <div class="color-picker">
                                <div class="color-option ${this.settings.accentColor === '#0078d4' ? 'active' : ''}" 
                                     style="background: #0078d4" data-color="#0078d4"></div>
                                <div class="color-option ${this.settings.accentColor === '#8764b8' ? 'active' : ''}" 
                                     style="background: #8764b8" data-color="#8764b8"></div>
                                <div class="color-option ${this.settings.accentColor === '#107c10' ? 'active' : ''}" 
                                     style="background: #107c10" data-color="#107c10"></div>
                                <div class="color-option ${this.settings.accentColor === '#ff8c00' ? 'active' : ''}" 
                                     style="background: #ff8c00" data-color="#ff8c00"></div>
                                <div class="color-option ${this.settings.accentColor === '#d13438' ? 'active' : ''}" 
                                     style="background: #d13438" data-color="#d13438"></div>
                                <div class="color-option ${this.settings.accentColor === '#e3008c' ? 'active' : ''}" 
                                     style="background: #e3008c" data-color="#e3008c"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Wallpaper</strong>
                            <div>Customize your desktop background</div>
                        </div>
                        <div class="settings-control">
                            <button id="changeWallpaperBtn" class="settings-btn">Change Wallpaper</button>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Animations</strong>
                            <div>Enable system animations</div>
                        </div>
                        <div class="settings-control">
                            <div class="toggle-switch ${this.settings.animations ? 'active' : ''}" id="animationsToggle"></div>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Font Size</strong>
                            <div>Adjust system font size</div>
                        </div>
                        <div class="settings-control">
                            <select id="fontSizeSelect">
                                <option value="small" ${this.settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                                <option value="medium" ${this.settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="large" ${this.settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSystemSettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">System Information</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Operating System</strong>
                        </div>
                        <div class="settings-control">
                            Windows 11 Clone v1.0
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Browser</strong>
                        </div>
                        <div class="settings-control">
                            ${navigator.userAgent.split(' ')[0]}
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Screen Resolution</strong>
                        </div>
                        <div class="settings-control">
                            ${screen.width} × ${screen.height}
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Language</strong>
                        </div>
                        <div class="settings-control">
                            <select id="languageSelect">
                                <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
                                <option value="es" ${this.settings.language === 'es' ? 'selected' : ''}>Español</option>
                                <option value="fr" ${this.settings.language === 'fr' ? 'selected' : ''}>Français</option>
                                <option value="de" ${this.settings.language === 'de' ? 'selected' : ''}>Deutsch</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Performance</strong>
                            <div>System performance settings</div>
                        </div>
                        <div class="settings-control">
                            <button id="optimizeBtn" class="settings-btn">Optimize Performance</button>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Reset Settings</strong>
                            <div>Reset all settings to default</div>
                        </div>
                        <div class="settings-control">
                            <button id="resetBtn" class="settings-btn danger">Reset All Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDisplaySettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">Display Settings</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Brightness</strong>
                            <div>Adjust screen brightness</div>
                        </div>
                        <div class="settings-control">
                            <input type="range" id="brightnessSlider" min="10" max="100" value="75" class="slider">
                            <span id="brightnessValue">75%</span>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Scale</strong>
                            <div>Change the size of text, apps, and other items</div>
                        </div>
                        <div class="settings-control">
                            <select id="scaleSelect">
                                <option value="100">100% (Recommended)</option>
                                <option value="125">125%</option>
                                <option value="150">150%</option>
                                <option value="175">175%</option>
                                <option value="200">200%</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Night Light</strong>
                            <div>Reduce blue light for better sleep</div>
                        </div>
                        <div class="settings-control">
                            <div class="toggle-switch" id="nightLightToggle"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSoundSettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">Sound Settings</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>System Volume</strong>
                            <div>Master volume control</div>
                        </div>
                        <div class="settings-control">
                            <input type="range" id="volumeSlider" min="0" max="100" value="50" class="slider">
                            <span id="volumeValue">50%</span>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>System Sounds</strong>
                            <div>Enable notification sounds</div>
                        </div>
                        <div class="settings-control">
                            <div class="toggle-switch active" id="soundsToggle"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderNetworkSettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">Network & Internet</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Wi-Fi</strong>
                            <div>Connected to: Home Network</div>
                        </div>
                        <div class="settings-control">
                            <span class="status-badge connected">Connected</span>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Internet Status</strong>
                            <div>Connection status</div>
                        </div>
                        <div class="settings-control">
                            <span class="status-badge connected">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAccountsSettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">Account Settings</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Username</strong>
                            <div>Your display name</div>
                        </div>
                        <div class="settings-control">
                            <input type="text" id="usernameInput" value="${this.settings.username || 'User'}" class="settings-input">
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Password</strong>
                            <div>Change your password</div>
                        </div>
                        <div class="settings-control">
                            <button id="changePasswordBtn" class="settings-btn">Change Password</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPrivacySettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">Privacy & Security</div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Notifications</strong>
                            <div>Show system notifications</div>
                        </div>
                        <div class="settings-control">
                            <div class="toggle-switch ${this.settings.notifications ? 'active' : ''}" id="notificationsToggle"></div>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Location</strong>
                            <div>Allow apps to access your location</div>
                        </div>
                        <div class="settings-control">
                            <div class="toggle-switch" id="locationToggle"></div>
                        </div>
                    </div>
                    
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Clear Data</strong>
                            <div>Clear all stored application data</div>
                        </div>
                        <div class="settings-control">
                            <button id="clearDataBtn" class="settings-btn danger">Clear All Data</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStorageSettings() {
        const totalStorage = 100; // GB simulated
        const usedStorage = Math.floor(Math.random() * 60) + 20; // Random used storage
        const freeStorage = totalStorage - usedStorage;

        return `
            <div class="settings-section">
                <div class="settings-title">Storage</div>
                
                <div class="settings-group">
                    <div class="storage-overview">
                        <div class="storage-bar">
                            <div class="storage-used" style="width: ${(usedStorage / totalStorage) * 100}%"></div>
                        </div>
                        <div class="storage-info">
                            <div class="storage-item">
                                <span class="storage-label">Used:</span>
                                <span class="storage-value">${usedStorage} GB</span>
                            </div>
                            <div class="storage-item">
                                <span class="storage-label">Free:</span>
                                <span class="storage-value">${freeStorage} GB</span>
                            </div>
                            <div class="storage-item">
                                <span class="storage-label">Total:</span>
                                <span class="storage-value">${totalStorage} GB</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>Temporary Files</strong>
                            <div>Clean up temporary files to free space</div>
                        </div>
                        <div class="settings-control">
                            <button id="cleanTempBtn" class="settings-btn">Clean Now</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAboutSettings() {
        return `
            <div class="settings-section">
                <div class="settings-title">About</div>
                
                <div class="settings-group">
                    <div class="about-info">
                        <div class="about-logo">🖥️</div>
                        <h2>Windows 11 Clone</h2>
                        <p>Version 1.0.0</p>
                        <p>Built with HTML, CSS, and JavaScript</p>
                        <p>A modern web-based operating system experience</p>
                    </div>
                </div>
                
                <div class="settings-group">
                    <div class="settings-item">
                        <div class="settings-label">
                            <strong>System Information</strong>
                        </div>
                        <div class="settings-control">
                            <div class="system-info">
                                <div>Platform: ${navigator.platform}</div>
                                <div>User Agent: ${navigator.userAgent.substring(0, 50)}...</div>
                                <div>Language: ${navigator.language}</div>
                                <div>Online: ${navigator.onLine ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupAppearanceEventListeners() {
        // Theme selector
        const themeSelect = this.container.querySelector('#themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                this.updateSetting('theme', theme);
                window.themeManager.applyTheme(theme);
                this.showNotification('Theme updated', 'success');
            });
        }

        // Color picker
        this.container.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                this.container.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.updateSetting('accentColor', color);
                window.themeManager.applyAccentColor(color);
                this.showNotification('Accent color updated', 'success');
            });
        });

        // Change wallpaper button
        const changeWallpaperBtn = this.container.querySelector('#changeWallpaperBtn');
        if (changeWallpaperBtn) {
            changeWallpaperBtn.addEventListener('click', () => {
                window.themeManager.openThemePanel();
            });
        }

        // Animations toggle
        const animationsToggle = this.container.querySelector('#animationsToggle');
        if (animationsToggle) {
            animationsToggle.addEventListener('click', () => {
                const enabled = !animationsToggle.classList.contains('active');
                animationsToggle.classList.toggle('active', enabled);
                this.updateSetting('animations', enabled);
                this.showNotification(`Animations ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }

        // Font size selector
        const fontSizeSelect = this.container.querySelector('#fontSizeSelect');
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                const fontSize = e.target.value;
                this.updateSetting('fontSize', fontSize);
                this.applyFontSize(fontSize);
                this.showNotification('Font size updated', 'success');
            });
        }
    }

    setupSystemEventListeners() {
        // Language selector
        const languageSelect = this.container.querySelector('#languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                const language = e.target.value;
                this.updateSetting('language', language);
                this.showNotification('Language updated', 'success');
            });
        }

        // Optimize button
        const optimizeBtn = this.container.querySelector('#optimizeBtn');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                this.optimizePerformance();
            });
        }

        // Reset button
        const resetBtn = this.container.querySelector('#resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    setupDisplayEventListeners() {
        // Brightness slider
        const brightnessSlider = this.container.querySelector('#brightnessSlider');
        const brightnessValue = this.container.querySelector('#brightnessValue');
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.addEventListener('input', (e) => {
                const brightness = e.target.value;
                brightnessValue.textContent = brightness + '%';
                document.body.style.filter = `brightness(${brightness}%)`;
            });
        }

        // Scale selector
        const scaleSelect = this.container.querySelector('#scaleSelect');
        if (scaleSelect) {
            scaleSelect.addEventListener('change', (e) => {
                const scale = e.target.value;
                document.documentElement.style.zoom = scale + '%';
                this.showNotification('Display scale updated', 'success');
            });
        }

        // Night light toggle
        const nightLightToggle = this.container.querySelector('#nightLightToggle');
        if (nightLightToggle) {
            nightLightToggle.addEventListener('click', () => {
                const enabled = !nightLightToggle.classList.contains('active');
                nightLightToggle.classList.toggle('active', enabled);
                
                if (enabled) {
                    document.body.style.filter = 'hue-rotate(10deg) brightness(0.9)';
                } else {
                    document.body.style.filter = '';
                }
                
                this.showNotification(`Night light ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
    }

    setupSoundEventListeners() {
        // Volume slider
        const volumeSlider = this.container.querySelector('#volumeSlider');
        const volumeValue = this.container.querySelector('#volumeValue');
        if (volumeSlider && volumeValue) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value;
                volumeValue.textContent = volume + '%';
                // Update global volume slider if it exists
                const globalVolumeSlider = document.getElementById('volumeSlider');
                if (globalVolumeSlider) {
                    globalVolumeSlider.value = volume;
                }
                window.taskbarManager?.updateVolumeStatus();
            });
        }

        // Sounds toggle
        const soundsToggle = this.container.querySelector('#soundsToggle');
        if (soundsToggle) {
            soundsToggle.addEventListener('click', () => {
                const enabled = !soundsToggle.classList.contains('active');
                soundsToggle.classList.toggle('active', enabled);
                this.showNotification(`System sounds ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }
    }

    setupAccountsEventListeners() {
        // Username input
        const usernameInput = this.container.querySelector('#usernameInput');
        if (usernameInput) {
            usernameInput.addEventListener('blur', (e) => {
                const username = e.target.value.trim();
                if (username && username !== this.settings.username) {
                    this.updateSetting('username', username);
                    this.updateUsernameDisplay(username);
                    this.showNotification('Username updated', 'success');
                }
            });
        }

        // Change password button
        const changePasswordBtn = this.container.querySelector('#changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.changePassword();
            });
        }
    }

    setupPrivacyEventListeners() {
        // Notifications toggle
        const notificationsToggle = this.container.querySelector('#notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('click', () => {
                const enabled = !notificationsToggle.classList.contains('active');
                notificationsToggle.classList.toggle('active', enabled);
                this.updateSetting('notifications', enabled);
                this.showNotification(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }

        // Location toggle
        const locationToggle = this.container.querySelector('#locationToggle');
        if (locationToggle) {
            locationToggle.addEventListener('click', () => {
                const enabled = !locationToggle.classList.contains('active');
                locationToggle.classList.toggle('active', enabled);
                this.showNotification(`Location access ${enabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }

        // Clear data button
        const clearDataBtn = this.container.querySelector('#clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        window.storage.saveSettings(this.settings);
    }

    applyFontSize(size) {
        const root = document.documentElement;
        switch (size) {
            case 'small':
                root.style.fontSize = '14px';
                break;
            case 'medium':
                root.style.fontSize = '16px';
                break;
            case 'large':
                root.style.fontSize = '18px';
                break;
        }
    }

    updateUsernameDisplay(username) {
        document.querySelectorAll('#startUserName, #lockUserName').forEach(el => {
            if (el) el.textContent = username;
        });
    }

    optimizePerformance() {
        // Simulate performance optimization
        const btn = this.container.querySelector('#optimizeBtn');
        btn.textContent = 'Optimizing...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = 'Optimize Performance';
            btn.disabled = false;
            this.showNotification('System optimized successfully', 'success');
        }, 2000);
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            window.storage.clear();
            this.showNotification('Settings reset successfully. Please refresh the page.', 'info');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }

    changePassword() {
        const newPassword = prompt('Enter new password:');
        if (newPassword !== null) {
            if (newPassword.length < 4) {
                this.showNotification('Password must be at least 4 characters long', 'error');
            } else {
                // In a real app, this would be handled securely
                this.showNotification('Password updated successfully', 'success');
            }
        }
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This will delete all files, settings, and app data.')) {
            if (confirm('This action cannot be undone. Continue?')) {
                window.storage.clear();
                this.showNotification('All data cleared. The page will reload.', 'info');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        }
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Settings',
                message: message,
                type: type,
                icon: '⚙️'
            });
        }
    }
}

// Register the app globally
window.SettingsApp = SettingsApp;