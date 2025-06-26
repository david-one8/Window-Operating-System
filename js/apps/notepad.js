// Notepad Application - notepad ka application hai ye
class NotepadApp {
    constructor(container, appData = {}) {
        this.container = container;
        this.appData = appData;
        this.currentFile = null;
        this.isModified = false;
        this.content = '';
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.loadContent();
    }

    render() {
        this.container.innerHTML = `
            <div class="notepad-app">
                <div class="notepad-toolbar">
                    <button class="notepad-btn" data-action="new">New</button>
                    <button class="notepad-btn" data-action="open">Open</button>
                    <button class="notepad-btn" data-action="save">Save</button>
                    <button class="notepad-btn" data-action="save-as">Save As</button>
                    <div class="toolbar-separator"></div>
                    <button class="notepad-btn" data-action="undo">Undo</button>
                    <button class="notepad-btn" data-action="redo">Redo</button>
                    <div class="toolbar-separator"></div>
                    <button class="notepad-btn" data-action="find">Find</button>
                    <button class="notepad-btn" data-action="replace">Replace</button>
                </div>
                <textarea class="notepad-editor" placeholder="Start typing..."></textarea>
                <div class="notepad-status">
                    <span class="status-file">Untitled</span>
                    <span class="status-position">Line 1, Column 1</span>
                    <span class="status-chars">0 characters</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Toolbar buttons - toolbar buttons setup kar rahe hai
        this.container.querySelectorAll('.notepad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleToolbarAction(btn.dataset.action);
            });
        });

        // Editor events - editor events setup kar rahe hai
        const editor = this.container.querySelector('.notepad-editor');
        if (editor) {
            editor.addEventListener('input', () => {
                this.handleContentChange();
            });

            editor.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });

            editor.addEventListener('keyup', () => {
                this.updateStatus();
            });

            editor.addEventListener('click', () => {
                this.updateStatus();
            });
        }

        // Keyboard shortcuts - keyboard shortcuts setup kar rahe hai
        this.container.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.newFile();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openFile();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.saveAsFile();
                        } else {
                            this.saveFile();
                        }
                        break;
                    case 'f':
                        e.preventDefault();
                        this.findText();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.replaceText();
                        break;
                }
            }
        });
    }

    loadContent() {
        // Load content from file path if provided - agar file path diya hai toh content load kar rahe hai
        if (this.appData.filePath) {
            const content = window.fileSystem.readFile(this.appData.filePath);
            if (content !== null) {
                this.setContent(content);
                this.currentFile = this.appData.filePath;
                this.updateTitle();
            }
        } else {
            // Load last session content - last session ka content load kar rahe hai
            const savedContent = window.storage.getAppData('notepad');
            if (savedContent.content) {
                this.setContent(savedContent.content);
            }
        }
    }

    handleToolbarAction(action) {
        switch (action) {
            case 'new':
                this.newFile();
                break;
            case 'open':
                this.openFile();
                break;
            case 'save':
                this.saveFile();
                break;
            case 'save-as':
                this.saveAsFile();
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'find':
                this.findText();
                break;
            case 'replace':
                this.replaceText();
                break;
        }
    }

    handleContentChange() {
        const editor = this.container.querySelector('.notepad-editor');
        if (editor) {
            this.content = editor.value;
            this.isModified = true;
            this.updateTitle();
            this.updateStatus();
            this.saveSession();
        }
    }

    handleKeyDown(e) {
        // Handle tab key - tab key handle kar rahe hai
        if (e.key === 'Tab') {
            e.preventDefault();
            const editor = e.target;
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            
            editor.value = editor.value.substring(0, start) + '\t' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 1;
            
            this.handleContentChange();
        }
    }

    newFile() {
        if (this.isModified) {
            if (!confirm('You have unsaved changes. Are you sure you want to create a new file?')) {
                return;
            }
        }

        this.setContent('');
        this.currentFile = null;
        this.isModified = false;
        this.updateTitle();
        this.updateStatus();
    }

    openFile() {
        // Show file picker dialog - file picker dialog dikhate hai
        this.showFileDialog('open');
    }

    saveFile() {
        if (this.currentFile) {
            // Save to existing file - existing file mein save kar rahe hai
            if (window.fileSystem.writeFile(this.currentFile, this.content)) {
                this.isModified = false;
                this.updateTitle();
                this.showNotification('File saved successfully', 'success');
            } else {
                this.showNotification('Failed to save file', 'error');
            }
        } else {
            // Save as new file - nayi file mein save kar rahe hai
            this.saveAsFile();
        }
    }

    saveAsFile() {
        this.showFileDialog('save');
    }

    showFileDialog(mode) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${mode === 'open' ? 'Open File' : 'Save File'}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-content">
                    <div class="file-dialog">
                        <div class="file-path">
                            <label>Path:</label>
                            <input type="text" class="path-input" value="/Documents" readonly>
                        </div>
                        <div class="file-list">
                            ${this.renderFileList('/Documents', mode)}
                        </div>
                        <div class="file-name">
                            <label>File name:</label>
                            <input type="text" class="name-input" placeholder="Enter file name" ${mode === 'save' ? 'value="Untitled.txt"' : ''}>
                        </div>
                        <div class="dialog-buttons">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-action">${mode === 'open' ? 'Open' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners - event listeners setup kar rahe hai
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const actionBtn = modal.querySelector('.btn-action');
        const nameInput = modal.querySelector('.name-input');

        const closeModal = () => modal.remove();

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        // File list interactions - file list interactions setup kar rahe hai
        modal.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.dataset.type === 'file') {
                    nameInput.value = item.dataset.name;
                }
            });

            item.addEventListener('dblclick', () => {
                if (item.dataset.type === 'file' && mode === 'open') {
                    this.handleFileAction(mode, item.dataset.path);
                    closeModal();
                }
            });
        });

        actionBtn.onclick = () => {
            const fileName = nameInput.value.trim();
            if (!fileName) {
                alert('Please enter a file name');
                return;
            }

            const filePath = '/Documents/' + fileName;
            this.handleFileAction(mode, filePath);
            closeModal();
        };

        // Focus name input - name input pe focus kar rahe hai
        nameInput.focus();
        nameInput.select();
    }

    renderFileList(path, mode) {
        const contents = window.fileSystem.getContents(path);
        const files = contents.filter(item => 
            item.type === 'file' && 
            (mode === 'save' || item.name.endsWith('.txt'))
        );

        if (files.length === 0) {
            return '<div class="no-files">No text files found</div>';
        }

        return files.map(file => `
            <div class="file-item" data-type="${file.type}" data-name="${file.name}" data-path="${file.path}">
                <div class="file-icon">${window.fileSystem.getFileIcon(file)}</div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${window.fileSystem.formatSize(file.size || 0)}</div>
                <div class="file-date">${window.fileSystem.formatDate(file.modified || Date.now())}</div>
            </div>
        `).join('');
    }

    handleFileAction(mode, filePath) {
        if (mode === 'open') {
            const content = window.fileSystem.readFile(filePath);
            if (content !== null) {
                this.setContent(content);
                this.currentFile = filePath;
                this.isModified = false;
                this.updateTitle();
                this.showNotification('File opened successfully', 'success');
            } else {
                this.showNotification('Failed to open file', 'error');
            }
        } else {
            // Save mode - save mode hai
            if (window.fileSystem.writeFile(filePath, this.content)) {
                this.currentFile = filePath;
                this.isModified = false;
                this.updateTitle();
                this.showNotification('File saved successfully', 'success');
            } else {
                // Try creating new file
                const fileName = filePath.split('/').pop();
                const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
                
                if (window.fileSystem.createFile(fileName, this.content, parentPath)) {
                    this.currentFile = filePath;
                    this.isModified = false;
                    this.updateTitle();
                    this.showNotification('File saved successfully', 'success');
                } else {
                    this.showNotification('Failed to save file', 'error');
                }
            }
        }
    }

    undo() {
        const editor = this.container.querySelector('.notepad-editor');
        if (editor) {
            document.execCommand('undo');
        }
    }

    redo() {
        const editor = this.container.querySelector('.notepad-editor');
        if (editor) {
            document.execCommand('redo');
        }
    }

    findText() {
        const query = prompt('Find:');
        if (query) {
            const editor = this.container.querySelector('.notepad-editor');
            const content = editor.value;
            const index = content.toLowerCase().indexOf(query.toLowerCase());
            
            if (index !== -1) {
                editor.focus();
                editor.setSelectionRange(index, index + query.length);
                this.showNotification(`Found "${query}"`, 'success');
            } else {
                this.showNotification(`"${query}" not found`, 'warning');
            }
        }
    }

    replaceText() {
        const find = prompt('Find:');
        if (!find) return;
        
        const replace = prompt('Replace with:');
        if (replace === null) return;
        
        const editor = this.container.querySelector('.notepad-editor');
        const content = editor.value;
        const newContent = content.replace(new RegExp(find, 'gi'), replace);
        
        if (newContent !== content) {
            this.setContent(newContent);
            this.showNotification('Text replaced', 'success');
        } else {
            this.showNotification(`"${find}" not found`, 'warning');
        }
    }

    setContent(content) {
        const editor = this.container.querySelector('.notepad-editor');
        if (editor) {
            editor.value = content;
            this.content = content;
            this.updateStatus();
        }
    }

    updateTitle() {
        const windowElement = this.container.closest('.window');
        if (windowElement) {
            const titleElement = windowElement.querySelector('.window-title');
            if (titleElement) {
                const fileName = this.currentFile ? 
                    this.currentFile.split('/').pop() : 
                    'Untitled';
                titleElement.textContent = `${fileName}${this.isModified ? ' *' : ''} - Notepad`;
            }
        }

        // Update status bar - status bar update kar rahe hai
        const statusFile = this.container.querySelector('.status-file');
        if (statusFile) {
            statusFile.textContent = this.currentFile ? 
                this.currentFile.split('/').pop() : 
                'Untitled';
        }
    }

    updateStatus() {
        const editor = this.container.querySelector('.notepad-editor');
        if (!editor) return;

        const content = editor.value;
        const position = editor.selectionStart;
        const lines = content.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        const statusPosition = this.container.querySelector('.status-position');
        const statusChars = this.container.querySelector('.status-chars');

        if (statusPosition) {
            statusPosition.textContent = `Line ${line}, Column ${column}`;
        }

        if (statusChars) {
            statusChars.textContent = `${content.length} characters`;
        }
    }

    saveSession() {
        // Save current content to localStorage for session recovery - session recovery ke liye current content localStorage mein save kar rahe hai
        window.storage.saveAppData('notepad', {
            content: this.content,
            currentFile: this.currentFile,
            isModified: this.isModified
        });
    }

    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show({
                title: 'Notepad',
                message: message,
                type: type,
                icon: '📝'
            });
        }
    }
}

// Register the app globally - app ko globally register kar rahe hai
window.NotepadApp = NotepadApp;