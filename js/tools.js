const TOOLS = [
    {
      id: "base64-image",
      name: "Base64 to Image",
      desc: "Decode Base64 strings into images directly in your browser. No uploads, no network requests.",
      category: "Security",
      updated: "2026-01-15",
      href: "/tools/base64-to-image/"
    },
    {
      id: "jwt-decoder",
      name: "JWT Decoder",
      desc: "Decode JWT header and payload locally. Inspect claims instantly without sending tokens anywhere.",
      category: "Security",
      updated: "2026-01-15",
      href: "/tools/jwt-decoder/"
    },
    {
      id: "sha256",
      name: "SHA-256 Hash Generator",
      desc: "Generate SHA-256 hashes in-browser. Useful for verifying checksums and data integrity.",
      category: "Security",
      updated: "2026-01-15",
      href: "/tools/sha-256/"
    },
    {
      id: "json-formatter",
      name: "JSON Formatter",
      desc: "Prettify and validate JSON quickly. Great for logs, APIs, and debugging payloads.",
      category: "Formatting",
      updated: "2026-01-15",
      href: "/tools/json-formatter/"
    },
    {
      id: "json-minifier",
      name: "JSON Minifier",
      desc: "Minify JSON for compact payloads while staying fully client-side.",
      category: "Formatting",
      updated: "2026-01-15",
      href: "/tools/json-minifier/"
    },
    {
      id: "ip-subnet",
      name: "IP Subnet Calculator",
      desc: "Calculate CIDR ranges, network/broadcast addresses, and usable hosts for IPv4 subnets.",
      category: "Networking",
      updated: "2026-01-15",
      href: "/tools/ip-subnet-calculator/"
	},
	{
	  "id": "pii-scrubber",
	  "name": "PII Scrubber",
	  "desc": "Anonymize sensitive data in logs, emails, and documents using local AI. Automatically redact names, addresses, and credentials before sharing with third parties.",
	  "category": "Privacy & Compliance",
	  "updated": "2026-01-15",
	  "href": "/tools/pii-scrubber/"
	},
	{
	  id: "sql-architect",
	  name: "SQL Architect Pro",
	  desc: "Design relational database schemas locally. Features multi-table support, dialect-smart SQL generation (Postgres, MySQL, etc.), and PII/Best-practice linting.",
	  category: "Database",
	  updated: "2026-01-16",
	  href: "/tools/sql-architect/"
	}
  ];

  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const searchInput = document.getElementById("searchInput");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  let activeCat = "All";
  let query = "";

  function iconSVG(cat){
    // Simple inline icons per category (no external libs)
    if (cat === "Security") return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2 20 6v7c0 5-3.5 9-8 9s-8-4-8-9V6l8-4Z" stroke="currentColor" stroke-width="2"/>
        <path d="M9.5 12.5 11 14l3.5-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    if (cat === "Formatting") return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16M4 12h10M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 12h10M12 7v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="2" opacity=".35"/>
      </svg>`;
  }

  function matches(t){
    const q = query.trim().toLowerCase();
    const inCat = activeCat === "All" || t.category === activeCat;
    const inSearch = !q || (t.name + " " + t.desc + " " + t.category).toLowerCase().includes(q);
    return inCat && inSearch;
  }

  function render(){
    grid.innerHTML = "";
    const results = TOOLS.filter(matches);

    if (!results.length){
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    for (const t of results){
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="top">
          <div class="icon">${iconSVG(t.category)}</div>
          <div class="badge" title="This tool runs entirely in your browser.">
            <span></span> CLIENT-SIDE PROCESSING
          </div>
        </div>

        <h3 class="title">${escapeHTML(t.name)}</h3>
        <p class="desc">${escapeHTML(t.desc)}</p>

        <div class="meta">
          <div class="updated">Last Updated: ${escapeHTML(t.updated)}</div>
        </div>

        <div class="cta">
          <button class="btn" data-href="${t.href}">USE TOOL</button>
        </div>
      `;
      grid.appendChild(card);
    }

    // click handlers (buttons)
    grid.querySelectorAll(".btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const href = btn.getAttribute("data-href");
        // You can change to window.open(href, "_blank") if you prefer
        window.location.href = href;
      });
    });
  }

  // Simple XSS-safe escaping for dynamic content
  function escapeHTML(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCat = tab.dataset.cat;
      render();
    });
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    query = e.target.value || "";
    render();
  });

  // Init
  document.getElementById("year").textContent = new Date().getFullYear();
  render();