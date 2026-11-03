// Builds scripts/browser/probe-map-pages.js: a paste-into-the-console probe that checks which markers have a
// "Map:<name>" page on zeldadungeon.net (and what its summary looks like), so we know what is worth scraping.
//
//   node scripts/build-probe-map-pages.mjs [src/data/generated/markers.json]
import { readFileSync, writeFileSync } from 'node:fs'

const markersPath = process.argv[2] ?? 'src/data/generated/markers.json'
const { markers } = JSON.parse(readFileSync(markersPath, 'utf8'))
// Probe a small sample per category rather than every name: enough to tell whether a category has Map pages at all,
// in two or three requests. Skipped: Korok seeds, shrines (already scraped in full), and landmarks, Sheikah towers and
// settlements (a first probe found no Map page for any of the 500 names it reached).
const SKIP = new Set(['korok-seed', 'shrine', 'landmark', 'sheikah-tower', 'settlement'])
const PER_CATEGORY = 4
const byCategory = new Map()
for (const m of markers) {
  if (SKIP.has(m.category)) continue
  const names = byCategory.get(m.category) ?? new Map()
  if (names.size < PER_CATEGORY) names.set(m.name, m.category)
  byCategory.set(m.category, names)
}
const entries = [...byCategory.values()].flatMap((names) => [...names.entries()])

const script = `// Run in the DevTools console on any www.zeldadungeon.net page. Checks whether "Map:<name>" pages exist for our
// markers (about ${Math.ceil(entries.length / 50)} requests of 50 titles, sequential, stops on 403/429) and downloads map-probe.json.
(async () => {
  const ENTRIES = ${JSON.stringify(entries)}; // [marker name, category]
  const DELAY_MS = 2500;
  const clean = (n) => n.replace(/\\s+x\\d+$/i, "").replace(/\\s*\\([^)]*\\)$/, "").trim();
  const titles = [...new Set(ENTRIES.map(([n]) => clean(n)))];
  const found = {}; // title -> { description } | { missing: true }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let stopped = null;
  for (let i = 0; i < titles.length && !stopped; i += 50) {
    const batch = titles.slice(i, i + 50);
    const asked = batch.map((t) => "Map:" + t);
    let cont = {};
    const pages = {};
    const norm = new Map();
    const redir = new Map();
    do {
      const q = new URLSearchParams({ format: "json", action: "query", prop: "pageprops", ppprop: "description", redirects: "1", titles: asked.join("|"), ...cont });
      const res = await fetch("/wiki/api.php?" + q, { credentials: "same-origin", headers: { Accept: "application/json" } }).catch((e) => ({ error: e }));
      if (res.error || res.status === 403 || res.status === 429 || !(res.headers.get("content-type") || "").includes("json")) {
        stopped = "Stopped (" + (res.error ? res.error.message : "HTTP " + res.status) + "). Nothing was hammered; reload and paste again later.";
        break;
      }
      const json = await res.json();
      const qy = json.query || {};
      for (const pg of Object.values(qy.pages || {})) pages[pg.title] = { ...(pages[pg.title] || {}), ...pg, pageprops: { ...((pages[pg.title] || {}).pageprops || {}), ...(pg.pageprops || {}) } };
      for (const n of qy.normalized || []) norm.set(n.from, n.to);
      for (const r of qy.redirects || []) redir.set(r.from, r.to);
      cont = json.continue || null;
      if (cont) await sleep(DELAY_MS);
    } while (cont);
    if (stopped) break;
    for (const t of asked) {
      const title = redir.get(norm.get(t) || t) || norm.get(t) || t;
      const pg = pages[title];
      found[t.slice(4)] = !pg || "missing" in pg || "invalid" in pg ? { missing: true } : { description: (pg.pageprops && pg.pageprops.description) || null };
    }
    console.log("[%d/%d] batch done", i / 50 + 1, Math.ceil(titles.length / 50));
    await sleep(DELAY_MS + Math.random() * 1000);
  }
  if (stopped) console.warn(stopped);

  // Per category: how many marker names have a Map page, how many of those have a summary, and a few samples.
  const cats = {};
  for (const [name, cat] of ENTRIES) {
    const f = found[clean(name)];
    if (!f) continue;
    const c = (cats[cat] ||= { names: 0, mapPage: 0, withSummary: 0, samples: [] });
    c.names++;
    if (!f.missing) {
      c.mapPage++;
      if (f.description) {
        c.withSummary++;
        if (c.samples.length < 3) c.samples.push({ name, description: f.description.slice(0, 300) });
      }
    }
  }
  console.table(Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, { names: v.names, mapPage: v.mapPage, withSummary: v.withSummary }])));
  const out = { categories: cats, titles: found, fetchedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
  Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "map-probe.json" }).click();
  window.__probe = out;
})();
`
writeFileSync('scripts/browser/probe-map-pages.js', script)
console.log(`probe-map-pages.js: ${entries.length} names, ${(script.length / 1024).toFixed(0)} KB`)
