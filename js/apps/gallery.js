// Gallery Application
class GalleryApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.currentFolder = appData.startPath || '/Pictures';
        this.images = [];
        this.currentImageIndex = 0;
        this.viewMode = 'grid'; // 'grid' or 'slideshow'
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
                    <!-- Content will be loaded here -->
                </div>
                
                <!-- Slideshow Modal -->
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
        // Navigation
        this.container.querySelector('#backBtn').addEventListener('click', () => this.goBack());
        this.container.querySelector('#refreshBtn').addEventListener('click', () => this.refresh());

        // View controls
        this.container.querySelector('#gridViewBtn').addEventListener('click', () => this.setViewMode('grid'));
        this.container.querySelector('#slideshowBtn').addEventListener('click', () => this.openSlideshow());
        this.container.querySelector('#uploadBtn').addEventListener('click', () => this.uploadImage());

        // Slideshow controls
        this.container.querySelector('#prevBtn').addEventListener('click', () => this.previousImage());
        this.container.querySelector('#nextBtn').addEventListener('click', () => this.nextImage());
        this.container.querySelector('#closeBtn').addEventListener('click', () => this.closeSlideshow());

        // Modal click outside to close
        this.container.querySelector('#slideshowModal').addEventListener('click', (e) => {
            if (e.target.id === 'slideshowModal') {
                this.closeSlideshow();
            }
        });

        // Keyboard navigation
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
        // Get images from file system
        const contents = window.fileSystem.getContents(this.currentFolder);
        this.images = contents.filter(item => 
            item.type === 'file' && 
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                item.name.split('.').pop().toLowerCase()
            )
        );

        // Add some sample images if folder is empty
        if (this.images.length === 0 && this.currentFolder === '/Pictures') {
            this.addSampleImages();
        }

        this.renderContent();
    }

    addSampleImages() {
        const sampleImages = [
            { name: 'landscape1.jpg', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' },
            { name: 'landscape2.jpg', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop' },
            { name: 'nature1.jpg', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop' },
            { name: 'nature2.jpg', url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=600&fit=crop' },
            { name: 'city1.jpg', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop' },
            { name: 'city2.jpg', url: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=800&h=600&fit=crop' }
        ];

        sampleImages.forEach(img => {
            window.fileSystem.createFile(img.name, img.url, this.currentFolder);
        });

        // Reload images after adding samples
        const contents = window.fileSystem.getContents(this.currentFolder);
        this.images = contents.filter(item => 
            item.type === 'file' && 
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
                item.name.split('.').pop().toLowerCase()
            )
        );
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
        // If the image content is a URL, use it directly
        if (image.content && image.content.startsWith('http')) {
            return image.content;
        }
        
        // For actual uploaded images, we'd use createObjectURL or similar
        // For now, return a placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
    }

    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button states
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
        if (this.images.length === 0) return;
        
        const currentImage = this.images[this.currentImageIndex];
        const slideshowImage = this.container.querySelector('#slideshowImage');
        const imageTitle = this.container.querySelector('#imageTitle');
        const imageCounter = this.container.querySelector('#imageCounter');
        
        slideshowImage.src = this.getImageUrl(currentImage);
        slideshowImage.alt = currentImage.name;
        imageTitle.textContent = currentImage.name;
        imageCounter.textContent = `${this.currentImageIndex + 1} of ${this.images.length}`;
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
        let uploaded = 0;
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    if (window.fileSystem.createFile(file.name, content, this.currentFolder)) {
                        uploaded++;
                    }
                    
                    // Refresh after all files are processed
                    if (uploaded === files.length) {
                        this.refresh();
                        this.showNotification(`${uploaded} image(s) uploaded successfully`, 'success');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    deleteImage(index) {
        const image = this.images[index];
        if (!image) return;
        
        if (confirm(`Are you sure you want to delete "${image.name}"?`)) {
            if (window.fileSystem.delete(image.path)) {
                this.images.splice(index, 1);
                this.renderContent();
                this.showNotification('Image deleted successfully', 'success');
                
                // Adjust slideshow index if needed
                if (this.currentImageIndex >= this.images.length) {
                    this.currentImageIndex = Math.max(0, this.images.length - 1);
                }
                
                // Close slideshow if no images left
                if (this.images.length === 0) {
                    this.closeSlideshow();
                } else {
                    this.updateSlideshow();
                }
            } else {
                this.showNotification('Failed to delete image', 'error');
            }
        }
    }

    goBack() {
        if (this.currentFolder !== '/') {
            const parentPath = window.fileSystem.getParentPath(this.currentFolder);
            this.currentFolder = parentPath;
            this.container.querySelector('.gallery-path').textContent = this.currentFolder;
            this.loadImages();
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

// Register the app globally
window.GalleryApp = GalleryApp;