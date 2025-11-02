// संपूर्ण ॲपचे मुख्य लॉजिक (नवीन कमेंट्स-सहित)

// 'DOMContentLoaded' इव्हेंटची वाट पाहतो, म्हणजेच HTML पेज पूर्ण लोड झाल्यावरच कोड चालवतो.
document.addEventListener('DOMContentLoaded', () => {
    // १. प्रथम, 'gita-data.html' फाईलमधून डेटा लोड करतो.
    loadAndParseData();
    
    // २. डेटा लोड झाल्यावर, बटणे आणि लिंक्स चालू करतो.
    setupUIControls();
    setupClickHandlers();
    setupSuchiControls();
});

/**
 * ही नवीन आणि सर्वात महत्त्वाची पायरी आहे.
 * ही 'gita-data.html' फाईलला Asynchronously (पार्श्वभूमीत) लोड करते.
 */
async function loadAndParseData() {
    console.log("डेटा लोड करणे सुरू करत आहे...");
    try {
        // 'gita-data.html' फाईलवरून डेटा आणतो.
        const response = await fetch('gita-data.html');
        
        // जर फाईल मिळाली नाही (उदा. 404), तर एरर देतो.
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - 'gita-data.html' फाईल सापडली नाही.`);
        }
        
        // फाईलमधील संपूर्ण HTML मजकूर वाचतो.
        const htmlData = await response.text();
        
        // वाचलेला मजकूर रिकाम्या '#raw-gita-data' div मध्ये टाकतो.
        const dataContainer = document.getElementById('raw-gita-data');
        if (dataContainer) {
            dataContainer.innerHTML = htmlData;
            console.log("डेटा यशस्वीरित्या लोड झाला.");
            
            // डेटा यशस्वीरित्या भरल्यानंतरच, 'parseGitaData' फंक्शन कॉल करतो.
            parseGitaData();
        } else {
            console.error("'#raw-gita-data' हा div सापडला नाही.");
        }

    } catch (error) {
        console.error("डेटा लोड करताना मोठी एरर आली:", error);
        alert("त्रुटी: 'gita-data.html' फाईलमधून डेटा लोड होऊ शकला नाही. फाईल अस्तित्वात आहे का ते तपासा.");
    }
}


/**
 * ही फाईल '#raw-gita-data' मधला डेटा वाचते आणि ॲप तयार करते.
 * (हे फंक्शन आता 'loadAndParseData' यशस्वी झाल्यावरच चालते)
 */
function parseGitaData() {
    console.log("डेटा पार्स करणे (Parsing) सुरू करत आहे...");
    const dataContainer = document.getElementById('raw-gita-data');
    if (!dataContainer) {
        console.error("डेटा कंटेनर सापडला नाही.");
        return;
    }
    
    const nodes = Array.from(dataContainer.childNodes);
    const tocContainer = document.getElementById('auto-toc-container');
    const chaptersContainer = document.getElementById('chapters-container');
    
    // जुना डेटा (असल्यास) रिकामा करतो.
    tocContainer.innerHTML = '';
    chaptersContainer.innerHTML = '';

    // सूची (Index) साठी डेटा साठवण्याची जागा
    const gitaData = {
        indices: {
            shloka: [], // p3
            paad: [],   // p11
            shabda: new Map(), // p3 (शब्द)
            vakta: []   // p2
        },
        shlokaCount: 0
    };

    let currentChapterTitle = '';
    let currentChapterNum = 0;
    let currentVakta = 'अज्ञात';
    let currentChapterBox = null;
    let shlokaInChapter = 0;

    // संपूर्ण HTML डेटावरून एक-एक करून जातो
    nodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return; // फक्त HTML टॅग्स तपासतो

        const className = node.className;
        const text = node.textContent.trim();

        try {
            // १. अध्याय (p1)
            if (className === 'p1') {
                currentChapterNum++;
                shlokaInChapter = 0;
                currentChapterTitle = text;

                // साईडबारमध्ये अध्यायाची लिंक बनवतो
                const tocLink = document.createElement('a');
                tocLink.href = `#chapter-${currentChapterNum}`;
                tocLink.textContent = `अध्याय ${currentChapterNum}: ${text}`;
                tocLink.dataset.target = `chapter-${currentChapterNum}`;
                tocLink.classList.add('nav-link');
                tocContainer.appendChild(tocLink);

                // 'गीता पाठ' मध्ये अध्यायाचा बॉक्स बनवतो
                currentChapterBox = document.createElement('div');
                currentChapterBox.id = `chapter-${currentChapterNum}`;
                currentChapterBox.className = 'chapter-box';
                currentChapterBox.style.display = 'none'; // सुरुवातीला लपवतो
                
                const titleHeader = document.createElement('h3');
                titleHeader.textContent = text;
                currentChapterBox.appendChild(titleHeader);
                
                chaptersContainer.appendChild(currentChapterBox);
            }
            // २. वक्ता (p2)
            else if (className === 'p2') {
                currentVakta = text;
                if (currentChapterBox) {
                    const vaktaPara = document.createElement('p');
                    vaktaPara.className = 'p4'; // जुन्या स्टाईलनुसार (p4)
                    vaktaPara.textContent = text;
                    currentChapterBox.appendChild(vaktaPara);
                }
            }
            // ३. श्लोक (p3)
            else if (className === 'p3' && currentChapterBox) {
                // श्लोक क्रमांक काढतो (उदा. 1.1)
                const shlokaNumberMatch = text.match(/।।([\०१-९]+)\/([\०१-९]+)।।/);
                let shlokaNum = '';
                let shlokaID = '';

                if (shlokaNumberMatch) {
                    // मराठी अंकांचे इंग्रजी अंकात रूपांतर
                    const marathiToEng = (s) => s.replace(/[\०१२३४५६७८९]/g, d => '०१२३४५६७८९'.indexOf(d));
                    const adhyayNum = parseInt(marathiToEng(shlokaNumberMatch[1]), 10);
                    const shlokNumInAdhyay = parseInt(marathiToEng(shlokaNumberMatch[2]), 10);
                    
                    shlokaNum = `${adhyayNum}.${shlokNumInAdhyay}`;
                    shlokaID = `c${adhyayNum}s${shlokNumInAdhyay}`;
                    gitaData.shlokaCount++;
                } else {
                    // जर क्रमांक मिळाला नाही (उदा. श्लोकाची दुसरी ओळ)
                    shlokaInChapter++;
                    shlokaNum = `${currentChapterNum}.${shlokaInChapter}`;
                    shlokaID = `c${currentChapterNum}s${shlokaInChapter}`;
                }
                
                // श्लोक तयार करतो
                const shlokaPara = document.createElement('p');
                shlokaPara.className = 'p6'; // जुन्या स्टाईलनुसार (p6)
                shlokaPara.id = shlokaID;
                shlokaPara.textContent = text;
                currentChapterBox.appendChild(shlokaPara);

                // 'श्लोक सूची' साठी डेटा टाकतो (फक्त पहिली ओळ)
                if (!text.includes('<br>')) { // गृहीत धरतो की p3 मध्ये <br> नाही
                    gitaData.indices.shloka.push({ text: text.split('।')[0] + '।', loc: shlokaNum });
                }
                
                // 'वक्ता सूची' साठी डेटा टाकतो
                gitaData.indices.vakta.push({ text: `${currentVakta}: ${text.split('।')[0]}...`, loc: shlokaNum });

                // 'शब्द सूची' साठी डेटा टाकतो
                const shabdas = text.replace(/।।([\०१-९]+\/[\०१-९]+)।।/g, '').replace(/[।(),.]/g, '').split(/\s+/).filter(Boolean);
                shabdas.forEach(shabd => {
                    if (!gitaData.indices.shabda.has(shabd)) {
                        gitaData.indices.shabda.set(shabd, []);
                    }
                    // डुप्लिकेट लोकेशन टाळतो
                    if (!gitaData.indices.shabda.get(shabd).includes(shlokaNum)) {
                        gitaData.indices.shabda.get(shabd).push(shlokaNum);
                    }
                });
            }
            // ४. पाद (p11) - 'पाद सूची' साठी
            else if (className === 'p11') {
                // हा पाद कोणत्या श्लोकाचा आहे हे ओळखणे कठीण आहे,
                // म्हणून आपण सध्याच्या श्लोकाशी जोडूया.
                const lastShlokaID = `c${currentChapterNum}s${shlokaInChapter}`;
                const lastShlokaNum = `${currentChapterNum}.${shlokaInChapter}`;
                gitaData.indices.paad.push({ text: text, loc: lastShlokaNum });
            }
            // ५. अन्वय (p6) आणि अर्थ (p9)
            else if ((className === 'p6' || className === 'p9') && currentChapterBox) {
                 const detailPara = document.createElement('p');
                 // CSS स्टाईलसाठी जुना क्लास वापरतो
                 detailPara.className = `shloka-detail-item ${className === 'p6' ? 'p6-detail' : 'p9'}`;
                 detailPara.textContent = text;
                 currentChapterBox.appendChild(detailPara);
            }
        } catch (e) {
            console.warn(`डेटा पार्स करताना एका नोडमध्ये एरर (class: ${className}):`, e);
        }
    });

    console.log(`पार्सिंग पूर्ण. ${currentChapterNum} अध्याय आणि ${gitaData.shlokaCount} श्लोक सापडले.`);
    
    // सर्व सूची (Indices) तयार करतो
    buildIndices(gitaData);
}

/**
 * 'gitaData' वरून सर्व ४ सूची HTML मध्ये तयार करतो.
 */
function buildIndices(gitaData) {
    const letters = new Set(); // अक्षरांची यादी बनवण्यासाठी

    // १. श्लोक सूची
    const shlokaContainer = document.getElementById('shloka-index');
    shlokaContainer.innerHTML = '';
    gitaData.indices.shloka.forEach(item => {
        shlokaContainer.appendChild(createIndexItem(item.text, item.loc));
        letters.add(item.text[0]); // पहिले अक्षर सेटमध्ये टाकतो
    });

    // २. पाद सूची
    const paadContainer = document.getElementById('paad-index');
    paadContainer.innerHTML = '';
    gitaData.indices.paad.forEach(item => {
        paadContainer.appendChild(createIndexItem(item.text, item.loc));
        letters.add(item.text[0]);
    });

    // ३. वक्ता सूची
    const vaktaContainer = document.getElementById('vakta-index');
    vaktaContainer.innerHTML = '';
    gitaData.indices.vakta.forEach(item => {
        vaktaContainer.appendChild(createIndexItem(item.text, item.loc));
        letters.add(item.text[0]); // वक्त्याचे पहिले अक्षर
    });

    // ४. शब्द सूची (Map)
    const shabdaContainer = document.getElementById('shabda-index');
    shabdaContainer.innerHTML = '';
    // शब्दांना अ-ज्ञ क्रमाने लावतो
    const sortedShabdas = Array.from(gitaData.indices.shabda.keys()).sort((a, b) => a.localeCompare(b, 'mr'));
    
    sortedShabdas.forEach(shabd => {
        const locations = gitaData.indices.shabda.get(shabd);
        // शब्दासाठी एक कंटेनर बनवतो
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shabd-item';
        itemDiv.dataset.letter = shabd[0]; // फिल्टरसाठी पहिले अक्षर
        
        // शब्दाचे नाव (span)
        const nameSpan = document.createElement('span');
        nameSpan.className = 'shabd-name';
        nameSpan.textContent = `${shabd} (${locations.length})`;
        itemDiv.appendChild(nameSpan);
        
        // श्लोक क्रमांकांची यादी (locations)
        const locDiv = document.createElement('div');
        locDiv.className = 'shabd-locations';
        locations.forEach(loc => {
            locDiv.appendChild(createLocationLink(loc));
        });
        itemDiv.appendChild(locDiv);
        shabdaContainer.appendChild(itemDiv);
        
        letters.add(shabd[0]); // पहिले अक्षर सेटमध्ये टाकतो
    });
    
    // ५. अक्षरांची सूची (Letter List) तयार करणे
    const letterContainer = document.querySelector('.letter-list');
    letterContainer.innerHTML = '';
    // अक्षरांना अ-ज्ञ क्रमाने लावतो
    const sortedLetters = Array.from(letters).sort((a, b) => a.localeCompare(b, 'mr'));
    sortedLetters.forEach(letter => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = letter;
        link.dataset.letter = letter;
        letterContainer.appendChild(link);
    });

    console.log("सर्व सूची (Indices) तयार आहेत.");
}

// सूचीमधील एक आयटम (नाव + लोकेशन) बनवण्यासाठी मदतनीस (helper)
function createIndexItem(text, loc) {
    const div = document.createElement('div');
    div.className = 'index-item';
    div.dataset.letter = text[0]; // फिल्टरसाठी पहिले अक्षर
    
    const span = document.createElement('span');
    span.textContent = text;
    div.appendChild(span);
    
    div.appendChild(createLocationLink(loc));
    return div;
}

// श्लोक क्रमांकाची (उदा. 1.1) क्लिक करण्यायोग्य लिंक बनवतो
function createLocationLink(loc) {
    const link = document.createElement('a');
    link.className = 'location';
    link.href = `#${loc.replace('.', 's')}`; // उदा. #1s1
    link.textContent = `(${loc})`;
    link.dataset.loc = loc; // 1.1
    return link;
}


/**
 * सर्व बटणे (Theme, Font, Sidebar) सेट करतो.
 */
function setupUIControls() {
    // १. थीम टॉगल (Day/Night)
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('light-mode');
        document.documentElement.classList.toggle('dark-mode');
    });

    // २. फॉन्ट आकार
    let scale = 1;
    document.getElementById('font-increase').addEventListener('click', () => {
        scale = Math.min(scale + 0.1, 1.5); // कमाल 1.5x
        document.documentElement.style.setProperty('--font-scale-factor', scale);
    });
    document.getElementById('font-decrease').addEventListener('click', () => {
        scale = Math.max(scale - 0.1, 0.8); // किमान 0.8x
        document.documentElement.style.setProperty('--font-scale-factor', scale);
    });

    // ३. साईडबार टॉगल (उघडा/बंद करा)
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.querySelector('.app-container').classList.toggle('sidebar-collapsed');
    });
    
    // ४. साईडबारमधील अध्याय सूची (TOC) टॉगल
    document.getElementById('toc-toggle').addEventListener('click', () => {
        document.querySelector('.chapter-list').classList.toggle('collapsed');
    });
}

/**
 * सर्व लिंक्स (नेव्हिगेशन, अध्याय, सूची) सेट करतो.
 */
function setupClickHandlers() {
    const mainLinks = document.querySelectorAll('.main-nav .nav-link, .chapter-list .nav-link');
    const sections = document.querySelectorAll('.content-section');
    const chapterBoxes = document.getElementById('chapters-container');
    const searchResults = document.getElementById('search-results');
    const chapterPrompt = document.getElementById('chapter-prompt');

    // सर्व नेव्हिगेशन लिंक्स
    mainLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;
            
            // आधी सर्वांना 'active' मधून काढतो
            mainLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active'); // फक्त या लिंकला 'active' करतो

            // सर्व मुख्य विभाग (मुखपृष्ठ, पाठ, सूची) लपवतो
            sections.forEach(sec => sec.classList.remove('active'));
            // सर्व अध्याय बॉक्स लपवतो
            chapterBoxes.querySelectorAll('.chapter-box').forEach(box => box.style.display = 'none');
            
            // सर्च रिझल्ट्स लपवतो
            searchResults.style.display = 'none';
            chapterPrompt.style.display = 'none';

            if (targetId.startsWith('chapter-')) {
                // जर अध्यायावर क्लिक केले असेल
                document.getElementById('gita-path').classList.add('active'); // 'गीता पाठ' विभाग दाखवतो
                document.getElementById(targetId).style.display = 'block'; // फक्त तो अध्याय दाखवतो
                // 'गीता पाठ' लिंकलाही active करतो
                document.querySelector('.main-nav a[data-target="gita-path"]').classList.add('active');
            } else {
                // जर मुख्य लिंकवर (मुखपृष्ठ, सूची) क्लिक केले असेल
                document.getElementById(targetId).classList.add('active');
                if (targetId === 'gita-path') {
                    chapterPrompt.style.display = 'block'; // 'अध्याय निवडा' मेसेज दाखवतो
                }
            }

            // मोबाईलवर लिंक क्लिक केल्यावर साईडबार आपोआप बंद करतो
            if (window.innerWidth < 768) {
                document.querySelector('.app-container').classList.add('sidebar-collapsed');
            }
        });
    });

    // सूचीमधील लोकेशन लिंकवर (उदा. 1.1) क्लिक हाताळणे
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('location')) {
            e.preventDefault();
            const loc = e.target.dataset.loc; // उदा. "1.1"
            if (loc) {
                MapsToShloka(loc);
            }
        }
    });
}

/**
 * 'गीता सूची' विभागातील टॅब आणि अक्षर-फिल्टर सेट करतो.
 */
function setupSuchiControls() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const letterList = document.querySelector('.letter-list');

    // १. टॅब बदलणे (श्लोक, पाद, शब्द, वक्ता)
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetIndex = link.dataset.index;
            
            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            tabContents.forEach(c => c.classList.remove('active'));
            document.getElementById(`${targetIndex}-index`).classList.add('active');
            
            // फिल्टर रीसेट करतो
            filterIndexByLetter(null); // सर्व दाखवतो
            letterList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        });
    });

    // २. अक्षर-फिल्टर (Letter List)
    letterList.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            const letter = e.target.dataset.letter;
            
            // जर आधीच active असेल, तर फिल्टर काढतो
            if (e.target.classList.contains('active')) {
                e.target.classList.remove('active');
                filterIndexByLetter(null); // सर्व दाखवतो
            } else {
                letterList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');
                filterIndexByLetter(letter); // फिल्टर करतो
            }
        }
    });
}

// अक्षर-फिल्टरचे मुख्य लॉजिक
function filterIndexByLetter(letter) {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (!activeTabContent) return;
    
    const items = activeTabContent.querySelectorAll('[data-letter]');
    
    items.forEach(item => {
        // जर letter = null (रीसेट), किंवा आयटमचे अक्षर जुळले, तर दाखवतो
        if (!letter || item.dataset.letter === letter) {
            item.style.display = ''; // CSS नुसार (flex/block)
        } else {
            item.style.display = 'none'; // लपवतो
        }
    });
}


/**
 * सूची किंवा सर्चमधून श्लोकावर नेव्हिगेट करतो.
 * @param {string} loc - श्लोक क्रमांक (उदा. "1.1")
 */
function MapsToShloka(loc) {
    const [chapter, shloka] = loc.split('.');
    const chapterId = `chapter-${chapter}`;
    const shlokaId = `c${chapter}s${shloka}`;

    // साईडबार लिंक्स 'active' करतो
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.main-nav a[data-target="gita-path"]`).classList.add('active');
    const chapterLink = document.querySelector(`.chapter-list a[data-target="${chapterId}"]`);
    if (chapterLink) {
        chapterLink.classList.add('active');
    }
    
    // 'गीता पाठ' विभाग दाखवतो
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('gita-path').classList.add('active');
    
    // सर्व अध्याय बॉक्स लपवतो
    document.querySelectorAll('.chapter-box').forEach(box => box.style.display = 'none');
    
    // सर्च रिझल्ट्स लपवतो
    document.getElementById('search-results').style.display = 'none';
    
    // फक्त योग्य अध्याय दाखवतो
    const targetChapterBox = document.getElementById(chapterId);
    if (targetChapterBox) {
        targetChapterBox.style.display = 'block';
        
        // योग्य श्लोकापर्यंत स्क्रोल करतो
        const targetShloka = document.getElementById(shlokaId);
        if (targetShloka) {
            targetShloka.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // क्षणभर हायलाईट करतो
            targetShloka.classList.add('highlight');
            setTimeout(() => {
                targetShloka.classList.remove('highlight');
            }, 1500); // 1.5 सेकंद
        } else {
            console.warn(`${shlokaId} हा श्लोक ID सापडला नाही.`);
        }
    } else {
        console.warn(`${chapterId} हा अध्याय ID सापडला नाही.`);
    }

    // मोबाईलवर साईडबार बंद करतो
    if (window.innerWidth < 768) {
        document.querySelector('.app-container').classList.add('sidebar-collapsed');
    }
}

// TODO: ग्लोबल सर्च फंक्शन (सध्या लागू केलेले नाही)
document.getElementById('global-search-bar').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    // इथे सर्च लॉजिक टाकावे लागेल.
    // console.log("Searching for:", query);
});


