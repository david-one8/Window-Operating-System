// Virtual File System
class FileSystem {
    constructor() {
        this.root = this.initializeFileSystem();
        this.currentPath = '/';
        this.clipboard = null;
        this.loadFromStorage();
    }

    initializeFileSystem() {
        return {
            type: 'folder',
            name: 'root',
            path: '/',
            children: {
                'Desktop': {
                    type: 'folder',
                    name: 'Desktop',
                    path: '/Desktop',
                    children: {}
                },
                'Documents': {
                    type: 'folder',
                    name: 'Documents',
                    path: '/Documents',
                    children: {
                        'Sample.txt': {
                            type: 'file',
                            name: 'Sample.txt',
                            path: '/Documents/Sample.txt',
                            content: 'This is a sample text file.',
                            size: 29,
                            modified: Date.now(),
                            created: Date.now()
                        }
                    }
                },
                'Pictures': {
                    type: 'folder',
                    name: 'Pictures',
                    path: '/Pictures',
                    children: {}
                },
                'Music': {
                    type: 'folder',
                    name: 'Music',
                    path: '/Music',
                    children: {}
                },
                'Videos': {
                    type: 'folder',
                    name: 'Videos',
                    path: '/Videos',
                    children: {}
                },
                'Downloads': {
                    type: 'folder',
                    name: 'Downloads',
                    path: '/Downloads',
                    children: {}
                },
                'RecycleBin': {
                    type: 'folder',
                    name: 'RecycleBin',
                    path: '/RecycleBin',
                    children: {},
                    hidden: true
                }
            }
        };
    }

    loadFromStorage() {
        const saved = window.storage.get('filesystem');
        if (saved) {
            this.root = saved;
        } else {
            this.saveToStorage();
        }
    }

    saveToStorage() {
        window.storage.set('filesystem', this.root);
    }

    // Navigation methods
    navigateTo(path) {
        if (this.exists(path)) {
            this.currentPath = path;
            return true;
        }
        return false;
    }

    getCurrentFolder() {
        return this.getItem(this.currentPath);
    }

    getParentPath(path) {
        const parts = path.split('/').filter(p => p);
        parts.pop();
        return '/' + parts.join('/');
    }

    // File/Folder operations
    exists(path) {
        return this.getItem(path) !== null;
    }

    getItem(path) {
        if (path === '/') return this.root;
        
        const parts = path.split('/').filter(p => p);
        let current = this.root;
        
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    createFolder(name, path = this.currentPath) {
        const parent = this.getItem(path);
        if (!parent || parent.type !== 'folder') return false;
        
        if (parent.children[name]) return false; // Already exists
        
        const newPath = path === '/' ? `/${name}` : `${path}/${name}`;
        parent.children[name] = {
            type: 'folder',
            name: name,
            path: newPath,
            children: {},
            created: Date.now(),
            modified: Date.now()
        };
        
        this.saveToStorage();
        return true;
    }

    createFile(name, content = '', path = this.currentPath) {
        const parent = this.getItem(path);
        if (!parent || parent.type !== 'folder') return false;
        
        if (parent.children[name]) return false; // Already exists
        
        const newPath = path === '/' ? `/${name}` : `${path}/${name}`;
        parent.children[name] = {
            type: 'file',
            name: name,
            path: newPath,
            content: content,
            size: content.length,
            created: Date.now(),
            modified: Date.now()
        };
        
        this.saveToStorage();
        return true;
    }

    rename(oldPath, newName) {
        const item = this.getItem(oldPath);
        if (!item) return false;
        
        const parentPath = this.getParentPath(oldPath);
        const parent = this.getItem(parentPath);
        if (!parent) return false;
        
        // Check if new name already exists
        if (parent.children[newName]) return false;
        
        // Update item
        const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
        item.name = newName;
        item.path = newPath;
        item.modified = Date.now();
        
        // Update parent's children
        delete parent.children[item.name];
        parent.children[newName] = item;
        
        // Update paths of all children if it's a folder
        if (item.type === 'folder') {
            this.updateChildrenPaths(item, newPath);
        }
        
        this.saveToStorage();
        return true;
    }

    updateChildrenPaths(folder, newBasePath) {
        if (folder.children) {
            Object.values(folder.children).forEach(child => {
                child.path = `${newBasePath}/${child.name}`;
                if (child.type === 'folder') {
                    this.updateChildrenPaths(child, child.path);
                }
            });
        }
    }

    delete(path) {
        const item = this.getItem(path);
        if (!item) return false;
        
        const parentPath = this.getParentPath(path);
        const parent = this.getItem(parentPath);
        if (!parent) return false;
        
        // Move to recycle bin instead of permanent deletion
        return this.moveToRecycleBin(item, parent);
    }

    moveToRecycleBin(item, parent) {
        const recycleBin = this.getItem('/RecycleBin');
        if (!recycleBin) return false;
        
        // Add deletion metadata
        const deletedItem = {
            ...item,
            originalPath: item.path,
            deletedDate: Date.now()
        };
        
        // Ensure unique name in recycle bin
        let newName = item.name;
        let counter = 1;
        while (recycleBin.children[newName]) {
            const nameWithoutExt = item.name.replace(/\.[^/.]+$/, "");
            const ext = item.name.includes('.') ? item.name.split('.').pop() : '';
            newName = ext ? `${nameWithoutExt}_${counter}.${ext}` : `${nameWithoutExt}_${counter}`;
            counter++;
        }
        
        deletedItem.name = newName;
        deletedItem.path = `/RecycleBin/${newName}`;
        
        // Move to recycle bin
        recycleBin.children[newName] = deletedItem;
        
        // Remove from original location
        delete parent.children[item.name];
        
        this.saveToStorage();
        return true;
    }

    restore(recycleBinPath) {
        const item = this.getItem(recycleBinPath);
        if (!item || !item.originalPath) return false;
        
        const originalParentPath = this.getParentPath(item.originalPath);
        const originalParent = this.getItem(originalParentPath);
        if (!originalParent) return false;
        
        // Get original name without deletion metadata
        const originalName = item.originalPath.split('/').pop();
        
        // Check if original location is available
        if (originalParent.children[originalName]) {
            // Find alternative name
            let counter = 1;
            let newName = originalName;
            while (originalParent.children[newName]) {
                const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
                const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
                newName = ext ? `${nameWithoutExt}_restored_${counter}.${ext}` : `${nameWithoutExt}_restored_${counter}`;
                counter++;
            }
            item.name = newName;
            item.path = originalParentPath === '/' ? `/${newName}` : `${originalParentPath}/${newName}`;
        } else {
            item.name = originalName;
            item.path = item.originalPath;
        }
        
        // Remove deletion metadata
        delete item.originalPath;
        delete item.deletedDate;
        
        // Move back to original location
        originalParent.children[item.name] = item;
        
        // Remove from recycle bin
        const recycleBin = this.getItem('/RecycleBin');
        delete recycleBin.children[recycleBinPath.split('/').pop()];
        
        this.saveToStorage();
        return true;
    }

    permanentDelete(recycleBinPath) {
        const recycleBin = this.getItem('/RecycleBin');
        if (!recycleBin) return false;
        
        const itemName = recycleBinPath.split('/').pop();
        if (!recycleBin.children[itemName]) return false;
        
        delete recycleBin.children[itemName];
        this.saveToStorage();
        return true;
    }

    // File content operations
    readFile(path) {
        const file = this.getItem(path);
        return file && file.type === 'file' ? file.content : null;
    }

    writeFile(path, content) {
        const file = this.getItem(path);
        if (file && file.type === 'file') {
            file.content = content;
            file.size = content.length;
            file.modified = Date.now();
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Copy/Cut/Paste operations
    copy(path) {
        const item = this.getItem(path);
        if (!item) return false;
        
        this.clipboard = {
            operation: 'copy',
            item: this.deepCopy(item)
        };
        return true;
    }

    cut(path) {
        const item = this.getItem(path);
        if (!item) return false;
        
        this.clipboard = {
            operation: 'cut',
            item: this.deepCopy(item),
            originalPath: path
        };
        return true;
    }

    paste(targetPath = this.currentPath) {
        if (!this.clipboard) return false;
        
        const target = this.getItem(targetPath);
        if (!target || target.type !== 'folder') return false;
        
        const item = this.clipboard.item;
        const newPath = targetPath === '/' ? `/${item.name}` : `${targetPath}/${item.name}`;
        
        // Ensure unique name
        let newName = item.name;
        let counter = 1;
        while (target.children[newName]) {
            const nameWithoutExt = item.name.replace(/\.[^/.]+$/, "");
            const ext = item.name.includes('.') ? item.name.split('.').pop() : '';
            newName = ext ? `${nameWithoutExt}_${counter}.${ext}` : `${nameWithoutExt}_${counter}`;
            counter++;
        }
        
        // Update item with new path and name
        const newItem = this.deepCopy(item);
        newItem.name = newName;
        newItem.path = targetPath === '/' ? `/${newName}` : `${targetPath}/${newName}`;
        newItem.created = Date.now();
        
        // Update all children paths if it's a folder
        if (newItem.type === 'folder') {
            this.updateChildrenPaths(newItem, newItem.path);
        }
        
        // Add to target
        target.children[newName] = newItem;
        
        // If cut operation, remove from original location
        if (this.clipboard.operation === 'cut') {
            const originalParent = this.getItem(this.getParentPath(this.clipboard.originalPath));
            if (originalParent) {
                delete originalParent.children[item.name];
            }
        }
        
        this.saveToStorage();
        this.clipboard = null;
        return true;
    }

    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Search functionality
    search(query, path = '/') {
        const results = [];
        const searchRecursive = (folder, currentPath) => {
            if (folder.children) {
                Object.values(folder.children).forEach(item => {
                    if (item.name.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            ...item,
                            parentPath: currentPath
                        });
                    }
                    if (item.type === 'folder') {
                        searchRecursive(item, item.path);
                    }
                });
            }
        };
        
        const startFolder = this.getItem(path);
        if (startFolder && startFolder.type === 'folder') {
            searchRecursive(startFolder, path);
        }
        
        return results;
    }

    // Get folder contents
    getContents(path = this.currentPath) {
        const folder = this.getItem(path);
        if (!folder || folder.type !== 'folder') return [];
        
        return Object.values(folder.children || {}).filter(item => !item.hidden);
    }

    // Get recycle bin contents
    getRecycleBinContents() {
        const recycleBin = this.getItem('/RecycleBin');
        return recycleBin ? Object.values(recycleBin.children || {}) : [];
    }

    // Empty recycle bin
    emptyRecycleBin() {
        const recycleBin = this.getItem('/RecycleBin');
        if (recycleBin) {
            recycleBin.children = {};
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Get file type icon
    getFileIcon(item) {
        if (item.type === 'folder') {
            return '📁';
        }
        
        const ext = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            'txt': '📝',
            'doc': '📄',
            'docx': '📄',
            'pdf': '📕',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'mp3': '🎵',
            'wav': '🎵',
            'mp4': '🎬',
            'avi': '🎬',
            'html': '🌐',
            'css': '🎨',
            'js': '⚡',
            'zip': '📦',
            'rar': '📦'
        };
        
        return iconMap[ext] || '📄';
    }

    // Format file size
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Format date
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }
}

// Global file system instance
window.fileSystem = new FileSystem();