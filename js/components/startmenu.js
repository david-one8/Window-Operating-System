// Start Menu Management
class StartMenuManager {
    constructor() {
        this.isOpen = false;
        this.pinnedApps = [];
        this.recentApps = [];
        this.allApps = [];
        this.searchResults = [];
        this.currentView = 'pinned'; // 'pinned' or 'all'
        this.init();
    }

    init() {
        this.loadApps();
        this.renderPinnedApps();
        this.renderRecentApps();
        this.setupEventListeners();
        this.updateUserInfo();
    }

    loadApps() {
        this.pinnedApps = window.storage.getPinnedApps();
        this.recentApps = window.storage.getRecentApps();
        
        // Define all available apps
        this.allApps = [
            { id: 'notepad', name: 'Notepad', icon: '📝', app: 'notepad', category: 'Productivity' },
            { id: 'fileexplorer', name: 'File Explorer', icon: '📁', app: 'fileexplorer', category: 'System' },
            { id: 'browser', name: 'Web Browser', icon: '🌐', app: 'browser', category: 'Internet' },
            { id: 'settings', name: 'Settings', icon: '⚙️', app: 'settings', category: 'System' },
            { id: 'gallery', name: 'Gallery', icon: '🖼️', app: 'gallery', category: 'Media' },
            { id: 'calendar', name: 'Calendar', icon: '🗓️', app: 'calendar', category: 'Productivity' },
            { id: 'recyclebin', name: 'Recycle Bin', icon: '🗑️', app: 'recyclebin', category: 'System' },
            { id: 'calculator', name: 'Calculator', icon: '🧮', app: 'calculator', category: 'Utilities' },
            { id: 'paint', name: 'Paint', icon: '🎨', app: 'paint', category: 'Graphics' },
            { id: 'music', name: 'Music Player', icon: '🎵', app: 'music', category: 'Media' },
            { id: 'video', name: 'Video Player', icon: '🎬', app: 'video', category: 'Media' },
            { id: 'terminal', name: 'Terminal', icon: '💻', app: 'terminal', category: 'Developer' }
        ];
    }

    renderPinnedApps() {
        const container = document.getElementById('pinnedApps');
        if (!container) return;

        container.innerHTML = '';

        this.pinnedApps.forEach(app => {
            const appElement = this.createAppTile(app);
            container.appendChild(appElement);
        });
    }

    renderRecentApps() {
        const container = document.getElementById('recentApps');
        if (!container) return;

        container.innerHTML = '';

        if (this.recentApps.length === 0) {
            container.innerHTML = '<div class="no-recent">No recent apps</div>';
            return;
        }

        this.recentApps.slice(0, 6).forEach(app => {
            const appElement = this.createRecentItem(app);
            container.appendChild(appElement);
        });
    }

    createAppTile(app) {
        const element = document.createElement('div');
        element.className = 'app-tile';
        element.dataset.appId = app.id;
        
        element.innerHTML = `
            <div class="app-tile-icon">${app.icon}</div>
            <div class="app-tile-name">${app.name}</div>
        `;

        element.addEventListener('click', () => {
            this.openApp(app);
        });

        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showAppContextMenu(e, app);
        });

        return element;
    }

    createRecentItem(app) {
        const element = document.createElement('div');
        element.className = 'recent-item';
        element.dataset.appId = app.id;
        
        const timeAgo = this.getTimeAgo(app.timestamp);
        
        element.innerHTML = `
            <div class="recent-item-icon">${app.icon}</div>
            <div class="recent-item-info">
                <div class="recent-item-name">${app.name}</div>
                <div class="recent-item-time">${timeAgo}</div>
            </div>
        `;

        element.addEventListener('click', () => {
            this.openApp(app);
        });

        return element;
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    setupEventListeners() {
        // Start search
        const startSearch = document.getElementById('startSearch');
        if (startSearch) {
            startSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            startSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.searchResults.length > 0) {
                    this.openApp(this.searchResults[0]);
                }
            });
        }

        // Power options
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handlePowerAction(btn.dataset.action);
            });
        });

        // User info
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.addEventListener('click', () => {
                this.showUserMenu();
            });
        }

        // All apps toggle
        const allAppsToggle = document.querySelector('.all-apps-toggle');
        if (allAppsToggle) {
            allAppsToggle.addEventListener('click', () => {
                this.toggleAllAppsView();
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            const startMenu = document.getElementById('startMenu');
            const startButton = document.getElementById('startButton');
            
            if (this.isOpen && 
                !startMenu.contains(e.target) && 
                !startButton.contains(e.target)) {
                this.close();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            } else if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.clearSearch();
            return;
        }

        // Search through all apps
        this.searchResults = this.allApps.filter(app =>
            app.name.toLowerCase().includes(query.toLowerCase()) ||
            app.category.toLowerCase().includes(query.toLowerCase())
        );

        this.renderSearchResults(query);
    }

    renderSearchResults(query) {
        const container = document.getElementById('pinnedApps');
        if (!container) return;

        container.innerHTML = '';

        if (this.searchResults.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <div class="no-results-text">No results for "${query}"</div>
                </div>
            `;
            return;
        }

        this.searchResults.forEach(app => {
            const appElement = this.createAppTile(app);
            container.appendChild(appElement);
        });
    }

    clearSearch() {
        const startSearch = document.getElementById('startSearch');
        if (startSearch) {
            startSearch.value = '';
        }
        this.searchResults = [];
        this.renderPinnedApps();
    }

    toggleAllAppsView() {
        this.currentView = this.currentView === 'pinned' ? 'all' : 'pinned';
        
        if (this.currentView === 'all') {
            this.renderAllApps();
        } else {
            this.renderPinnedApps();
        }
    }

    renderAllApps() {
        const container = document.getElementById('pinnedApps');
        if (!container) return;

        container.innerHTML = '';

        // Group apps by category
        const categories = {};
        this.allApps.forEach(app => {
            if (!categories[app.category]) {
                categories[app.category] = [];
            }
            categories[app.category].push(app);
        });

        // Render each category
        Object.entries(categories).forEach(([category, apps]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'apps-category';
            categoryElement.innerHTML = `
                <div class="category-title">${category}</div>
                <div class="category-apps">
                    ${apps.map(app => `
                        <div class="app-tile" data-app-id="${app.id}">
                            <div class="app-tile-icon">${app.icon}</div>
                            <div class="app-tile-name">${app.name}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add event listeners
            categoryElement.querySelectorAll('.app-tile').forEach(tile => {
                const appId = tile.dataset.appId;
                const app = apps.find(a => a.id === appId);
                
                tile.addEventListener('click', () => {
                    this.openApp(app);
                });

                tile.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showAppContextMenu(e, app);
                });
            });

            container.appendChild(categoryElement);
        });
    }

    openApp(app) {
        if (window.windowManager) {
            window.windowManager.openApp(app.app, app);
            
            // Add to recent apps
            window.storage.addRecentApp(app);
            this.recentApps = window.storage.getRecentApps();
            this.renderRecentApps();
        }
        
        this.close();
    }

    showAppContextMenu(e, app) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        const isPinned = this.pinnedApps.some(pinnedApp => pinnedApp.id === app.id);
        
        menu.innerHTML = `
            <div class="context-item" data-action="open">
                <span class="context-icon">📂</span>
                <span>Open</span>
            </div>
            <div class="context-divider"></div>
            <div class="context-item" data-action="${isPinned ? 'unpin' : 'pin'}">
                <span class="context-icon">${isPinned ? '📌' : '📍'}</span>
                <span>${isPinned ? 'Unpin from Start' : 'Pin to Start'}</span>
            </div>
        `;

        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        document.body.appendChild(menu);

        // Event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleAppContextAction(action, app);
            }
            menu.remove();
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    handleAppContextAction(action, app) {
        switch (action) {
            case 'open':
                this.openApp(app);
                break;
            case 'pin':
                this.pinApp(app);
                break;
            case 'unpin':
                this.unpinApp(app);
                break;
        }
    }

    pinApp(app) {
        if (!this.pinnedApps.some(pinnedApp => pinnedApp.id === app.id)) {
            this.pinnedApps.push(app);
            window.storage.savePinnedApps(this.pinnedApps);
            this.renderPinnedApps();
        }
    }

    unpinApp(app) {
        this.pinnedApps = this.pinnedApps.filter(pinnedApp => pinnedApp.id !== app.id);
        window.storage.savePinnedApps(this.pinnedApps);
        this.renderPinnedApps();
    }

    handlePowerAction(action) {
        switch (action) {
            case 'lock':
                this.lockScreen();
                break;
            case 'restart':
                this.restart();
                break;
            case 'shutdown':
                this.shutdown();
                break;
        }
        this.close();
    }

    lockScreen() {
        const lockScreen = document.getElementById('lockScreen');
        if (lockScreen) {
            lockScreen.classList.remove('hidden');
            
            // Focus password input
            setTimeout(() => {
                const passwordInput = document.getElementById('lockPassword');
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 100);
        }
    }

    restart() {
        if (confirm('Are you sure you want to restart?')) {
            // Simulate restart
            document.body.style.opacity = '0';
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    }

    shutdown() {
        if (confirm('Are you sure you want to shut down?')) {
            // Simulate shutdown
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: #000;
                        color: #fff;
                        font-family: var(--font-family);
                        font-size: 24px;
                    ">
                        System Shutdown
                    </div>
                `;
            }, 1000);
        }
    }

    showUserMenu() {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-item" data-action="account">
                <span class="context-icon">👤</span>
                <span>Account Settings</span>
            </div>
            <div class="context-item" data-action="lock">
                <span class="context-icon">🔒</span>
                <span>Lock</span>
            </div>
            <div class="context-item" data-action="signout">
                <span class="context-icon">🚪</span>
                <span>Sign Out</span>
            </div>
        `;

        const userInfo = document.querySelector('.user-info');
        const rect = userInfo.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.bottom = '80px';
        document.body.appendChild(menu);

        // Event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleUserAction(action);
            }
            menu.remove();
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    handleUserAction(action) {
        switch (action) {
            case 'account':
                this.openApp({
                    id: 'settings',
                    name: 'Settings',
                    icon: '⚙️',
                    app: 'settings'
                });
                break;
            case 'lock':
                this.lockScreen();
                break;
            case 'signout':
                this.lockScreen();
                break;
        }
    }

    updateUserInfo() {
        const settings = window.storage.getSettings();
        const userNameElements = document.querySelectorAll('#startUserName, #lockUserName');
        
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = settings.username || 'User';
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const startMenu = document.getElementById('startMenu');
        const startButton = document.getElementById('startButton');
        
        if (startMenu && startButton) {
            startMenu.classList.remove('hidden');
            startButton.classList.add('active');
            this.isOpen = true;
            
            // Focus search input
            setTimeout(() => {
                const startSearch = document.getElementById('startSearch');
                if (startSearch) {
                    startSearch.focus();
                }
            }, 100);
        }
    }

    close() {
        const startMenu = document.getElementById('startMenu');
        const startButton = document.getElementById('startButton');
        
        if (startMenu && startButton) {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
            this.isOpen = false;
            this.clearSearch();
        }
    }
}

// Initialize start menu manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.startMenuManager = new StartMenuManager();
});