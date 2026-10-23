/* ─── CodeGraph — Main Script ─────────────────────────────────
   Handles folder selection, upload, file grid rendering, and
   navigation between views.
──────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

    /* ── State ────────────────────────────────────────────────── */
    let selectedFiles = [];
    let folderName    = '';

    /* ── DOM refs ─────────────────────────────────────────────── */
    const view1              = document.getElementById('view1');
    const view2              = document.getElementById('view2');
    const dropzone           = document.getElementById('dropzone');
    const folderInput        = document.getElementById('folderInput');
    const metadataContainer  = document.getElementById('metadataContainer');
    const previewFolderName  = document.getElementById('previewFolderName');
    const previewFolderStats = document.getElementById('previewFolderStats');
    const processBtn         = document.getElementById('processBtn');
    const activeFolderName   = document.getElementById('activeFolderName');
    const totalFilesBadge    = document.getElementById('totalFilesBadge');
    const searchInput        = document.getElementById('searchInput');
    const fileGrid           = document.getElementById('fileGrid');
    const changeFolderBtn    = document.getElementById('changeFolderBtn');
    const processingBanner   = document.getElementById('processingBanner');
    const successBanner      = document.getElementById('successBanner');
    const successText        = document.getElementById('successText');

    /* ── Constants ────────────────────────────────────────────── */
    const IGNORE_DIRS = new Set(['node_modules', 'venv', '.git', '__pycache__', '.env', 'dist', 'build', '.next', 'coverage']);
    const CODE_EXT    = new Set(['.py','.js','.ts','.java','.go','.rs','.cpp','.c','.rb','.php','.jsx','.tsx','.vue','.swift','.kt','.cs']);
    const ALL_EXT     = new Set([...CODE_EXT, '.html', '.css', '.json', '.md', '.yaml', '.yml', '.toml', '.sh', '.dart', '.r', '.scala']);

    /* ── Dropzone interactions ────────────────────────────────── */
    folderInput.addEventListener('change', handleFileSelect);

    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            folderInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    /* ── File selection handler ───────────────────────────────── */
    function handleFileSelect() {
        const files = Array.from(folderInput.files);
        if (!files.length) return;

        // Show code files in the grid; send only code files to backend
        selectedFiles = files.filter(f => ALL_EXT.has('.' + getFileExtension(f.name).toLowerCase()));

        const samplePath = files[0].webkitRelativePath;
        folderName = samplePath ? samplePath.split('/')[0] : 'Selected Project';

        const codeFileCount = files.filter(f => CODE_EXT.has('.' + getFileExtension(f.name).toLowerCase())).length;
        const totalBytes    = selectedFiles.reduce((a, f) => a + f.size, 0);

        previewFolderName.textContent  = folderName;
        previewFolderStats.textContent = `${codeFileCount} code files detected • ~${formatBytes(totalBytes)}`;
        metadataContainer.style.display = 'block';
    }

    /* ── Analyze button ───────────────────────────────────────── */
    processBtn.addEventListener('click', () => {
        const codeFiles = selectedFiles.filter(f => CODE_EXT.has('.' + getFileExtension(f.name).toLowerCase()));
        if (!codeFiles.length) {
            alert('No supported code files found in the selected folder.');
            return;
        }

        const fd = new FormData();
        fd.append('project', folderName);

        let skipped = 0;
        codeFiles.forEach(f => {
            const rel  = f.webkitRelativePath;
            const dirs = rel.split('/').slice(0, -1);
            if (dirs.some(d => IGNORE_DIRS.has(d))) { skipped++; return; }
            fd.append('files', f, f.name);
            fd.append('paths', rel);
        });

        // Switch to view2 and show loading state immediately
        switchView('view2');
        renderFileGrid(selectedFiles);
        processingBanner.style.display = 'flex';
        successBanner.style.display    = 'none';

        fetch('/go_through_all', { method: 'POST', body: fd })
            .then(res => {
                if (!res.ok) throw new Error(`Server error ${res.status}`);
                return res.json();
            })
            .then(data => {
                processingBanner.style.display = 'none';
                successBanner.style.display    = 'flex';
                const failed = data.failed || 0;
                successText.textContent =
                    `Analysis complete! ${data.processed} files indexed into the graph.` +
                    (failed > 0 ? ` (${failed} failed)` : '') +
                    ' Click any file card to view its dependency graph.';
            })
            .catch(err => {
                processingBanner.style.display = 'none';
                successBanner.style.display    = 'flex';
                successBanner.style.background  = '#fef2f2';
                successBanner.style.borderColor = '#fca5a5';
                successBanner.style.color       = '#991b1b';
                successText.textContent = `Error: ${err.message}. The graph may be incomplete.`;
            });
    });

    /* ── Navigation ───────────────────────────────────────────── */
    changeFolderBtn.addEventListener('click', () => switchView('view1'));

    function switchView(target) {
        if (target === 'view2') {
            view1.classList.remove('active');
            setTimeout(() => {
                view1.style.display  = 'none';
                view2.style.display  = 'block';
                setTimeout(() => view2.classList.add('active'), 30);
            }, 220);
            activeFolderName.textContent = folderName;
            totalFilesBadge.textContent  = `${selectedFiles.length} Files`;
        } else {
            view2.classList.remove('active');
            setTimeout(() => {
                view2.style.display  = 'none';
                view1.style.display  = 'block';
                setTimeout(() => view1.classList.add('active'), 30);
            }, 220);
        }
    }

    /* ── Search ───────────────────────────────────────────────── */
    searchInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        const filtered = selectedFiles.filter(f =>
            f.name.toLowerCase().includes(q) ||
            getFileExtension(f.name).toLowerCase().includes(q) ||
            (f.webkitRelativePath || '').toLowerCase().includes(q)
        );
        renderFileGrid(filtered);
    });

    /* ── File grid renderer ───────────────────────────────────── */
    function renderFileGrid(filesToRender) {
        fileGrid.innerHTML = '';

        if (!filesToRender.length) {
            fileGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <h3>No files found</h3>
                    <p>Try a different search term or extension.</p>
                </div>`;
            return;
        }

        filesToRender.forEach((file, idx) => {
            const ext        = getFileExtension(file.name);
            const iconCfg    = getIconConfig(ext);
            const relPath    = file.webkitRelativePath || file.name;
            const isCodeFile = CODE_EXT.has('.' + ext.toLowerCase());

            const card = document.createElement('div');
            card.className = 'file-card';
            card.style.animationDelay = `${Math.min(idx * 30, 400)}ms`;

            card.innerHTML = `
                <div>
                    <div class="card-top">
                        <i class="${iconCfg.icon} file-icon ${iconCfg.colorClass}"></i>
                        <span class="file-type-badge">${ext ? ext.toUpperCase() : 'FILE'}</span>
                    </div>
                    <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                    <div class="file-path" title="${escapeHtml(relPath)}">${escapeHtml(relPath)}</div>
                </div>
                <div class="card-bottom">
                    <span class="status-indicator">
                        <span class="status-dot"></span>
                        ${isCodeFile ? 'Indexed' : 'Detected'}
                    </span>
                    <span class="card-graph-hint">
                        <i class="fa-solid fa-diagram-project"></i> View graph
                    </span>
                    <span>${formatBytes(file.size)}</span>
                </div>
            `;

            if (isCodeFile) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    const parts   = relPath.split('/');
                    const project = parts[0];
                    const filePath = parts.slice(1).join('/');
                    window.open(
                        '/graph?project=' + encodeURIComponent(project) +
                        '&file='    + encodeURIComponent(filePath),
                        '_blank'
                    );
                });
            } else {
                card.style.cursor = 'default';
                card.style.opacity = '0.7';
            }

            fileGrid.appendChild(card);
        });
    }

    /* ── Utilities ────────────────────────────────────────────── */
    function getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    function getIconConfig(ext) {
        ext = (ext || '').toLowerCase();
        if (['jpg','jpeg','png','gif','svg','webp','ico'].includes(ext))
            return { icon: 'fa-solid fa-file-image', colorClass: 'icon-image' };
        if (['pdf'].includes(ext))
            return { icon: 'fa-solid fa-file-pdf', colorClass: 'icon-pdf' };
        if (['py','js','jsx','ts','tsx','html','css','json','go','rs','cpp','c','java','rb','php','vue','swift','kt','cs','dart','scala','r','toml','yaml','yml'].includes(ext))
            return { icon: 'fa-solid fa-file-code', colorClass: 'icon-code' };
        if (['mp4','mov','avi','mkv','webm'].includes(ext))
            return { icon: 'fa-solid fa-file-video', colorClass: 'icon-video' };
        if (['mp3','wav','ogg','flac'].includes(ext))
            return { icon: 'fa-solid fa-file-audio', colorClass: 'icon-audio' };
        if (['zip','tar','gz','7z','rar'].includes(ext))
            return { icon: 'fa-solid fa-file-zipper', colorClass: 'icon-archive' };
        if (['doc','docx','txt','md','rtf'].includes(ext))
            return { icon: 'fa-solid fa-file-lines', colorClass: 'icon-doc' };
        return { icon: 'fa-solid fa-file', colorClass: 'icon-default' };
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});