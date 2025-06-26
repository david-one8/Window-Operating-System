// Local Storage Management
class StorageManager {
    constructor() {
        this.prefix = 'win11_';
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    // App-specific storage methods
    saveAppData(appName, data) {
        return this.set(`app_${appName}`, data);
    }

    getAppData(appName, defaultValue = {}) {
        return this.get(`app_${appName}`, defaultValue);
    }

    // Settings storage
    saveSettings(settings) {
        return this.set('settings', settings);
    }

    getSettings() {
        return this.get('settings', {
            theme: 'light',
            accentColor: '#0078d4',
            wallpaper: 'default',
            username: 'User',
            language: 'en',
            notifications: true,
            animations: true,
            fontSize: 'medium'
        });
    }

    // Desktop icons storage
    saveDesktopIcons(icons) {
        return this.set('desktop_icons', icons);
    }

    getDesktopIcons() {
        return this.get('desktop_icons', [
            {
                id: 'notepad',
                name: 'Notepad',
                icon: '📝',
                app: 'notepad',
                x: 0,
                y: 0
            },
            {
                id: 'explorer',
                name: 'File Explorer',
                icon: '📁',
                app: 'fileexplorer',
                x: 0,
                y: 1
            },
            {
                id: 'browser',
                name: 'Web Browser',
                icon: '🌐',
                app: 'browser',
                x: 0,
                y: 2
            },
            {
                id: 'settings',
                name: 'Settings',
                icon: '⚙️',
                app: 'settings',
                x: 0,
                y: 3
            },
            {
                id: 'gallery',
                name: 'Gallery',
                icon: '🖼️',
                app: 'gallery',
                x: 1,
                y: 0
            },
            {
                id: 'calendar',
                name: 'Calendar',
                icon: '🗓️',
                app: 'calendar',
                x: 1,
                y: 1
            },
            {
                id: 'recyclebin',
                name: 'Recycle Bin',
                icon: '🗑️',
                app: 'recyclebin',
                x: 1,
                y: 2
            }
        ]);
    }

    // Window states storage
    saveWindowStates(states) {
        return this.set('window_states', states);
    }

    getWindowStates() {
        return this.get('window_states', {});
    }

    // Recent apps storage
    addRecentApp(app) {
        const recentApps = this.getRecentApps();
        const filtered = recentApps.filter(item => item.id !== app.id);
        filtered.unshift({
            ...app,
            timestamp: Date.now()
        });
        
        // Keep only last 10 items
        const limited = filtered.slice(0, 10);
        return this.set('recent_apps', limited);
    }

    getRecentApps() {
        return this.get('recent_apps', []);
    }

    // Pinned apps storage
    savePinnedApps(apps) {
        return this.set('pinned_apps', apps);
    }

    getPinnedApps() {
        return this.get('pinned_apps', [
            { id: 'notepad', name: 'Notepad', icon: '📝', app: 'notepad' },
            { id: 'explorer', name: 'File Explorer', icon: '📁', app: 'fileexplorer' },
            { id: 'browser', name: 'Web Browser', icon: '🌐', app: 'browser' },
            { id: 'settings', name: 'Settings', icon: '⚙️', app: 'settings' },
            { id: 'gallery', name: 'Gallery', icon: '🖼️', app: 'gallery' },
            { id: 'calendar', name: 'Calendar', icon: '🗓️', app: 'calendar' }
        ]);
    }

    // Notifications storage
    saveNotifications(notifications) {
        return this.set('notifications', notifications);
    }

    getNotifications() {
        return this.get('notifications', []);
    }

    addNotification(notification) {
        const notifications = this.getNotifications();
        notifications.unshift({
            id: Date.now(),
            timestamp: Date.now(),
            ...notification
        });
        
        // Keep only last 50 notifications
        const limited = notifications.slice(0, 50);
        return this.saveNotifications(limited);
    }

    removeNotification(id) {
        const notifications = this.getNotifications();
        const filtered = notifications.filter(notif => notif.id !== id);
        return this.saveNotifications(filtered);
    }

    clearNotifications() {
        return this.saveNotifications([]);
    }
}

// Global storage instance
window.storage = new StorageManager();