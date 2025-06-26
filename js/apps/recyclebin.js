// Recycle Bin Application - recycle bin ka application hai ye
class RecycleBinApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.selectedItems = [];
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadContent();
    }

    render() {
        this.container.innerHTML = `
            <div class="recyclebin-app">
                <div class="recyclebin-toolbar">
                    <div class="recyclebin-info">
                        <span id="itemCount">0 items</span>
                    </div>
                    <div class="recyclebin-actions">
                        <button class="nav-btn" id="restoreBtn" disabled title="Restore Selected">↩️ Restore</button>
                        <button class="nav-btn" id="deleteBtn" disabled title="Delete Permanently">🗑️ Delete</button>
                        <button class="nav-btn" id="emptyBtn" title="Empty Recycle Bin">🧹 Empty</button>
                        <button class="nav-btn" id="refreshBtn" title="Refresh">🔄</button>
                    </div>
                </div>
                
                <div class="recyclebin-content">
                    <div id="recycleBinItems" class="recycle-bin-items">
                        <!-- Content will be loaded here - content yahan load hoga -->
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Action buttons - action buttons setup kar rahe hai
        this.container.querySelector('#restoreBtn').addEventListener('click', () => this.restoreSelected());
        this.container.querySelector('#deleteBtn').addEventListener('click', () => this.deleteSelected());
        this.container.querySelector('#emptyBtn').addEventListener('click', () => this.emptyRecycleBin());
        this.container.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());

        // Keyboard shortcuts - keyboard shortcuts setup kar rahe hai
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
                this.deleteSelected();
            } else if (e.key === 'Enter') {
                this.restoreSelected();
            } else if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
        });
    }

    loadContent() {
        const itemsContainer = this.container.querySelector('#recycleBinItems');
        const items = window.fileSystem.getRecycleBinContents();
        
        if (items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="recyclebin-empty">
                    <div class="recyclebin-empty-icon">🗑️</div>
                    <div class="empty-title">Recycle Bin is empty</div>
                    <div class="empty-subtitle">Items you delete will appear here</div>
                </div>
            `;
        } else {
            itemsContainer.innerHTML = `
                <div class="recycle-bin-list">
                    ${items.map(item => this.createItemElement(item)).join('')}
                </div>
            `;

            // Add event listeners to items - items ko event listeners add kar rahe hai
            itemsContainer.querySelectorAll('.recycle-item').forEach(element => {
                element.addEventListener('click', (e) => this.handleItemClick(e, element));
                element.addEventListener('dblclick', (e) => this.handleItemDoubleClick(e, element));
                element.addEventListener('contextmenu', (e) => this.handleItemContextMenu(e, element));
            });
        }

        this.updateItemCount(items.length);
        this.updateActionButtons();
    }

    createItemElement(item) {
        const icon = window.fileSystem.getFileIcon(item);
        const deleteDate = new Date(item.deletedDate).toLocaleDateString();
        const originalPath = item.originalPath || 'Unknown';
        const size = item.type === 'file' ? window.fileSystem.formatSize(item.size || 0) : '--';

        return `
            <div class="recycle-item" data-path="${item.path}">
                <div class="item-checkbox">
                    <input type="checkbox" class="item-select">
                </div>
                <div class="item-icon">${icon}</div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-info">
                        <span class="item-original-path">Original: ${originalPath}</span>
                        <span class="item-delete-date">Deleted: ${deleteDate}</span>
                        <span class="item-size">${size}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="action-btn restore-btn" title="Restore">↩️</button>
                    <button class="action-btn delete-btn" title="Delete Permanently">🗑️</button>
                </div>
            </div>
        `;
    }

    handleItemClick(e, element) {
        // Handle checkbox click - checkbox click handle kar rahe hai
        if (e.target.classList.contains('item-select')) {
            this.updateSelection();
            return;
        }

        // Handle action buttons - action buttons handle kar rahe hai
        if (e.target.classList.contains('restore-btn')) {
            e.stopPropagation();
            this.restoreItem(element.dataset.path);
            return;
        }

        if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation();
            this.deleteItem(element.dataset.path);
            return;
        }

        // Handle item selection - item selection handle kar rahe hai
        if (!e.ctrlKey) {
            this.clearSelection();
        }
        
        const checkbox = element.querySelector('.item-select');
        checkbox.checked = !checkbox.checked;
        this.updateSelection();
    }

    handleItemDoubleClick(e, element) {
        // Double-click to restore - double-click karne se restore ho jata hai
        this.restoreItem(element.dataset.path);
    }

    handleItemContextMenu(e, element) {
        e.preventDefault();
        this.showContextMenu(e, element.dataset.path);
    }

    showContextMenu(e, itemPath) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-item" data-action="restore">
                <span class="context-icon">↩️</span>
                <span>Restore</span>
            </div>
            <div class="context-item" data-action="delete">
                <span class="context-icon">🗑️</span>
                <span>Delete Permanently</span>
            </div>
            <div class="context-divider"></div>
            <div class="context-item" data-action="properties">
                <span class="context-icon">ℹ️</span>
                <span>Properties</span>
            </div>
        `;

        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        document.body.appendChild(menu);

        // Event listeners - context menu ke event listeners setup kar rahe hai
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleContextAction(action, itemPath);
            }
            menu.remove();
        });

        // Close on outside click - bahar click karne pe close kar rahe hai
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    handleContextAction(action, itemPath) {
        switch (action) {
            case 'restore':
                this.restoreItem(itemPath);
                break;
            case 'delete':
                this.deleteItem(itemPath);
                break;
            case 'properties':
                this.showItemProperties(itemPath);
                break;
        }
    }

    restoreItem(itemPath) {
        if (window.fileSystem.restore(itemPath)) {
            this.loadContent();
            this.showNotification('Item restored successfully', 'success');
        } else {
            this.showNotification('Failed to restore item', 'error');
        }
    }

    deleteItem(itemPath) {
        const item = window.fileSystem.getItem(itemPath);
        if (!item) return;

        if (confirm(`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`)) {
            if (window.fileSystem.permanentDelete(itemPath)) {
                this.loadContent();
                this.showNotification('Item permanently deleted', 'warning');
            } else {
                this.showNotification('Failed to delete item', 'error');
            }
        }
    }

    restoreSelected() {
        const selectedPaths = this.getSelectedPaths();
        if (selectedPaths.length === 0) {
            this.showNotification('No items selected', 'warning');
            return;
        }

        const confirmMessage = selectedPaths.length === 1 
            ? 'Restore selected item?'
            : `Restore ${selectedPaths.length} selected items?`;

        if (confirm(confirmMessage)) {
            let restored = 0;
            selectedPaths.forEach(path => {
                if (window.fileSystem.restore(path)) {
                    restored++;
                }
            });

            this.loadContent();
            if (restored > 0) {
                this.showNotification(`${restored} item(s) restored successfully`, 'success');
            }
        }
    }

    deleteSelected() {
        const selectedPaths = this.getSelectedPaths();
        if (selectedPaths.length === 0) {
            this.showNotification('No items selected', 'warning');
            return;
        }

        const confirmMessage = selectedPaths.length === 1 
            ? 'Permanently delete selected item? This action cannot be undone.'
            : `Permanently delete ${selectedPaths.length} selected items? This action cannot be undone.`;

        if (confirm(confirmMessage)) {
            let deleted = 0;
            selectedPaths.forEach(path => {
                if (window.fileSystem.permanentDelete(path)) {
                    deleted++;
                }
            });

            this.loadContent();
            if (deleted > 0) {
                this.showNotification(`${deleted} item(s) permanently deleted`, 'warning');
            }
        }
    }

    emptyRecycleBin() {
        const items = window.fileSystem.getRecycleBinContents();
        if (items.length === 0) {
            this.showNotification('Recycle Bin is already empty', 'info');
            return;
        }

        if (confirm(`Are you sure you want to permanently delete all ${items.length} items in the Recycle Bin? This action cannot be undone.`)) {
            if (window.fileSystem.emptyRecycleBin()) {
                this.loadContent();
                this.showNotification('Recycle Bin emptied successfully', 'warning');
            } else {
                this.showNotification('Failed to empty Recycle Bin', 'error');
            }
        }
    }

    selectAll() {
        this.container.querySelectorAll('.item-select').forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateSelection();
    }

    clearSelection() {
        this.container.querySelectorAll('.item-select').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateSelection();
    }

    getSelectedPaths() {
        const selected = [];
        this.container.querySelectorAll('.recycle-item').forEach(item => {
            const checkbox = item.querySelector('.item-select');
            if (checkbox.checked) {
                selected.push(item.dataset.path);
            }
        });
        return selected;
    }

    updateSelection() {
        const selectedCount = this.getSelectedPaths().length;
        this.updateActionButtons(selectedCount);
    }

    updateActionButtons(selectedCount = 0) {
        const restoreBtn = this.container.querySelector('#restoreBtn');
        const deleteBtn = this.container.querySelector('#deleteBtn');

        restoreBtn.disabled = selectedCount === 0;
        deleteBtn.disabled = selectedCount === 0;

        if (selectedCount > 0) {
            restoreBtn.textContent = `↩️ Restore (${selectedCount})`;
            deleteBtn.textContent = `🗑️ Delete (${selectedCount})`;
        } else {
            restoreBtn.textContent = '↩️ Restore';
            deleteBtn.textContent = '🗑️ Delete';
        }
    }

    updateItemCount(count) {
        const itemCountElement = this.container.querySelector('#itemCount');
        itemCountElement.textContent = count === 1 ? '1 item' : `${count} items`;
    }

    showItemProperties(itemPath) {
        const item = window.fileSystem.getItem(itemPath);
        if (!item) return;

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
                            <strong>Original Location:</strong> ${item.originalPath || 'Unknown'}
                        </div>
                        <div class="property-row">
                            <strong>Current Location:</strong> ${item.path}
                        </div>
                        ${item.type === 'file' ? `
                            <div class="property-row">
                                <strong>Size:</strong> ${window.fileSystem.formatSize(item.size || 0)}
                            </div>
                        ` : ''}
                        <div class="property-row">
                            <strong>Date Deleted:</strong> ${window.fileSystem.formatDate(item.deletedDate)}
                        </div>
                        <div class="property-row">
                            <strong>Date Created:</strong> ${window.fileSystem.formatDate(item.created || Date.now())}
                        </div>
                        <div class="property-row">
                            <strong>Date Modified:</strong> ${window.fileSystem.formatDate(item.modified || Date.now())}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners - properties modal ke event listeners setup kar rahe hai
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    refresh() {
        this.clearSelection();
        this.loadContent();
        this.showNotification('Recycle Bin refreshed', 'info');
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Recycle Bin',
                message: message,
                type: type,
                icon: '🗑️'
            });
        }
    }
}

// Register the app globally - app ko globally register kar rahe hai
window.RecycleBinApp = RecycleBinApp;