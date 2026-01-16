document.addEventListener('DOMContentLoaded', () => {
    // Standard Footer Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const input = document.getElementById('jsonInput');
    const output = document.getElementById('jsonOutput');
    const errorBanner = document.getElementById('errorBanner');
    
    // Buttons
    const prettifyBtn = document.getElementById('prettifyBtn');
    const minifyBtn = document.getElementById('minifyBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    const processJSON = (spaces = 2) => {
        errorBanner.style.display = 'none';
        const rawValue = input.value.trim();
        
        if (!rawValue) {
            output.textContent = "";
            return;
        }

        try {
            const parsed = JSON.parse(rawValue);
            output.textContent = JSON.stringify(parsed, null, spaces);
            output.style.color = "#7dd3fc"; // Blue for valid
        } catch (e) {
            errorBanner.textContent = `Invalid JSON: ${e.message}`;
            errorBanner.style.display = 'block';
            output.textContent = "Fix error to see formatted output...";
            output.style.color = "var(--error)";
        }
    };

    prettifyBtn.addEventListener('click', () => processJSON(2));
    minifyBtn.addEventListener('click', () => processJSON(0));
    
    clearBtn.addEventListener('click', () => {
        input.value = "";
        output.textContent = "";
        errorBanner.style.display = 'none';
    });

    copyBtn.addEventListener('click', () => {
        const text = output.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied!";
            setTimeout(() => copyBtn.innerText = originalText, 2000);
        });
    });

    // Also auto-process on input for a snappy feel
    input.addEventListener('input', () => processJSON(2));
});