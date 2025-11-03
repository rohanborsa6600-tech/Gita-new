// --- Devanagari Letters ---
const DEVANAGARI_LETTERS = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ',
  'क', 'ख', 'ग', 'घ', 'ङ',
  'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह', 'ळ', 'क्ष', 'ज्ञ'
];

// --- Helper Functions ---
const normalizeDevanagariNumber = (str) => {
  if (!str) return '';
  const map = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
  return str.replace(/[०-९]/g, (match) => map[match]);
};

const parseShlokaNumber = (text) => {
  const match = text.match(/।।([०-९]+)\/([०-९]+)।।/);
  if (match && match[1] && match[2]) {
    return `${normalizeDevanagariNumber(match[1])}.${normalizeDevanagariNumber(match[2])}`;
  }
  return null;
};

const getFirstThreeWords = (text) => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]+>/g, '').replace(/[\s,।]+$/, '');
  return cleanText.split(/[\s,।]+/).slice(0, 3).join(' ') + '...';
};

// --- Application State ---
let isLoading = true;
let theme = 'dark';
let fontSize = 16;
let currentView = 'grid';
let previousView = 'grid';
let chapterData = new Map();
let indices = { shlokas: [], padas: [], shabdas: [], vaktas: [] };

let currentChapterNum = null;
let scrollToShloka = null;
let highlightTerm = null;

let searchTerm = '';
let searchScope = 'all';
let currentSuchiTab = 0;
let currentLetterFilter = '';

// --- DOM Elements ---
const docEl = document.documentElement;
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');
const views = {
    grid: document.getElementById('view-grid'),
    suchi: document.getElementById('view-suchi'),
    search: document.getElementById('view-search'),
    path: document.getElementById('view-path'),
};
const nav = {
    logo: document.getElementById('nav-logo'),
    suchi: document.getElementById('nav-suchi'),
    search: document.getElementById('nav-search'),
};
const themeToggle = document.getElementById('theme-toggle');
const iconMoon = themeToggle.querySelector('.icon-moon');
const iconSun = themeToggle.querySelector('.icon-sun');
const fontDecrease = document.getElementById('font-decrease');
const fontIncrease = document.getElementById('font-increase');
const backButton = document.getElementById('back-button');

// --- Data Parsing (Now accepts HTML content as argument) ---
function parseData(gitaHtmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(gitaHtmlContent, 'text/html');
        
        let currentChapter = 0;
        let currentChapterName = '';
        let chapterBlocks = [];
        let currentVakta = '';
        let currentShlokaBlock = null;
        let p4Buffer = []; 
        let currentChapterEndLine = null;
        
        const shabdaMap = new Map();

        const saveCurrentShlokaBlock = () => {
            if (currentShlokaBlock) {
                chapterBlocks.push(currentShlokaBlock);
                currentShlokaBlock = null;
            }
        };

        const elements = doc.body.children;

        for (const el of elements) {
            const className = el.className;
            el.querySelectorAll('.Apple-converted-space').forEach(span => span.remove());
            const textContent = el.textContent || '';
            const outerHTML = el.outerHTML;

            if (className === 'p2') { 
                saveCurrentShlokaBlock();
                p4Buffer = []; 
                
                if (currentChapterEndLine) {
                    chapterBlocks.push(currentChapterEndLine);
                    currentChapterEndLine = null;
                }

                if (currentChapter > 0) {
                    chapterData.set(currentChapter, {
                        name: currentChapterName,
                        blocks: chapterBlocks
                    });
                }
                currentChapter++;
                const chapterTitleParts = textContent.split(' - ');
                currentChapterName = chapterTitleParts[1] || textContent;
                chapterBlocks = [{ type: 'chapterTitle', html: outerHTML, name: currentChapterName }];
                currentVakta = '';
            } else if (className === 'p3') { 
                saveCurrentShlokaBlock();
                p4Buffer = []; 
                currentVakta = textContent;
                chapterBlocks.push({ type: 'vakta', html: outerHTML, speaker: currentVakta });
            } else if (className === 'p4') { 
                p4Buffer.push(outerHTML); 
                const shlokaId = parseShlokaNumber(textContent);
                
                if (shlokaId) {
                    saveCurrentShlokaBlock(); 
                    
                    currentShlokaBlock = {
                        type: 'shloka',
                        id: shlokaId,
                        speaker: currentVakta,
                        p4: p4Buffer, 
                        p5: [],
                        p6: [],
                        p1: []
                    };
                    
                    const fullShlokaText = p4Buffer.map(html => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        return tempDiv.textContent || '';
                    }).join(' ');
                    
                    indices.shlokas.push({ id: shlokaId, text: fullShlokaText, chapter: currentChapter });
                    
                    if(currentVakta) {
                        indices.vaktas.push({ id: shlokaId, speaker: currentVakta, preview: getFirstThreeWords(fullShlokaText), chapter: currentChapter });
                    }
                    
                    p4Buffer = []; 
                }
            } else if (className === 'p5' && currentShlokaBlock) { 
                currentShlokaBlock.p5.push(outerHTML);
                indices.padas.push({ id: currentShlokaBlock.id, text: textContent, chapter: currentChapter });
            } else if (className === 'p6' && currentShlokaBlock) { 
                currentShlokaBlock.p6.push(outerHTML);
                
                const words = textContent.split(/[,\s.]+/);
                for (const word of words) {
                    const trimmedWord = word.trim();
                    if (trimmedWord) {
                        if (!shabdaMap.has(trimmedWord)) {
                            shabdaMap.set(trimmedWord, new Set());
                        }
                        shabdaMap.get(trimmedWord).add(currentShlokaBlock.id);
                    }
                }
            } else if (className === 'p1') { 
                if (currentShlokaBlock) {
                    currentShlokaBlock.p1.push(outerHTML);
                } else {
                    chapterBlocks.push({ type: 'intro', html: outerHTML });
                }
            } else if (className === 'p7') { 
                saveCurrentShlokaBlock(); 
                p4Buffer = [];
            } else if (className === 'p11') {
                currentChapterEndLine = { type: 'chapterEnd', html: outerHTML };
            } else {
                chapterBlocks.push({ type: 'intro', html: outerHTML });
            }
        }
        
        saveCurrentShlokaBlock(); 
        
        if (currentChapterEndLine) {
            chapterBlocks.push(currentChapterEndLine);
            currentChapterEndLine = null;
        }

        if (currentChapter > 0) {
            chapterData.set(currentChapter, {
                name: currentChapterName,
                blocks: chapterBlocks
            });
        }

        indices.shabdas = Array.from(shabdaMap.entries())
            .map(([word, idSet]) => ({
                text: word,
                ids: Array.from(idSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            }))
            .sort((a, b) => a.text.localeCompare(b.text, 'mr')); 

    } catch (error) {
        console.error("Data parsing failed:", error);
    }
}

// --- Navigation ---
function showView(viewName) {
    if (currentView === viewName && viewName !== 'suchi' && viewName !== 'search') return;
    
    previousView = currentView;
    currentView = viewName;

    for (const key in views) {
        views[key].classList.remove('active');
    }
    views[viewName].classList.add('active');
    
    window.scrollTo(0, 0);

    // Render content for the view
    if (viewName === 'grid') renderChapterGrid();
    if (viewName === 'suchi') renderGitaSuchi();
    if (viewName === 'search') renderSearchComponent();
    if (viewName === 'path') renderGitaPath();
}

// --- Render Functions ---
function renderChapterGrid() {
    const container = document.getElementById('chapter-grid-container');
    let html = '';
    Array.from(chapterData.entries()).forEach(([num, { name }], index) => {
        html += `
            <button
                class="chapter-grid-button glass-panel animate-slide-in-up"
                data-chapter-num="${num}"
                style="animation-delay: ${index * 50}ms"
            >
                <span>${`अध्याय ${normalizeDevanagariNumber(String(num))}`}</span>
                <h3>${name}</h3>
            </button>
        `;
    });
    container.innerHTML = html;
}

function renderGitaSuchi() {
    const tabsContainer = document.getElementById('suchi-tabs-container');
    const letterFilterContainer = document.getElementById('letter-filter-container');
    const listContainer = document.getElementById('suchi-list-container');
    
    const tabs = [
        { name: 'श्लोक सूची', data: indices.shlokas },
        { name: 'पाद सूची', data: indices.padas },
        { name: 'शब्द सूची', data: indices.shabdas },
        { name: 'वक्ता सूची', data: indices.vaktas },
    ];
    
    const isVaktaTab = currentSuchiTab === 3;
    const isShabdTab = currentSuchiTab === 2;

    // Render Tabs
    tabsContainer.innerHTML = tabs.map((tab, index) => `
        <button class="suchi-tab-button ${index === currentSuchiTab ? 'active' : ''}" data-tab-index="${index}">
            ${tab.name}
        </button>
    `).join('');

    // Render Letter Filter (and hide if Vakta tab)
    letterFilterContainer.style.display = isVaktaTab ? 'none' : 'flex';
    let letterFilterHTML = `
        <button class="letter-filter-button all-btn ${currentLetterFilter === '' ? 'active' : ''}" data-letter="">
            सर्व
        </button>
    `;
    letterFilterHTML += DEVANAGARI_LETTERS.map(letter => `
        <button class="letter-filter-button ${currentLetterFilter === letter ? 'active' : ''}" data-letter="${letter}">
            ${letter}
        </button>
    `).join('');
    letterFilterContainer.innerHTML = letterFilterHTML;

    // Render List
    const currentData = tabs[currentSuchiTab].data;
    // Don't filter Vakta tab
    const filteredData = (currentLetterFilter && !isVaktaTab)
        ? currentData.filter(item => (item.text || item.preview || '').replace(/<[^>]+>/g, '').trim().startsWith(currentLetterFilter))
        : currentData;

    let listHTML = '';
    if (isShabdTab) {
        // --- Render Aggregated Shabd Suchi ---
        listHTML = '<ul class="suchi-list">';
        listHTML += filteredData.map((item, index) => `
            <li class="suchi-item-aggregated animate-slide-in-up" style="animation-delay: ${Math.min(index * 10, 500)}ms">
                <span class="shabd-text">${item.text}</span>
                <div class="shabd-id-list">
                    ${item.ids.map(id => `
                        <button class="shabd-id-button" data-shloka-id="${id}" data-highlight="${item.text}">
                            ${id}
                        </button>
                    `).join('')}
                </div>
            </li>
        `).join('');
        listHTML += '</ul>';

    } else if (isVaktaTab) {
        // --- Vakta Suchi (Grouped) ---
        const groupedVaktas = filteredData.reduce((acc, item) => {
            (acc[item.speaker] = acc[item.speaker] || []).push(item);
            return acc;
        }, {});
        
        listHTML = Object.entries(groupedVaktas).map(([speaker, items]) => `
            <div class="vakta-group animate-slide-in-up">
                <h3 class="vakta-group-header">${speaker}</h3>
                <ul class="suchi-list">
                    ${items.map(item => `
                        <li>
                            <button class="suchi-item-button" data-shloka-id="${item.id}" data-highlight="">
                                <span class="shloka-id">${item.id}</span>
                                <span class="shloka-text-shloka">${item.preview}</span>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    } else { 
        // --- Shloka/Pada Suchi ---
        listHTML = '<ul class="suchi-list">';
        listHTML += filteredData.map((item, index) => {
            const textClass = currentSuchiTab === 0 ? 'shloka-text-shloka' : 'shloka-text-other';
            return `
                <li style="animation-delay: ${Math.min(index * 10, 500)}ms">
                    <button class="suchi-item-button" data-shloka-id="${item.id}" data-highlight="">
                        <span class="shloka-id">${item.id}</span>
                        <span class="shloka-text ${textClass}">${item.text}</span>
                    </button>
                </li>
            `;
        }).join('');
        listHTML += '</ul>';
    }
    listContainer.innerHTML = listHTML;
}

function renderSearchComponent() {
    const scopesContainer = document.getElementById('search-scopes-container');
    const resultsInfo = document.getElementById('search-results-info');
    const resultsList = document.getElementById('search-results-list');
    
    const scopeOptions = [
        { id: 'all', name: 'सर्व', icon: 'filter' },
        { id: 'shloka', name: 'श्लोक', icon: 'book-open' },
        { id: 'pada', name: 'पाद', icon: 'baseline' },
        { id: 'shabda', name: 'शब्द', icon: 'whole-word' },
        { id: 'vakta', name: 'वक्ता', icon: 'user' },
        { id: 'id', name: 'श्लोक ID', icon: 'baseline' },
    ];

    scopesContainer.innerHTML = scopeOptions.map(opt => `
        <button class="scope-button glass-panel ${searchScope === opt.id ? 'active' : ''}" data-scope="${opt.id}">
            <i data-lucide="${opt.icon}"></i>
            ${opt.name}
        </button>
    `).join('');
    
    lucide.createIcons(); // Re-render icons

    // Search Logic
    let results = [];
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const idSearchTerm = term.replace(/[\/.\s]+/g, '.');

        if (searchScope === 'id' || (searchScope === 'all' && /^\d+\.\d+$/.test(idSearchTerm))) {
            const found = indices.shlokas.find(item => item.id === idSearchTerm);
            if (found) results = [{ ...found, type: 'श्लोक ID' }];
        } else {
            const rawResults = [];
            const searchIn = (list, type) => list.forEach(item => {
                if (item.text.toLowerCase().includes(term)) rawResults.push({ ...item, type });
            });
            
            if (searchScope === 'all' || searchScope === 'shloka') searchIn(indices.shlokas, 'श्लोक');
            if (searchScope === 'all' || searchScope === 'pada') searchIn(indices.padas, 'पाद');
            if (searchScope === 'all' || searchScope === 'shabda') searchIn(indices.shabdas, 'शब्द'); // This will now search the word text
            if (searchScope === 'all' || searchScope === 'vakta') {
                indices.vaktas.forEach(item => {
                    if (item.speaker.toLowerCase().includes(term)) {
                        rawResults.push({ ...item, text: `${item.speaker} - ${item.preview}`, type: 'वक्ता' });
                    }
                });
            }
            
            const resultMap = new Map();
            rawResults.forEach(item => {
                // For aggregated shabdas, we must create entries for each ID
                if (item.type === 'शब्द' && item.ids) {
                    item.ids.forEach(id => {
                        if (!resultMap.has(id)) {
                            resultMap.set(id, { ...item, id: id, text: item.text }); // Use the word as text
                        }
                    });
                } else if (!resultMap.has(item.id) || (resultMap.has(item.id) && item.type === 'श्लोक')) {
                    resultMap.set(item.id, item);
                }
            });
            results = Array.from(resultMap.values()).sort((a,b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        }
    }

    // Render Results
    resultsInfo.textContent = searchTerm ? `'${searchTerm}' साठी ${results.length} निकाल सापडले.` : '';
    
    const highlight = (text, term) => {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, `<mark>$1</mark>`);
    };

    resultsList.innerHTML = results.map((item, index) => {
        const textClass = (item.type === 'श्लोक') ? 'shloka-text-shloka' : 'shloka-text-other';
        return `
            <li class="animate-slide-in-up" style="animation-delay: ${index * 50}ms">
                <button class="search-result-item glass-panel" data-shloka-id="${item.id}" data-highlight="${searchTerm}">
                    <div class="search-result-header">
                        <span class="shloka-id">श्लोक ${item.id}</span>
                        <span class="shloka-type">${item.type}</span>
                    </div>
                    <p class="search-result-text ${textClass}">${highlight(item.text, searchTerm)}</p>
                </button>
            </li>
        `;
    }).join('');
}

function renderGitaPath() {
    const container = document.getElementById('gita-path-content');
    const chapter = chapterData.get(currentChapterNum);
    if (!chapter) {
        container.innerHTML = '<p>अध्याय सापडला नाही.</p>';
        return;
    }

    const highlight = (htmlStringArray, term) => {
        let combinedHtml = htmlStringArray.join('');
        if (term) {
            const regex = new RegExp(`(${term})`, 'gi');
            combinedHtml = combinedHtml.replace(regex, `<mark>$1</mark>`);
        }
        // Clean and center shlokas
        combinedHtml = combinedHtml.replace(
            /<p class="p4"><span class="s4">([\s\S]*?)।।([०-९]+\/[०-९]+)।।<\/span><\/p>/g,
            (match, content) => `<p class="p4"><span class="s4"><div class="shloka-center">${content}</div></span></p>`
        );
        combinedHtml = combinedHtml.replace(
            /<p class="p4"><span class="s4">([\s\S]*?)<\/span><\/p>/g,
            (match, content) => content.includes('shloka-center') ? match : `<p class="p4"><span class="s4"><div class="shloka-center">${content}</div></span></p>`
        );
        return combinedHtml;
    };

    container.innerHTML = chapter.blocks.map((block, index) => {
        switch (block.type) {
            case 'chapterTitle':
            case 'vakta':
            case 'intro':
            case 'chapterEnd': 
                return `<div class="animate-slide-in-up">${block.html}</div>`;
            case 'shloka':
                return `
                    <div id="shloka-${block.id}" class="shloka-block glass-panel animate-slide-in-up">
                        <div>
                            ${highlight(block.p4, highlightTerm)}
                        </div>
                        <div class="shloka-details shloka-details-p1">
                            ${highlight(block.p1, highlightTerm)}
                        </div>
                        <div class="shloka-details shloka-details-p5p6" style="margin-top: 0.5rem;">
                            ${highlight(block.p5, highlightTerm)}
                            ${highlight(block.p6, highlightTerm)}
                        </div>
                    </div>
                `;
            default: return '';
        }
    }).join('');

    // Scroll and highlight
    if (scrollToShloka) {
        const targetEl = document.getElementById(`shloka-${scrollToShloka}`);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.classList.add('highlight-shloka');
            setTimeout(() => {
                targetEl.classList.remove('highlight-shloka');
                scrollToShloka = null; // Reset
                highlightTerm = null; // Reset
            }, 2000);
        }
    }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Navbar
    nav.logo.addEventListener('click', () => showView('grid'));
    nav.suchi.addEventListener('click', () => showView('suchi'));
    nav.search.addEventListener('click', () => showView('search'));
    backButton.addEventListener('click', () => showView(previousView));

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        docEl.className = theme;
        iconMoon.style.display = theme === 'dark' ? 'none' : 'block';
        iconSun.style.display = theme === 'dark' ? 'block' : 'none';
    });
    
    // Font Size
    fontDecrease.addEventListener('click', () => {
        fontSize = Math.max(10, fontSize - 1);
        docEl.style.setProperty('--font-size-base', `${fontSize}px`);
    });
    fontIncrease.addEventListener('click', () => {
        fontSize = Math.min(32, fontSize + 2);
        docEl.style.setProperty('--font-size-base', `${fontSize}px`);
    });

    // --- Event Delegation for Main Content ---
    mainContent.addEventListener('click', (event) => {
        // Chapter Grid Button
        const gridButton = event.target.closest('.chapter-grid-button');
        if (gridButton) {
            currentChapterNum = Number(gridButton.dataset.chapterNum);
            showView('path');
            return;
        }

        // Suchi Tab
        const suchiTab = event.target.closest('.suchi-tab-button');
        if (suchiTab) {
            currentSuchiTab = Number(suchiTab.dataset.tabIndex);
            currentLetterFilter = ''; // Reset filter
            renderGitaSuchi(); // Re-render
            return;
        }
        
        // Letter Filter
        const letterButton = event.target.closest('.letter-filter-button');
        if (letterButton) {
            currentLetterFilter = letterButton.dataset.letter;
            renderGitaSuchi(); // Re-render
            return;
        }
        
        // Suchi/Search Item
        const itemButton = event.target.closest('.suchi-item-button, .search-result-item, .shabd-id-button');
        if (itemButton) {
            currentChapterNum = Number(itemButton.dataset.shlokaId.split('.')[0]);
            scrollToShloka = itemButton.dataset.shlokaId;
            highlightTerm = itemButton.dataset.highlight || null;
            showView('path');
            return;
        }
        
        // Search Scope
        const scopeButton = event.target.closest('.scope-button');
        if (scopeButton) {
            searchScope = scopeButton.dataset.scope;
            renderSearchComponent(); // Re-render scopes
            renderSearchComponent(); // Re-render results
            return;
        }
    });
    
    // Search Input
    document.getElementById('search-input').addEventListener('input', (event) => {
        searchTerm = event.target.value;
        renderSearchComponent(); // Re-render results
    });
}

// --- App Initialization (Modified to fetch data) ---
async function loadDataAndRunApp() {
    try {
        // 1. Set initial theme (can do this early)
        iconMoon.style.display = 'none';
        iconSun.style.display = 'block';

        // 2. Fetch data from the separate file
        const response = await fetch('gita-data.html');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const gitaHtmlContent = await response.text();

        // 3. Parse data
        parseData(gitaHtmlContent);

        // 4. Setup listeners
        setupEventListeners();
        
        // 5. Show initial view
        showView('grid');
        
        // 6. Hide loading screen
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
        
        // 7. Create all icons
        lucide.createIcons();

    } catch (error) {
        console.error("Failed to load or initialize app:", error);
        // Display a user-friendly error message
        loadingScreen.innerHTML = `
            <h2 style="color: #ff8a8a;">डेटा लोड करण्यात अयशस्वी.</h2>
            <p style="color: #f0f0f0; max-width: 400px; text-align: center; font-family: 'Mukta', sans-serif;">
                कृपया खात्री करा की तुम्ही हे ॲप 'Live Server' (उदा. VS Code एक्स्टेंशन) वापरून चालवत आहात. 
                <br><br>
                थेट फाईल उघडल्यास (file://) ते चालणार नाही.
            </p>`;
    }
}

// Run the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', loadDataAndRunApp);
