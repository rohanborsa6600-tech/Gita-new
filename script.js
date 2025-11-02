/* --- 💎 गीता ॲप लॉजिक V5 --- */
/* (ही एक नवीन कमेंट आहे जेणेकरून कोड लपणार नाही) */
/* (यात साईडबार आणि डेटा लोडर वेगळे केले आहेत) */

document.addEventListener('DOMContentLoaded', () => {
    
    // ---------------------------------
    // 1. व्हेरिएबल्स (Variables)
    // ---------------------------------
    const gitaData = {
        chapters: [], // { id, title, shlokas: [] }
        indices: {
            shloka: [], // { text, location, firstChar }
            paad: [],   // { text, location, firstChar }
            shabda: new Map(), // 'shabd' => ['loc1', 'loc2']
            vakta: new Map(),  // 'vakta' => ['loc1', 'loc2']
        }
    };
    
    // UI Elements
    const body = document.body;
    const appContainer = document.querySelector('.app-container');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const tocContainer = document.getElementById('auto-toc-container');
    const tocToggle = document.getElementById('toc-toggle');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const chaptersContainer = document.getElementById('chapters-container');
    const chapterPrompt = document.getElementById('chapter-prompt');
    const tabLinks = document.querySelectorAll('.index-tabs .tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const letterLists = document.querySelectorAll('.letter-list');
    const searchBar = document.getElementById('global-search-bar');
    const searchResultsContainer = document.getElementById('search-results');
    
    let currentFontFactor = 1.0;
    
    // ---------------------------------
    // 2. UI कंट्रोल्स (हे आधी लोड करा)
    // ---------------------------------
    function setupUIControls() {
        // (Sidebar Toggle)
        sidebarToggle.addEventListener('click', () => {
            // Mobile var 'sidebar-open' vapra, Desktop var 'sidebar-collapsed'
            if (window.innerWidth <= 768) {
                appContainer.classList.toggle('sidebar-open');
            } else {
                appContainer.classList.toggle('sidebar-collapsed');
            }
        });

        // (Theme Toggle)
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-mode');
        });

        // (Font Size)
        fontIncrease.addEventListener('click', () => {
            currentFontFactor = Math.min(currentFontFactor + 0.1, 1.5);
            document.documentElement.style.setProperty('--font-scale-factor', currentFontFactor);
        });

        fontDecrease.addEventListener('click', () => {
            currentFontFactor = Math.max(currentFontFactor - 0.1, 0.7);
            document.documentElement.style.setProperty('--font-scale-factor', currentFontFactor);
        });
        
        // (TOC Collapse)
        tocToggle.addEventListener('click', () => {
            tocToggle.classList.toggle('collapsed');
            tocContainer.classList.toggle('collapsed');
        });
        
        // (Lucide Icons)
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // ---------------------------------
    // 3. डेटा लोड करणे (Fetch Data)
    // ---------------------------------
    async function loadGitaData() {
        try {
            const response = await fetch('gita-data.html');
            if (!response.ok) {
                throw new Error(`gita-data.html file sapadli nahi (404 Error)`);
            }
            const htmlText = await response.text();
            
            // Data eka invisible div madhe taka
            const rawDataContainer = document.getElementById('raw-gita-data');
            if (!rawDataContainer) {
                console.error('#raw-gita-data container sapadla nahi!');
                return;
            }
            rawDataContainer.innerHTML = htmlText;
            
            // Data load zalyavarach parsing chalu kara
            parseGitaData(rawDataContainer);
            
        } catch (error) {
            console.error('Data load kartana error aala:', error);
            chapterPrompt.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${error.message}<br>Lutya 'gita-data.html' file upload keli aahe ka te tapaasa.</p>`;
        }
    }
    
    // ---------------------------------
    // 4. डेटा पार्सिंग (Parse Data)
    // ---------------------------------
    function parseGitaData(container) {
        const nodes = container.querySelectorAll('p[class^="p"]');
        let currentChapter = null;
        let currentVakta = "N/A";
        let chapterIndex = 0;
        let shlokaIndex = 0;
        let currentShlokaData = {};

        nodes.forEach(node => {
            const className = node.className;
            const text = node.textContent.trim();

            if (!text) return;

            // P1: Adhyay Title
            if (className === 'p1') {
                chapterIndex++;
                shlokaIndex = 0;
                const chapterId = `chapter-${chapterIndex}`;
                currentChapter = {
                    id: chapterId,
                    title: text,
                    shlokas: []
                };
                gitaData.chapters.push(currentChapter);
                
                // TOC (Sidebar List) madhe add kara
                const tocLink = document.createElement('a');
                tocLink.href = `#${chapterId}`;
                tocLink.className = 'toc-link';
                tocLink.textContent = text;
                tocLink.dataset.target = chapterId;
                tocContainer.appendChild(tocLink);
            }
            // P2: Vakta
            else if (className === 'p2') {
                currentVakta = text.replace(' उवाच', '');
            }
            // P3: Shloka Text (Start of shloka)
            else if (className === 'p3' && currentChapter) {
                // Adhicha shloka save kara (jarcha asel tar)
                if (currentShlokaData.p3) {
                    currentChapter.shlokas.push(currentShlokaData);
                    indexShloka(currentShlokaData, chapterIndex, shlokaIndex, currentVakta);
                }
                
                shlokaIndex++;
                const location = `${chapterIndex}.${shlokaIndex}`;
                currentShlokaData = {
                    location: location,
                    id: `c${chapterIndex}s${shlokaIndex}`,
                    vakta: currentVakta,
                    p3: text, // Shloka
                    p11: '', // Paad
                    p6: '',  // Anvay
                    p9: ''   // Arth
                };
            }
            // P11: Paad
            else if (className === 'p11' && currentShlokaData.p3) {
                currentShlokaData.p11 += (currentShlokaData.p11 ? '<br>' : '') + text;
            }
            // P6: Anvay
            else if (className === 'p6' && currentShlokaData.p3) {
                currentShlokaData.p6 = text;
            }
            // P9: Arth
            else if (className === 'p9' && currentShlokaData.p3) {
                currentShlokaData.p9 = text;
            }
        });

        // Shevatcha shloka save kara
        if (currentShlokaData.p3 && currentChapter) {
            currentChapter.shlokas.push(currentShlokaData);
            indexShloka(currentShlokaData, chapterIndex, shlokaIndex, currentVakta);
        }
        
        // Data parse zalyavar UI banva
        buildChapterHTML();
        buildIndicesHTML();
        setupClickHandlers(); // Ata click handlers setup kara
        
        // Loading message kadha
        chapterPrompt.style.display = 'block'; // Default message dakhva
    }
    
    // ---------------------------------
    // 5. सूची बनवणे (Indexing Logic)
    // ---------------------------------
    function indexShloka(shloka, chapIdx, shlokaIdx, vakta) {
        const location = shloka.location;
        const firstChar = (text) => text[0] || '';

        // 1. Shloka Suchi
        const shlokaText = shloka.p3.split('।।')[0] + '...'; // Fakt pahili line
        gitaData.indices.shloka.push({ text: shlokaText, location: location, firstChar: firstChar(shlokaText) });

        // 2. Paad Suchi
        if (shloka.p11) {
            shloka.p11.split('<br>').forEach(paad => {
                const paadText = paad.trim();
                if (paadText) {
                    gitaData.indices.paad.push({ text: paadText, location: location, firstChar: firstChar(paadText) });
                }
            });
        }

        // 3. Shabda Suchi
        const words = (shloka.p3 || '').match(/[\u0900-\u097F\w']+/g) || [];
        words.forEach(word => {
            if (word.length < 2) return; // Lahan shabda sodun dya
            if (!gitaData.indices.shabda.has(word)) {
                gitaData.indices.shabda.set(word, []);
            }
            const locations = gitaData.indices.shabda.get(word);
            if (!locations.includes(location)) { // Duplicate location nako
                locations.push(location);
            }
        });
        
        // 4. Vakta Suchi
        if (!gitaData.indices.vakta.has(vakta)) {
            gitaData.indices.vakta.set(vakta, []);
        }
        const vaktaLocations = gitaData.indices.vakta.get(vakta);
        if (!vaktaLocations.includes(location)) {
            vaktaLocations.push(location);
        }
    }

    // ---------------------------------
    // 6. HTML बनवणे (Build HTML)
    // ---------------------------------

    // (Adhyay banva)
    function buildChapterHTML() {
        let html = '';
        gitaData.chapters.forEach(chapter => {
            html += `<div class="chapter-box" id="${chapter.id}">`;
            html += `<h2 class="p1">${chapter.title}</h2>`;
            
            let currentVakta = '';
            chapter.shlokas.forEach(shloka => {
                if (shloka.vakta !== currentVakta) {
                    html += `<h3 class="p2">${shloka.vakta} उवाच</h3>`;
                    currentVakta = shloka.vakta;
                }
                
                // Shloka number (e.g., ।।०१/०१।।) bold kara
                const formattedShloka = shloka.p3.replace(/(।।[\s\S]*।।)/g, ' <span>$1</span>');
                
                html += `<div class="shloka-container" id="${shloka.id}">`;
                html += `<p class="p3">${formattedShloka}</p>`;
                
                // (Pad, Anvay, Arth - Hide/Show nako)
                if (shloka.p11) html += `<div class="shloka-detail-item p11"><strong>पाद:</strong><br>${shloka.p11}</div>`;
                if (shloka.p6) html += `<div class="shloka-detail-item p6"><strong>अन्वय:</strong> ${shloka.p6}</div>`;
                if (shloka.p9) html += `<div class="shloka-detail-item p9"><strong>अर्थ:</strong> ${shloka.p9}</div>`;
                
                html += `</div>`; // .shloka-container
            });
            html += `</div>`; // .chapter-box
        });
        chaptersContainer.innerHTML = html;
    }

    // (Suchi banva)
    function buildIndicesHTML() {
        const createItem = (text, location) => 
            `<div class="index-item">
                <span class="text">${text}</span>
                <span class="location" data-loc="${location}">(${location})</span>
            </div>`;
        
        // Shloka
        document.getElementById('shloka-index').innerHTML = 
            gitaData.indices.shloka.map(item => createItem(item.text, item.location)).join('');
            
        // Paad
        document.getElementById('paad-index').innerHTML = 
            gitaData.indices.paad.map(item => createItem(item.text, item.location)).join('');

        // Shabda
        let shabdaHtml = '';
        const sortedShabda = [...gitaData.indices.shabda.keys()].sort();
        sortedShabda.forEach(word => {
            const locations = gitaData.indices.shabda.get(word);
            const locHtml = locations.map(loc => `<span class="location" data-loc="${loc}">${loc}</span>`).join('');
            shabdaHtml += `<div class="index-item">
                                <span class="text">${word}</span>
                                <div class="locations-list">${locHtml}</div>
                           </div>`;
        });
        document.getElementById('shabda-index').innerHTML = shabdaHtml;
        
        // Vakta
        let vaktaHtml = '';
        [...gitaData.indices.vakta.keys()].forEach(vakta => {
            const locations = gitaData.indices.vakta.get(vakta);
            const locHtml = locations.map(loc => `<span class="location" data-loc="${loc}">${loc}</span>`).join('');
            vaktaHtml += `<div class="index-item">
                                <span class="vakta-name">${vakta}</span>
                                <div class="vakta-shlokas">${locHtml}</div>
                           </div>`;
        });
        document.getElementById('vakta-index').innerHTML = vaktaHtml;

        // Akshar Suchi (Letter List)
        buildLetterList(gitaData.indices.shloka.map(i => i.firstChar));
    }
    
    // (Akshar Suchi banva)
    function buildLetterList(firstChars) {
        const uniqueChars = [...new Set(firstChars)].filter(c => c).sort();
        const html = uniqueChars.map(char => `<a href="#" data-char="${char}">${char}</a>`).join('');
        letterLists.forEach(list => list.innerHTML = html);
        
        // Akshar click handler
        document.querySelectorAll('.letter-list a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const char = e.target.dataset.char;
                const currentList = e.target.closest('.content-section').querySelector('.tab-content.active');
                const firstItem = currentList.querySelector(`.index-item .text`);
                
                // .text span aahe ka te check kara (shabda/vakta suchi sathi)
                const items = currentList.querySelectorAll('.index-item');
                let targetItem = null;
                
                for (let item of items) {
                    const textEl = item.querySelector('.text, .vakta-name'); // Vegvegya suchi sathi
                    if (textEl && textEl.textContent.trim().startsWith(char)) {
                        targetItem = item;
                        break;
                    }
                }
                
                if (targetItem) {
                    currentList.scrollTo({
                        top: targetItem.offsetTop - currentList.offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ---------------------------------
    // 7. क्लिक हँडलर्स (Click Handlers)
    // ---------------------------------
    function setupClickHandlers() {
        
        // (Main Navigation)
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.dataset.target;
                
                // Section badla
                contentSections.forEach(sec => sec.classList.toggle('active', sec.id === targetId));
                
                // Link 'active' kara
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Search results lapva
                searchResultsContainer.style.display = 'none';
                searchBar.value = '';
                
                // Mobile var sidebar band kara
                if (window.innerWidth <= 768) {
                    appContainer.classList.remove('sidebar-open');
                }
            });
        });

        // (TOC - Adhyay Links)
        tocContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('toc-link')) {
                e.preventDefault();
                const targetId = e.target.dataset.target;
                
                // 'Gita Path' tab var ja
                document.querySelector('.nav-link[data-target="gita-path"]').click();
                
                // Sarva adhyay lapva, fakt ha dakhva
                document.querySelectorAll('.chapter-box').forEach(box => {
                    box.classList.toggle('active', box.id === targetId);
                });
                chapterPrompt.style.display = 'none';
                
                // TOC link 'active' kara
                document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                
                // Mobile var sidebar band kara
                if (window.innerWidth <= 768) {
                    appContainer.classList.remove('sidebar-open');
                }
            }
        });

        // (Suchi Tabs)
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetIndex = link.dataset.index;
                
                // Tab link 'active' kara
                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Tab content 'active' kara
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `${targetIndex}-index`);
                });
                
                // Navin Akshar Suchi banva
                let firstChars = [];
                if (targetIndex === 'shloka') firstChars = gitaData.indices.shloka.map(i => i.firstChar);
                else if (targetIndex === 'paad') firstChars = gitaData.indices.paad.map(i => i.firstChar);
                else if (targetIndex === 'shabda') firstChars = [...gitaData.indices.shabda.keys()].sort().map(s => s[0]);
                else if (targetIndex === 'vakta') firstChars = [...gitaData.indices.vakta.keys()].sort().map(s => s[0]);
                
                buildLetterList(firstChars);
            });
        });

        // (Location Click [Suchi/Search madhun])
        body.addEventListener('click', (e) => {
            if (e.target.classList.contains('location')) {
                e.preventDefault();
                const location = e.target.dataset.loc;
                mapsToShloka(location);
            }
        });
        
        // (Global Search)
        searchBar.addEventListener('input', (e) => {
            performGlobalSearch(e.target.value);
        });
    }

    // ---------------------------------
    // 8. मुख्य कार्यपद्धती (Functions)
    // ---------------------------------
    
    // (Shloka paryant scroll karne)
    function mapsToShloka(location) { // e.g., "1.1"
        const [chapIdx, shlokaIdx] = location.split('.');
        const chapterId = `chapter-${chapIdx}`;
        const shlokaId = `c${chapIdx}s${shlokaIdx}`;

        // 1. 'Gita Path' tab var ja
        document.querySelector('.nav-link[data-target="gita-path"]').click();
        
        // 2. Yogya adhyay dakhva
        document.querySelectorAll('.chapter-box').forEach(box => {
            box.classList.toggle('active', box.id === chapterId);
        });
        chapterPrompt.style.display = 'none';
        
        // 3. Yogya TOC link 'active' kara
        document.querySelectorAll('.toc-link').forEach(l => {
            l.classList.toggle('active', l.dataset.target === chapterId);
        });

        // 4. Shloka paryant scroll kara
        const shlokaElement = document.getElementById(shlokaId);
        if (shlokaElement) {
            // Scroll karnyaadhi highlight class kadha (jar adhi asel tar)
            document.querySelectorAll('.shloka-container.highlight').forEach(el => el.classList.remove('highlight'));
            
            // Scroll
            const contentScrollArea = document.querySelector('.content-scroll-area');
            contentScrollArea.scrollTo({
                top: shlokaElement.offsetTop - contentScrollArea.offsetTop - varToNum('--header-height'), // Header chya khali
                behavior: 'smooth'
            });
            
            // Highlight kara
            shlokaElement.classList.add('highlight');
            // Thodya velane highlight kadha
            setTimeout(() => {
                shlokaElement.classList.remove('highlight');
            }, 1500);
        }
    }
    
    // (Global Search)
    function performGlobalSearch(query) {
        query = query.trim().toLowerCase();
        
        if (query.length < 2) {
            searchResultsContainer.style.display = 'none';
            searchResultsContainer.innerHTML = '';
            // Jar search bar rikami zali tar parat adhyay dakhva
            if (document.querySelector('.chapter-box.active')) {
                chapterPrompt.style.display = 'none';
            } else {
                chapterPrompt.style.display = 'block';
            }
            return;
        }

        let resultsHtml = '';
        let count = 0;
        
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        
        gitaData.chapters.forEach(chapter => {
            chapter.shlokas.forEach(shloka => {
                // Shlok, Paad, Anvay, Arth - saglyat shodha
                const textToSearch = [shloka.p3, shloka.p11, shloka.p6, shloka.p9].join(' ');
                
                if (textToSearch.toLowerCase().includes(query)) {
                    count++;
                    // Matched shlok dakhva (p3)
                    const highlightedText = shloka.p3.replace(regex, '<strong>$&</strong>');
                    resultsHtml += `
                        <div class="search-result-item">
                            <span class="location" data-loc="${shloka.location}">(${shloka.location})</span>
                            <p>${highlightedText}</p>
                        </div>`;
                }
            });
        });

        if (count > 0) {
            searchResultsContainer.innerHTML = `<h4>"${query}" साठी ${count} परिणाम सापडले:</h4>` + resultsHtml;
        } else {
            searchResultsContainer.innerHTML = `<h4>"${query}" साठी काहीही सापडले नाही.</h4>`;
        }
        
        searchResultsContainer.style.display = 'block';
        chapterPrompt.style.display = 'none'; // Prompt lapva
        document.querySelectorAll('.chapter-box').forEach(box => box.classList.remove('active')); // Adhyay lapva
    }
    
    // (Helper Function)
    function varToNum(varName) {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue(varName), 10) || 0;
    }

    // ---------------------------------
    // 9. ॲप सुरू करा (Initialize)
    // ---------------------------------
    
    // 1. UI controls (sidebar, theme) *laglich* chalu kara
    setupUIControls();
    
    // 2. Gita data *nantar* load kara
    loadGitaData();

});


