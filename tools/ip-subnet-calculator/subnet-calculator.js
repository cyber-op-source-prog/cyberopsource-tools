document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const cidrSelect = document.getElementById('cidrInput');
    const ipInput = document.getElementById('ipInput');

    // 1. Populate CIDR Dropdown
    for (let i = 32; i >= 0; i--) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `/${i}`;
        if (i === 24) opt.selected = true;
        cidrSelect.appendChild(opt);
    }

    const calculate = () => {
        const ip = ipInput.value.trim();
        const cidr = parseInt(cidrSelect.value);

        if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
            return;
        }

        // Convert IP to 32-bit integer
        const ipInt = ip.split('.').reduce((res, octet) => (res << 8) + parseInt(octet), 0) >>> 0;
        
        // Calculate Mask
        const maskInt = (cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr))) >>> 0;
        const netInt = (ipInt & maskInt) >>> 0;
        const broadcastInt = (netInt | (~maskInt)) >>> 0;

        const intToIp = (i) => [(i >>> 24) & 0xFF, (i >>> 16) & 0xFF, (i >>> 8) & 0xFF, i & 0xFF].join('.');

        // Fill Results
        document.getElementById('resNetwork').textContent = intToIp(netInt);
        document.getElementById('resBroadcast').textContent = intToIp(broadcastInt);
        document.getElementById('resMask').textContent = intToIp(maskInt);
        document.getElementById('resWildcard').textContent = intToIp(~maskInt);

        if (cidr <= 30) {
            document.getElementById('resRange').textContent = `${intToIp(netInt + 1)} - ${intToIp(broadcastInt - 1)}`;
            document.getElementById('resHosts').textContent = (Math.pow(2, 32 - cidr) - 2).toLocaleString();
        } else {
            document.getElementById('resRange').textContent = "N/A (Point-to-Point)";
            document.getElementById('resHosts').textContent = cidr === 31 ? "2" : "1";
        }
    };

    [ipInput, cidrSelect].forEach(el => el.addEventListener('input', calculate));
    calculate(); // Initial run

    // Egress Monitor
    const updateEgress = () => {
        const resources = performance.getEntriesByType("resource");
        const external = resources.filter(r => !r.name.includes(window.location.hostname));
        document.getElementById('egressCount').textContent = `${external.length} Authorized`;
    };
    setTimeout(updateEgress, 1000);
});