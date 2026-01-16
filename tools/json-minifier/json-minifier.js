document.addEventListener('DOMContentLoaded', () => {
    // 1. Footer Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 2. Egress Monitoring Gadget
    const updateEgress = () => {
        const resources = performance.getEntriesByType("resource");
        const external = resources.filter(r => !r.name.includes(window.location.hostname));
        const egressEl = document.getElementById('egressCount');
        if (egressEl) egressEl.textContent = `${external.length} Authorized`;
    };
    setTimeout(updateEgress, 1000);

    // 3. UI Elements
    const input = document.getElementById('jsonInput');
    const output = document.getElementById('jsonOutput');
    const errorBanner = document.getElementById('errorBanner');
    const minifyBtn = document.getElementById('minifyBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    // 4. Minification Logic
    const minifyJSON = () => {
        errorBanner.style.display = 'none';
        const rawValue = input.value.trim();
        
        if (!rawValue) {
            output.textContent = "";
            return;
        }

        try {
            // Parse to validate, then stringify with 0 spaces to minify
            const parsed = JSON.parse(rawValue);
            output.textContent = JSON.stringify(parsed);
            output.style.color = "#7dd3fc";
        } catch (e) {
            errorBanner.textContent = `Syntax Error: ${e.message}`;
            errorBanner.style.display = 'block';
            output.textContent = "Fix the errors in the input box to minify...";
            output.style.color = "var(--error)";
        }
    };

    // 5. Event Listeners
    minifyBtn.addEventListener('click', minifyJSON);
    
    // Auto-minify on input for reactive feel
    input.addEventListener('input', minifyJSON);

    clearBtn.addEventListener('click', () => {
        input.value = "";
        output.textContent = "";
        errorBanner.style.display = 'none';
    });

    copyBtn.addEventListener('click', () => {
        const text = output.textContent;
        if (!text || text.includes("Fix the errors")) return;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied!";
            copyBtn.style.background = "#22c55e";
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.background = "";
            }, 2000);
        });
    });
});