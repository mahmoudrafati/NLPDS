/**
 * SVG diagram stubs for image-based questions.
 * Provides accessible, styled fallback diagrams when original images are not available.
 */

console.log('🔧 DEBUGGING: diagrams.js wird geladen...');

// --- Centralized SVG Styles & Definitions ---

const SVG_STYLES = `
    <style>
        .label { font-family: sans-serif; font-size: 11px; fill: #374151; }
        .header { font-family: sans-serif; font-size: 12px; fill: #374151; font-weight: bold; }
        .box { fill: #f3f4f6; stroke: #6b7280; stroke-width: 1; }
        .arrow { stroke: #6b7280; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
    </style>
    <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
    </defs>
`;

// --- Diagram Generators ---

/**
 * Generates an SVG for a Transformer architecture.
 * @returns {string} SVG markup.
 */
function generateTransformerDiagram() {
    return `
        <svg viewBox="0 0 400 300" class="w-full max-w-md mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="transformer-title transformer-desc">
            <title id="transformer-title">Transformer Architecture Diagram</title>
            <desc id="transformer-desc">A simplified diagram showing the encoder-decoder structure of a Transformer model, including multi-head attention and cross-attention blocks.</desc>
            ${SVG_STYLES}
            <style>
                .encoder { fill: #dbeafe; stroke: #3b82f6; }
                .decoder { fill: #fef3c7; stroke: #f59e0b; }
                .attention { fill: #fce7f3; stroke: #ec4899; }
            </style>
            
            <!-- Input -->
            <rect x="50" y="260" width="80" height="25" class="box" />
            <text x="90" y="275" text-anchor="middle" class="label">Input Tokens</text>
            
            <!-- Encoder Stack -->
            <rect x="30" y="180" width="120" height="60" class="encoder" />
            <text x="90" y="200" text-anchor="middle" class="label header">Encoder</text>
            <text x="90" y="215" text-anchor="middle" class="label">Multi-Head</text>
            <text x="90" y="230" text-anchor="middle" class="label">Attention</text>
            
            <!-- Decoder Stack -->
            <rect x="250" y="180" width="120" height="60" class="decoder" />
            <text x="310" y="200" text-anchor="middle" class="label header">Decoder</text>
            <text x="310" y="215" text-anchor="middle" class="label">Masked</text>
            <text x="310" y="230" text-anchor="middle" class="label">Attention</text>
            
            <!-- Cross Attention -->
            <rect x="150" y="130" width="100" height="35" class="attention" />
            <text x="200" y="150" text-anchor="middle" class="label">Cross-Attention</text>
            
            <!-- Output -->
            <rect x="270" y="50" width="80" height="25" class="box" />
            <text x="310" y="65" text-anchor="middle" class="label">Output Probs</text>
            
            <!-- Arrows -->
            <path d="M 90 260 L 90 240" class="arrow" />
            <path d="M 150 210 L 250 210" class="arrow" />
            <path d="M 90 180 L 160 155" class="arrow" />
            <path d="M 240 155 L 310 180" class="arrow" />
            <path d="M 310 180 L 310 75" class="arrow" />
            
            <text x="200" y="20" text-anchor="middle" class="header">Transformer Architecture</text>
        </svg>
    `;
}

/**
 * Generates an SVG for a Sentiment Analysis pipeline.
 * @returns {string} SVG markup.
 */
function generateSentimentPipelineDiagram() {
    return `
        <svg viewBox="0 0 500 180" class="w-full max-w-lg mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pipeline-title pipeline-desc">
            <title id="pipeline-title">Sentiment Analysis Pipeline</title>
            <desc id="pipeline-desc">A diagram showing the steps of a sentiment analysis process: Raw Text, Preprocessing, Feature Extraction, Classifier, and Result.</desc>
            ${SVG_STYLES}
            <style>
                .step { fill: #f0f9ff; stroke: #0284c7; stroke-width: 1.5; }
            </style>
            
            <text x="250" y="20" text-anchor="middle" class="header">Sentiment Analysis Pipeline</text>
            
            <!-- Steps -->
            <rect x="20" y="50" width="80" height="40" rx="5" class="step" />
            <text x="60" y="70" text-anchor="middle" class="label">Raw Text</text>
            
            <rect x="120" y="50" width="80" height="40" rx="5" class="step" />
            <text x="160" y="70" text-anchor="middle" class="label">Preprocessing</text>
            
            <rect x="220" y="50" width="80" height="40" rx="5" class="step" />
            <text x="260" y="70" text-anchor="middle" class="label">Feature Extraction</text>
            
            <rect x="320" y="50" width="80" height="40" rx="5" class="step" />
            <text x="360" y="70" text-anchor="middle" class="label">Classifier</text>
            
            <rect x="420" y="50" width="80" height="40" rx="5" class="step" />
            <text x="460" y="70" text-anchor="middle" class="label">Result</text>
            
            <!-- Arrows -->
            <path d="M 100 70 L 120 70" class="arrow" />
            <path d="M 200 70 L 220 70" class="arrow" />
            <path d="M 300 70 L 320 70" class="arrow" />
            <path d="M 400 70 L 420 70" class="arrow" />
            
            <text x="260" y="120" text-anchor="middle" class="label">Evaluation with Precision, Recall, F1-Score</text>
        </svg>
    `;
}

/**
 * Generates an SVG for a Confusion Matrix.
 * @returns {string} SVG markup.
 */
function generateConfusionMatrixDiagram() {
    return `
        <svg viewBox="0 0 300 280" class="w-full max-w-xs mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="matrix-title matrix-desc">
            <title id="matrix-title">Confusion Matrix</title>
            <desc id="matrix-desc">A 2x2 confusion matrix showing True Positives (TP), False Negatives (FN), False Positives (FP), and True Negatives (TN).</desc>
            ${SVG_STYLES}
            <style>
                .matrix-cell { stroke: #6b7280; stroke-width: 1; }
                .tp, .tn { fill: #dcfce7; }
                .fp, .fn { fill: #fef2f2; }
            </style>
            
            <text x="150" y="25" text-anchor="middle" class="header">Confusion Matrix</text>
            
            <text x="170" y="60" text-anchor="middle" class="header">Predicted</text>
            <text x="110" y="80" text-anchor="middle" class="label">Positive</text>
            <text x="230" y="80" text-anchor="middle" class="label">Negative</text>
            
            <text x="30" y="150" text-anchor="middle" class="header" transform="rotate(-90, 30, 150)">Actual</text>
            <text x="30" y="110" text-anchor="middle" class="label">Positive</text>
            <text x="30" y="190" text-anchor="middle" class="label">Negative</text>
            
            <!-- Matrix cells -->
            <rect x="70" y="90" width="80" height="50" class="matrix-cell tp" /><text x="110" y="120" text-anchor="middle" class="label">TP</text>
            <rect x="190" y="90" width="80" height="50" class="matrix-cell fn" /><text x="230" y="120" text-anchor="middle" class="label">FN</text>
            <rect x="70" y="170" width="80" height="50" class="matrix-cell fp" /><text x="110" y="200" text-anchor="middle" class="label">FP</text>
            <rect x="190" y="170" width="80" height="50" class="matrix-cell tn" /><text x="230" y="200" text-anchor="middle" class="label">TN</text>
        </svg>
    `;
}

/**
 * Generates an SVG for a Decision Tree.
 * @returns {string} SVG markup.
 */
function generateDecisionTreeDiagram() {
    return `
        <svg viewBox="0 0 350 220" class="w-full max-w-md mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="tree-title tree-desc">
            <title id="tree-title">Decision Tree Diagram</title>
            <desc id="tree-desc">A simple binary decision tree with a root node, two levels of branches, and four leaf nodes showing classification paths.</desc>
            ${SVG_STYLES}
            <style>
                .node { fill: #f0f9ff; stroke: #0284c7; stroke-width: 1.5; }
                .leaf { fill: #f0fdf4; stroke: #16a34a; stroke-width: 1.5; }
                .line { stroke: #6b7280; stroke-width: 1.5; }
                .decision { font-size: 9px; fill: #dc2626; }
            </style>
            
            <text x="175" y="20" text-anchor="middle" class="header">Decision Tree</text>
            
            <rect x="130" y="40" width="90" height="25" rx="3" class="node" /><text x="175" y="55" text-anchor="middle" class="label">Word Length > 5?</text>
            <rect x="60" y="100" width="70" height="25" rx="3" class="node" /><text x="95" y="115" text-anchor="middle" class="label">TF-IDF > 0.3?</text>
            <rect x="220" y="100" width="70" height="25" rx="3" class="node" /><text x="255" y="115" text-anchor="middle" class="label">POS = Noun?</text>
            
            <rect x="30" y="160" width="50" height="25" rx="3" class="leaf" /><text x="55" y="175" text-anchor="middle" class="label">Positive</text>
            <rect x="100" y="160" width="50" height="25" rx="3" class="leaf" /><text x="125" y="175" text-anchor="middle" class="label">Negative</text>
            <rect x="190" y="160" width="50" height="25" rx="3" class="leaf" /><text x="215" y="175" text-anchor="middle" class="label">Neutral</text>
            <rect x="260" y="160" width="50" height="25" rx="3" class="leaf" /><text x="285" y="175" text-anchor="middle" class="label">Positive</text>
            
            <line x1="150" y1="65" x2="115" y2="100" class="line" /><text x="125" y="85" text-anchor="middle" class="decision">yes</text>
            <line x1="200" y1="65" x2="235" y2="100" class="line" /><text x="225" y="85" text-anchor="middle" class="decision">no</text>
            <line x1="80" y1="125" x2="65" y2="160" class="line" /><text x="70" y="145" text-anchor="middle" class="decision">yes</text>
            <line x1="110" y1="125" x2="125" y2="160" class="line" /><text x="120" y="145" text-anchor="middle" class="decision">no</text>
            <line x1="240" y1="125" x2="225" y2="160" class="line" /><text x="230" y="145" text-anchor="middle" class="decision">yes</text>
            <line x1="270" y1="125" x2="285" y2="160" class="line" /><text x="280" y="145" text-anchor="middle" class="decision">no</text>
        </svg>
    `;
}

/**
 * Generates an SVG demonstrating MLM Gender Bias detection.
 * @returns {string} SVG markup.
 */
function generateMLMBiasDiagram() {
    return `
        <svg viewBox="0 0 450 220" class="w-full max-w-lg mx-auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="bias-title bias-desc">
            <title id="bias-title">MLM Gender Bias Detection</title>
            <desc id="bias-desc">Diagram showing how templates like '[MASK] works as a nurse' can be used to probe gender bias in a Masked Language Model by comparing probabilities for male and female pronouns.</desc>
            ${SVG_STYLES}
            <style>
                .template { fill: #f0f9ff; stroke: #0284c7; }
                .mask { fill: #fef3c7; stroke: #f59e0b; stroke-width: 1.5; }
                .prediction { fill: #f0fdf4; stroke: #16a34a; }
                .bias { fill: #fef2f2; stroke: #dc2626; }
            </style>
            
            <text x="225" y="25" text-anchor="middle" class="header">MLM Gender Bias Detection</text>
            
            <rect x="20" y="50" width="200" height="30" rx="5" class="template" />
            <text x="120" y="68" text-anchor="middle" class="label">"[MASK] arbeitet als Ingenieur."</text>
            
            <rect x="250" y="50" width="180" height="30" rx="5" class="prediction" />
            <text x="340" y="68" text-anchor="middle" class="label">P(Er) = 0.7, P(Sie) = 0.2</text>
            
            <rect x="20" y="100" width="200" height="30" rx="5" class="template" />
            <text x="120" y="118" text-anchor="middle" class="label">"[MASK] arbeitet als Krankenschwester."</text>
            
            <rect x="250" y="100" width="180" height="30" rx="5" class="prediction" />
            <text x="340" y="118" text-anchor="middle" class="label">P(Sie) = 0.8, P(Er) = 0.15</text>
            
            <rect x="20" y="150" width="410" height="40" rx="5" class="bias" />
            <text x="225" y="175" text-anchor="middle" class="label header">Bias-Maß: Δ = P(männlich|Beruf) - P(weiblich|Beruf)</text>
        </svg>
    `;
}

// --- Main Logic ---

const diagramGenerators = {
    'transformer': generateTransformerDiagram,
    'sentiment_pipeline': generateSentimentPipelineDiagram,
    'confusion_matrix': generateConfusionMatrixDiagram,
    'decision_tree': generateDecisionTreeDiagram,
    'mlm_bias': generateMLMBiasDiagram,
};

/**
 * Renders a diagram stub into the given container.
 * @param {HTMLElement} container - Container element to render into.
 * @param {string} kind - Type of diagram to render.
 * @returns {boolean} Success status.
 */
export function renderDiagramStub(container, kind) {
    if (!container || !kind) {
        console.warn('renderDiagramStub: Invalid container or kind');
        return false;
    }

    const generator = diagramGenerators[kind];
    if (!generator) {
        console.warn(`renderDiagramStub: Unknown diagram kind: ${kind}`);
        return false;
    }

    const svgContent = generator();
    container.innerHTML = `
        <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-600">📊 Diagram-Stub</span>
                <span class="text-xs text-gray-500 uppercase tracking-wide">${kind.replace(/_/g, ' ')}</span>
            </div>
            <div class="svg-container text-center">
                ${svgContent}
            </div>
            <p class="text-xs text-gray-500 mt-2 text-center">
                Vereinfachte Darstellung zur Veranschaulichung der Fragestellung
            </p>
        </div>
    `;

    console.log(`✅ SVG-Stub '${kind}' gerendert`);
    return true;
}

console.log('✅ DEBUGGING: diagrams.js geladen und initialisiert');

