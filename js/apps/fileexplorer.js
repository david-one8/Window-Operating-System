// File Explorer Application - file explorer ka application hai ye
class FileExplorerApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.currentPath = appData.startPath || '/';
        this.viewMode = 'grid'; // 'grid' or 'list' - grid ya list view mode hai
        this.selectedItems = [];
        this.clipboardData = null;
        this.history = [this.currentPath];
        this.historyIndex = 0;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadContent();
        this.updateNavigation();
    }

    render() {
        this.container.innerHTML = `
            <div class="explorer-app">
                <div class="explorer-toolbar">
                    <div class="explorer-nav">
                        <button class="nav-btn" id="backBtn" title="Back">⬅️</button>
                        <button class="nav-btn" id="forwardBtn" title="Forward">➡️</button>
                        <button class="nav-btn" id="upBtn" title="Up">⬆️</button>
                        <button class="nav-btn" id="refreshBtn" title="Refresh">🔄</button>
                    </div>
                    <div class="address-bar">
                        <input type="text" id="addressInput" value="${this.currentPath}" placeholder="Enter path">
                    </div>
                    <div class="view-toggle">
                        <button class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid" title="Grid View">▦</button>
                        <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" data-view="list" title="List View">☰</button>
                    </div>
                    <div class="explorer-actions">
                        <button class="nav-btn" id="newFolderBtn" title="New Folder">📁+</button>
                        <button class="nav-btn" id="newFileBtn" title="New File">📄+</button>
                    </div>
                </div>
                
                <div class="explorer-content">
                    <div class="explorer-sidebar">
                        <div class="sidebar-section">
                            <div class="sidebar-title">Quick Access</div>
                            <div class="sidebar-item" data-path="/Desktop">
                                <span>🖥️</span> Desktop
                            </div>
                            <div class="sidebar-item" data-path="/Documents">
                                <span>📄</span> Documents
                            </div>
                            <div class="sidebar-item" data-path="/Pictures">
                                <span>🖼️</span> Pictures
                            </div>
                            <div class="sidebar-item" data-path="/Music">
                                <span>🎵</span> Music
                            </div>
                            <div class="sidebar-item" data-path="/Videos">
                                <span>🎬</span> Videos
                            </div>
                            <div class="sidebar-item" data-path="/Downloads">
                                <span>📥</span> Downloads
                            </div>
                        </div>
                        <div class="sidebar-section">
                            <div class="sidebar-title">Storage</div>
                            <div class="sidebar-item" data-path="/">
                                <span>💾</span> Local Disk (C:)
                            </div>
                            <div class="sidebar-item" data-path="/RecycleBin">
                                <span>🗑️</span> Recycle Bin
                            </div>
                        </div>
                    </div>
                    
                    <div class="explorer-main">
                        <div id="explorerContent" class="file-${this.viewMode}">
                            <!-- Content will be loaded here - content yahan load hoga -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Navigation buttons - navigation buttons setup kar rahe hai
        this.container.querySelector('#backBtn').addEventListener('click', () => this.goBack());
        this.container.querySelector('#forwardBtn').addEventListener('click', () => this.goForward());
        this.container.querySelector('#upBtn').addEventListener('click', () => this.goUp());
        this.container.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());

        // Address bar - address bar setup kar rahe hai
        const addressInput = this.container.querySelector('#addressInput');
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigateTo(addressInput.value);
            }
        });

        // View toggle - view toggle setup kar rahe hai
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setViewMode(btn.dataset.view);
            });
        });

        // Action buttons - action buttons setup kar rahe hai
        this.container.querySelector('#newFolderBtn').addEventListener('click', () => this.createNewFolder());
        this.container.querySelector('#newFileBtn').addEventListener('click', () => this.createNewFile());

        // Sidebar navigation - sidebar navigation setup kar rahe hai
        this.container.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                if (path) {
                    this.navigateTo(path);
                }
            });
        });

        // Global keyboard shortcuts - global keyboard shortcuts setup kar rahe hai
        this.container.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'c':
                        e.preventDefault();
                        this.copySelected();
                        break;
                    case 'x':
                        e.preventDefault();
                        this.cutSelected();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.paste();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                }
            } else if (e.key === 'Delete') {
                this.deleteSelected();
            } else if (e.key === 'F2') {
                this.renameSelected();
            }
        });

        // Content area context menu - content area ka context menu setup kar rahe hai
        const contentArea = this.container.querySelector('#explorerContent');
        contentArea.addEventListener('contextmenu', (e) => {
            if (e.target === contentArea) {
                e.preventDefault();
                this.showContextMenu(e, null);
            }
        });
    }

    loadContent() {
        const contentContainer = this.container.querySelector('#explorerContent');
        const contents = window.fileSystem.getContents(this.currentPath);
        
        contentContainer.innerHTML = '';
        
        if (contents.length === 0) {
            contentContainer.innerHTML = `
                <div class="empty-folder">
                    <div class="empty-icon">📁</div>
                    <div class="empty-text">This folder is empty</div>
                </div>
            `;
            return;
        }

        contents.forEach(item => {
            const element = this.createFileElement(item);
            contentContainer.appendChild(element);
        });

        this.updateAddressBar();
        this.updateNavigation();
    }

    createFileElement(item) {
        const element = document.createElement('div');
        element.className = `file-item ${this.viewMode === 'list' ? 'list-view' : ''}`;
        element.dataset.path = item.path;
        element.dataset.type = item.type;

        const icon = window.fileSystem.getFileIcon(item);
        const size = item.type === 'file' ? window.fileSystem.formatSize(item.size || 0) : '';
        const modified = window.fileSystem.formatDate(item.modified || Date.now());

        if (this.viewMode === 'grid') {
            element.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${item.name}</div>
            `;
        } else {
            element.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${item.name}</div>
                <div class="file-details">
                    <div class="file-size">${size}</div>
                    <div class="file-date">${modified}</div>
                </div>
            `;
        }

        // Event listeners - event listeners setup kar rahe hai
        element.addEventListener('click', (e) => this.handleItemClick(e, item));
        element.addEventListener('dblclick', (e) => this.handleItemDoubleClick(e, item));
        element.addEventListener('contextmenu', (e) => this.handleItemContextMenu(e, item));

        return element;
    }

    handleItemClick(e, item) {
        if (!e.ctrlKey) {
            this.clearSelection();
        }
        this.selectItem(item.path);
    }

    handleItemDoubleClick(e, item) {
        if (item.type === 'folder') {
            this.navigateTo(item.path);
        } else {
            this.openFile(item);
        }
    }

    handleItemContextMenu(e, item) {
        e.preventDefault();
        this.selectItem(item.path);
        this.showContextMenu(e, item);
    }

    selectItem(path) {
        const element = this.container.querySelector(`[data-path="${path}"]`);
        if (element) {
            element.classList.add('selected');
            if (!this.selectedItems.includes(path)) {
                this.selectedItems.push(path);
            }
        }
    }

    clearSelection() {
        this.container.querySelectorAll('.file-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.selectedItems = [];
    }

    selectAll() {
        this.clearSelection();
        this.container.querySelectorAll('.file-item').forEach(el => {
            const path = el.dataset.path;
            this.selectItem(path);
        });
    }

    navigateTo(path) {
        if (window.fileSystem.exists(path)) {
            this.currentPath = path;
            
            // Update history - history update kar rahe hai
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            this.history.push(path);
            this.historyIndex = this.history.length - 1;
            
            this.clearSelection();
            this.loadContent();
            this.updateSidebarSelection();
        }
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentPath = this.history[this.historyIndex];
            this.clearSelection();
            this.loadContent();
            this.updateSidebarSelection();
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentPath = this.history[this.historyIndex];
            this.clearSelection();
            this.loadContent();
            this.updateSidebarSelection();
        }
    }

    goUp() {
        if (this.currentPath !== '/') {
            const parentPath = window.fileSystem.getParentPath(this.currentPath);
            this.navigateTo(parentPath);
        }
    }

    refresh() {
        this.clearSelection();
        this.loadContent();
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update view buttons - view buttons update kar rahe hai
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        // Update content container - content container update kar rahe hai
        const contentContainer = this.container.querySelector('#explorerContent');
        contentContainer.className = `file-${mode}`;
        
        this.loadContent();
    }

    updateAddressBar() {
        const addressInput = this.container.querySelector('#addressInput');
        addressInput.value = this.currentPath;
    }

    updateNavigation() {
        const backBtn = this.container.querySelector('#backBtn');
        const forwardBtn = this.container.querySelector('#forwardBtn');
        const upBtn = this.container.querySelector('#upBtn');

        backBtn.disabled = this.historyIndex <= 0;
        forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
        upBtn.disabled = this.currentPath === '/';
    }

    updateSidebarSelection() {
        this.container.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.path === this.currentPath);
        });
    }

    createNewFolder() {
        const name = prompt('Enter folder name:', 'New Folder');
        if (name && name.trim()) {
            if (window.fileSystem.createFolder(name.trim(), this.currentPath)) {
                this.loadContent();
                this.showNotification('Folder created successfully', 'success');
            } else {
                this.showNotification('Failed to create folder', 'error');
            }
        }
    }

    createNewFile() {
        const name = prompt('Enter file name:', 'New File.txt');
        if (name && name.trim()) {
            if (window.fileSystem.createFile(name.trim(), '', this.currentPath)) {
                this.loadContent();
                this.showNotification('File created successfully', 'success');
            } else {
                this.showNotification('Failed to create file', 'error');
            }
        }
    }

    copySelected() {
        if (this.selectedItems.length > 0) {
            this.clipboardData = {
                operation: 'copy',
                items: [...this.selectedItems]
            };
            this.showNotification(`${this.selectedItems.length} item(s) copied`, 'info');
        }
    }

    cutSelected() {
        if (this.selectedItems.length > 0) {
            this.clipboardData = {
                operation: 'cut',
                items: [...this.selectedItems]
            };
            this.showNotification(`${this.selectedItems.length} item(s) cut`, 'info');
        }
    }

    paste() {
        if (this.clipboardData && this.clipboardData.items.length > 0) {
            let success = 0;
            
            this.clipboardData.items.forEach(itemPath => {
                if (this.clipboardData.operation === 'copy') {
                    if (window.fileSystem.copy(itemPath)) {
                        if (window.fileSystem.paste(this.currentPath)) {
                            success++;
                        }
                    }
                } else if (this.clipboardData.operation === 'cut') {
                    if (window.fileSystem.cut(itemPath)) {
                        if (window.fileSystem.paste(this.currentPath)) {
                            success++;
                        }
                    }
                }
            });
            
            if (success > 0) {
                this.loadContent();
                this.showNotification(`${success} item(s) pasted`, 'success');
                if (this.clipboardData.operation === 'cut') {
                    this.clipboardData = null;
                }
            }
        }
    }

    deleteSelected() {
        if (this.selectedItems.length === 0) return;
        
        const itemNames = this.selectedItems.map(path => {
            const item = window.fileSystem.getItem(path);
            return item ? item.name : '';
        }).filter(name => name);

        const message = itemNames.length === 1 
            ? `Are you sure you want to delete "${itemNames[0]}"?`
            : `Are you sure you want to delete ${itemNames.length} items?`;

        if (confirm(message)) {
            let deleted = 0;
            this.selectedItems.forEach(path => {
                if (window.fileSystem.delete(path)) {
                    deleted++;
                }
            });
            
            if (deleted > 0) {
                this.clearSelection();
                this.loadContent();
                this.showNotification(`${deleted} item(s) moved to recycle bin`, 'success');
            }
        }
    }

    renameSelected() {
        if (this.selectedItems.length === 1) {
            const path = this.selectedItems[0];
            const item = window.fileSystem.getItem(path);
            if (item) {
                const newName = prompt('Enter new name:', item.name);
                if (newName && newName.trim() && newName !== item.name) {
                    if (window.fileSystem.rename(path, newName.trim())) {
                        this.clearSelection();
                        this.loadContent();
                        this.showNotification('Item renamed successfully', 'success');
                    } else {
                        this.showNotification('Failed to rename item', 'error');
                    }
                }
            }
        }
    }

    openFile(item) {
        // Open file in appropriate app - file ko appropriate app mein open kar rahe hai
        const extension = item.name.split('.').pop().toLowerCase();
        
        if (extension === 'txt') {
            // Open in Notepad - Notepad mein open kar rahe hai
            window.windowManager.openApp('notepad', {
                id: 'notepad_' + Date.now(),
                name: 'Notepad',
                icon: '📝',
                app: 'notepad',
                filePath: item.path
            });
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            // Open in Gallery - Gallery mein open kar rahe hai
            window.windowManager.openApp('gallery', {
                id: 'gallery_' + Date.now(),
                name: 'Gallery',
                icon: '🖼️',
                app: 'gallery',
                filePath: item.path
            });
        } else {
            this.showNotification('No app available to open this file type', 'warning');
        }
    }

    showContextMenu(e, item) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        let menuItems = [];
        
        if (item) {
            // Item-specific menu - item specific menu hai
            menuItems = [
                { icon: '📂', text: 'Open', action: () => this.handleItemDoubleClick(e, item) },
                { divider: true },
                { icon: '📋', text: 'Copy', action: () => this.copySelected() },
                { icon: '✂️', text: 'Cut', action: () => this.cutSelected() },
                { divider: true },
                { icon: '✏️', text: 'Rename', action: () => this.renameSelected() },
                { icon: '🗑️', text: 'Delete', action: () => this.deleteSelected() },
                { divider: true },
                { icon: 'ℹ️', text: 'Properties', action: () => this.showProperties(item) }
            ];
        } else {
            // Empty area menu - empty area ka menu hai
            menuItems = [
                { icon: '📁', text: 'New Folder', action: () => this.createNewFolder() },
                { icon: '📄', text: 'New File', action: () => this.createNewFile() },
                { divider: true },
                { icon: '📋', text: 'Paste', action: () => this.paste(), disabled: !this.clipboardData },
                { divider: true },
                { icon: '🔄', text: 'Refresh', action: () => this.refresh() }
            ];
        }
        
        menu.innerHTML = menuItems.map(item => {
            if (item.divider) {
                return '<div class="context-divider"></div>';
            }
            return `
                <div class="context-item ${item.disabled ? 'disabled' : ''}" ${!item.disabled ? `data-action="${item.text}"` : ''}>
                    <span class="context-icon">${item.icon}</span>
                    <span>${item.text}</span>
                </div>
            `;
        }).join('');

        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        document.body.appendChild(menu);

        // Event listeners - event listeners setup kar rahe hai
        menuItems.forEach((menuItem, index) => {
            if (!menuItem.divider && !menuItem.disabled) {
                const element = menu.children[index];
                element.addEventListener('click', () => {
                    menuItem.action();
                    menu.remove();
                });
            }
        });

        // Close on outside click - bahar click karne pe close kar rahe hai
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    showProperties(item) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${item.name} Properties</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="properties-grid">
                        <div class="property-row">
                            <strong>Name:</strong> ${item.name}
                        </div>
                        <div class="property-row">
                            <strong>Type:</strong> ${item.type === 'folder' ? 'Folder' : 'File'}
                        </div>
                        <div class="property-row">
                            <strong>Location:</strong> ${item.path}
                        </div>
                        ${item.type === 'file' ? `
                            <div class="property-row">
                                <strong>Size:</strong> ${window.fileSystem.formatSize(item.size || 0)}
                            </div>
                        ` : ''}
                        <div class="property-row">
                            <strong>Created:</strong> ${window.fileSystem.formatDate(item.created || Date.now())}
                        </div>
                        <div class="property-row">
                            <strong>Modified:</strong> ${window.fileSystem.formatDate(item.modified || Date.now())}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners - properties dialog ke event listeners setup kar rahe hai
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'File Explorer',
                message: message,
                type: type,
                icon: '📁'
            });
        }
    }
}

// Register the app globally - app ko globally register kar rahe hai
window.FileExplorerApp = FileExplorerApp;