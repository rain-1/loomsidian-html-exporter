// Expects window.DOC_DATA to be populated with the document structure
// DOC_DATA = { rootId: "...", nodes: { "id": { content: "...", children: ["id", ...] } } }

document.addEventListener('DOMContentLoaded', () => {
    if (!window.DOC_DATA) return; // Index page or error

    const treeContainer = document.getElementById('tree-view');
    const readerContainer = document.getElementById('reader-view');
    const choicesContainer = document.getElementById('choices-view');
    const nodes = window.DOC_DATA.nodes;

    // State
    let currentPath = []; // Array of node IDs from root to current tip

    // Initialize
    init();

    function init() {
        // Check URL hash for state restoration
        const hash = window.location.hash.slice(1);
        if (hash && nodes[hash]) {
            reconstructPath(hash);
        } else {
            startFromRoot();
        }
        render();
    }

    function startFromRoot() {
        currentPath = [window.DOC_DATA.rootId];
    }

    function reconstructPath(leafId) {
        currentPath = [];
        let curr = leafId;
        while (curr) {
            currentPath.unshift(curr);
            curr = nodes[curr].parentId;
        }
    }

    function selectNode(nodeId) {
        // If clicking a node already in the path, truncate the path to that node
        const index = currentPath.indexOf(nodeId);
        if (index !== -1) {
            currentPath = currentPath.slice(0, index + 1);
        } else {
            // Appending a new child (or jumping to a node in the tree)
            // If it's a jump from tree, we need to reconstruct path
            reconstructPath(nodeId);
        }
        updateHash();
        render();
    }

    function updateHash() {
        const tip = currentPath[currentPath.length - 1];
        window.history.replaceState(null, null, `#${tip}`);
    }

    function render() {
        renderReader();
        renderTree();
    }

    function renderReader() {
        readerContainer.innerHTML = '';

        // Render continuous text
        currentPath.forEach((nodeId) => {
            const node = nodes[nodeId];
            if (!node.content) return;

            const el = document.createElement('span');
            el.className = 'reader-block';
            // Replace newlines with <br> to preserve formatting within the inline block
            const htmlContent = escapeHtml(node.content).replace(/\n/g, '<br>');
            el.innerHTML = htmlContent;
            readerContainer.appendChild(el);
        });

        // Scroll to bottom
        // Use setTimeout to ensure DOM has updated layout
        const mainElement = document.getElementById('main');
        setTimeout(() => {
            mainElement.scrollTop = mainElement.scrollHeight;
        }, 0);

        // Render Choices
        const tipId = currentPath[currentPath.length - 1];
        const tipNode = nodes[tipId];

        choicesContainer.innerHTML = '';
        if (tipNode.children && tipNode.children.length > 0) {
            const title = document.createElement('div');
            title.className = 'choices-title';
            title.textContent = 'Continue with...';
            choicesContainer.appendChild(title);

            tipNode.children.forEach(childId => {
                const child = nodes[childId];
                const item = document.createElement('div');
                item.className = 'choice-item';
                // Preview first few words
                const preview = child.content ? child.content.slice(0, 150) + (child.content.length > 150 ? '...' : '') : '<em>Empty</em>';
                item.innerHTML = `<div class="choice-preview">${escapeHtml(preview)}</div>`;
                item.onclick = () => selectNode(childId);
                choicesContainer.appendChild(item);
            });
        }
    }



    // Resizer Logic
    const sidebar = document.getElementById('sidebar');
    const resizer = document.getElementById('resizer');

    if (resizer) {
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none'; // Prevent text selection while resizing
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth > 150 && newWidth < 800) { // Min/Max constraints
                sidebar.style.width = `${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    function renderTree() {
        // We render the tree recursively starting from root
        // This might be expensive for huge trees, but let's try it.
        // Optimization: Only render expanded nodes? 
        // For now, let's render the whole tree but maybe collapse non-active branches if it's too big?
        // Let's try rendering just the active path and its siblings (the "backbone" of the story).

        // Actually, user asked for "entire loom tree".
        treeContainer.innerHTML = '';
        const rootId = window.DOC_DATA.rootId;
        treeContainer.appendChild(createTreeNode(rootId));
    }

    function createTreeNode(nodeId) {
        const node = nodes[nodeId];
        const isActive = currentPath.includes(nodeId);
        const isTip = currentPath[currentPath.length - 1] === nodeId;

        const container = document.createElement('div');
        container.className = 'tree-node';

        const content = document.createElement('div');
        content.className = `tree-content ${isActive ? 'active' : ''}`;
        content.textContent = (node.content || 'Empty').slice(0, 30) || '...';
        content.onclick = (e) => {
            e.stopPropagation();
            selectNode(nodeId);
        };
        container.appendChild(content);
        // Add bookmark star if node is bookmarked
        if (node.bookmarked) {
            const star = document.createElement('span');
            star.className = 'bookmark-star';
            star.textContent = '★'; // Unicode star
            content.appendChild(star);
        }

        // Render children if this node is active or if we want to show everything
        // Showing EVERYTHING might be too much. Let's show children if:
        // 1. Node is in current path (so we can see siblings of our path)
        // 2. Node is the tip (so we can see choices)
        // 3. OR maybe just show everything? "entire loom tree" implies everything.
        // Let's try showing everything. CSS can handle indentation.

        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';

            node.children.forEach(childId => {
                childrenContainer.appendChild(createTreeNode(childId));
            });
            container.appendChild(childrenContainer);
        }

        return container;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
