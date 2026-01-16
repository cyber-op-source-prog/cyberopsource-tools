document.addEventListener('DOMContentLoaded', () => {
    // 1. Set the Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 2. Identify Elements
    const textInput = document.getElementById('textInput');
    const fileInput = document.getElementById('fileInput');
    const copyBtn = document.getElementById('copyBtn');
    const hashOutput = document.getElementById('hashOutput');

    // 3. Attach Event Listeners
    if (textInput) {
        textInput.addEventListener('input', generateTextHash);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', generateFileHash);
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copyHash);
    }
});

// --- CORE LOGIC ---

async function generateTextHash() {
    const input = document.getElementById('textInput').value;
    const output = document.getElementById('hashOutput');
    
    if (!input) {
        output.innerText = "...";
        return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hash = await computeHash(data);
    output.innerText = hash;
}

async function generateFileHash(event) {
    const file = event.target.files[0];
    const output = document.getElementById('hashOutput');
    
    if (!file) return;

    output.innerText = "Processing file...";

    const reader = new FileReader();
    reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const hash = await computeHash(arrayBuffer);
        output.innerText = hash;
    };
    reader.readAsArrayBuffer(file);
}

// Single reusable hashing function (Web Crypto API)
async function computeHash(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function copyHash() {
    const output = document.getElementById('hashOutput');
    const hash = output.innerText;
    
    if (hash === "..." || hash === "Processing file...") return;
    
    navigator.clipboard.writeText(hash).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalText = btn.innerText;
        
        btn.innerText = "Copied!";
        btn.style.background = "#22c55e"; // Success Green
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
        }, 2000);
    });
}