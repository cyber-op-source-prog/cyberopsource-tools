const updateEgress = () => {
    // Counts how many external resources (scripts, images) are loaded
    const resources = performance.getEntriesByType("resource");
    const external = resources.filter(r => !r.name.includes(window.location.hostname));
    
    const egressEl = document.getElementById('egressCount');
    if (egressEl) {
        // We say "Authorized" because your CSP allows GoDaddy/Logo
        egressEl.textContent = `${external.length} Authorized Connections`;
    }
};

// Run it after a short delay to catch the GoDaddy injections
setTimeout(updateEgress, 1000);