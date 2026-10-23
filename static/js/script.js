document.addEventListener('DOMContentLoaded', () => {
    let selectedFiles = [];
    let folderName = '';

    const view1 = document.getElementById('view1');
    const view2 = document.getElementById('view2');
    const dropzone = document.getElementById('dropzone');
    const folderInput = document.getElementById('folderInput');
    const metadataContainer = document.getElementById('metadataContainer');
    const previewFolderName = document.getElementById('previewFolderName');
    const previewFolderStats = document.getElementById('previewFolderStats');
    const processBtn = document.getElementById('processBtn');
    const activeFolderName = document.getElementById('activeFolderName');
    const totalFilesBadge = document.getElementById('totalFilesBadge');
    const searchInput = document.getElementById('searchInput');
    const fileGrid = document.getElementById('fileGrid');
    const changeFolderBtn = document.getElementById('changeFolderBtn');

    folderInput.addEventListener('change', handleFileSelect);

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            folderInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    processBtn.addEventListener('click', () => {
        switchView('view2');
        renderFileGrid(selectedFiles);
    });

    changeFolderBtn.addEventListener('click', () => { switchView('view1'); });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = selectedFiles.filter(file =>
            file.name.toLowerCase().includes(query) ||
            getFileExtension(file.name).toLowerCase().includes(query)
        );
        renderFileGrid(filtered);
    });

    const CODE_EXTENSIONS = ['py', 'js', 'ts', 'java', 'go', 'rs', 'cpp', 'c', 'rb', 'php', 'jsx', 'tsx', 'html', 'css', 'vue', 'swift', 'kt', 'scala', 'cs', 'r', 'dart'];

function handleFileSelect() {
    const files = Array.from(folderInput.files);
    if (!files.length) return;

    // filter only code files
    selectedFiles = files.filter(file => {
        const ext = getFileExtension(file.name).toLowerCase();
        return CODE_EXTENSIONS.includes(ext);
    });

    const samplePath = files[0].webkitRelativePath;
    folderName = samplePath ? samplePath.split('/')[0] : 'Selected Directory';
    const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    previewFolderName.textContent = folderName;
    previewFolderStats.textContent = `${selectedFiles.length} code files detected • ~${formatBytes(totalBytes)}`;
    metadataContainer.style.display = 'block';
}

    function switchView(targetView) {
        if (targetView === 'view2') {
            view1.classList.remove('active');
            setTimeout(() => {
                view1.style.display = 'none';
                view2.style.display = 'block';
                setTimeout(() => view2.classList.add('active'), 50);
            }, 200);
            activeFolderName.textContent = folderName;
            totalFilesBadge.textContent = `${selectedFiles.length} Files`;
        } else {
            view2.classList.remove('active');
            setTimeout(() => {
                view2.style.display = 'none';
                view1.style.display = 'block';
                setTimeout(() => view1.classList.add('active'), 50);
            }, 200);
        }
    }

    function renderFileGrid(filesToRender) {
        fileGrid.innerHTML = '';
        if (filesToRender.length === 0) {
            fileGrid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No files match your search criteria.</p></div>`;
            return;
        }
        filesToRender.forEach(file => {
            const ext = getFileExtension(file.name);
            const iconConfig = getIconConfig(ext);
            const relativePath = file.webkitRelativePath || file.name;
            const card = document.createElement('div');
            card.className = 'file-card';
            card.innerHTML = `
                <div>
                    <div class="card-top">
                        <i class="${iconConfig.icon} file-icon ${iconConfig.colorClass}"></i>
                        <span class="file-type-badge">${ext || 'FILE'}</span>
                    </div>
                    <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                    <div class="file-path" title="${escapeHtml(relativePath)}">${escapeHtml(relativePath)}</div>
                </div>
                <div class="card-bottom">
                    <span>${formatBytes(file.size)}</span>
                    <span class="status-indicator"><span class="status-dot"></span> Indexed</span>
                </div>
            `;
            fileGrid.appendChild(card);
        });
    }

    function getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    function getIconConfig(ext) {
        ext = ext.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return { icon: 'fa-solid fa-file-image', colorClass: 'icon-image' };
        if (['pdf'].includes(ext)) return { icon: 'fa-solid fa-file-pdf', colorClass: 'icon-pdf' };
        if (['js', 'py', 'html', 'css', 'json', 'ts', 'cpp', 'java'].includes(ext)) return { icon: 'fa-solid fa-file-code', colorClass: 'icon-code' };
        if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return { icon: 'fa-solid fa-file-video', colorClass: 'icon-video' };
        if (['mp3', 'wav', 'ogg'].includes(ext)) return { icon: 'fa-solid fa-file-audio', colorClass: 'icon-audio' };
        if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return { icon: 'fa-solid fa-file-zipper', colorClass: 'icon-archive' };
        if (['doc', 'docx', 'txt', 'md'].includes(ext)) return { icon: 'fa-solid fa-file-lines', colorClass: 'icon-doc' };
        return { icon: 'fa-solid fa-file', colorClass: 'icon-default' };
    }

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});