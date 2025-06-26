// Theme Management System
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.currentAccent = '#0078d4';
        this.currentWallpaper = 'default';
        this.init();
    }

    init() {
        const settings = window.storage.getSettings();
        this.currentTheme = settings.theme;
        this.currentAccent = settings.accentColor;
        this.currentWallpaper = settings.wallpaper;
        
        this.applyTheme(this.currentTheme);
        this.applyAccentColor(this.currentAccent);
        this.applyWallpaper(this.currentWallpaper);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveSettings();
        
        // Update theme toggle in quick settings
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.classList.toggle('active', theme === 'dark');
            themeToggle.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    applyAccentColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--accent-color', color);
        
        // Generate hover color (slightly darker)
        const hoverColor = this.darkenColor(color, 10);
        root.style.setProperty('--accent-hover', hoverColor);
        
        this.currentAccent = color;
        this.saveSettings();
    }

    applyWallpaper(wallpaper) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Predefined wallpapers
        const wallpapers = {
            'default': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'blue': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            'purple': 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
            'green': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            'orange': 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
            'pink': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'dark': 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
            'nature': 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)'
        };

        if (wallpapers[wallpaper]) {
            desktop.style.background = wallpapers[wallpaper];
        } else if (wallpaper.startsWith('http') || wallpaper.startsWith('data:')) {
            // Custom image URL or data URL
            desktop.style.background = `url(${wallpaper}) center/cover`;
        }

        this.currentWallpaper = wallpaper;
        this.saveSettings();
    }

    // Utility function to darken a color
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    // Utility function to lighten a color
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
            (G > 255 ? 255 : G) * 0x100 +
            (B > 255 ? 255 : B)).toString(16).slice(1);
    }

    saveSettings() {
        const settings = window.storage.getSettings();
        settings.theme = this.currentTheme;
        settings.accentColor = this.currentAccent;
        settings.wallpaper = this.currentWallpaper;
        window.storage.saveSettings(settings);
    }

    openThemePanel() {
        this.createThemePanel();
    }

    createThemePanel() {
        // Remove existing panel
        const existing = document.querySelector('.theme-panel');
        if (existing) {
            existing.remove();
        }

        const panel = document.createElement('div');
        panel.className = 'theme-panel modal';
        panel.innerHTML = `
            <div class="theme-panel-header modal-header">
                <h3>Personalization</h3>
                <button class="theme-panel-close modal-close">×</button>
            </div>
            <div class="theme-panel-content modal-content">
                <div class="theme-section">
                    <div class="theme-section-title">Theme</div>
                    <div class="theme-options">
                        <button class="theme-option ${this.currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                            ☀️ Light
                        </button>
                        <button class="theme-option ${this.currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                            🌙 Dark
                        </button>
                    </div>
                </div>
                
                <div class="theme-section">
                    <div class="theme-section-title">Accent Color</div>
                    <div class="accent-colors">
                        ${this.getAccentColorOptions()}
                    </div>
                </div>
                
                <div class="theme-section">
                    <div class="theme-section-title">Wallpaper</div>
                    <div class="wallpaper-grid">
                        ${this.getWallpaperOptions()}
                    </div>
                </div>
            </div>
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // Event listeners
        panel.querySelector('.theme-panel-close').onclick = () => overlay.remove();
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        // Theme options
        panel.querySelectorAll('.theme-option').forEach(btn => {
            btn.onclick = () => {
                panel.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyTheme(btn.dataset.theme);
            };
        });

        // Accent colors
        panel.querySelectorAll('.accent-color').forEach(color => {
            color.onclick = () => {
                panel.querySelectorAll('.accent-color').forEach(c => c.classList.remove('active'));
                color.classList.add('active');
                this.applyAccentColor(color.dataset.color);
            };
        });

        // Wallpapers
        panel.querySelectorAll('.wallpaper-option').forEach(wallpaper => {
            wallpaper.onclick = () => {
                panel.querySelectorAll('.wallpaper-option').forEach(w => w.classList.remove('active'));
                wallpaper.classList.add('active');
                this.applyWallpaper(wallpaper.dataset.wallpaper);
            };
        });
    }

    getAccentColorOptions() {
        const colors = [
            { name: 'Blue', value: '#0078d4' },
            { name: 'Purple', value: '#8764b8' },
            { name: 'Green', value: '#107c10' },
            { name: 'Orange', value: '#ff8c00' },
            { name: 'Red', value: '#d13438' },
            { name: 'Pink', value: '#e3008c' },
            { name: 'Teal', value: '#00bcf2' },
            { name: 'Yellow', value: '#ffd343' }
        ];

        return colors.map(color => `
            <div class="accent-color ${this.currentAccent === color.value ? 'active' : ''}" 
                 style="background: ${color.value}" 
                 data-color="${color.value}"
                 title="${color.name}">
            </div>
        `).join('');
    }

    getWallpaperOptions() {
        const wallpapers = [
            { name: 'Default', value: 'default' },
            { name: 'Blue', value: 'blue' },
            { name: 'Purple', value: 'purple' },
            { name: 'Green', value: 'green' },
            { name: 'Orange', value: 'orange' },
            { name: 'Pink', value: 'pink' },
            { name: 'Dark', value: 'dark' },
            { name: 'Nature', value: 'nature' }
        ];

        return wallpapers.map(wallpaper => {
            const style = this.getWallpaperPreviewStyle(wallpaper.value);
            return `
                <div class="wallpaper-option ${this.currentWallpaper === wallpaper.value ? 'active' : ''}" 
                     style="${style}"
                     data-wallpaper="${wallpaper.value}"
                     title="${wallpaper.name}">
                </div>
            `;
        }).join('');
    }

    getWallpaperPreviewStyle(wallpaper) {
        const wallpapers = {
            'default': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'blue': 'background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            'purple': 'background: linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
            'green': 'background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            'orange': 'background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
            'pink': 'background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'dark': 'background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
            'nature': 'background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)'
        };
        return wallpapers[wallpaper] || wallpapers.default;
    }
}

// Global theme manager instance
window.themeManager = new ThemeManager();