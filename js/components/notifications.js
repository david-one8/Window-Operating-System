// Notification Management System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.isOpen = false;
        this.maxNotifications = 50;
        this.init();
    }

    init() {
        this.loadNotifications();
        this.setupEventListeners();
        this.renderNotifications();
    }

    loadNotifications() {
        // Only load notifications from this session (clear on refresh)
        this.notifications = [];
        this.saveNotifications();
    }

    saveNotifications() {
        window.storage.saveNotifications(this.notifications);
    }

    setupEventListeners() {
        // Notification center toggle
        const notificationIcon = document.getElementById('notificationIcon');
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationIcon) {
            notificationIcon.addEventListener('click', () => {
                this.toggle();
            });
        }

        // Clear all notifications
        const clearButton = document.getElementById('clearNotifications');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearAll();
            });
        }

        // Quick settings
        this.setupQuickSettings();

        // Close on outside click
        document.addEventListener('click', (e) => {
            // Defensive: check if elements exist
            const notificationCenter = document.getElementById('notificationCenter');
            const notificationIcon = document.getElementById('notificationIcon');
            if (!notificationCenter || !notificationIcon) return;
            if (this.isOpen &&
                !notificationCenter.contains(e.target) &&
                !notificationIcon.contains(e.target)) {
                this.close();
            }
        });
    }

    setupQuickSettings() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                window.themeManager.toggleTheme();
                this.updateQuickSettings();
            });
        }

        // WiFi toggle
        const wifiToggle = document.getElementById('wifiToggle');
        if (wifiToggle) {
            wifiToggle.addEventListener('click', () => {
                wifiToggle.classList.toggle('active');
                const isActive = wifiToggle.classList.contains('active');
                wifiToggle.textContent = isActive ? '📶 Wi-Fi On' : '📶 Wi-Fi Off';
                
                this.show({
                    title: 'Network',
                    message: `Wi-Fi ${isActive ? 'connected' : 'disconnected'}`,
                    type: 'info'
                });
            });
        }

        // Bluetooth toggle
        const bluetoothToggle = document.getElementById('bluetoothToggle');
        if (bluetoothToggle) {
            bluetoothToggle.addEventListener('click', () => {
                bluetoothToggle.classList.toggle('active');
                const isActive = bluetoothToggle.classList.contains('active');
                bluetoothToggle.textContent = isActive ? '🔵 Bluetooth On' : '🔵 Bluetooth Off';
                
                this.show({
                    title: 'Bluetooth',
                    message: `Bluetooth ${isActive ? 'enabled' : 'disabled'}`,
                    type: 'info'
                });
            });
        }

        // Focus toggle
        const focusToggle = document.getElementById('focusToggle');
        if (focusToggle) {
            focusToggle.addEventListener('click', () => {
                focusToggle.classList.toggle('active');
                const isActive = focusToggle.classList.contains('active');
                focusToggle.textContent = isActive ? '🎯 Focus On' : '🎯 Focus Off';
                
                this.show({
                    title: 'Focus Assist',
                    message: `Focus mode ${isActive ? 'enabled' : 'disabled'}`,
                    type: 'info'
                });
            });
        }

        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value;
                if (window.taskbarManager) {
                    window.taskbarManager.updateVolumeStatus();
                }
            });
        }

        // Brightness slider
        const brightnessSlider = document.getElementById('brightnessSlider');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                const brightness = e.target.value;
                document.body.style.filter = `brightness(${brightness}%)`;
            });
        }
    }

    updateQuickSettings() {
        const settings = window.storage.getSettings();
        
        // Update theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.classList.toggle('active', settings.theme === 'dark');
            themeToggle.textContent = settings.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    show(notification) {
        const newNotification = {
            id: Date.now(),
            timestamp: Date.now(),
            title: notification.title || 'Notification',
            message: notification.message || '',
            type: notification.type || 'info',
            icon: notification.icon || this.getTypeIcon(notification.type),
            duration: notification.duration || 5000,
            persistent: notification.persistent || false
        };

        // Add to notifications array
        this.notifications.unshift(newNotification);
        
        // Limit notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        this.saveNotifications();
        this.renderNotifications();
        this.showToast(newNotification);
        this.updateNotificationBadge();
    }

    getTypeIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || 'ℹ️';
    }

    showToast(notification) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${notification.type}`;
        toast.innerHTML = `
            <div class="toast-icon">${notification.icon}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close">×</button>
        `;

        // Position toast
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '10001';
        toast.style.background = 'var(--glass-bg)';
        toast.style.backdropFilter = 'blur(var(--blur-amount))';
        toast.style.border = '1px solid var(--glass-border)';
        toast.style.borderRadius = 'var(--radius-lg)';
        toast.style.padding = 'var(--spacing-md)';
        toast.style.boxShadow = 'var(--shadow-lg)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = 'var(--spacing-sm)';
        toast.style.maxWidth = '400px';
        toast.style.animation = 'slideInRight var(--transition-medium)';

        document.body.appendChild(toast);

        // Close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.hideToast(toast);
        });

        // Auto-hide if not persistent
        if (!notification.persistent) {
            setTimeout(() => {
                this.hideToast(toast);
            }, notification.duration);
        }

        // Click to open notification center
        toast.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                this.open();
                this.hideToast(toast);
            }
        });
    }

    hideToast(toast) {
        toast.style.animation = 'slideOutRight var(--transition-medium)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 250);
    }

    renderNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">🔔</div>
                    <div>No new notifications</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item" data-notification-id="${notification.id}">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                <button class="notification-delete" title="Delete">🗑️</button>
            </div>
        `).join('');

        // Add click handlers for delete
        container.querySelectorAll('.notification-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.notification-item');
                const id = parseInt(item.dataset.notificationId);
                console.log('Delete button clicked for notification id:', id); // Debug log
                this.remove(id);
            });
        });

        // Add click handlers for notification items (optional: open or mark as read)
        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-delete')) {
                    const id = parseInt(item.dataset.notificationId);
                    this.handleNotificationClick(id);
                }
            });
        });
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    handleNotificationClick(id) {
        // Handle notification click - could open related app or perform action
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            console.log('Notification clicked:', notification);
            // Remove notification after click
            this.remove(id);
        }
    }

    remove(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.renderNotifications();
        this.updateNotificationBadge();
    }

    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.renderNotifications();
        this.updateNotificationBadge();
        
        this.show({
            title: 'Notifications',
            message: 'All notifications cleared',
            type: 'info',
            duration: 2000
        });
    }

    updateNotificationBadge() {
        const notificationIcon = document.getElementById('notificationIcon');
        if (!notificationIcon) return;

        // Remove existing badge
        const existingBadge = notificationIcon.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add badge if there are unread notifications
        if (this.notifications.length > 0) {
            let badge = document.createElement('div');
            badge.className = 'notification-badge';
            badge.textContent = this.notifications.length > 99 ? '99+' : this.notifications.length;
            badge.style.position = 'absolute';
            badge.style.top = '-4px';
            badge.style.right = '-4px';
            badge.style.background = '#ff4444';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.width = '16px';
            badge.style.height = '16px';
            badge.style.fontSize = '10px';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.fontWeight = 'bold';
            notificationIcon.style.position = 'relative';
            notificationIcon.appendChild(badge);
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationCenter) {
            notificationCenter.classList.add('active');
            this.isOpen = true;
            this.updateQuickSettings();
        }
    }

    close() {
        const notificationCenter = document.getElementById('notificationCenter');
        if (notificationCenter) {
            notificationCenter.classList.remove('active');
            this.isOpen = false;
        }
    }

    // System notification methods
    showSystemNotification(title, message, type = 'info') {
        this.show({
            title: title,
            message: message,
            type: type,
            icon: '🖥️'
        });
    }

    showAppNotification(appName, message, icon = '📱') {
        this.show({
            title: appName,
            message: message,
            type: 'info',
            icon: icon
        });
    }

    showNetworkNotification(message, connected = true) {
        this.show({
            title: 'Network',
            message: message,
            type: connected ? 'success' : 'warning',
            icon: connected ? '📶' : '📵'
        });
    }

    showBatteryNotification(level, charging = false) {
        const type = level < 20 ? 'warning' : 'info';
        const icon = charging ? '🔌' : level < 20 ? '🪫' : '🔋';
        
        this.show({
            title: 'Battery',
            message: `${level}% ${charging ? 'charging' : 'remaining'}`,
            type: type,
            icon: icon
        });
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
    
    // Show welcome notification
    setTimeout(() => {
        window.notificationManager.show({
            title: 'Welcome to Windows 11 Clone',
            message: 'System ready and all services are running',
            type: 'success',
            icon: '🖥️'
        });
    }, 2000);
});