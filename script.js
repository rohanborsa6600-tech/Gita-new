// ३. JavaScript (पानाची कार्यपद्धती) ⚙️
// UPDATED for p1/p2/p3/p11/p6/p9 structure
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Global Variables ---
    const gitaData = {
        chapters: [], // { title, chapterNum, el, shlokas: [] }
        allShlokas: [], // { text, location, id, chapterNum }
        indices: {
            shloka: [], // { text, location, firstLetter }
            paad: [],   // { text, location, firstLetter }
            shabda: new Map(), // word -> [location]
            vakta: []   // { text, location, firstLetter }
        }
    };
    let currentFontScale = 1.0;
    const MAX_FONT_SCALE = 1.5;
    const MIN_FONT_SCALE = 0.8;

    // --- Element Selectors ---
    const appContainer = document.querySelector('.app-container');
    const sidebar = document.querySelector('.sidebar');
    const tocContainer = document.getElementById('auto-toc-container');
    const gitaPathContainer = document.getElementById('gita-path');
    const sections = document.querySelectorAll('.content-area > section');
    const navLinks = document.querySelectorAll('.main-nav a, .chapter-list a'); // Will be updated
    const chapterPrompt = document.getElementById('chapter-prompt');
    const searchResultsContainer = document.getElementById('search-results');
    const globalSearchBar = document.getElementById('global-search-bar');
    
    // Suchi elements
    const indexTabsContainer = document.querySelector('.index-tabs');
    const tabContents = document.querySelectorAll('.tab-content');
    const letterListContainer = document.querySelector('.letter-list');
    
    // --- 1. Main Initialization ---
    function init() {
        parseGitaData();
        setupUIControls();
        setupClickHandlers();
        setupSuchiControls();
        
        // Show cover page initially
        showSection('#cover-page');
        setActiveLink(document.querySelector('.main-nav a[href="#cover-page"]'));
        
        // **Initialize Lucide Icons**
        lucide.createIcons();
    }

    // --- 2. Data Parsing (UPDATED for p3/p11/p6/p9 structure) ---
    function parseGitaData() {
        console.log("Parsing Gita data with new structure (p1/p2/p3/p11/p6/p9)...");
        const rawDataContainer = document.getElementById('raw-gita-data');
        if (!rawDataContainer) {
            console.error("Fatal Error: #raw-gita-data container not found.");
            return;
        }
        
        const nodes = rawDataContainer.childNodes;
        let currentChapter = null;
        let currentSpeaker = "N/A";
        let chapterIndex = 0;
        
        // These track the *current* shloka being built
        let currentShlokaContainer = null;
        let currentShlokaDetailsDiv = null;
        let currentShlokaData = null; // Store last shloka data for p11

        nodes.forEach(node => {
            // Check for element nodes only
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            const tagName = node.nodeName.toLowerCase();
            const className = node.className;

            if (tagName === 'p' && className === 'p1') { // 1. Chapter
                chapterIndex++;
                const chapterTitle = node.textContent.trim();
                
                currentChapter = {
                    title: chapterTitle,
                    chapterNum: chapterIndex,
                    shlokas: []
                };
                gitaData.chapters.push(currentChapter);
                
                // 1a. Create ToC link
                const tocLink = document.createElement('a');
                tocLink.href = `#chapter-${chapterIndex}`;
                tocLink.textContent = chapterTitle.replace('अथ ', '').replace('ऽध्यायः', ' अध्याय');
                tocLink.dataset.target = `#chapter-${chapterIndex}`;
                const tocLi = document.createElement('li');
                tocLi.appendChild(tocLink);
                tocContainer.appendChild(tocLi);
                
                // 1b. Create Chapter Box
                const chapterBox = document.createElement('div');
                chapterBox.className = 'chapter-box';
                chapterBox.id = `chapter-${chapterIndex}`;
                chapterBox.innerHTML = `<h2>${chapterTitle}</h2>`;
                currentChapter.el = chapterBox;
                gitaPathContainer.appendChild(chapterBox);
                
                currentShlokaContainer = null;
                currentShlokaDetailsDiv = null;
                currentShlokaData = null;

            } else if (tagName === 'p' && className === 'p2') { // 2. Speaker
                if (!currentChapter) return;
                
                currentSpeaker = node.textContent.trim();
                
                // Add speaker element to chapter box
                const speakerEl = document.createElement('p');
                speakerEl.className = 'p4'; // Use p4 class for styling
                speakerEl.textContent = currentSpeaker;
                currentChapter.el.appendChild(speakerEl);

                currentShlokaContainer = null;
                currentShlokaDetailsDiv = null;
                currentShlokaData = null;
                
            } else if (tagName === 'p' && className === 'p3') { // 3. Shloka
                if (!currentChapter) return;

                const shlokaHtml = node.innerHTML;
                
                // Check for shloka number
                const numberMatch = shlokaHtml.match(/।।(\d{2})\/(\d{2})।।/);
                if (numberMatch) {
                    const chapterNum = parseInt(numberMatch[1], 10);
                    const shlokaNum = parseInt(numberMatch[2], 10);
                    
                    const location = `${chapterNum}.${shlokaNum}`;
                    const shlokaId = `c${chapterNum}s${shlokaNum}`;
                    const fullHtml = shlokaHtml.replace(/।।(\d{2})\/(\d{2})।।/, ` ।।${shlokaNum}।।`);
                    
                    // Cleaned text for search and indices
                    const shlokaText = node.textContent
                        .replace(/।।(\d{2})\/(\d{2})।।/, ' ')
                        .replace(/।/g, ' । ').replace(/।।/g, ' ।। ')
                        .replace(/\s+/g, ' ').trim();

                    // Store shloka data
                    currentShlokaData = { // *** SET currentShlokaData ***
                        text: shlokaText, html: fullHtml, location: location,
                        id: shlokaId, chapterNum: chapterNum, speaker: currentSpeaker
                    };
                    currentChapter.shlokas.push(currentShlokaData);
                    gitaData.allShlokas.push(currentShlokaData);
                    
                    // --- Create Shloka Container HTML ---
                    currentShlokaContainer = document.createElement('div');
                    currentShlokaContainer.className = 'shloka-container';
                    
                    const shlokaEl = document.createElement('p');
                    shlokaEl.className = 'p6'; // Use p6 class for STYLING
                    shlokaEl.id = shlokaId;
                    shlokaEl.innerHTML = fullHtml;
                    currentShlokaContainer.appendChild(shlokaEl);

                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'toggle-details';
                    toggleBtn.innerHTML = `<i data-lucide="chevron-down"></i> अधिक माहिती`;
                    currentShlokaContainer.appendChild(toggleBtn);
                    
                    currentShlokaDetailsDiv = document.createElement('div');
                    currentShlokaDetailsDiv.className = 'shloka-details';
                    currentShlokaContainer.appendChild(currentShlokaDetailsDiv);
                    
                    currentChapter.el.appendChild(currentShlokaContainer);
                    // --- End HTML Creation ---

                    // --- Populate Indices ---
                    // 1. Shlok Suchi (from p3)
                    const firstLine = shlokaText.split('।')[0] + '।';
                    const firstLetter = firstLine.charAt(0);
                    if (firstLine.trim()) {
                        gitaData.indices.shloka.push({ text: firstLine, location: location, firstLetter: firstLetter });
                    }
                    // 2. Shabda Suchi (from p3)
                    const words = shlokaText.replace(/।|॥|[,.;?!]/g, ' ').split(/\s+/);
                    words.forEach(word => {
                        if (word && word.length > 1) {
                            if (!gitaData.indices.shabda.has(word)) gitaData.indices.shabda.set(word, []);
                            const locations = gitaData.indices.shabda.get(word);
                            if (!locations.includes(location)) locations.push(location);
                        }
                    });
                    // 3. Vakta Suchi (from p2)
                    gitaData.indices.vakta.push({ text: currentSpeaker, location: location, firstLetter: currentSpeaker.charAt(0) });
                    // *Paad Suchi is populated by p11*
                }
            
            } else if (tagName === 'p' && className === 'p11') { // 4. Paad (for Paad Suchi)
                if (!currentShlokaData) return; // Must follow a shloka
                
                const paadText = node.textContent.trim();
                const location = currentShlokaData.location; // Get location from last shloka
                
                if (paadText) {
                    gitaData.indices.paad.push({ text: paadText, location: location, firstLetter: paadText.charAt(0) });
                }

            } else if (tagName === 'p' && className === 'p6') { // 5. Anvay (for Details)
                if (!currentShlokaDetailsDiv) return; // Must be inside a shloka container
                
                const detailEl = node.cloneNode(true);
                detailEl.className = 'shloka-detail-item p6'; // Add class for styling
                currentShlokaDetailsDiv.appendChild(detailEl);

            } else if (tagName === 'p' && className === 'p9') { // 6. Arth (for Details)
                if (!currentShlokaDetailsDiv) return; // Must be inside a shloka container
                
                const detailEl = node.cloneNode(true);
                detailEl.className = 'shloka-detail-item p9'; // Add class for styling
                currentShlokaDetailsDiv.appendChild(detailEl);
            }
        });
        
        // 5. Sort Indices (as before)
        const marathiCompare = new Intl.Collator('mr').compare;
        gitaData.indices.shloka.sort((a, b) => marathiCompare(a.text, b.text));
        gitaData.indices.paad.sort((a, b) => marathiCompare(a.text, b.text));
        gitaData.indices.vakta.sort((a, b) => {
            const speakerCompare = marathiCompare(a.text, b.text);
            if (speakerCompare !== 0) return speakerCompare;
            const [aChap, aShlok] = a.location.split('.').map(Number);
            const [bChap, bShlok] = b.location.split('.').map(Number);
            if (aChap !== bChap) return aChap - bChap;
            return aShlok - bShlok;
        });
        gitaData.indices.shabda = new Map(
            [...gitaData.indices.shabda.entries()].sort((a, b) => marathiCompare(a[0], b[0]))
        );

        // 6. Render initial indices (Shloka Suchi)
        renderIndex('shloka');
        updateLetterList('shloka');

        console.log("Parsing complete.", gitaData);
    }

    // --- 3. UI Controls Setup ---
    function setupUIControls() {
        // Theme Toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('gitaTheme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        });
        
        if (localStorage.getItem('gitaTheme') === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // Font Size
        document.querySelector('.font-plus').addEventListener('click', () => {
            if (currentFontScale < MAX_FONT_SCALE) {
                currentFontScale += 0.1;
                document.documentElement.style.setProperty('--font-scale-factor', currentFontScale);
            }
        });
        document.querySelector('.font-minus').addEventListener('click', () => {
             if (currentFontScale > MIN_FONT_SCALE) {
                currentFontScale -= 0.1;
                document.documentElement.style.setProperty('--font-scale-factor', currentFontScale);
            }
        });
        
        // Sidebar Toggle
        document.querySelector('.sidebar-toggle').addEventListener('click', () => {
            appContainer.classList.toggle('sidebar-collapsed');
        });
        
        // ---** NEW: Collapse Chapter List **---
        document.querySelector('.chapter-list h4').addEventListener('click', (e) => {
            const chapterList = e.currentTarget.closest('.chapter-list');
            chapterList.classList.toggle('collapsed');
            const tocList = chapterList.querySelector('#auto-toc-container');
            
            if (chapterList.classList.contains('collapsed')) {
                tocList.style.display = 'none';
            } else {
                tocList.style.display = 'block';
            }
        });
        
        // Close sidebar on content click (on mobile)
        appContainer.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !appContainer.classList.contains('sidebar-collapsed')) {
                if (e.target.closest('.sidebar') || e.target.closest('.sidebar-toggle')) return;
                appContainer.classList.add('sidebar-collapsed');
            }
        });

        // Global Search
        globalSearchBar.addEventListener('input', (e) => {
            performGlobalSearch(e.target.value);
        });
    }
    
    // --- 4. Navigation & Click Handlers ---
    function setupClickHandlers() {
        // Sidebar Navigation
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href');
            
            if (targetId.startsWith('#chapter-')) {
                showSection('#gita-path');
                setActiveLink(document.querySelector('.main-nav a[href="#gita-path"]'));
                showChapterBox(targetId);
                hideSearchResults();
            } else {
                showSection(targetId);
                hideChapterBoxes();
                hideSearchResults();
            }
            
            setActiveLink(link);
            
            if (window.innerWidth <= 768 && !appContainer.classList.contains('sidebar-collapsed')) {
                appContainer.classList.add('sidebar-collapsed');
            }
        });
        
        // ---** NEW: Shloka Detail Toggle **---
        gitaPathContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.toggle-details');
            if (!button) return;
            
            const shlokaContainer = button.closest('.shloka-container');
            const detailsDiv = shlokaContainer.querySelector('.shloka-details');
            
            if (detailsDiv.style.display === 'block') {
                detailsDiv.style.display = 'none';
                button.innerHTML = `<i data-lucide="chevron-down"></i> अधिक माहिती`;
            } else {
                detailsDiv.style.display = 'block';
                button.innerHTML = `<i data-lucide="chevron-up"></i> माहिती लपवा`;
            }
            // Re-render the icon we just changed
            lucide.createIcons();
        });
    }

    // --- 5. Suchi (Index) Controls ---
    function setupSuchiControls() {
        // Tab clicks
        indexTabsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-button');
            if (!button) return;
            
            const indexName = button.dataset.index;
            openIndex(indexName);
            
            if (indexTabsContainer.querySelector('.active')) {
                indexTabsContainer.querySelector('.active').classList.remove('active');
            }
            button.classList.add('active');
        });
        
        // Letter list clicks
        letterListContainer.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();
            
            const letter = link.getAttribute('href').replace('#letter-', '');
            const activeTabContent = document.querySelector('.tab-content.active .index-results');
            
            const items = activeTabContent.querySelectorAll('.index-item');
            let targetItem = null;
            for (const item of items) {
                if (item.dataset.firstLetter === letter) {
                    targetItem = item;
                    break;
                }
            }
            
            if (targetItem) {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                targetItem.style.transition = 'background-color 0.5s';
                targetItem.style.backgroundColor = 'var(--icon-hover-bg)';
                setTimeout(() => {
                    targetItem.style.backgroundColor = 'transparent';
                }, 1000);
            }
        });
        
        // Location clicks (delegated)
        document.querySelector('.content-area').addEventListener('click', (e) => {
            const locationLink = e.target.closest('[data-loc]');
            if (locationLink) {
                e.preventDefault();
                MapsToShloka(locationLink.dataset.loc);
            }
        });
    }

    // --- 6. Helper Functions ---
    
    function showSection(targetId) {
        sections.forEach(section => {
            section.classList.toggle('active', section.id === targetId.substring(1));
        });
    }

    function setActiveLink(activeLink) {
        document.querySelectorAll('.main-nav a, .chapter-list a').forEach(link => {
            link.classList.remove('active');
        });
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    function hideChapterBoxes() {
        document.querySelectorAll('.chapter-box').forEach(box => box.classList.remove('active'));
        chapterPrompt.style.display = 'block';
    }
    
    function showChapterBox(chapterId) {
        hideChapterBoxes(); // Hide all first
        chapterPrompt.style.display = 'none';
        const chapterBox = document.querySelector(chapterId);
        if (chapterBox) {
            chapterBox.classList.add('active');
        }
    }
    
    function hideSearchResults() {
        searchResultsContainer.style.display = 'none';
        globalSearchBar.value = ''; // Clear search bar
    }

    function MapsToShloka(location) { // (उदा. "1.2")
        try {
            const [chapterNum, shlokaNum] = location.split('.');
            if (!chapterNum || !shlokaNum) return;
            
            const chapterId = `#chapter-${chapterNum}`;
            const shlokaId = `#c${chapterNum}s${shlokaNum}`;

            showSection('#gita-path');
            showChapterBox(chapterId);
            hideSearchResults();

            setActiveLink(document.querySelector(`.main-nav a[href="#gita-path"]`));
            const chapterLink = document.querySelector(`.chapter-list a[href="${chapterId}"]`);
            if(chapterLink) {
                chapterLink.classList.add('active');
            }

            const shlokaElement = document.querySelector(shlokaId);
            if (shlokaElement) {
                shlokaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                shlokaElement.classList.add('highlight');
                setTimeout(() => {
                    shlokaElement.classList.remove('highlight');
                }, 2000); // 2 seconds
            } else {
                console.warn(`Shloka not found: ${shlokaId}`);
            }
        } catch (e) {
            console.error("Error in MapsToShloka:", e);
        }
    }
    
    function openIndex(indexName) {
        tabContents.forEach(tab => {
            tab.classList.toggle('active', tab.id === `index-${indexName}`);
        });
        
        const resultsContainer = document.getElementById(`results-${indexName}`);
        if (resultsContainer && !resultsContainer.hasChildNodes()) {
            renderIndex(indexName);
        }
        updateLetterList(indexName);
    }
    
    function renderIndex(indexName) {
        const container = document.getElementById(`results-${indexName}`);
        if (!container) return;
        
        let html = '';
        
        if (indexName === 'shabda') {
            gitaData.indices.shabda.forEach((locations, word) => {
                const firstLetter = word.charAt(0);
                html += `<div class="index-item" data-first-letter="${firstLetter}">`;
                html += `<strong>${word}</strong>: <span class="word-locations">`;
                html += locations.map(loc => `<a class="location" data-loc="${loc}">${loc}</a>`).join(', ');
                html += `</span></div>`;
            });
        } else {
            const indexData = gitaData.indices[indexName] || [];
            indexData.forEach(item => {
                html += `<div class="index-item" data-first-letter="${item.firstLetter}">`;
                if (indexName === 'vakta') {
                     html += `<strong>${item.text}</strong> <a class="location" data-loc="${item.location}">(${item.location})</a>`;
                } else {
                     html += `${item.text} <a class="location" data-loc="${item.location}">(${item.location})</a>`;
                }
                html += `</div>`;
            });
        }
        container.innerHTML = html;
    }
    
    function updateLetterList(indexName) {
        let letters = new Set();
        
        if (indexName === 'shabda') {
            gitaData.indices.shabda.forEach((val, key) => letters.add(key.charAt(0)));
        } else {
            const indexData = gitaData.indices[indexName] || [];
            indexData.forEach(item => letters.add(item.firstLetter));
        }
        
        const sortedLetters = [...letters].sort(new Intl.Collator('mr').compare);
        letterListContainer.innerHTML = sortedLetters.map(l => `<a href="#letter-${l}">${l}</a>`).join('');
    }
    
    function performGlobalSearch(query) {
        query = query.trim();
        
        if (query.length < 2) {
            searchResultsContainer.style.display = 'none';
            if (!document.querySelector('.chapter-box.active')) {
                chapterPrompt.style.display = 'block';
            }
            return;
        }
        
        chapterPrompt.style.display = 'none';
        hideChapterBoxes();
        searchResultsContainer.style.display = 'block';
        
        const results = gitaData.allShlokas.filter(shloka => shloka.text.includes(query));
        
        let html = `<h3>'${query}' साठी ${results.length} परिणाम:</h3>`;
        
        if (results.length > 0) {
            results.forEach(shloka => {
                const highlightedText = shloka.text.replace(
                    new RegExp(query, 'gi'),
                    '<mark>$&</mark>'
                );
                
                html += `
                    <div class="search-result-item">
                        <p>${highlightText}</p>
                        - <a data-loc="${shloka.location}">अध्याय ${shloka.location} पहा</a>
                    </div>
                `;
            });
        } else {
            html += '<p>काहीही आढळले नाही.</p>';
        }
        
        searchResultsContainer.innerHTML = html;
    }

    // --- Run ---
    init();
});


