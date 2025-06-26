// Window Management System
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndex = 1000;
        this.dragState = null;
        this.resizeState = null;
        this.snapZones = {
            left: { x: 0, y: 0, width: 0.5, height: 1 },
            right: { x: 0.5, y: 0, width: 0.5, height: 1 },
            maximize: { x: 0, y: 0, width: 1, height: 1 }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadWindowStates();
    }

    setupEventListeners() {
        // Global mouse events for dragging and resizing
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    loadWindowStates() {
        const states = window.storage.getWindowStates();
        // Restore window positions and sizes if needed
        this.windowStates = states;
    }

    saveWindowStates() {
        const states = {};
        this.windows.forEach((windowData, windowId) => {
            const element = windowData.element;
            states[windowId] = {
                x: parseInt(element.style.left) || 0,
                y: parseInt(element.style.top) || 0,
                width: parseInt(element.style.width) || 800,
                height: parseInt(element.style.height) || 600,
                maximized: element.classList.contains('maximized'),
                minimized: element.classList.contains('minimized')
            };
        });
        window.storage.saveWindowStates(states);
    }

    openApp(appName, appData = {}) {
        const windowId = this.generateWindowId();
        const windowElement = this.createWindow(windowId, appName, appData);
        
        // Add to taskbar
        if (window.taskbarManager) {
            window.taskbarManager.addApp(appData.id || appName, appData);
            window.taskbarManager.addWindow(appData.id || appName, windowId);
        }

        // Initialize app content
        this.initializeApp(windowElement, appName, appData);
        
        // Focus the new window
        this.focusWindow(windowId);
        
        return windowId;
    }

    generateWindowId() {
        return 'window_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    createWindow(windowId, appName, appData) {
        const container = document.getElementById('windowsContainer');
        if (!container) return null;

        const windowElement = document.createElement('div');
        windowElement.className = 'window opening';
        windowElement.dataset.windowId = windowId;
        windowElement.dataset.appName = appName;

        // Default window size and position
        const defaultWidth = 800;
        const defaultHeight = 600;
        const x = Math.max(0, (window.innerWidth - defaultWidth) / 2 + (this.windows.size * 30));
        const y = Math.max(0, (window.innerHeight - defaultHeight - 60) / 2 + (this.windows.size * 30));

        windowElement.style.width = defaultWidth + 'px';
        windowElement.style.height = defaultHeight + 'px';
        windowElement.style.left = x + 'px';
        windowElement.style.top = y + 'px';
        windowElement.style.zIndex = ++this.zIndex;

        // Window structure
        windowElement.innerHTML = `
            <div class="window-header">
                <div class="window-icon">${appData.icon || '📄'}</div>
                <div class="window-title">${appData.name || appName}</div>
                <div class="window-controls">
                    <button class="window-control minimize" title="Minimize"></button>
                    <button class="window-control maximize" title="Maximize"></button>
                    <button class="window-control close" title="Close"></button>
                </div>
            </div>
            <div class="window-content">
                <!-- App content will be inserted here -->
            </div>
            ${this.createResizeHandles()}
        `;

        container.appendChild(windowElement);

        // Store window data
        this.windows.set(windowId, {
            element: windowElement,
            appName: appName,
            appData: appData,
            isMaximized: false,
            isMinimized: false,
            originalBounds: null
        });

        // Setup window event listeners
        this.setupWindowEventListeners(windowElement, windowId);

        return windowElement;
    }

    createResizeHandles() {
        return `
            <div class="resize-handle n"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
            <div class="resize-handle w"></div>
            <div class="resize-handle ne"></div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle sw"></div>
        `;
    }

    setupWindowEventListeners(windowElement, windowId) {
        const header = windowElement.querySelector('.window-header');
        const controls = windowElement.querySelectorAll('.window-control');
        const resizeHandles = windowElement.querySelectorAll('.resize-handle');

        // Header dragging
        header.addEventListener('mousedown', (e) => {
            if (e.target === header || e.target.classList.contains('window-icon') || e.target.classList.contains('window-title')) {
                this.startDragging(e, windowId);
            }
        });

        // Double-click to maximize/restore
        header.addEventListener('dblclick', (e) => {
            if (e.target === header || e.target.classList.contains('window-title')) {
                this.toggleMaximize(windowId);
            }
        });

        // Window controls
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = control.classList.contains('minimize') ? 'minimize' :
                              control.classList.contains('maximize') ? 'maximize' :
                              control.classList.contains('close') ? 'close' : null;
                
                if (action) {
                    this.handleWindowControl(windowId, action);
                }
            });
        });

        // Resize handles
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this.startResizing(e, windowId, handle.classList[1]);
            });
        });

        // Focus on click
        windowElement.addEventListener('mousedown', () => {
            this.focusWindow(windowId);
        });
    }

    initializeApp(windowElement, appName, appData) {
        const content = windowElement.querySelector('.window-content');
        if (!content) return;

        switch (appName) {
            case 'notepad':
                if (window.NotepadApp) {
                    new window.NotepadApp(content, appData);
                }
                break;
            case 'fileexplorer':
                if (window.FileExplorerApp) {
                    new window.FileExplorerApp(content, appData);
                }
                break;
            case 'browser':
                if (window.BrowserApp) {
                    new window.BrowserApp(content, appData);
                }
                break;
            case 'settings':
                if (window.SettingsApp) {
                    new window.SettingsApp(content, appData);
                }
                break;
            case 'gallery':
                if (window.GalleryApp) {
                    new window.GalleryApp(content, appData);
                }
                break;
            case 'calendar':
                if (window.CalendarApp) {
                    new window.CalendarApp(content, appData);
                }
                break;
            case 'recyclebin':
                if (window.RecycleBinApp) {
                    new window.RecycleBinApp(content, appData);
                }
                break;
            default:
                content.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h2>App Not Implemented</h2>
                        <p>The ${appName} app is not yet implemented.</p>
                    </div>
                `;
        }
    }

    handleWindowControl(windowId, action) {
        switch (action) {
            case 'minimize':
                this.minimizeWindow(windowId);
                break;
            case 'maximize':
                this.toggleMaximize(windowId);
                break;
            case 'close':
                this.closeWindow(windowId);
                break;
        }
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        element.classList.add('minimizing');
        
        setTimeout(() => {
            element.classList.remove('minimizing');
            element.classList.add('minimized');
            windowData.isMinimized = true;
        }, 250);
    }

    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        element.classList.add('restoring');
        element.classList.remove('minimized');
        
        setTimeout(() => {
            element.classList.remove('restoring');
            windowData.isMinimized = false;
            this.focusWindow(windowId);
        }, 250);
    }

    toggleMaximize(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.isMaximized) {
            this.restoreFromMaximized(windowId);
        } else {
            this.maximizeWindow(windowId);
        }
    }

    maximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        
        // Store original bounds
        windowData.originalBounds = {
            x: parseInt(element.style.left),
            y: parseInt(element.style.top),
            width: parseInt(element.style.width),
            height: parseInt(element.style.height)
        };

        element.classList.add('maximized');
        windowData.isMaximized = true;

        // Update maximize button
        const maximizeBtn = element.querySelector('.window-control.maximize');
        if (maximizeBtn) {
            maximizeBtn.classList.remove('maximize');
            maximizeBtn.classList.add('restore');
            maximizeBtn.title = 'Restore';
        }
    }

    restoreFromMaximized(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.originalBounds) return;

        const element = windowData.element;
        const bounds = windowData.originalBounds;

        element.classList.remove('maximized');
        element.style.left = bounds.x + 'px';
        element.style.top = bounds.y + 'px';
        element.style.width = bounds.width + 'px';
        element.style.height = bounds.height + 'px';

        windowData.isMaximized = false;
        windowData.originalBounds = null;

        // Update restore button back to maximize
        const restoreBtn = element.querySelector('.window-control.restore');
        if (restoreBtn) {
            restoreBtn.classList.remove('restore');
            restoreBtn.classList.add('maximize');
            restoreBtn.title = 'Maximize';
        }
    }

    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        element.classList.add('closing');

        setTimeout(() => {
            // Remove from taskbar
            if (window.taskbarManager) {
                window.taskbarManager.removeWindow(windowData.appData.id || windowData.appName, windowId);
            }

            // Remove from DOM
            element.remove();
            
            // Remove from windows map
            this.windows.delete(windowId);
            
            // Save window states
            this.saveWindowStates();
        }, 250);
    }

    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Remove focus from all windows
        this.windows.forEach((data) => {
            data.element.classList.remove('focused');
        });

        // Focus the target window
        const element = windowData.element;
        element.classList.add('focused');
        element.style.zIndex = ++this.zIndex;

        // Update taskbar
        if (window.taskbarManager) {
            window.taskbarManager.updateTaskbarApps();
        }
    }

    startDragging(e, windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMaximized) return;

        const element = windowData.element;
        const rect = element.getBoundingClientRect();

        this.dragState = {
            windowId: windowId,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left,
            startTop: rect.top,
            isDragging: false
        };

        element.classList.add('dragging');
        this.focusWindow(windowId);
    }

    startResizing(e, windowId, direction) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMaximized) return;

        const element = windowData.element;
        const rect = element.getBoundingClientRect();

        this.resizeState = {
            windowId: windowId,
            direction: direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height,
            startLeft: rect.left,
            startTop: rect.top
        };

        element.classList.add('resizing');
        this.focusWindow(windowId);
    }

    handleMouseMove(e) {
        if (this.dragState) {
            this.handleDragMove(e);
        } else if (this.resizeState) {
            this.handleResizeMove(e);
        }
    }

    handleDragMove(e) {
        if (!this.dragState) return;

        const { windowId, startX, startY, startLeft, startTop } = this.dragState;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Start dragging if moved enough
        if (!this.dragState.isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            this.dragState.isDragging = true;
        }

        if (this.dragState.isDragging) {
            const windowData = this.windows.get(windowId);
            if (!windowData) return;

            const element = windowData.element;
            const newLeft = startLeft + deltaX;
            const newTop = Math.max(0, startTop + deltaY);

            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';

            // Check for snap zones
            this.checkSnapZones(e, windowId);
        }
    }

    handleResizeMove(e) {
        if (!this.resizeState) return;

        const { windowId, direction, startX, startY, startWidth, startHeight, startLeft, startTop } = this.resizeState;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        const minWidth = 300;
        const minHeight = 200;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        // Calculate new dimensions based on resize direction
        if (direction.includes('e')) {
            newWidth = Math.max(minWidth, startWidth + deltaX);
        }
        if (direction.includes('w')) {
            newWidth = Math.max(minWidth, startWidth - deltaX);
            newLeft = startLeft + (startWidth - newWidth);
        }
        if (direction.includes('s')) {
            newHeight = Math.max(minHeight, startHeight + deltaY);
        }
        if (direction.includes('n')) {
            newHeight = Math.max(minHeight, startHeight - deltaY);
            newTop = startTop + (startHeight - newHeight);
        }

        // Apply new dimensions
        element.style.width = newWidth + 'px';
        element.style.height = newHeight + 'px';
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
    }

    handleMouseUp(e) {
        if (this.dragState) {
            this.endDragging(e);
        } else if (this.resizeState) {
            this.endResizing();
        }
    }

    endDragging(e) {
        if (!this.dragState) return;

        const { windowId } = this.dragState;
        const windowData = this.windows.get(windowId);
        
        if (windowData) {
            const element = windowData.element;
            element.classList.remove('dragging');

            // Check for window snapping
            this.handleWindowSnap(e, windowId);
        }

        this.hideSnapIndicators();
        this.dragState = null;
        this.saveWindowStates();
    }

    endResizing() {
        if (!this.resizeState) return;

        const { windowId } = this.resizeState;
        const windowData = this.windows.get(windowId);
        
        if (windowData) {
            windowData.element.classList.remove('resizing');
        }

        this.resizeState = null;
        this.saveWindowStates();
    }

    checkSnapZones(e, windowId) {
        const threshold = 10;
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        let snapZone = null;

        if (clientX <= threshold) {
            snapZone = 'left';
        } else if (clientX >= innerWidth - threshold) {
            snapZone = 'right';
        } else if (clientY <= threshold) {
            snapZone = 'maximize';
        }

        this.showSnapIndicator(snapZone);
    }

    showSnapIndicator(zone) {
        this.hideSnapIndicators();

        if (!zone) return;

        const indicator = document.createElement('div');
        indicator.className = `snap-indicator ${zone}`;
        indicator.id = 'snapIndicator';
        document.body.appendChild(indicator);
    }

    hideSnapIndicators() {
        const existing = document.getElementById('snapIndicator');
        if (existing) {
            existing.remove();
        }
    }

    handleWindowSnap(e, windowId) {
        const threshold = 10;
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        if (clientX <= threshold) {
            this.snapWindow(windowId, 'left');
        } else if (clientX >= innerWidth - threshold) {
            this.snapWindow(windowId, 'right');
        } else if (clientY <= threshold) {
            this.maximizeWindow(windowId);
        }
    }

    snapWindow(windowId, position) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        const zone = this.snapZones[position];
        
        if (!zone) return;

        // Store original bounds if not maximized
        if (!windowData.isMaximized) {
            windowData.originalBounds = {
                x: parseInt(element.style.left),
                y: parseInt(element.style.top),
                width: parseInt(element.style.width),
                height: parseInt(element.style.height)
            };
        }

        // Apply snap dimensions
        const taskbarHeight = 60;
        element.style.left = (zone.x * window.innerWidth) + 'px';
        element.style.top = (zone.y * (window.innerHeight - taskbarHeight)) + 'px';
        element.style.width = (zone.width * window.innerWidth) + 'px';
        element.style.height = (zone.height * (window.innerHeight - taskbarHeight)) + 'px';

        windowData.isMaximized = position === 'maximize';
        
        // Update maximize button if needed
        const maximizeBtn = element.querySelector('.window-control.maximize');
        const restoreBtn = element.querySelector('.window-control.restore');
        
        if (windowData.isMaximized) {
            if (maximizeBtn) {
                maximizeBtn.classList.remove('maximize');
                maximizeBtn.classList.add('restore');
                maximizeBtn.title = 'Restore';
            }
        } else {
            if (restoreBtn) {
                restoreBtn.classList.remove('restore');
                restoreBtn.classList.add('maximize');
                restoreBtn.title = 'Maximize';
            }
        }
    }

    handleKeyDown(e) {
        // Alt+Tab window switching
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            this.showWindowSwitcher();
        }
        
        // Alt+F4 close window
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            const focusedWindow = this.getFocusedWindow();
            if (focusedWindow) {
                this.closeWindow(focusedWindow);
            }
        }
    }

    getFocusedWindow() {
        for (const [windowId, windowData] of this.windows) {
            if (windowData.element.classList.contains('focused')) {
                return windowId;
            }
        }
        return null;
    }

    showWindowSwitcher() {
        if (this.windows.size === 0) return;

        // Create window switcher overlay
        const switcher = document.createElement('div');
        switcher.className = 'window-switcher-overlay';
        switcher.innerHTML = `
            <div class="window-switcher">
                <div class="switcher-windows">
                    ${Array.from(this.windows.entries()).map(([windowId, windowData]) => `
                        <div class="switcher-window" data-window-id="${windowId}">
                            <div class="window-thumbnail">
                                <div class="thumbnail-icon">${windowData.appData.icon || '📄'}</div>
                            </div>
                            <div class="window-info">
                                <div class="window-title">${windowData.appData.name || windowData.appName}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(switcher);

        // Handle selection
        let selectedIndex = 0;
        const windows = switcher.querySelectorAll('.switcher-window');
        windows[selectedIndex].classList.add('selected');

        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                windows[selectedIndex].classList.remove('selected');
                selectedIndex = (selectedIndex + 1) % windows.length;
                windows[selectedIndex].classList.add('selected');
            } else if (e.key === 'Enter' || !e.altKey) {
                const selectedWindow = windows[selectedIndex];
                const windowId = selectedWindow.dataset.windowId;
                this.focusWindow(windowId);
                switcher.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Auto-close after a delay
        setTimeout(() => {
            if (document.body.contains(switcher)) {
                const selectedWindow = windows[selectedIndex];
                const windowId = selectedWindow.dataset.windowId;
                this.focusWindow(windowId);
                switcher.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        }, 3000);
    }
}

// Initialize window manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.windowManager = new WindowManager();
});