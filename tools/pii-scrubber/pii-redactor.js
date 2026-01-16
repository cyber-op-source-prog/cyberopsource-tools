function collectMatches(text, regex) {
  // Ensure global flag so matchAll works properly
  const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
  const re = new RegExp(regex.source, flags);

  const out = [];
  for (const m of text.matchAll(re)) {
    // m[0] is the full match
    out.push(m[0]);
  }
  return out;
}

function uniqueLimited(arr, limit = 10) {
  const seen = new Set();
  const uniq = [];
  for (const v of arr) {
    const key = String(v);
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(key);
      if (uniq.length >= limit) break;
    }
  }
  return uniq;
}

function renderAudit(audit, showValues) {
  const container = document.getElementById("auditLog");
  if (!container) return;

  const rows = Object.entries(audit).map(([key, info]) => {
    const count = info.count || 0;
    const sample = info.sample || [];
    const label = info.label || key;

    return `
      <div style="padding:10px 12px; border:1px solid var(--border); border-radius:10px; background: rgba(255,255,255,0.02); margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div style="font-weight:700; color: var(--text-main);">${label}</div>
          <div style="color: var(--accent); font-weight:700;">${count}</div>
        </div>
        ${
          showValues && sample.length
            ? `<div style="margin-top:8px; color: var(--text-dim); font-size:0.85rem; white-space:pre-wrap;">
                 <span style="color: var(--text-main); font-weight:700;">Sample:</span> ${sample.join(", ")}
               </div>`
            : `<div style="margin-top:8px; color: var(--text-dim); font-size:0.85rem;">
                 ${sample.length ? `Sample hidden (toggle “Show values”)` : `No matches`}
               </div>`
        }
      </div>
    `;
  });

  container.innerHTML = rows.join("") || `<div style="color:var(--text-dim);">No redactions detected.</div>`;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pull likely person-name tokens from headers + signature-ish lines.
function extractNameCandidates(text) {
  const candidates = new Set();

  // 1) From header display name: From: "Jonathan 'Dough' Smith" <...>
  const fromMatch = text.match(/^\s*From:\s*"([^"]+)"\s*<[^>]+>/mi);
  if (fromMatch) {
    const cleaned = fromMatch[1]
      .replace(/['’"].*?['’"]/g, " ")       // remove nicknames in quotes
      .replace(/[^A-Za-z\s-]/g, " ")        // keep letters, spaces, hyphens
      .replace(/\s+/g, " ")
      .trim();

    // Add full name + parts
    if (cleaned) {
      candidates.add(cleaned);
      cleaned.split(" ").forEach(p => {
        if (p.length >= 2) candidates.add(p);
      });
    }
  }

  // 2) Signature block: common sign-offs + next line name-ish
  // Best,\nJon
  const sigMatch = text.match(/\n\s*(best|regards|thanks|sincerely|cheers)\s*,\s*\n\s*([^\n\r]{2,40})/i);
  if (sigMatch) {
    const sigLine = sigMatch[2]
      .replace(/[^A-Za-z\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (sigLine) {
      candidates.add(sigLine);
      sigLine.split(" ").forEach(p => {
        if (p.length >= 2) candidates.add(p);
      });
    }
  }

  // Filter out junk words you don’t want to redact as “names”
  const stop = new Set([
    "hi", "team", "hello", "support", "thanks", "best", "regards", "dear",
    "friday", "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december"
  ]);

  return [...candidates].filter(w => {
    const lw = w.toLowerCase();
    if (stop.has(lw)) return false;
    // avoid redacting single common initials, etc.
    if (w.length < 2) return false;
    // avoid redacting huge phrases
    if (w.split(" ").length > 4) return false;
    return true;
  });
}

function redactCandidatesEverywhere(text, candidates) {
  // Redact longer phrases first (e.g., "Jonathan Smith" before "Jonathan")
  candidates.sort((a,b) => b.length - a.length);

  for (const c of candidates) {
    const re = new RegExp(`\\b${escapeRegExp(c)}\\b`, "gi");
    text = text.replace(re, "[NAME_REDACTED]");
  }
  return text;
}

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const slider = document.getElementById('sensitivitySlider');
    const label = document.getElementById('sensitivityLabel');
    const rawInput = document.getElementById('rawInput');
    const cleanOutput = document.getElementById('cleanOutput');
    const runBtn = document.getElementById('runScrub');

    // 1. Slider Levels Definition
    const levels = {
        1: { name: "LEVEL 1: BASIC", desc: "Redacts Emails, IPs, and Phone Numbers." },
        2: { name: "LEVEL 2: FINANCIAL", desc: "Adds Credit Cards, SSNs, and IBANs." },
        3: { name: "LEVEL 3: PARANOID", desc: "Adds Dates, MAC addresses, and UUIDs." }
    };

    slider.addEventListener('input', () => {
        label.innerText = levels[slider.value].name;
    });

    // 2. The Pattern Library
    const patterns = {
        // Level 1
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        phone: /(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
        
        // Level 2
        creditCard: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        crypto: /\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g,
        
        // Level 3
		date: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,
		mac: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
		uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,

		fromDisplayName: /(From:\s*)"(?:[^"\\]|\\.)*"\s*(<)/gi,                 // From: "Name" <
		myNameIs: /\b(my name is|i am|i’m|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g, // My name is Jonathan Smith
		signatureLine: /(\n\s*(?:best|regards|thanks|sincerely|cheers)\s*,\s*\n\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/gi,

		streetAddress: /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Terrace|Ter|Court|Ct|Way|Place|Pl)\b\.?/gi,
		cityStateZip: /\b[A-Za-z .'-]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/g
    };

    // 3. The Scrubbing Engine
	runBtn.addEventListener('click', () => {
	  let text = rawInput.value;
	  const currentLevel = parseInt(slider.value);
	  if (!text) return;

	  const originalText = text; // keep for auditing matches
	  const showValues = document.getElementById("showAuditValues")?.checked === true;

	  // Build audit (counts + small sample)
	  const audit = {
	    email: { label: "Emails", count: 0, sample: [] },
	    ip: { label: "IP Addresses", count: 0, sample: [] },
	    phone: { label: "Phone Numbers", count: 0, sample: [] },
	    creditCard: { label: "Credit Cards", count: 0, sample: [] },
	    ssn: { label: "SSNs", count: 0, sample: [] },
	    crypto: { label: "Crypto Wallets", count: 0, sample: [] },
	    date: { label: "Dates", count: 0, sample: [] },
	    mac: { label: "MAC Addresses", count: 0, sample: [] },
	    uuid: { label: "UUIDs", count: 0, sample: [] },
	    names: { label: "Names (learned)", count: 0, sample: [] },
	    address: { label: "Street Addresses", count: 0, sample: [] },
	    location: { label: "City/State/ZIP", count: 0, sample: [] },
	  };

	  // Level 1 auditing
	  let m;
	  m = collectMatches(originalText, patterns.email); audit.email.count = m.length; audit.email.sample = uniqueLimited(m);
	  m = collectMatches(originalText, patterns.ip);    audit.ip.count = m.length;    audit.ip.sample = uniqueLimited(m);
	  m = collectMatches(originalText, patterns.phone); audit.phone.count = m.length; audit.phone.sample = uniqueLimited(m);

	  // Level 2 auditing
	  if (currentLevel >= 2) {
	    m = collectMatches(originalText, patterns.creditCard); audit.creditCard.count = m.length; audit.creditCard.sample = uniqueLimited(m);
	    m = collectMatches(originalText, patterns.ssn);        audit.ssn.count = m.length;        audit.ssn.sample = uniqueLimited(m);
	    m = collectMatches(originalText, patterns.crypto);     audit.crypto.count = m.length;     audit.crypto.sample = uniqueLimited(m);
	  }

	  // Level 3 auditing
	  let nameCandidates = [];
	  if (currentLevel >= 3) {
	    m = collectMatches(originalText, patterns.date); audit.date.count = m.length; audit.date.sample = uniqueLimited(m);
	    m = collectMatches(originalText, patterns.mac);  audit.mac.count = m.length;  audit.mac.sample = uniqueLimited(m);
	    m = collectMatches(originalText, patterns.uuid); audit.uuid.count = m.length; audit.uuid.sample = uniqueLimited(m);

	    m = collectMatches(originalText, patterns.streetAddress); audit.address.count = m.length; audit.address.sample = uniqueLimited(m);
	    m = collectMatches(originalText, patterns.cityStateZip);  audit.location.count = m.length; audit.location.sample = uniqueLimited(m);

	    // Learn names from the ORIGINAL (important)
	    nameCandidates = extractNameCandidates(originalText);
	    audit.names.count = nameCandidates.length;
	    audit.names.sample = uniqueLimited(nameCandidates);
	  }

	  cleanOutput.innerHTML = `<span style="color: var(--accent)">Scrubbing at ${levels[currentLevel].name}...</span>`;

	  // ---- Now do your existing replacement flow (same as you have) ----
	  text = text.replace(patterns.email, "[EMAIL_REDACTED]");
	  text = text.replace(patterns.ip, "[IP_REDACTED]");
	  text = text.replace(patterns.phone, "[PHONE_REDACTED]");

	  if (currentLevel >= 2) {
	    text = text.replace(patterns.creditCard, "[CARD_REDACTED]");
	    text = text.replace(patterns.ssn, "[SSN_REDACTED]");
	    text = text.replace(patterns.crypto, "[WALLET_REDACTED]");
	  }

	  if (currentLevel >= 3) {
	    text = text.replace(patterns.date, "[DATE_REDACTED]");
	    text = text.replace(patterns.mac, "[MAC_REDACTED]");
	    text = text.replace(patterns.uuid, "[ID_REDACTED]");

	    text = text.replace(patterns.fromDisplayName, '$1"[NAME_REDACTED]" $2');
	    text = text.replace(patterns.myNameIs, (m, p1) => `${p1} [NAME_REDACTED]`);
	    text = text.replace(patterns.signatureLine, '$1[NAME_REDACTED]');
	    text = text.replace(patterns.streetAddress, "[ADDRESS_REDACTED]");
	    text = text.replace(patterns.cityStateZip, "[LOCATION_REDACTED]");

	    // Use learned names
	    text = redactCandidatesEverywhere(text, nameCandidates);
	  }

	  // Render output
	  const highlighted = text.replace(/\[.*?\]/g, match => `<span class="highlight-redacted">${match}</span>`);
	  cleanOutput.innerHTML = highlighted;

	  // Render audit (values hidden unless toggle checked)
	  if (!showValues) {
	    // wipe samples so nothing sensitive appears even accidentally
	    for (const k of Object.keys(audit)) audit[k].sample = audit[k].sample?.length ? audit[k].sample : [];
	  }
	  renderAudit(audit, showValues);
	});


    // Copy to Clipboard
    document.getElementById('copyOutput').addEventListener('click', () => {
        const textToCopy = cleanOutput.innerText;
        navigator.clipboard.writeText(textToCopy);
    });
});