// Desktop Environment Management - desktop environment manage kar rahe hai
class DesktopManager {
    constructor() {
        this.icons = [];
        this.selectedIcons = [];
        this.draggedIcon = null;
        this.contextMenu = null;
        this.gridSize = 80;
        this.init();
    }

    init() {
        this.loadIcons();
        this.renderIcons();
        this.setupEventListeners();
    }

    loadIcons() {
        // Always ensure all default apps are present - hamesha ensure karte hai ki saare default apps present hai
        const defaultIcons = [
            { id: 'notepad', name: 'Notepad', icon: '📝', app: 'notepad', x: 0, y: 0 },
            { id: 'explorer', name: 'File Explorer', icon: '📁', app: 'fileexplorer', x: 0, y: 1 },
            { id: 'browser', name: 'Web Browser', icon: '🌐', app: 'browser', x: 0, y: 2 },
            { id: 'settings', name: 'Settings', icon: '⚙️', app: 'settings', x: 0, y: 3 },
            { id: 'gallery', name: 'Gallery', icon: '🖼️', app: 'gallery', x: 1, y: 0 },
            { id: 'calendar', name: 'Calendar', icon: '🗓️', app: 'calendar', x: 1, y: 1 },
            { id: 'recyclebin', name: 'Recycle Bin', icon: '🗑️', app: 'recyclebin', x: 1, y: 2 }
        ];
        this.icons = window.storage.getDesktopIcons();
        // Add any missing default icons - koi bhi missing default icons add karte hai
        defaultIcons.forEach(defIcon => {
            if (!this.icons.some(icon => icon.id === defIcon.id)) {
                this.icons.push({ ...defIcon });
            }
        });
        this.saveIcons();
    }

    saveIcons() {
        window.storage.saveDesktopIcons(this.icons);
    }

    renderIcons() {
        const container = document.getElementById('desktopIcons');
        if (!container) return;

        container.innerHTML = '';

        this.icons.forEach(icon => {
            const iconElement = this.createIconElement(icon);
            container.appendChild(iconElement);
        });
    }

    createIconElement(icon) {
        const element = document.createElement('div');
        element.className = 'desktop-icon';
        element.dataset.iconId = icon.id;
        element.style.gridColumn = icon.x + 1;
        element.style.gridRow = icon.y + 1;
        
        element.innerHTML = `
            <div class="icon-image">${icon.icon}</div>
            <div class="icon-label">${icon.name}</div>
        `;

        // Event listeners - event listeners setup kar rahe hai
        element.addEventListener('click', (e) => this.handleIconClick(e, icon));
        element.addEventListener('dblclick', (e) => this.handleIconDoubleClick(e, icon));
        element.addEventListener('mousedown', (e) => this.handleIconMouseDown(e, icon, element));
        element.addEventListener('contextmenu', (e) => this.handleIconContextMenu(e, icon));

        return element;
    }

    handleIconClick(e, icon) {
        e.stopPropagation();
        
        if (!e.ctrlKey) {
            this.clearSelection();
        }
        
        this.selectIcon(icon.id);
    }

    handleIconDoubleClick(e, icon) {
        e.stopPropagation();
        this.openApp(icon.app, icon);
    }

    handleIconMouseDown(e, icon, element) {
        if (e.button !== 0) return; // Only left mouse button - sirf left mouse button
        
        this.draggedIcon = {
            icon: icon,
            element: element,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - element.getBoundingClientRect().left,
            offsetY: e.clientY - element.getBoundingClientRect().top
        };

        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseMove(e) {
        if (!this.draggedIcon) return;

        const { element, startX, startY } = this.draggedIcon;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;        
        // Start dragging if moved enough - agar kaafi move ho gaya hai to dragging start karte hai
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            element.classList.add('dragging');
            element.style.position = 'fixed';
            element.style.left = e.clientX - this.draggedIcon.offsetX + 'px';
            element.style.top = e.clientY - this.draggedIcon.offsetY + 'px';
            element.style.zIndex = '9999';
            element.style.pointerEvents = 'none';
        }
    }

    handleMouseUp(e) {
        if (!this.draggedIcon) return;

        const { icon, element } = this.draggedIcon;
        
        if (element.classList.contains('dragging')) {
            // Calculate new grid position - naya grid position calculate karte hai
            const container = document.getElementById('desktopIcons');
            const containerRect = container.getBoundingClientRect();
            const x = Math.floor((e.clientX - containerRect.left) / this.gridSize);
            const y = Math.floor((e.clientY - containerRect.top) / this.gridSize);            
            // Update icon position - icon position update karte hai
            this.updateIconPosition(icon.id, x, y);

            // Reset element styles - element styles reset karte hai
            element.classList.remove('dragging');
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.zIndex = '';
            element.style.pointerEvents = '';
        }

        this.draggedIcon = null;
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleIconContextMenu(e, icon) {
        e.preventDefault();
        this.showIconContextMenu(e, icon);
    }

    selectIcon(iconId) {
        if (!this.selectedIcons.includes(iconId)) {
            this.selectedIcons.push(iconId);
        }
        this.updateIconSelection();
    }

    clearSelection() {
        this.selectedIcons = [];
        this.updateIconSelection();
    }

    updateIconSelection() {
        document.querySelectorAll('.desktop-icon').forEach(element => {
            const iconId = element.dataset.iconId;
            element.classList.toggle('selected', this.selectedIcons.includes(iconId));
        });
    }

    updateIconPosition(iconId, x, y) {
        const icon = this.icons.find(i => i.id === iconId);
        if (icon) {
            icon.x = Math.max(0, x);
            icon.y = Math.max(0, y);
            this.saveIcons();
            this.renderIcons();
        }
    }

    openApp(appName, icon) {
        if (window.windowManager) {
            window.windowManager.openApp(appName, icon);
            
            // Add to recent apps - recent apps mein add karte hai
            window.storage.addRecentApp({
                id: icon.id,
                name: icon.name,
                icon: icon.icon,
                app: appName
            });
        }
    }

    showIconContextMenu(e, icon) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-item" data-action="open">
                <span class="context-icon">📂</span>
                <span>Open</span>
            </div>
            <div class="context-divider"></div>
            <div class="context-item" data-action="rename">
                <span class="context-icon">✏️</span>
                <span>Rename</span>
            </div>
            <div class="context-item" data-action="delete">
                <span class="context-icon">🗑️</span>
                <span>Delete</span>
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
        this.contextMenu = menu;

        // Event listeners - event listeners setup kar rahe hai
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleIconContextAction(action, icon);
            }
        });

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 0);
    }

    handleIconContextAction(action, icon) {
        switch (action) {
            case 'open':
                this.openApp(icon.app, icon);
                break;
            case 'rename':
                this.renameIcon(icon);
                break;
            case 'delete':
                this.deleteIcon(icon);
                break;
            case 'properties':
                this.showIconProperties(icon);
                break;
        }
        this.hideContextMenu();
    }

    renameIcon(icon) {
        const newName = prompt('Enter new name:', icon.name);
        if (newName && newName.trim() && newName !== icon.name) {
            icon.name = newName.trim();
            this.saveIcons();
            this.renderIcons();
        }
    }

    deleteIcon(icon) {
        if (confirm(`Are you sure you want to delete "${icon.name}"?`)) {
            this.icons = this.icons.filter(i => i.id !== icon.id);
            this.saveIcons();
            this.renderIcons();
        }
    }

    showIconProperties(icon) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${icon.name} Properties</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="properties-grid">
                        <div class="property-row">
                            <strong>Name:</strong> ${icon.name}
                        </div>
                        <div class="property-row">
                            <strong>Type:</strong> Application
                        </div>
                        <div class="property-row">
                            <strong>Position:</strong> (${icon.x}, ${icon.y})
                        </div>
                        <div class="property-row">
                            <strong>Icon:</strong> ${icon.icon}
                        </div>
                    </div>
                </div>
            </div>
        `;        
        document.body.appendChild(modal);

        // Event listeners - event listeners setup kar rahe hai
        modal.querySelector('.modal-close').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    setupEventListeners() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Desktop click - desktop click handle kar rahe hai
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop) {
                this.clearSelection();
                this.hideContextMenu();
            }
        });        
        // Desktop context menu - desktop context menu setup kar rahe hai
        desktop.addEventListener('contextmenu', (e) => {
            if (e.target === desktop) {
                e.preventDefault();
                this.showDesktopContextMenu(e);
            }
        });        
        // Keyboard shortcuts - keyboard shortcuts setup kar rahe hai
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedIcons.length > 0) {
                this.deleteSelectedIcons();
            } else if (e.key === 'F2' && this.selectedIcons.length === 1) {
                const icon = this.icons.find(i => i.id === this.selectedIcons[0]);
                if (icon) this.renameIcon(icon);
            }
        });
    }

    showDesktopContextMenu(e) {
        this.hideContextMenu();
        
        const menu = document.getElementById('contextMenu');
        if (!menu) return;

        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.remove('hidden');
        this.contextMenu = menu;

        // Event listeners - event listeners setup kar rahe hai
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-item')?.dataset.action;
            if (action) {
                this.handleDesktopContextAction(action, e);
            }
        });

        // Close on outside click - bahar click karne par close kar dete hai
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu.bind(this), { once: true });
        }, 0);
    }

    handleDesktopContextAction(action, e) {
        switch (action) {
            case 'refresh':
                this.refreshDesktop();
                break;
            case 'new-folder':
                this.createNewFolder(e);
                break;
            case 'wallpaper':
                window.themeManager.openThemePanel();
                break;
            case 'display':
                this.openDisplaySettings();
                break;
        }
        this.hideContextMenu();
    }

    refreshDesktop() {
        this.loadIcons();
        this.renderIcons();
        
        // Show notification - notification dikhate hai
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Desktop',
                message: 'Desktop refreshed',
                type: 'info'
            });
        }
    }

    createNewFolder(e) {
        const name = prompt('Enter folder name:', 'New Folder');
        if (name && name.trim()) {
            // Calculate grid position from click - click se grid position calculate karte hai
            const container = document.getElementById('desktopIcons');
            const containerRect = container.getBoundingClientRect();
            const x = Math.floor((e.clientX - containerRect.left) / this.gridSize);
            const y = Math.floor((e.clientY - containerRect.top) / this.gridSize);

            const newIcon = {
                id: 'folder_' + Date.now(),
                name: name.trim(),
                icon: '📁',
                app: 'fileexplorer',
                x: Math.max(0, x),
                y: Math.max(0, y)
            };

            this.icons.push(newIcon);
            this.saveIcons();
            this.renderIcons();
        }
    }

    openDisplaySettings() {
        if (window.windowManager) {
            window.windowManager.openApp('settings', {
                id: 'settings',
                name: 'Settings',
                icon: '⚙️',
                app: 'settings'
            });
        }
    }

    deleteSelectedIcons() {
        if (this.selectedIcons.length === 0) return;

        const iconNames = this.selectedIcons.map(id => {
            const icon = this.icons.find(i => i.id === id);
            return icon ? icon.name : '';
        }).filter(name => name);

        const message = iconNames.length === 1 
            ? `Are you sure you want to delete "${iconNames[0]}"?`
            : `Are you sure you want to delete ${iconNames.length} items?`;

        if (confirm(message)) {
            this.icons = this.icons.filter(icon => !this.selectedIcons.includes(icon.id));
            this.selectedIcons = [];
            this.saveIcons();
            this.renderIcons();
        }
    }

    hideContextMenu() {
        if (this.contextMenu) {
            if (this.contextMenu.id === 'contextMenu') {
                this.contextMenu.classList.add('hidden');
            } else {
                this.contextMenu.remove();
            }
            this.contextMenu = null;
        }
    }

    addIcon(icon) {
        // Find empty position - empty position dhundte hai
        const usedPositions = new Set();
        this.icons.forEach(existingIcon => {
            usedPositions.add(`${existingIcon.x},${existingIcon.y}`);
        });

        let x = 0, y = 0;
        while (usedPositions.has(`${x},${y}`)) {
            y++;
            if (y > 10) {
                y = 0;
                x++;
            }
        }

        const newIcon = {
            ...icon,
            x: x,
            y: y
        };

        this.icons.push(newIcon);
        this.saveIcons();
        this.renderIcons();
    }
}

// Initialize desktop manager when DOM is loaded - DOM load hone par desktop manager initialize karte hai
document.addEventListener('DOMContentLoaded', () => {
    window.desktopManager = new DesktopManager();
});