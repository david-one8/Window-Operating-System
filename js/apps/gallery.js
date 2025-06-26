// Gallery Application - gallery ka application hai ye
class GalleryApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.currentFolder = appData.startPath || '/Pictures';
        this.images = [];
        this.currentImageIndex = 0;
        this.viewMode = 'grid'; // 'grid' or 'slideshow' - grid ya slideshow view mode hai
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadImages();
    }

    render() {
        this.container.innerHTML = `
            <div class="gallery-app">
                <div class="gallery-toolbar">
                    <div class="gallery-nav">
                        <button class="nav-btn" id="backBtn" title="Back">⬅️</button>
                        <span class="gallery-path">${this.currentFolder}</span>
                    </div>
                    <div class="gallery-controls">
                        <button class="nav-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="gridViewBtn" title="Grid View">▦</button>
                        <button class="nav-btn ${this.viewMode === 'slideshow' ? 'active' : ''}" id="slideshowBtn" title="Slideshow">🖼️</button>
                        <button class="nav-btn" id="uploadBtn" title="Upload Image">📁</button>
                        <button class="nav-btn" id="refreshBtn" title="Refresh">🔄</button>
                    </div>
                </div>
                
                <div class="gallery-content" id="galleryContent">
                    <!-- Content will be loaded here - content yahan load hoga -->
                </div>
                
                <!-- Slideshow Modal - slideshow modal hai ye -->
                <div class="slideshow-modal hidden" id="slideshowModal">
                    <div class="slideshow-controls">
                        <button class="slideshow-btn" id="prevBtn">⬅️</button>
                        <button class="slideshow-btn" id="nextBtn">➡️</button>
                        <button class="slideshow-btn" id="closeBtn">✕</button>
                    </div>
                    <div class="slideshow-content">
                        <img id="slideshowImage" alt="Gallery Image">
                        <div class="slideshow-info">
                            <div class="image-title" id="imageTitle"></div>
                            <div class="image-counter" id="imageCounter"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Navigation - navigation setup kar rahe hai
        this.container.querySelector('#backBtn').addEventListener('click', () => this.goBack());
        this.container.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());

        // View controls - view controls setup kar rahe hai
        this.container.querySelector('#gridViewBtn').addEventListener('click', () => this.setViewMode('grid'));
        this.container.querySelector('#slideshowBtn').addEventListener('click', () => this.openSlideshow());
        this.container.querySelector('#uploadBtn').addEventListener('click', () => this.uploadImage());

        // Slideshow controls - slideshow controls setup kar rahe hai
        this.container.querySelector('#prevBtn').addEventListener('click', () => this.previousImage());
        this.container.querySelector('#nextBtn').addEventListener('click', () => this.nextImage());
        this.container.querySelector('#closeBtn').addEventListener('click', () => this.closeSlideshow());

        // Modal click outside to close - modal ke bahar click karne se band ho jata hai
        this.container.querySelector('#slideshowModal').addEventListener('click', (e) => {
            if (e.target.id === 'slideshowModal') {
                this.closeSlideshow();
            }
        });

        // Keyboard navigation - keyboard navigation setup kar rahe hai
        document.addEventListener('keydown', (e) => {
            if (!this.container.querySelector('#slideshowModal').classList.contains('hidden')) {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.previousImage();
                        break;
                    case 'ArrowRight':
                        this.nextImage();
                        break;
                    case 'Escape':
                        this.closeSlideshow();
                        break;
                }
            }
        });
    }

    loadImages() {
        // Get images from file system (with error handling) - file system se images le rahe hai (error handling ke saath)
        try {
            const contents = window.fileSystem ? window.fileSystem.getContents(this.currentFolder) : [];
            this.images = contents.filter(item => 
                item.type === 'file' && 
                ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                    item.name.split('.').pop().toLowerCase()
                )
            );

            // Add some sample images if folder is empty - agar folder empty hai toh sample images add kar rahe hai
            if (this.images.length === 0 && this.currentFolder === '/Pictures') {
                this.addSampleImages();
            }

            this.renderContent();
        } catch (error) {
            console.error('Error loading images:', error);
            this.images = [];
            this.addSampleImages();
            this.renderContent();
        }
    }

    addSampleImages() {
        const sampleImages = [
            { name: 'landscape1.jpg', url: 'https://picsum.photos/800/600?random=1' },
            { name: 'landscape2.jpg', url: 'https://picsum.photos/800/600?random=2' },
            { name: 'nature1.jpg', url: 'https://picsum.photos/800/600?random=3' },
            { name: 'nature2.jpg', url: 'https://picsum.photos/800/600?random=4' },
            { name: 'city1.jpg', url: 'https://picsum.photos/800/600?random=5' },
            { name: 'city2.jpg', url: 'https://picsum.photos/800/600?random=6' }
        ];

        // Create fake image objects for display - display ke liye fake image objects banate hai
        this.images = sampleImages.map((img, index) => ({
            name: img.name,
            content: img.url,
            type: 'file',
            path: `${this.currentFolder}/${img.name}`,
            id: 'sample_' + index
        }));

        // Try to save to filesystem if available
        if (window.fileSystem) {
            try {
                sampleImages.forEach(img => {
                    window.fileSystem.createFile(img.name, img.url, this.currentFolder);
                });
            } catch (error) {
                console.log('FileSystem not available, using sample data');
            }
        }
    }

    renderContent() {
        const content = this.container.querySelector('#galleryContent');
        
        if (this.images.length === 0) {
            content.innerHTML = `
                <div class="gallery-empty">
                    <div class="empty-icon">🖼️</div>
                    <div class="empty-text">No images found</div>
                    <div class="empty-subtext">Add some images to get started</div>
                    <button class="upload-btn" onclick="document.getElementById('uploadBtn').click()">
                        Upload Images
                    </button>
                </div>
            `;
            return;
        }

        if (this.viewMode === 'grid') {
            content.innerHTML = `
                <div class="gallery-grid">
                    ${this.images.map((image, index) => `
                        <div class="gallery-item" data-index="${index}">
                            <img src="${this.getImageUrl(image)}" alt="${image.name}" loading="lazy">
                            <div class="image-overlay">
                                <div class="image-name">${image.name}</div>
                                <div class="image-actions">
                                    <button class="action-btn" onclick="event.stopPropagation()" data-action="view" data-index="${index}">👁️</button>
                                    <button class="action-btn" onclick="event.stopPropagation()" data-action="delete" data-index="${index}">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add click handlers for images
            content.querySelectorAll('.gallery-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index);
                    this.openSlideshow(index);
                });
            });

            // Add action button handlers
            content.querySelectorAll('.action-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const index = parseInt(btn.dataset.index);
                    
                    if (action === 'view') {
                        this.openSlideshow(index);
                    } else if (action === 'delete') {
                        this.deleteImage(index);
                    }
                });
            });
        }
    }

    getImageUrl(image) {
        // If the image content is a URL, use it directly - agar image content URL hai toh directly use kar rahe hai
        if (image.content && (image.content.startsWith('http') || image.content.startsWith('data:'))) {
            return image.content;
        }
        
        // For actual uploaded images, we'd use createObjectURL or similar - actual uploaded images ke liye createObjectURL ya similar use karenge
        // For now, return a placeholder with the image name - abhi ke liye image name ke saath placeholder return kar rahe hai
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
        const colorIndex = image.name.length % colors.length;
        const bgColor = colors[colorIndex];
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${bgColor}99;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)"/>
                <rect x="50" y="50" width="700" height="400" fill="none" stroke="white" stroke-width="4" rx="16" opacity="0.3"/>
                <circle cx="200" cy="200" r="60" fill="white" opacity="0.4"/>
                <polygon points="500,300 400,200 600,200" fill="white" opacity="0.4"/>
                <text x="400" y="500" font-family="Segoe UI, Arial, sans-serif" font-size="32px" fill="white" text-anchor="middle" font-weight="600">${image.name}</text>
            </svg>
        `)}`;
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button states - button states update kar rahe hai
        this.container.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'grid') {
            this.container.querySelector('#gridViewBtn').classList.add('active');
        }
        
        this.renderContent();
    }

    openSlideshow(startIndex = 0) {
        if (this.images.length === 0) return;
        
        this.currentImageIndex = startIndex;
        const modal = this.container.querySelector('#slideshowModal');
        modal.classList.remove('hidden');
        
        this.updateSlideshow();
    }

    closeSlideshow() {
        const modal = this.container.querySelector('#slideshowModal');
        modal.classList.add('hidden');
    }

    previousImage() {
        if (this.images.length === 0) return;
        
        this.currentImageIndex = this.currentImageIndex > 0 
            ? this.currentImageIndex - 1 
            : this.images.length - 1;
        
        this.updateSlideshow();
    }

    nextImage() {
        if (this.images.length === 0) return;
        
        this.currentImageIndex = this.currentImageIndex < this.images.length - 1 
            ? this.currentImageIndex + 1 
            : 0;
        
        this.updateSlideshow();
    }

    updateSlideshow() {
        if (this.images.length === 0) {
            this.closeSlideshow();
            return;
        }
        
        // Ensure index is within bounds - index bounds ke andar hai ye ensure kar rahe hai
        if (this.currentImageIndex >= this.images.length) {
            this.currentImageIndex = 0;
        }
        if (this.currentImageIndex < 0) {
            this.currentImageIndex = this.images.length - 1;
        }
        
        const currentImage = this.images[this.currentImageIndex];
        const slideshowImage = this.container.querySelector('#slideshowImage');
        const imageTitle = this.container.querySelector('#imageTitle');
        const imageCounter = this.container.querySelector('#imageCounter');
        
        if (slideshowImage && imageTitle && imageCounter && currentImage) {
            slideshowImage.src = this.getImageUrl(currentImage);
            slideshowImage.alt = currentImage.name;
            imageTitle.textContent = currentImage.name;
            imageCounter.textContent = `${this.currentImageIndex + 1} of ${this.images.length}`;
            
            // Handle image load errors
            slideshowImage.onerror = () => {
                slideshowImage.src = this.getImageUrl({ name: 'Error loading image', content: '' });
            };
        }
    }

    uploadImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.handleImageUpload(files);
        };
        
        input.click();
    }

    handleImageUpload(files) {
        let processed = 0;
        let uploaded = 0;
        
        if (files.length === 0) return;

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    
                    // Create image object
                    const newImage = {
                        name: file.name,
                        content: content,
                        type: 'file',
                        path: `${this.currentFolder}/${file.name}`,
                        id: 'uploaded_' + Date.now() + '_' + processed
                    };
                    
                    // Add to images array
                    this.images.push(newImage);
                    
                    // Try to save to filesystem if available
                    if (window.fileSystem) {
                        try {
                            window.fileSystem.createFile(file.name, content, this.currentFolder);
                        } catch (error) {
                            console.log('FileSystem save failed, keeping in memory');
                        }
                    }
                    
                    uploaded++;
                    processed++;
                    
                    // Refresh after all files are processed
                    if (processed === files.length) {
                        this.renderContent();
                        this.showNotification(`${uploaded} image(s) uploaded successfully`, 'success');
                    }
                };
                reader.onerror = () => {
                    processed++;
                    this.showNotification(`Failed to upload ${file.name}`, 'error');
                    
                    if (processed === files.length && uploaded > 0) {
                        this.renderContent();
                        this.showNotification(`${uploaded} of ${files.length} image(s) uploaded successfully`, 'warning');
                    }
                };
                reader.readAsDataURL(file);
            } else {
                processed++;
                this.showNotification(`${file.name} is not a valid image file`, 'warning');
            }
        });
    }

    deleteImage(index) {
        const image = this.images[index];
        if (!image) return;
        
        if (confirm(`Are you sure you want to delete "${image.name}"?`)) {
            try {
                // Try to delete from filesystem if available
                if (window.fileSystem && image.path) {
                    window.fileSystem.delete(image.path);
                }
                
                // Remove from images array
                this.images.splice(index, 1);
                this.renderContent();
                this.showNotification('Image deleted successfully', 'success');
                
                // Adjust slideshow index if needed
                if (this.currentImageIndex >= this.images.length) {
                    this.currentImageIndex = Math.max(0, this.images.length - 1);
                }
                
                // Update slideshow if open
                const modal = this.container.querySelector('#slideshowModal');
                if (!modal.classList.contains('hidden')) {
                    if (this.images.length === 0) {
                        this.closeSlideshow();
                    } else {
                        this.updateSlideshow();
                    }
                }
            } catch (error) {
                console.error('Error deleting image:', error);
                this.showNotification('Failed to delete image', 'error');
            }
        }
    }

    goBack() {
        if (this.currentFolder !== '/' && this.currentFolder !== '/Pictures') {
            try {
                const parentPath = window.fileSystem ? 
                    window.fileSystem.getParentPath(this.currentFolder) : 
                    '/Pictures';
                this.currentFolder = parentPath;
                this.container.querySelector('.gallery-path').textContent = this.currentFolder;
                this.loadImages();
            } catch (error) {
                console.error('Error navigating back:', error);
                this.currentFolder = '/Pictures';
                this.container.querySelector('.gallery-path').textContent = this.currentFolder;
                this.loadImages();
            }
        }
    }

    refresh() {
        this.loadImages();
        this.showNotification('Gallery refreshed', 'info');
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Gallery',
                message: message,
                type: type,
                icon: '🖼️'
            });
        }
    }
}

// Register the app globally - app ko globally register kar rahe hai
window.GalleryApp = GalleryApp;