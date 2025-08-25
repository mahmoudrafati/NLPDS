/**
 * Main application bootstrap
 * Handles routing, event management, and application lifecycle
 */

// Debug-Logging
console.log('🔧 DEBUGGING: app.js wird geladen...');

import { 
    state, 
    addEventListener, 
    loadDefaultQuestions, 
    importQuestions, 
    startSession, 
    endSession,
    nextQuestion,
    previousQuestion,
    getCurrentQuestion,
    setFilters,
    setCurrentPage,
    setSettings,
    exportResults,
    clearData,
    restore
} from './store.js';

import { renderPage, renderMath, updateDataStatus, postRenderImageSection, renderImageSection } from './render.js';
import { evaluateAnswer, generateHint, evaluateNumericalAnswer } from './evaluate.js';

// New imports for authentication and sync
import { config } from './config.js';
import { initializeAuth, isAuthenticated, isBackendAvailable } from './auth.js';
import { initializeSync, saveAnswerResult } from './sync.js';
import { initializeUserUI } from './user-ui.js';
import { initializePageAnimations } from './animations.js';
import { fetchLeaderboardData, updateLeaderboardSort, updateLeaderboardFilter, refreshLeaderboard } from './leaderboard.js';

console.log('✅ DEBUGGING: Alle Module erfolgreich importiert');

/**
 * Application state for UI interactions
 */
const appState = {
    currentHintLevel: 0,
    hintsUsed: 0,
    questionStartTime: null,
    timerInterval: null,
    currentEvaluation: null
};

/**
 * Initialize application
 */
async function init() {
    try {
        console.log('🚀 NLP Learning App wird gestartet...');
        
        // Test ob alle Module verfügbar sind
        console.log('📦 Teste Module-Imports...');
        console.log('- state:', typeof state);
        console.log('- loadDefaultQuestions:', typeof loadDefaultQuestions);
        console.log('- renderPage:', typeof renderPage);
        
        // Event listeners registrieren
        console.log('🔗 Registriere Event-Listener...');
        registerEventListeners();
        
        // Gespeicherte Daten laden
        console.log('💾 Lade gespeicherte Daten...');
        const restored = restore();
        console.log('- Daten wiederhergestellt:', restored);
        
        // Versuche Standard-JSON zu laden (falls nicht bereits Daten vorhanden)
        if (!restored || state.questions.length === 0) {
            console.log('🔄 Lade Standard-Fragen...');
            const loaded = await loadDefaultQuestions();
            console.log('- Fragen geladen:', loaded);
        }
        
        // Image-Mapping laden und attachImages aufrufen
        await loadImageMappingAndAttach();
        
        // Initial UI rendern
        console.log('🎨 Rendere UI...');
        setupRouter();
        await navigateToPage('dashboard');
        
        // Data Status im Header aktualisieren
        console.log('📊 Aktualisiere Status...');
        updateDataStatus();
        
        // Theme beim Start anwenden
        console.log('🎨 Lade Theme...');
        applyCurrentTheme();
        
        // KaTeX-Verfügbarkeit prüfen und warten falls nötig
        // console.log('📐 Prüfe KaTeX-Verfügbarkeit...');
        await waitForKaTeX();
        // checkKaTeXAvailability();
        
        // Initialize authentication and user features
        console.log('🔐 Initialisiere Authentifizierung...');
        await initializeAuth();
        
        // Initialize sync system (works with or without authentication)
        console.log('🔄 Initialisiere Synchronisation...');
        await initializeSync();
        
        // Initialize user interface components (DOM should be ready now)
        console.log('👤 Initialisiere Benutzeroberfläche...');
        initializeUserUI();
        
        // Log configuration for debugging
        if (config.DEBUG) {
            console.log('🔧 App-Status:', {
                authenticated: isAuthenticated(),
                backendAvailable: isBackendAvailable(),
                questionsLoaded: state.questions.length,
                syncEnabled: config.FEATURES.PROGRESS_SYNC
            });
        }
        
        console.log('✅ App erfolgreich gestartet');
        
    } catch (error) {
        console.error('❌ Fehler beim App-Start:', error);
        console.error('Stack trace:', error.stack);
        
        // Fallback UI anzeigen
        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.innerHTML = `
                <div class="max-w-2xl mx-auto text-center py-12">
                    <h2 class="text-2xl font-bold text-red-600 mb-4">❌ App-Start fehlgeschlagen</h2>
                    <p class="text-gray-600 mb-4">Es ist ein Fehler beim Laden der App aufgetreten:</p>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                        <pre class="text-sm text-red-800">${error.message}</pre>
                    </div>
                    <p class="text-gray-500 mt-4 text-sm">Bitte überprüfen Sie die Browser-Konsole für weitere Details.</p>
                </div>
            `;
        }
    }
}

/**
 * Event-Listener registrieren
 */
function registerEventListeners() {
    // Store-Events
    addEventListener('stateChange', handleStateChange);
    addEventListener('questionsLoaded', handleQuestionsLoaded);
    addEventListener('sessionStart', handleSessionStart);
    addEventListener('sessionEnd', handleSessionEnd);
    
    // Browser-Events
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Keyboard-Events
    document.addEventListener('keydown', handleKeyboard);
    
    console.log('Event-Listener registriert');
}

/**
 * Router-Setup
 */
function setupRouter() {
    // Hash-basiertes Routing
    if (!window.location.hash) {
        window.location.hash = '#/dashboard';
    }
}

/**
 * Navigation zu einer Seite
 * @param {string} page - Zielseite
 */
async function navigateToPage(page) {
    console.log(`📄 Navigiere zu Seite: ${page}`);
    
    setCurrentPage(page);
    await renderPage(page);
    attachEventHandlers();
    updateDataStatus();
    
    // Timer für Fragen-Seiten starten
    if (page === 'learn' || page === 'exam') {
        // Nur Timer starten wenn noch kein Timer läuft oder es eine neue Session ist
        if (!appState.questionStartTime || state.session.results.length === 0) {
            resetQuestionTimer();
        }
    }
    
    // Hash aktualisieren ohne Event zu triggern
    const newHash = `#/${page}`;
    if (window.location.hash !== newHash) {
        window.location.hash = newHash;
    }
    
    // Zusätzliches KaTeX-Rendering für Mathematik
    // console.log('📐 Triggere KaTeX-Rendering für neue Seite...');
    setTimeout(() => {
        renderMath();
        
        // Initialize page-specific functionality
        if (page === 'statistics') {
            initializePageAnimations();
        } else if (page === 'leaderboard') {
            fetchLeaderboardData();
        }
    }, 200);
}

/**
 * Event-Handler für Hash-Änderungen
 */
async function handleHashChange() {
    const hash = window.location.hash.slice(2); // Entferne "#/"
    const page = hash || 'dashboard';
    
    if (page !== state.ui.currentPage) {
        await navigateToPage(page);
    }
}

/**
 * Event-Handler für State-Änderungen
 */
function handleStateChange(newState) {
    updateDataStatus();
    
    // UI-spezifische Updates
    if (state.ui.currentPage === 'learn' || state.ui.currentPage === 'exam') {
        updateQuestionTimer();
    }
}

/**
 * Event-Handler für neue Fragen
 */
function handleQuestionsLoaded(questions) {
    console.log(`✅ ${questions.length} Fragen geladen`);
    updateDataStatus();
    
    // Dashboard neu rendern falls aktiv
    if (state.ui.currentPage === 'dashboard') {
        renderPage('dashboard');
        attachEventHandlers();
    }
}

/**
 * Event-Handler für Session-Start
 */
function handleSessionStart(session) {
    console.log(`🎯 ${session.mode}-Session gestartet: ${session.queue.length} Fragen`);
    
    // Timer starten falls Zeitlimit gesetzt
    if (session.timeLimit) {
        startSessionTimer(session.timeLimit);
    }
    
    // Frage-Timer zurücksetzen
    resetQuestionTimer();
}

/**
 * Event-Handler für Session-Ende
 */
function handleSessionEnd(sessionData) {
    console.log('🏁 Session beendet');
    
    // Timer stoppen
    if (appState.timerInterval) {
        clearInterval(appState.timerInterval);
        appState.timerInterval = null;
    }
    
    // Zur Ergebnisseite navigieren
    navigateToPage('results');
}

/**
 * Event-Handler für Keyboard-Shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboard(event) {
    // Shortcuts nur wenn kein Input-Element fokussiert ist
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.key) {
        case 'Enter':
            if (event.ctrlKey || event.metaKey) {
                const checkBtn = document.getElementById('check-answer');
                if (checkBtn && !checkBtn.disabled) {
                    event.preventDefault();
                    checkBtn.click();
                }
            }
            break;
            
        case 'ArrowLeft':
            if (event.altKey) {
                const prevBtn = document.getElementById('prev-question');
                if (prevBtn && !prevBtn.disabled) {
                    event.preventDefault();
                    prevBtn.click();
                }
            }
            break;
            
        case 'ArrowRight':
            if (event.altKey) {
                const nextBtn = document.getElementById('next-question');
                if (nextBtn && !nextBtn.disabled) {
                    event.preventDefault();
                    nextBtn.click();
                }
            }
            break;
            
        case 's':
            if (event.ctrlKey || event.metaKey) {
                const solutionBtn = document.getElementById('show-solution');
                if (solutionBtn) {
                    event.preventDefault();
                    solutionBtn.click();
                }
            }
            break;
    }
}

/**
 * Event-Handler für Before-Unload
 */
function handleBeforeUnload(event) {
    // Warne nur bei aktiver Session
    if (state.session.mode && state.session.results.length > 0) {
        event.preventDefault();
        event.returnValue = 'Sie haben eine aktive Session. Möchten Sie wirklich die Seite verlassen?';
        return event.returnValue;
    }
}

/**
 * Event-Handler für DOM-Events anhängen
 */
function attachEventHandlers() {
    // Dashboard-Events
    attachDashboardEvents();
    
    // Question-View-Events
    attachQuestionEvents();
    
    // Global-Events
    attachGlobalEvents();
    
    // Nach dem Anhängen KaTeX rendern
    // console.log('🎯 Trigger KaTeX-Rendering nach Event-Handler-Setup...');
    setTimeout(() => {
        const success = renderMath();
        // if (!success) {
        //     console.warn('⚠️ KaTeX-Rendering fehlgeschlagen - versuche erneut in 1s');
        //     setTimeout(() => renderMath(), 1000);
        // }
    }, 100);
}

/**
 * Dashboard-spezifische Event-Handler
 */
function attachDashboardEvents() {
    // Lernen starten
    const startLearnBtn = document.getElementById('start-learn');
    if (startLearnBtn) {
        startLearnBtn.addEventListener('click', () => {
            const randomOrder = document.getElementById('learn-random')?.checked ?? true;
            const questionCount = parseInt(document.getElementById('learn-count')?.value) || null;
            
            const success = startSession({
                mode: 'learn',
                randomOrder,
                questionCount,
                selectedTopics: Array.from(state.filters.activeTopics),
                selectedTypes: Array.from(state.filters.activeTypes)
            });
            
            if (success) {
                navigateToPage('learn');
            }
        });
    }
    
    // Prüfung starten
    const startExamBtn = document.getElementById('start-exam');
    if (startExamBtn) {
        startExamBtn.addEventListener('click', () => {
            const questionCount = parseInt(document.getElementById('exam-count')?.value) || null;
            const timeLimit = parseInt(document.getElementById('exam-time')?.value) || null;
            
            const success = startSession({
                mode: 'exam',
                randomOrder: true,
                questionCount,
                timeLimit,
                selectedTopics: Array.from(state.filters.activeTopics),
                selectedTypes: Array.from(state.filters.activeTypes)
            });
            
            if (success) {
                navigateToPage('exam');
            }
        });
    }
    
    // Filter-Events
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            setFilters({ search: e.target.value });
            updateFilteredCount();
        });
    }
    
    // Topic-Filter
    document.querySelectorAll('.topic-filter').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.filters.activeTopics.add(e.target.value);
            } else {
                state.filters.activeTopics.delete(e.target.value);
            }
            setFilters({ activeTopics: state.filters.activeTopics });
            updateFilteredCount();
        });
    });
    
    // Type-Filter
    document.querySelectorAll('.type-filter').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.filters.activeTypes.add(e.target.value);
            } else {
                state.filters.activeTypes.delete(e.target.value);
            }
            setFilters({ activeTypes: state.filters.activeTypes });
            updateFilteredCount();
        });
    });
    
    // Bildbasierte Fragen Toggle
    const showImageQuestionsCheckbox = document.getElementById('show-image-questions');
    if (showImageQuestionsCheckbox) {
        showImageQuestionsCheckbox.addEventListener('change', (e) => {
            setFilters({ showImageQuestions: e.target.checked });
            updateFilteredCount();
        });
    }
    
    // Filter zurücksetzen
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            state.filters.activeTopics.clear();
            state.filters.activeTypes.clear();
            setFilters({ 
                search: '', 
                activeTopics: new Set(), 
                activeTypes: new Set(),
                showImageQuestions: false 
            });
            
            // UI aktualisieren
            renderPage('dashboard');
            attachEventHandlers();
        });
    }
    
    // Katalog anzeigen
    const viewCatalogBtn = document.getElementById('view-catalog');
    if (viewCatalogBtn) {
        viewCatalogBtn.addEventListener('click', () => {
            navigateToPage('catalog');
        });
    }
    
    // Navigation zu Statistiken
    const navToStatsBtn = document.getElementById('nav-to-statistics');
    if (navToStatsBtn) {
        navToStatsBtn.addEventListener('click', async () => {
            await navigateToPage('statistics');
        });
    }
    
    // Navigation zur Rangliste
    const navToLeaderboardBtn = document.getElementById('nav-to-leaderboard');
    if (navToLeaderboardBtn) {
        navToLeaderboardBtn.addEventListener('click', async () => {
            await navigateToPage('leaderboard');
        });
    }
    
    // File-Upload (aktuell deaktiviert)
    // TODO: In zukünftiger Version implementieren
}

/**
 * Question-View-spezifische Event-Handler
 */
function attachQuestionEvents() {
    // Antwort prüfen
    const checkBtn = document.getElementById('check-answer');
    if (checkBtn) {
        checkBtn.addEventListener('click', handleCheckAnswer);
    }
    
    // Antwort zurücksetzen
    const resetBtn = document.getElementById('reset-answer');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const currentQuestion = getCurrentQuestion();
            if (
                currentQuestion && (
                    (currentQuestion.type && (currentQuestion.type.startsWith('mc_') || currentQuestion.type === 'multiple_choice')) ||
                    (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0)
                )
            ) {
                document.querySelectorAll('.mc-input').forEach(i => i.checked = false);
            } else {
                const textarea = document.getElementById('user-answer');
                if (textarea) {
                    textarea.value = '';
                    textarea.focus();
                }
            }
            
            // Evaluation verstecken
            const evalResult = document.getElementById('evaluation-result');
            if (evalResult) {
                evalResult.classList.add('hidden');
            }
        });
    }
    
    // Frage überspringen
    const skipBtn = document.getElementById('skip-question');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            saveAnswerResult({
                userAnswer: '',
                score: 0,
                correct: false,
                evaluation: null,
                hintsUsed: appState.hintsUsed,
                timeSpent: getQuestionTime()
            });
            
            goToNextQuestion();
            
            goToNextQuestion();
        });
    }
    
    // Hinweise
    document.querySelectorAll('.hint-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = parseInt(e.target.dataset.level);
            showHint(level);
        });
    });
    
    // Lösung zeigen
    const solutionBtn = document.getElementById('show-solution');
    if (solutionBtn) {
        solutionBtn.addEventListener('click', toggleSolution);
    }
    
    // Manuelle Bewertung
    const markCorrectBtn = document.getElementById('mark-correct');
    if (markCorrectBtn) {
        markCorrectBtn.addEventListener('click', () => markAnswer(true));
    }
    
    const markIncorrectBtn = document.getElementById('mark-incorrect');
    if (markIncorrectBtn) {
        markIncorrectBtn.addEventListener('click', () => markAnswer(false));
    }
    
    // Navigation
    const prevBtn = document.getElementById('prev-question');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (previousQuestion()) {
                resetQuestionTimer();
                renderPage(state.ui.currentPage);
                attachEventHandlers();
            }
        });
    }
    
    const nextBtn = document.getElementById('next-question');
    if (nextBtn) {
        nextBtn.addEventListener('click', goToNextQuestion);
    }
    
    // Session beenden
    const endSessionBtn = document.getElementById('end-session');
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', () => {
            if (confirm('Möchten Sie die Session wirklich beenden?')) {
                endSession();
            }
        });
    }
    
    // Bild-Upload-Buttons
    attachImageUploadEvents();
    
    // Stub-Toggle-Buttons
    attachStubToggleEvents();
}

/**
 * Globale Event-Handler
 */
function attachGlobalEvents() {
    // Zurück zum Dashboard
    document.querySelectorAll('#back-to-dashboard').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateToPage('dashboard');
        });
    });
    
    // Ergebnisse exportieren
    const exportBtn = document.getElementById('export-results');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = exportResults();
            downloadFile(data, 'nlp-learning-results.json', 'application/json');
        });
    }
    
    // Session neustarten
    const restartBtn = document.getElementById('restart-session');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            // Gleiche Einstellungen wie vorher verwenden
            const success = startSession({
                mode: state.session.mode,
                questionCount: state.session.settings.questionCount,
                randomOrder: state.session.settings.randomOrder
            });
            
            if (success) {
                navigateToPage(state.session.mode);
            }
        });
    }
    
    // Theme-Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Statistics Page Navigation
    const viewMyStatsBtn = document.getElementById('view-my-stats');
    if (viewMyStatsBtn) {
        viewMyStatsBtn.addEventListener('click', () => {
            navigateToPage('statistics');
        });
    }
    
    // Leaderboard Navigation
    const viewLeaderboardBtn = document.getElementById('view-leaderboard');
    if (viewLeaderboardBtn) {
        viewLeaderboardBtn.addEventListener('click', () => {
            navigateToPage('leaderboard');
        });
    }
    
    // Leaderboard Controls
    const leaderboardSort = document.getElementById('leaderboard-sort');
    if (leaderboardSort) {
        leaderboardSort.addEventListener('change', (e) => {
            updateLeaderboardSort(e.target.value);
        });
    }
    
    const leaderboardFilter = document.getElementById('leaderboard-filter');
    if (leaderboardFilter) {
        leaderboardFilter.addEventListener('change', (e) => {
            updateLeaderboardFilter(e.target.value);
        });
    }
    
    const refreshLeaderboardBtn = document.getElementById('refresh-leaderboard');
    if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.addEventListener('click', () => {
            refreshLeaderboard();
        });
    }
    
    // Start learning from leaderboard
    const startLearningFromLeaderboard = document.getElementById('start-learning-from-leaderboard');
    if (startLearningFromLeaderboard) {
        startLearningFromLeaderboard.addEventListener('click', () => {
            navigateToPage('dashboard');
        });
    }
}

/**
 * Antwort prüfen
 */
async function handleCheckAnswer() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    let userAnswer = '';
    if ((currentQuestion.type && (currentQuestion.type.startsWith('mc_') || currentQuestion.type === 'multiple_choice')) || (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0)) {
        const inputs = Array.from(document.querySelectorAll('.mc-input'));
        const selected = inputs.filter(i => i.checked).map(i => i.value);
        userAnswer = selected.join(',');
        if (selected.length === 0) {
            showNotification('Bitte wählen Sie mindestens eine Option aus.', 'warning');
            return;
        }
    } else {
        const textarea = document.getElementById('user-answer');
        userAnswer = textarea?.value?.trim() || '';
        if (!userAnswer) {
            showNotification('Bitte geben Sie eine Antwort ein.', 'warning');
            return;
        }
    }
    
    // Evaluation durchführen
    let evaluation;
    
    if (currentQuestion.type === 'rechenaufgabe') {
        // Spezielle Behandlung für Rechenaufgaben
        const numEval = evaluateNumericalAnswer(userAnswer, currentQuestion.given_answer);
        evaluation = evaluateAnswer(userAnswer, currentQuestion);
        
        // Numerische Bewertung mit Text-Bewertung kombinieren
        evaluation.score = Math.max(evaluation.score, numEval.score);
        evaluation.numericalEvaluation = numEval;
    } else if ((currentQuestion.type && (currentQuestion.type.startsWith('mc_') || currentQuestion.type === 'multiple_choice')) || (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0)) {
        evaluation = evaluateAnswer(userAnswer, currentQuestion, { mode: 'multiple_choice' });
    } else {
        evaluation = evaluateAnswer(userAnswer, currentQuestion);
    }
    
    appState.currentEvaluation = evaluation;
    
    // Ergebnis anzeigen
    displayEvaluation(evaluation);
    
    // Button-States aktualisieren
    document.getElementById('check-answer').textContent = 'Erneut prüfen';
    
    console.log('Evaluation:', evaluation);
}

/**
 * Evaluation-Ergebnis anzeigen
 * @param {object} evaluation - Evaluation-Objekt
 */
function displayEvaluation(evaluation) {
    const container = document.getElementById('evaluation-result');
    if (!container) return;
    
    container.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-medium text-gray-900">📊 Bewertung</h4>
            <div class="text-right">
                <div class="text-2xl font-bold ${evaluation.color}">
                    ${(evaluation.score * 100).toFixed(0)}%
                </div>
                <div class="text-sm text-gray-600">${evaluation.label}</div>
            </div>
        </div>
        
        <div class="space-y-3">
            <!-- Score-Breakdown -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div class="text-center p-2 bg-gray-50 rounded">
                    <div class="font-medium">Keywords</div>
                    <div class="${evaluation.breakdown.keywords > 0.6 ? 'text-green-600' : 'text-red-600'}">
                        ${(evaluation.breakdown.keywords * 100).toFixed(0)}%
                    </div>
                </div>
                <div class="text-center p-2 bg-gray-50 rounded">
                    <div class="font-medium">Ähnlichkeit</div>
                    <div class="${evaluation.breakdown.jaccard > 0.5 ? 'text-green-600' : 'text-red-600'}">
                        ${(evaluation.breakdown.jaccard * 100).toFixed(0)}%
                    </div>
                </div>
                <div class="text-center p-2 bg-gray-50 rounded">
                    <div class="font-medium">Mathematik</div>
                    <div class="${evaluation.breakdown.math > 0.6 ? 'text-green-600' : 'text-red-600'}">
                        ${(evaluation.breakdown.math * 100).toFixed(0)}%
                    </div>
                </div>
                <div class="text-center p-2 bg-gray-50 rounded">
                    <div class="font-medium">Länge</div>
                    <div class="${evaluation.breakdown.length > 0.5 ? 'text-green-600' : 'text-red-600'}">
                        ${(evaluation.breakdown.length * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
            
            <!-- Gefundene Keywords -->
            ${evaluation.matchedKeywords.length > 0 ? `
                <div>
                    <span class="font-medium text-green-700">✓ Gefundene Begriffe:</span>
                    <span class="text-sm">${evaluation.matchedKeywords.join(', ')}</span>
                </div>
            ` : ''}
            
            <!-- Fehlende Keywords -->
            ${evaluation.missingKeywords.length > 0 ? `
                <div>
                    <span class="font-medium text-red-700">✗ Fehlende Begriffe:</span>
                    <span class="text-sm">${evaluation.missingKeywords.slice(0, 5).join(', ')}</span>
                </div>
            ` : ''}
            
            <!-- Verbesserungsvorschläge -->
            ${evaluation.suggestions.length > 0 ? `
                <div>
                    <span class="font-medium text-blue-700">💡 Verbesserungsvorschläge:</span>
                    <ul class="text-sm mt-1 space-y-1">
                        ${evaluation.suggestions.slice(0, 3).map(suggestion => 
                            `<li class="text-blue-600">• ${suggestion}</li>`
                        ).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    container.classList.remove('hidden');
    
    // Scroll zur Bewertung
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hinweis anzeigen
 * @param {number} level - Hinweis-Level (1-3)
 */
function showHint(level) {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    const hint = generateHint(currentQuestion, level);
    const container = document.getElementById('hints-container');
    
    if (!container) return;
    
    // Hinweis hinzufügen
    const hintElement = document.createElement('div');
    hintElement.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4';
    hintElement.innerHTML = `
        <div class="prose max-w-none text-blue-800">
            ${hint.replace(/\n/g, '<br>')}
        </div>
    `;
    
    container.appendChild(hintElement);
    container.classList.remove('hidden');
    
    // Hinweis-Zähler erhöhen
    appState.hintsUsed++;
    appState.currentHintLevel = Math.max(appState.currentHintLevel, level);
    
    // Nächsten Hinweis-Button aktivieren
    const nextHintBtn = document.getElementById(`hint-${level + 1}`);
    if (nextHintBtn) {
        nextHintBtn.disabled = false;
    }
    
    // Aktuellen Button deaktivieren
    const currentBtn = document.getElementById(`hint-${level}`);
    if (currentBtn) {
        currentBtn.disabled = true;
        currentBtn.textContent = `Hinweis ${level} ✓`;
    }
    
    // KaTeX rendern falls LaTeX im Hinweis
    renderMath(hintElement);
    
    // Scroll zum Hinweis
    hintElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Lösung ein-/ausblenden
 */
function toggleSolution() {
    const container = document.getElementById('solution-container');
    const button = document.getElementById('show-solution');
    
    if (!container || !button) return;
    
    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        button.textContent = 'Lösung verbergen';
        button.classList.add('bg-purple-700');
        
        // KaTeX in Lösung rendern
        renderMath(container);
        
        // Scroll zur Lösung
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        container.classList.add('hidden');
        button.textContent = 'Lösung zeigen';
        button.classList.remove('bg-purple-700');
    }
}

/**
 * Antwort manuell bewerten
 * @param {boolean} correct - Ist die Antwort korrekt?
 */
function markAnswer(correct) {
    const currentQuestion = getCurrentQuestion();
    let userAnswer = '';
    if (
        currentQuestion && (
            (currentQuestion.type && (currentQuestion.type.startsWith('mc_') || currentQuestion.type === 'multiple_choice')) ||
            (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0)
        )
    ) {
        const inputs = Array.from(document.querySelectorAll('.mc-input'));
        const selected = inputs.filter(i => i.checked).map(i => i.value);
        userAnswer = selected.join(',');
    } else {
        const textarea = document.getElementById('user-answer');
        userAnswer = textarea?.value?.trim() || '';
    }
    
    const score = correct ? 1.0 : 0.0;
    
    saveAnswerResult({
        userAnswer,
        score,
        correct,
        evaluation: appState.currentEvaluation,
        hintsUsed: appState.hintsUsed,
        timeSpent: getQuestionTime()
    });
    
    showNotification(
        correct ? '✓ Als korrekt markiert' : '✗ Als falsch markiert', 
        correct ? 'success' : 'info'
    );
    
    // Nach kurzer Verzögerung zur nächsten Frage
    setTimeout(() => {
        goToNextQuestion();
    }, 1000);
}

/**
 * Zur nächsten Frage gehen
 */
async function goToNextQuestion() {
    // Wenn noch nicht bewertet, automatisch bewerten
    if (!appState.currentEvaluation) {
        const currentQuestion = getCurrentQuestion();
        let userAnswer = '';
        let evaluation = null;
        if (
            currentQuestion && (
                (currentQuestion.type && (currentQuestion.type.startsWith('mc_') || currentQuestion.type === 'multiple_choice')) ||
                (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0)
            )
        ) {
            const inputs = Array.from(document.querySelectorAll('.mc-input'));
            const selected = inputs.filter(i => i.checked).map(i => i.value);
            if (selected.length > 0) {
                userAnswer = selected.join(',');
                evaluation = evaluateAnswer(userAnswer, currentQuestion, { mode: 'multiple_choice' });
            }
        } else {
            const textarea = document.getElementById('user-answer');
            userAnswer = textarea?.value?.trim() || '';
            if (userAnswer) {
                evaluation = evaluateAnswer(userAnswer, currentQuestion);
            }
        }
        
        if (evaluation) {
            
            await saveAnswerResult({
                userAnswer,
                score: evaluation.score,
                correct: evaluation.score >= 0.6,
                evaluation,
                hintsUsed: appState.hintsUsed,
                timeSpent: getQuestionTime()
            });
        }
    }
    
    if (nextQuestion()) {
        resetQuestionTimer();
        renderPage(state.ui.currentPage);
        attachEventHandlers();
        
        // Spezielle Behandlung für Mathematik und SVG-Stubs nach Fragen-Wechsel
        // console.log('🔄 Neue Frage geladen - triggere KaTeX und SVG...');
        setTimeout(() => {
            renderMath();
            const newQuestion = getCurrentQuestion();
            if (newQuestion) {
                postRenderImageSection(newQuestion);
            }
        }, 300);
    } else {
        // Session beendet
        endSession();
    }
}

/**
 * Timer-Management
 */
function startSessionTimer(minutes) {
    const endTime = Date.now() + (minutes * 60 * 1000);
    
    appState.timerInterval = setInterval(() => {
        const remaining = endTime - Date.now();
        
        if (remaining <= 0) {
            clearInterval(appState.timerInterval);
            endSession();
            showNotification('⏰ Zeit ist abgelaufen!', 'warning');
            return;
        }
        
        updateTimerDisplay(remaining);
    }, 1000);
}

function updateTimerDisplay(remainingMs) {
    const timerText = document.getElementById('timer-text');
    if (!timerText) return;
    
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    
    timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Warnung bei weniger als 5 Minuten
    if (remainingMs < 5 * 60 * 1000) {
        timerText.parentElement.classList.add('bg-red-100', 'text-red-700');
    }
}

function resetQuestionTimer() {
    appState.questionStartTime = Date.now();
    appState.currentHintLevel = 0;
    appState.hintsUsed = 0;
    appState.currentEvaluation = null;
    console.log('🔄 resetQuestionTimer() - Timer gestartet um:', new Date(appState.questionStartTime).toLocaleTimeString());
}

function getQuestionTime() {
    const timeSpent = appState.questionStartTime ? Date.now() - appState.questionStartTime : 0;
    console.log('⏱️ getQuestionTime():', {
        questionStartTime: appState.questionStartTime,
        currentTime: Date.now(),
        timeSpent: timeSpent,
        timeSpentSeconds: Math.round(timeSpent / 1000)
    });
    return timeSpent;
}

function updateQuestionTimer() {
    // Placeholder für Live-Timer-Updates
}

/**
 * Utility-Funktionen
 */
function updateFilteredCount() {
    // Aktualisiert die Anzeige der gefilterten Fragen-Anzahl
    const countElement = document.querySelector('#search-input + p');
    if (countElement) {
        const count = getFilteredQuestions().length;
        countElement.textContent = `${count} Fragen gefunden`;
    }
}

function showNotification(message, type = 'info') {
    // Einfache Notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove nach 3 Sekunden
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make showNotification globally available
window.showNotification = showNotification;

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

function applyCurrentTheme() {
    const currentTheme = state.settings.theme;
    
    // Dark-Mode Klasse auf Body anwenden
    document.body.classList.toggle('dark', currentTheme === 'dark');
    
    // Theme-Button aktualisieren
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
    
    console.log(`🎨 Theme angewendet: ${currentTheme}`);
}

async function waitForKaTeX(maxWait = 5000) {
    // console.log('⏳ Warte auf KaTeX...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
        if (typeof katex !== 'undefined' && typeof renderMathInElement !== 'undefined') {
            // console.log('✅ KaTeX ist verfügbar');
            return true;
        }
        
        // Warte 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // console.warn('⚠️ KaTeX-Timeout nach', maxWait, 'ms');
    return false;
}

function checkKaTeXAvailability() {
    const checks = {
        katex: typeof katex !== 'undefined',
        renderMathInElement: typeof renderMathInElement !== 'undefined',
        window_katex: typeof window.katex !== 'undefined',
        window_renderMathInElement: typeof window.renderMathInElement !== 'undefined'
    };
    
    // console.log('📐 KaTeX-Status:', checks);
    
    // if (!checks.katex) {
    //     console.error('❌ KaTeX library nicht geladen');
    // }
    
    // if (!checks.renderMathInElement) {
    //     console.error('❌ KaTeX renderMathInElement nicht geladen');
    // }
    
    // Teste ein einfaches KaTeX-Rendering
    // if (checks.katex) {
    //     try {
    //         const testHtml = katex.renderToString('E = mc^2', { throwOnError: false });
    //         console.log('✅ KaTeX-Test erfolgreich:', testHtml.substring(0, 50) + '...');
    //     } catch (error) {
    //         console.error('❌ KaTeX-Test fehlgeschlagen:', error);
    //     }
    // }
    
    return checks.katex && checks.renderMathInElement;
}

function toggleTheme() {
    const currentTheme = state.settings.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    setSettings({ theme: newTheme });
    
    // Theme anwenden
    applyCurrentTheme();
}

/**
 * Event-Handler für Bild-Upload-Buttons
 */
function attachImageUploadEvents() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    const uploadBtn = document.getElementById(`upload-image-${currentQuestion.id}`);
    const fileInput = document.getElementById(`file-input-${currentQuestion.id}`);
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await saveUserImage(currentQuestion.id, file);
                // Input zurücksetzen für zukünftige Uploads
                e.target.value = '';
            }
        });
    }
}

/**
 * Event-Handler für Stub-Toggle-Buttons
 */
function attachStubToggleEvents() {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    const toggleBtn = document.getElementById(`toggle-stub-${currentQuestion.id}`);
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            toggleStubTextFallback(currentQuestion.id);
        });
    }
}

/**
 * Lädt image_map.json und ruft attachImages auf
 */
async function loadImageMappingAndAttach() {
    console.log('🖼️ Lade Image-Mapping...');
    
    try {
        const response = await fetch('./data/image_map.json');
        let imageMap = { bySource: {}, byHint: {} };
        
        if (response.ok) {
            const data = await response.json();
            imageMap = {
                bySource: data.bySource || {},
                byHint: data.byHint || {}
            };
            console.log('✅ Image-Map geladen:', Object.keys(imageMap.bySource).length, 'bySource,', Object.keys(imageMap.byHint).length, 'byHint');
        } else {
            console.warn('⚠️ image_map.json nicht gefunden, verwende leere Mapping');
        }
        
        // attachImages aufrufen falls verfügbar
        if (typeof window.storeAttachImages === 'function' && state.questions.length > 0) {
            window.storeAttachImages(state.questions, imageMap);
            console.log('✅ Bilder an Fragen angehängt');
        }
        
    } catch (error) {
        console.warn('⚠️ Fehler beim Laden der Image-Map:', error);
        
        // Fallback: leere Mapping verwenden
        if (typeof window.storeAttachImages === 'function' && state.questions.length > 0) {
            window.storeAttachImages(state.questions, { bySource: {}, byHint: {} });
        }
    }
}

/**
 * Speichert User-Upload-Bild für eine Frage
 * @param {string} questionId - Frage-ID
 * @param {File} file - Upload-Datei
 */
async function saveUserImage(questionId, file) {
    if (!file || !file.type.startsWith('image/')) {
        showNotification('Bitte wählen Sie eine gültige Bilddatei aus.', 'error');
        return false;
    }
    
    // Größenbegrenzung (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Bilddatei ist zu groß (max. 5MB).', 'error');
        return false;
    }
    
    try {
        // File zu DataURL konvertieren
        const dataURL = await fileToDataURL(file);
        
        // In localStorage speichern
        const imageData = {
            dataURL,
            filename: file.name,
            uploadDate: new Date().toISOString(),
            size: file.size,
            type: file.type
        };
        
        localStorage.setItem(`img:${questionId}`, JSON.stringify(imageData));
        
        // Frage-Objekt aktualisieren
        const question = state.questions.find(q => q.id === questionId);
        if (question) {
            question._image = {
                kind: 'user',
                src: dataURL,
                metadata: {
                    filename: file.name,
                    uploadDate: imageData.uploadDate
                }
            };
            
            // UI neu rendern
            const container = document.getElementById(`image-container-${questionId}`);
            if (container) {
                container.innerHTML = renderImageSection(question);
                console.log(`✅ User-Bild für Frage ${questionId} gespeichert`);
                showNotification('Bild erfolgreich hochgeladen!', 'success');
                return true;
            }
        }
        
    } catch (error) {
        console.error('Fehler beim Speichern des Bildes:', error);
        showNotification('Fehler beim Hochladen des Bildes.', 'error');
        return false;
    }
}

/**
 * Konvertiert File zu DataURL
 * @param {File} file - Datei
 * @returns {Promise<string>} DataURL
 */
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Togglet zwischen Stub und Text-Fallback
 * @param {string} questionId - Frage-ID
 */
function toggleStubTextFallback(questionId) {
    const question = state.questions.find(q => q.id === questionId);
    if (!question || !question._image?.stubKind) return;
    
    // Toggle zwischen stub und null (löst Text-Fallback aus)
    const wasStub = question._image.kind === 'stub';
    question._image.kind = wasStub ? null : 'stub';
    
    // UI neu rendern
    const container = document.getElementById(`image-container-${questionId}`);
    if (container) {
        container.innerHTML = renderImageSection(question);
        
        // SVG-Stub falls nötig rendern
        if (!wasStub) {
            setTimeout(() => postRenderImageSection(question), 50);
        }
        
        console.log(`🔄 Toggle für Frage ${questionId}: ${wasStub ? 'stub → text' : 'text → stub'}`);
    }
}

/**
 * Debugging-Funktionen
 */
window.debug = {
    getState: () => state,
    getAppState: () => appState,
    clearData: () => {
        if (confirm('Alle Daten löschen? Das kann nicht rückgängig gemacht werden.')) {
            clearData();
            location.reload();
        }
    }
};

// App starten wenn DOM bereit ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
