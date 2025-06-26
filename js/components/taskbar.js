// Taskbar Management
class TaskbarManager {
    constructor() {
        this.runningApps = new Map();
        this.clock = null;
        this.init();
    }

    init() {
        this.setupClock();
        this.setupEventListeners();
        this.updateSystemTray();
    }

    setupClock() {
        this.updateClock();
        this.clock = setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const timeElement = document.getElementById('taskbarTime');
        const dateElement = document.getElementById('taskbarDate');
        const lockTimeElement = document.getElementById('lockTime');
        const lockDateElement = document.getElementById('lockDate');

        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric' 
            });
        }

        if (lockTimeElement) {
            lockTimeElement.textContent = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        if (lockDateElement) {
            lockDateElement.textContent = now.toLocaleDateString([], { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    setupEventListeners() {
        // Start button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                window.startMenuManager.toggle();
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.executeSearch(e.target.value);
                }
            });
        }

        // System tray icons
        document.getElementById('wifiIcon')?.addEventListener('click', () => {
            this.toggleWifi();
        });

        document.getElementById('volumeIcon')?.addEventListener('click', () => {
            this.toggleVolume();
        });

        document.getElementById('batteryIcon')?.addEventListener('click', () => {
            this.showBatteryInfo();
        });

        document.getElementById('notificationIcon')?.addEventListener('click', () => {
            window.notificationManager.toggle();
        });

        // Clock container
        document.getElementById('clockContainer')?.addEventListener('click', () => {
            this.showCalendar();
        });
    }

    addApp(appId, appInfo) {
        this.runningApps.set(appId, {
            ...appInfo,
            windows: []
        });
        this.updateTaskbarApps();
    }

    removeApp(appId) {
        this.runningApps.delete(appId);
        this.updateTaskbarApps();
    }

    addWindow(appId, windowId) {
        const app = this.runningApps.get(appId);
        if (app && !app.windows.includes(windowId)) {
            app.windows.push(windowId);
            this.updateTaskbarApps();
        }
    }

    removeWindow(appId, windowId) {
        const app = this.runningApps.get(appId);
        if (app) {
            app.windows = app.windows.filter(id => id !== windowId);
            if (app.windows.length === 0) {
                this.removeApp(appId);
            } else {
                this.updateTaskbarApps();
            }
        }
    }

    updateTaskbarApps() {
        const container = document.getElementById('taskbarApps');
        if (!container) return;

        container.innerHTML = '';

        this.runningApps.forEach((app, appId) => {
            const appElement = document.createElement('div');
            appElement.className = 'taskbar-app';
            appElement.dataset.appId = appId;
            appElement.innerHTML = app.icon;
            appElement.title = app.name;

            // Check if app has focused window
            const hasActiveWindow = app.windows.some(windowId => {
                const window = document.querySelector(`[data-window-id="${windowId}"]`);
                return window && window.classList.contains('focused');
            });

            if (hasActiveWindow) {
                appElement.classList.add('active');
            }

            // Event listeners
            appElement.addEventListener('click', () => {
                this.handleTaskbarAppClick(appId, app);
            });

            appElement.addEventListener('mouseenter', () => {
                this.showAppPreview(appElement, app);
            });

            appElement.addEventListener('mouseleave', () => {
                this.hideAppPreview();
            });

            appElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showAppContextMenu(e, appId, app);
            });

            container.appendChild(appElement);
        });
    }

    handleTaskbarAppClick(appId, app) {
        if (app.windows.length === 1) {
            // Single window - toggle minimize/restore
            const windowId = app.windows[0];
            const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
            
            if (windowElement) {
                if (windowElement.classList.contains('minimized')) {
                    window.windowManager.restoreWindow(windowId);
                } else if (windowElement.classList.contains('focused')) {
                    window.windowManager.minimizeWindow(windowId);
                } else {
                    window.windowManager.focusWindow(windowId);
                }
            }
        } else if (app.windows.length > 1) {
            // Multiple windows - show window switcher
            this.showWindowSwitcher(app);
        }
    }

    showAppPreview(element, app) {
        if (app.windows.length === 0) return;

        const preview = document.createElement('div');
        preview.className = 'app-preview';
        preview.innerHTML = `
            <div class="preview-header">
                <div class="preview-icon">${app.icon}</div>
                <div class="preview-title">${app.name}</div>
            </div>
            <div class="preview-content">
                ${app.windows.length} window${app.windows.length > 1 ? 's' : ''} open
            </div>
        `;

        element.appendChild(preview);
        this.currentPreview = preview;
    }

    hideAppPreview() {
        if (this.currentPreview) {
            this.currentPreview.remove();
            this.currentPreview = null;
        }
    }

    showAppContextMenu(e, appId, app) {
        const menu = document.createElement('div');
        menu.className = 'taskbar-context';
        menu.style.left = e.clientX + 'px';
        menu.style.bottom = '70px';

        const menuItems = [];

        if (app.windows.length > 0) {
            menuItems.push(`
                <div class="taskbar-context-item" data-action="restore-all">
                    Restore all windows
                </div>
                <div class="taskbar-context-item" data-action="minimize-all">
                    Minimize all windows
                </div>
                <div class="taskbar-context-item" data-action="close-all">
                    Close all windows
                </div>
            `);
        }

        menuItems.push(`
            <div class="taskbar-context-item" data-action="new-window">
                Open new window
            </div>
        `);

        menu.innerHTML = menuItems.join('<div class="context-divider"></div>');
        document.body.appendChild(menu);

        // Event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleAppContextAction(action, appId, app);
            }
            menu.remove();
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    handleAppContextAction(action, appId, app) {
        switch (action) {
            case 'restore-all':
                app.windows.forEach(windowId => {
                    window.windowManager.restoreWindow(windowId);
                });
                break;
            case 'minimize-all':
                app.windows.forEach(windowId => {
                    window.windowManager.minimizeWindow(windowId);
                });
                break;
            case 'close-all':
                app.windows.forEach(windowId => {
                    window.windowManager.closeWindow(windowId);
                });
                break;
            case 'new-window':
                window.windowManager.openApp(app.app, app);
                break;
        }
    }

    showWindowSwitcher(app) {
        // Create window switcher overlay
        const switcher = document.createElement('div');
        switcher.className = 'window-switcher';
        switcher.innerHTML = `
            <div class="switcher-header">
                <div class="switcher-icon">${app.icon}</div>
                <div class="switcher-title">${app.name}</div>
            </div>
            <div class="switcher-windows">
                ${app.windows.map(windowId => {
                    const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
                    const windowTitle = windowElement ? 
                        windowElement.querySelector('.window-title').textContent : 
                        'Window';
                    return `
                        <div class="switcher-window" data-window-id="${windowId}">
                            <div class="window-thumbnail"></div>
                            <div class="window-title">${windowTitle}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        document.body.appendChild(switcher);

        // Event listeners
        switcher.addEventListener('click', (e) => {
            const windowItem = e.target.closest('.switcher-window');
            if (windowItem) {
                const windowId = windowItem.dataset.windowId;
                window.windowManager.focusWindow(windowId);
                switcher.remove();
            }
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', () => switcher.remove(), { once: true });
        }, 0);
    }

    handleSearch(query) {
        if (!query.trim()) return;

        // Simple search implementation
        // In a real implementation, this would search through apps, files, web, etc.
        console.log('Searching for:', query);
    }

    executeSearch(query) {
        if (!query.trim()) return;

        // Execute search or open app
        const apps = window.storage.getPinnedApps();
        const matchingApp = apps.find(app => 
            app.name.toLowerCase().includes(query.toLowerCase())
        );

        if (matchingApp) {
            window.windowManager.openApp(matchingApp.app, matchingApp);
            document.getElementById('searchInput').value = '';
        } else {
            // Open browser with search
            window.windowManager.openApp('browser', {
                id: 'browser',
                name: 'Web Browser',
                icon: '🌐',
                app: 'browser',
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
            });
            document.getElementById('searchInput').value = '';
        }
    }

    updateSystemTray() {
        // Update system tray icons based on system state
        const settings = window.storage.getSettings();
        
        // Update theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.classList.toggle('active', settings.theme === 'dark');
        }

        // Update other system indicators
        this.updateWifiStatus();
        this.updateVolumeStatus();
        this.updateBatteryStatus();
    }

    updateWifiStatus() {
        const wifiIcon = document.getElementById('wifiIcon');
        if (wifiIcon) {
            // Simulate wifi status
            wifiIcon.classList.add('active');
            wifiIcon.title = 'Connected to Wi-Fi';
        }
    }

    updateVolumeStatus() {
        const volumeIcon = document.getElementById('volumeIcon');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (volumeIcon && volumeSlider) {
            const volume = parseInt(volumeSlider.value);
            if (volume === 0) {
                volumeIcon.textContent = '🔇';
            } else if (volume < 50) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
            volumeIcon.title = `Volume: ${volume}%`;
        }
    }

    updateBatteryStatus() {
        const batteryIcon = document.getElementById('batteryIcon');
        if (batteryIcon) {
            // Simulate battery status
            batteryIcon.title = 'Battery: 85%';
        }
    }

    toggleWifi() {
        // Toggle wifi (simulated)
        const wifiToggle = document.getElementById('wifiToggle');
        if (wifiToggle) {
            wifiToggle.classList.toggle('active');
            const isActive = wifiToggle.classList.contains('active');
            wifiToggle.textContent = isActive ? '📶 Wi-Fi On' : '📶 Wi-Fi Off';
        }
    }

    toggleVolume() {
        // Toggle volume mute
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            const currentVolume = parseInt(volumeSlider.value);
            volumeSlider.value = currentVolume > 0 ? 0 : 50;
            this.updateVolumeStatus();
        }
    }

    showBatteryInfo() {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Battery Status',
                message: 'Battery: 85% - 3 hours remaining',
                type: 'info'
            });
        }
    }

    showCalendar() {
        // Open calendar app
        window.windowManager.openApp('calendar', {
            id: 'calendar',
            name: 'Calendar',
            icon: '🗓️',
            app: 'calendar'
        });
    }
}

// Initialize taskbar manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskbarManager = new TaskbarManager();
});