// Run in the DevTools console on any www.zeldadungeon.net page. Checks whether "Map:<name>" pages exist for our
// markers (about 3 requests of 50 titles, sequential, stops on 403/429) and downloads map-probe.json.
(async () => {
  const ENTRIES = [["Hateno Ancient Tech Lab","tech-lab"],["Akkala Ancient Tech Lab","tech-lab"],["Rito Stable","stable"],["Tabantha Bridge Stable","stable"],["Gerudo Canyon Stable","stable"],["Snowfield Stable","stable"],["Gerudo Town","village"],["Goron City","village"],["Hateno Village","village"],["Kakariko Village","village"],["Recovered Memory #1 - Subdued Ceremony (Picture 1)","memory"],["Recovered Memory #3 - Resolve and Grief (Picture 2)","memory"],["Recovered Memory #5 - Zelda's Resentment (Picture 3)","memory"],["Recovered Memory #7 - Blades of the Yiga (Picture 4)","memory"],["Great Fairy Cotera","great-fairy"],["Great Fairy Kaysa","great-fairy"],["Great Fairy Mija","great-fairy"],["Great Fairy Tera","great-fairy"],["Stone Talus","stone-talus"],["Stone Talus (Junior)","stone-talus"],["Stone Talus (Senior)","stone-talus"],["Stone Talus (Luminous)","stone-talus"],["Hinox","hinox"],["Hinox (Youngest Kin)","hinox"],["Blue Hinox","hinox"],["Hinox (Middle Kin)","hinox"],["Lynel (Sword)","lynel"],["Lynel (Spear)","lynel"],["Lynel (Crusher)","lynel"],["Blue-Maned Lynel (Sword)","lynel"],["Molduga","molduga"],["Guardian Stalker","guardian"],["Decayed Guardian","guardian"],["Guardian Turret","guardian"],["Guardian Skywatcher","guardian"],["Goddess Statue","goddess-statue"],["Raft","raft"],["Cooking Pot","cooking-pot"],["Diamond","rare-gems"],["Ruby","rare-gems"],["Sapphire","rare-gems"],["Topaz","rare-gems"],["Opal","common-gems"],["Amber","common-gems"],["Luminous Stone","common-gems"],["Opal (glitched)","common-gems"],["Gold Rupee","big-rupees"],["Silver Rupee","big-rupees"],["Gold Rupee (dog treasure)","big-rupees"],["Silver Rupee (dog treasure)","big-rupees"],["Purple Rupee","small-rupees"],["Purple Rupee (glitched)","small-rupees"],["Red Rupee","small-rupees"],["Ancient Shaft","materials"],["Giant Ancient Core","materials"],["Star Fragment","materials"],["Star Fragment (dog treasure)","materials"],["Zora Helm","clothing"],["Salvager Headwear","clothing"],["Salvager Trousers","clothing"],["Salvager Vest","clothing"],["Hestu's Maracas","uniques"],["Gambling mini-game","uniques"],["Hylian Shield","uniques"],["Great Eagle Bow","uniques"],["Traveler's Sword","one-handed-weapons"],["Knight's Broadsword","one-handed-weapons"],["Boomerang","one-handed-weapons"],["Soldier's Broadsword","one-handed-weapons"],["Soldier's Claymore","two-handed-weapons"],["Knight's Claymore","two-handed-weapons"],["Great Thunderblade","two-handed-weapons"],["Silver Longsword","two-handed-weapons"],["Soldier's Spear","spears"],["Knight's Halberd","spears"],["Silverscale Spear","spears"],["Gerudo Spear","spears"],["Meteor Rod","rods"],["Blizzard Rod","rods"],["Thunderstorm Rod","rods"],["Ice Rod","rods"],["Soldier's Bow","bows"],["Golden Bow","bows"],["Falcon Bow","bows"],["Knight's Bow","bows"],["Bomb Arrow x5","arrows"],["Shock Arrow x5","arrows"],["Fire Arrow x10","arrows"],["Fire Arrow x5","arrows"],["Soldier's Shield","shields"],["Knight's Shield","shields"],["Knight's Shield (glitched)","shields"],["Royal Shield","shields"],["Follow the Sheikah Slate","main-quest"],["The Isolated Plateau","main-quest"],["Destroy Ganon","main-quest"],["Seek Out Impa","main-quest"],["The Stolen Heirloom","shrine-quest"],["Into the Vortex","shrine-quest"],["A Fragmented Monument","shrine-quest"],["Watch Out for the Flowers","shrine-quest"],["Misko, the Great Bandit","side-quest"],["The Priceless Maracas","side-quest"],["Wild Horses","side-quest"],["Flown the Coop","side-quest"],["Destroy Ganon","quest-objective"],["Obtain the Master Sword","quest-objective"],["Seek Out Impa","quest-objective"],["Divine Beast Vah Ruta","quest-objective"],["Seabed Inn","inn"],["Swallow's Roost","inn"],["Shuteye Inn","inn"],["Inn","inn"],["General Store","general-store"],["Goron Gusto Shop","general-store"],["Protein Palace","general-store"],["Lorn's Fruit Stand","general-store"],["Brazen Beak","armor-shop"],["Enchanted","armor-shop"],["Ripped and Shredded","armor-shop"],["Ventest Clothing Boutique","armor-shop"],["Kochi Dye Shop","dye-shop"],["Ore and More","jewelry-shop"],["Starlight Memories","jewelry-shop"]]; // [marker name, category]
  const DELAY_MS = 2500;
  const clean = (n) => n.replace(/\s+x\d+$/i, "").replace(/\s*\([^)]*\)$/, "").trim();
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
