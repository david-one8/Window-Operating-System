// Web Browser Application
class BrowserApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.currentUrl = appData.url || 'https://www.google.com';
        this.history = [this.currentUrl];
        this.historyIndex = 0;
        this.bookmarks = this.loadBookmarks();
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadPage();
    }

    render() {
        this.container.innerHTML = `
            <div class="browser-app">
                <div class="browser-toolbar">
                    <div class="browser-nav">
                        <button class="nav-btn" id="backBtn" title="Back">⬅️</button>
                        <button class="nav-btn" id="forwardBtn" title="Forward">➡️</button>
                        <button class="nav-btn" id="refreshBtn" title="Refresh">🔄</button>
                        <button class="nav-btn" id="homeBtn" title="Home">🏠</button>
                    </div>
                    <div class="url-container">
                        <input type="url" class="browser-url" id="urlInput" 
                               value="${this.currentUrl}" placeholder="Enter URL or search term">
                        <button class="nav-btn" id="goBtn" title="Go">➡️</button>
                    </div>
                    <div class="browser-actions">
                        <button class="nav-btn" id="bookmarkBtn" title="Bookmark">⭐</button>
                        <button class="nav-btn" id="menuBtn" title="Menu">☰</button>
                    </div>
                </div>
                
                <div class="browser-bookmarks" id="bookmarksBar" ${this.bookmarks.length === 0 ? 'style="display: none;"' : ''}>
                    ${this.renderBookmarks()}
                </div>
                
                <div class="browser-content">
                    <div class="browser-loading" id="loadingIndicator">
                        <div class="loading-spinner"></div>
                        <span>Loading...</span>
                    </div>
                    <iframe class="browser-iframe" id="browserFrame" src="about:blank"></iframe>
                    <div class="browser-error" id="errorPage" style="display: none;">
                        <div class="error-icon">🚫</div>
                        <h2>Can't reach this page</h2>
                        <p>The webpage might be temporarily down or it may have moved permanently to a new web address.</p>
                        <button class="retry-btn" id="retryBtn">Try again</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Navigation buttons
        this.container.querySelector('#backBtn').addEventListener('click', () => this.goBack());
        this.container.querySelector('#forwardBtn').addEventListener('click', () => this.goForward());
        this.container.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());
        this.container.querySelector('#homeBtn').addEventListener('click', () => this.goHome());

        // URL input
        const urlInput = this.container.querySelector('#urlInput');
        const goBtn = this.container.querySelector('#goBtn');

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigate(urlInput.value);
            }
        });

        goBtn.addEventListener('click', () => {
            this.navigate(urlInput.value);
        });

        // Other actions
        this.container.querySelector('#bookmarkBtn').addEventListener('click', () => this.toggleBookmark());
        this.container.querySelector('#menuBtn').addEventListener('click', () => this.showMenu());
        this.container.querySelector('#retryBtn').addEventListener('click', () => this.loadPage());

        // Iframe load events
        const iframe = this.container.querySelector('#browserFrame');
        iframe.addEventListener('load', () => this.onPageLoad());
        iframe.addEventListener('error', () => this.onPageError());

        // Update navigation state
        this.updateNavigation();
    }

    loadPage() {
        const iframe = this.container.querySelector('#browserFrame');
        const loading = this.container.querySelector('#loadingIndicator');
        const error = this.container.querySelector('#errorPage');

        loading.style.display = 'flex';
        error.style.display = 'none';
        iframe.style.display = 'none';

        try {
            // Check if URL is valid
            let url = this.currentUrl;
            
            // Add protocol if missing
            if (!url.match(/^https?:\/\//)) {
                if (url.includes('.') && !url.includes(' ')) {
                    url = 'https://' + url;
                } else {
                    // Treat as search query
                    url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
                }
            }

            iframe.src = url;
            this.currentUrl = url;
            this.container.querySelector('#urlInput').value = url;
            
        } catch (error) {
            this.onPageError();
        }
    }

    onPageLoad() {
        const iframe = this.container.querySelector('#browserFrame');
        const loading = this.container.querySelector('#loadingIndicator');
        const error = this.container.querySelector('#errorPage');

        loading.style.display = 'none';
        error.style.display = 'none';
        iframe.style.display = 'block';

        // Update window title
        this.updateWindowTitle();
        
        // Update bookmark button state
        this.updateBookmarkButton();
    }

    onPageError() {
        const iframe = this.container.querySelector('#browserFrame');
        const loading = this.container.querySelector('#loadingIndicator');
        const error = this.container.querySelector('#errorPage');

        loading.style.display = 'none';
        iframe.style.display = 'none';
        error.style.display = 'flex';
    }

    navigate(url) {
        if (!url.trim()) return;

        this.currentUrl = url.trim();
        
        // Update history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(this.currentUrl);
        this.historyIndex = this.history.length - 1;

        this.loadPage();
        this.updateNavigation();
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentUrl = this.history[this.historyIndex];
            this.loadPage();
            this.updateNavigation();
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentUrl = this.history[this.historyIndex];
            this.loadPage();
            this.updateNavigation();
        }
    }

    refresh() {
        this.loadPage();
    }

    goHome() {
        this.navigate('https://www.google.com');
    }

    updateNavigation() {
        const backBtn = this.container.querySelector('#backBtn');
        const forwardBtn = this.container.querySelector('#forwardBtn');

        backBtn.disabled = this.historyIndex <= 0;
        forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    updateWindowTitle() {
        const windowElement = this.container.closest('.window');
        if (windowElement) {
            const titleElement = windowElement.querySelector('.window-title');
            if (titleElement) {
                try {
                    const domain = new URL(this.currentUrl).hostname;
                    titleElement.textContent = `${domain} - Browser`;
                } catch {
                    titleElement.textContent = 'Browser';
                }
            }
        }
    }

    toggleBookmark() {
        const isBookmarked = this.isCurrentPageBookmarked();
        
        if (isBookmarked) {
            this.removeBookmark();
        } else {
            this.addBookmark();
        }
    }

    isCurrentPageBookmarked() {
        return this.bookmarks.some(bookmark => bookmark.url === this.currentUrl);
    }

    addBookmark() {
        try {
            const domain = new URL(this.currentUrl).hostname;
            const bookmark = {
                id: Date.now(),
                title: domain,
                url: this.currentUrl,
                created: Date.now()
            };

            this.bookmarks.push(bookmark);
            this.saveBookmarks();
            this.updateBookmarks();
            this.updateBookmarkButton();
            
            this.showNotification('Page bookmarked', 'success');
        } catch {
            this.showNotification('Failed to bookmark page', 'error');
        }
    }

    removeBookmark() {
        this.bookmarks = this.bookmarks.filter(bookmark => bookmark.url !== this.currentUrl);
        this.saveBookmarks();
        this.updateBookmarks();
        this.updateBookmarkButton();
        
        this.showNotification('Bookmark removed', 'info');
    }

    updateBookmarkButton() {
        const bookmarkBtn = this.container.querySelector('#bookmarkBtn');
        const isBookmarked = this.isCurrentPageBookmarked();
        
        bookmarkBtn.innerHTML = isBookmarked ? '⭐' : '☆';
        bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Add bookmark';
        bookmarkBtn.classList.toggle('bookmarked', isBookmarked);
    }

    renderBookmarks() {
        return this.bookmarks.map(bookmark => `
            <div class="bookmark-item" data-url="${bookmark.url}" title="${bookmark.url}">
                <span class="bookmark-icon">🔖</span>
                <span class="bookmark-title">${bookmark.title}</span>
                <button class="bookmark-remove" data-id="${bookmark.id}">×</button>
            </div>
        `).join('');
    }

    updateBookmarks() {
        const bookmarksBar = this.container.querySelector('#bookmarksBar');
        bookmarksBar.innerHTML = this.renderBookmarks();
        bookmarksBar.style.display = this.bookmarks.length > 0 ? 'flex' : 'none';

        // Add event listeners to bookmarks
        bookmarksBar.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('bookmark-remove')) {
                    this.navigate(item.dataset.url);
                }
            });
        });

        bookmarksBar.querySelectorAll('.bookmark-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bookmarkId = parseInt(btn.dataset.id);
                this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
                this.saveBookmarks();
                this.updateBookmarks();
                this.updateBookmarkButton();
            });
        });
    }

    showMenu() {
        const menu = document.createElement('div');
        menu.className = 'context-menu browser-menu';
        menu.innerHTML = `
            <div class="context-item" data-action="new-tab">
                <span class="context-icon">📄</span>
                <span>New Tab</span>
            </div>
            <div class="context-item" data-action="bookmarks">
                <span class="context-icon">⭐</span>
                <span>Bookmarks</span>
            </div>
            <div class="context-item" data-action="history">
                <span class="context-icon">🕐</span>
                <span>History</span>
            </div>
            <div class="context-divider"></div>
            <div class="context-item" data-action="settings">
                <span class="context-icon">⚙️</span>
                <span>Settings</span>
            </div>
            <div class="context-item" data-action="about">
                <span class="context-icon">ℹ️</span>
                <span>About Browser</span>
            </div>
        `;

        const menuBtn = this.container.querySelector('#menuBtn');
        const rect = menuBtn.getBoundingClientRect();
        menu.style.left = rect.right - 200 + 'px';
        menu.style.top = rect.bottom + 'px';
        
        document.body.appendChild(menu);

        // Event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleMenuAction(action);
            }
            menu.remove();
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new-tab':
                // Open new browser window
                window.windowManager.openApp('browser', {
                    id: 'browser_' + Date.now(),
                    name: 'Web Browser',
                    icon: '🌐',
                    app: 'browser'
                });
                break;
            case 'bookmarks':
                this.showBookmarksDialog();
                break;
            case 'history':
                this.showHistoryDialog();
                break;
            case 'settings':
                this.showBrowserSettings();
                break;
            case 'about':
                this.showAboutDialog();
                break;
        }
    }

    showBookmarksDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Bookmarks</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="bookmarks-list">
                        ${this.bookmarks.length === 0 ? 
                            '<div class="empty-state">No bookmarks yet</div>' :
                            this.bookmarks.map(bookmark => `
                                <div class="bookmark-entry">
                                    <div class="bookmark-info">
                                        <div class="bookmark-title">${bookmark.title}</div>
                                        <div class="bookmark-url">${bookmark.url}</div>
                                    </div>
                                    <div class="bookmark-actions">
                                        <button class="btn-visit" data-url="${bookmark.url}">Visit</button>
                                        <button class="btn-delete" data-id="${bookmark.id}">Delete</button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        modal.querySelectorAll('.btn-visit').forEach(btn => {
            btn.onclick = () => {
                this.navigate(btn.dataset.url);
                modal.remove();
            };
        });

        modal.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => {
                const bookmarkId = parseInt(btn.dataset.id);
                this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
                this.saveBookmarks();
                this.updateBookmarks();
                modal.remove();
                this.updateBookmarkButton();
            };
        });
    }

    showHistoryDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Browser History</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="history-list">
                        ${this.history.map((url, index) => `
                            <div class="history-entry ${index === this.historyIndex ? 'current' : ''}">
                                <span class="history-url">${url}</span>
                                <button class="btn-visit" data-url="${url}">Visit</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        modal.querySelectorAll('.btn-visit').forEach(btn => {
            btn.onclick = () => {
                this.navigate(btn.dataset.url);
                modal.remove();
            };
        });
    }

    showBrowserSettings() {
        this.showNotification('Browser settings not implemented yet', 'info');
    }

    showAboutDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>About Browser</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="about-content">
                        <div class="about-icon">🌐</div>
                        <h2>Windows 11 Browser Clone</h2>
                        <p>Version 1.0.0</p>
                        <p>A simple web browser built with HTML, CSS, and JavaScript.</p>
                        <p>Part of the Windows 11 OS Clone project.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    loadBookmarks() {
        return window.storage.get('browser_bookmarks', []);
    }

    saveBookmarks() {
        window.storage.set('browser_bookmarks', this.bookmarks);
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Browser',
                message: message,
                type: type,
                icon: '🌐'
            });
        }
    }
}

// Register the app globally
window.BrowserApp = BrowserApp;