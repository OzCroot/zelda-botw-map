// Run this in the browser DevTools console while on any www.zeldadungeon.net page (so requests are same-origin and
// carry your already-solved Cloudflare session). It downloads one JSON file with:
//   Phase 1  shrines: each shrine's wiki "summary" (blessing, requirements, recommendations, shrine quest, treasure,
//            enemies), one request per shrine.
//   Phase 2  everything else: each page's short description (pageprops), in batches of 50 titles per request.
//
// - Requests are sequential with a pause between them.
// - It stops immediately if the site answers 403/429 or shows a challenge page; it never retries through one.
// - Progress is kept in localStorage, so if it stops you can paste it again and it carries on where it left off.
// - Please check the site's terms before using the data anywhere public.
(async () => {
  const SHRINES = /*SHRINES*/[];
  const NAMES = /*NAMES*/[];
  const QUESTS = /*QUESTS*/[]; // quest marker names; their "Map:<name>" pages hold requirements, quest giver and notes
  const DELAY_MS = 2500; // pause between requests (plus up to 1s of jitter)
  const CACHE_KEY = "zd-wiki-v1";

  // <helpers>
  // Turns the shrine summary HTML into { blessing, requirements: { text, links }, ... }. The HTML is a single <p> of
  // "<b>Label:</b> value" runs separated by <br>, led by an italic blessing name.
  const parseSummary = (html, withIntro = false) => {
    const p = new DOMParser().parseFromString(html, "text/html").querySelector("p");
    if (!p) return null;
    const out = {};
    const blessing = p.querySelector(":scope > i");
    if (blessing) out.blessing = blessing.textContent.trim();

    const camel = (label) =>
      label.replace(/:\s*$/, "").trim().split(/\s+/).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase())).join("");
    const linkOf = (el) => ({
      name: el.textContent.trim(),
      page: el.dataset.target || decodeURIComponent((el.getAttribute("href") || "").replace(/^\/wiki\//, "")).replace(/_/g, " "),
    });

    // Quest pages can open with plain text before the first label ("Given by the Old Man after…"); keep it as "intro".
    let key = withIntro ? "intro" : null;
    let text = "";
    let links = [];
    const flush = () => {
      if (!key || (key === "intro" && !text.trim())) { key = null; text = ""; links = []; return; }
      out[key] = { text: text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"), links };
      key = null;
      text = "";
      links = [];
    };
    for (const node of p.childNodes) {
      if (node.nodeType === 1 && node.tagName === "B") {
        flush();
        key = camel(node.textContent);
      } else if (key) {
        if (node.nodeType === 1 && node.tagName === "BR") text += "\n";
        else {
          text += node.textContent;
          if (node.nodeType === 1) {
            const found = node.matches("a, .internal-link") ? [node] : [...node.querySelectorAll("a, .internal-link")];
            links.push(...found.map(linkOf));
          }
        }
      }
    }
    // A numbered/bulleted list straight after the paragraph (a quest chain) belongs to the last label.
    // With withIntro, further paragraphs (a main quest's objective text) are kept the same way.
    const keep = (el) => /^(OL|UL)$/.test(el.tagName) || (withIntro && el.tagName === "P");
    for (let el = p.nextElementSibling; key && el && keep(el); el = el.nextElementSibling) {
      for (const part of el.tagName === "P" ? [el] : el.querySelectorAll("li")) {
        text += "\n" + part.textContent;
        links.push(...[...part.querySelectorAll("a, .internal-link")].map(linkOf));
      }
    }
    flush();
    return out;
  };

  // Marker names are not always wiki titles: "Fire Arrow x10", "Stone Talus (Junior)", "Gold Rupee (dog treasure)".
  const cleanTitle = (name) => name.replace(/\s+x\d+$/i, "").replace(/\s*\([^)]*\)$/, "").trim();
  // Titles to look up for a marker name: the name itself first, then the cleaned-up form if that differs.
  const candidates = (name) => [...new Set([name, cleanTitle(name)])].filter(Boolean);

  // Reads a batched pageprops response into { [requestedTitle]: { description } | { missing: true } }, following the
  // API's title normalisation and redirects so each answer is filed under the title that was asked for.
  const readDescriptions = (json, titles) => {
    const q = (json && json.query) || {};
    const normalized = new Map((q.normalized || []).map((n) => [n.from, n.to]));
    const redirects = new Map((q.redirects || []).map((r) => [r.from, r.to]));
    const byTitle = new Map(Object.values(q.pages || {}).map((pg) => [pg.title, pg]));
    const out = {};
    for (const t of titles) {
      let title = normalized.get(t) || t;
      title = redirects.get(title) || title;
      const pg = byTitle.get(title);
      if (!pg || "missing" in pg || "invalid" in pg) out[t] = { missing: true };
      else out[t] = { description: (pg.pageprops && pg.pageprops.description) || null, ...(title !== t ? { page: title } : {}) };
    }
    return out;
  };
  // </helpers>

  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  cache.shrines ||= {};
  cache.titles ||= {};
  cache.quests ||= {};
  // Reuse shrine summaries saved by the earlier shrines-only version of this script, so they are not fetched again.
  // (Entries that had no summary are left out so they get another try.)
  const earlier = JSON.parse(localStorage.getItem("zd-shrine-summaries-v1") || "{}");
  for (const [name, entry] of Object.entries(earlier)) if (!entry.missing && !cache.shrines[name]) cache.shrines[name] = entry;
  const save = () => localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let stopped = null;

  // Returns parsed JSON, or null after recording why we stopped (blocked, challenged, offline).
  const get = async (url) => {
    try {
      const res = await fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (res.status === 403 || res.status === 429 || !(res.headers.get("content-type") || "").includes("json")) {
        stopped = "Blocked or challenged (HTTP " + res.status + "). Stopping so we do not hammer the site. Reload the page, make sure you can browse normally, then paste the script again to resume.";
        return null;
      }
      return await res.json();
    } catch (e) {
      stopped = "Network error: " + e.message;
      return null;
    }
  };
  const pause = () => sleep(DELAY_MS + Math.random() * 1000);

  // ---- Phase 1: shrines ------------------------------------------------------------------------------------------
  const summaryUrl = (name) => {
    // Our data tags DLC shrines "(DLC)"; wiki page titles do not.
    const page = name.replace(/ \(DLC\)$/, "");
    const wikitext =
      "{{#vardefine:gsize|300}}{{#vardefine:galign|left}}{{#vardefine:gpad|0}}{{#vardefine:square|false}}" +
      "{{#lst:" + page + "|summary}}";
    const q = new URLSearchParams({ format: "json", action: "parse", prop: "text", contentmodel: "wikitext", text: wikitext });
    return "/wiki/api.php?" + q;
  };
  const shrinesTodo = SHRINES.filter((n) => !cache.shrines[n]);
  console.log("Phase 1: %d shrines, %d to fetch (~%d min)", SHRINES.length, shrinesTodo.length, Math.ceil((shrinesTodo.length * (DELAY_MS + 500)) / 60000));
  for (const [i, name] of shrinesTodo.entries()) {
    const json = await get(summaryUrl(name));
    if (!json) break;
    const html = json.parse && json.parse.text && json.parse.text["*"];
    const parsed = html ? parseSummary(html) : null;
    cache.shrines[name] = parsed && Object.keys(parsed).length
      ? { ...parsed, html, fetchedAt: new Date().toISOString() }
      : { missing: true, html: html || null, error: json.error && json.error.info, fetchedAt: new Date().toISOString() };
    save();
    console.log("[%d/%d] %s%s", i + 1, shrinesTodo.length, name, cache.shrines[name].missing ? "  (no summary found)" : "");
    await pause();
  }

  // ---- Phase 3 (runs after phase 2, see below) is defined here: quests' "Map:" pages ------------------------------------
  const questsTodo = () => QUESTS.filter((n) => !cache.quests[n]);

  // ---- Phase 2: descriptions for everything else, 50 titles per request ----------------------------------------
  if (!stopped) {
    const titles = [...new Set(NAMES.flatMap(candidates))].filter((t) => !cache.titles[t]);
    const batches = [];
    for (let i = 0; i < titles.length; i += 50) batches.push(titles.slice(i, i + 50));
    console.log("Phase 2: %d titles in %d requests", titles.length, batches.length);
    for (const [i, batch] of batches.entries()) {
      // pageprops can be split across continuation requests; gather the pieces before reading the result.
      const merged = { query: { pages: {}, normalized: [], redirects: [] } };
      let cont = {};
      do {
        const q = new URLSearchParams({ format: "json", action: "query", prop: "pageprops", ppprop: "description", redirects: "1", titles: batch.join("|"), ...cont });
        const json = await get("/wiki/api.php?" + q);
        if (!json) break;
        for (const [id, pg] of Object.entries((json.query && json.query.pages) || {}))
          merged.query.pages[id] = { ...merged.query.pages[id], ...pg, pageprops: { ...(merged.query.pages[id] || {}).pageprops, ...pg.pageprops } };
        merged.query.normalized.push(...((json.query && json.query.normalized) || []));
        merged.query.redirects.push(...((json.query && json.query.redirects) || []));
        cont = json.continue || null;
        if (cont) await pause();
      } while (cont);
      if (stopped) break;
      Object.assign(cache.titles, readDescriptions(merged, batch));
      save();
      console.log("[%d/%d] %d titles", i + 1, batches.length, batch.length);
      await pause();
    }
  }

  // ---- Phase 3: quest details (requirements, quest giver, notes) from each quest's "Map:" page ----------------------
  if (!stopped) {
    const todo = questsTodo();
    console.log("Phase 3: %d quests, %d to fetch (~%d min)", QUESTS.length, todo.length, Math.ceil((todo.length * (DELAY_MS + 500)) / 60000));
    for (const [i, name] of todo.entries()) {
      const q = new URLSearchParams({ format: "json", action: "parse", prop: "text", page: "Map:" + name, redirects: "1" });
      const json = await get("/wiki/api.php?" + q);
      if (!json) break;
      const html = json.parse && json.parse.text && json.parse.text["*"];
      const parsed = html ? parseSummary(html, true) : null;
      cache.quests[name] = parsed && Object.keys(parsed).length
        ? { ...parsed, fetchedAt: new Date().toISOString() }
        : { missing: true, error: json.error && json.error.info, fetchedAt: new Date().toISOString() };
      save();
      console.log("[%d/%d] %s%s", i + 1, todo.length, name, cache.quests[name].missing ? "  (no Map page)" : "");
      await pause();
    }
  }

  if (stopped) console.warn(stopped);
  console.log("Quests: %d of %d with details.", QUESTS.filter((n) => cache.quests[n] && !cache.quests[n].missing).length, QUESTS.length);
  const shrinesOk = SHRINES.filter((n) => cache.shrines[n] && !cache.shrines[n].missing).length;
  const found = Object.values(cache.titles).filter((t) => t.description).length;
  console.log("Shrines: %d of %d with a summary. Titles: %d looked up, %d with a description.", shrinesOk, SHRINES.length, Object.keys(cache.titles).length, found);

  // Marker name -> the titles to try for it, so the importer does not have to repeat the clean-up rules.
  const names = Object.fromEntries(NAMES.map((n) => [n, candidates(n)]));
  const out = { shrines: cache.shrines, titles: cache.titles, names, quests: cache.quests, fetchedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "zeldadungeon-data.json" });
  a.click();
  window.__zd = out;
})();
