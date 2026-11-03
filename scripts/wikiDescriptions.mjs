// Picks the wiki description to show for a marker, from the "titles"/"names" maps in zeldadungeon-data.json
// (see scripts/browser/wiki-scrape.template.js).

/**
 * True for one-line stubs that only restate the name and category ("Rospro Pass is a location in Breath of the Wild and
 * Tears of the Kingdom.", "Playtime with Cottla is a Side Quest from Breath of the Wild."). The dialog already shows
 * both, so these are not worth storing.
 */
export function isBoilerplate(text) {
  // Disambiguation and redirect notes scraped from the top of a page are not descriptions either.
  if (/redirects here|may refer to|^this article is about/i.test(text)) return true
  return /^.{1,80}? (is|are) (a|an) (location|area|side quest|shrine quest|main quest|sheikah tower)( in| from)? (the )?breath of the wild( and tears of the kingdom)?\.$/i.test(
    text.trim(),
  )
}

/** The first usable description among the page titles a marker name resolves to, or undefined. */
export function pickDescription(titles, candidates) {
  for (const title of candidates ?? []) {
    const text = titles[title]?.description?.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    if (text && !isBoilerplate(text)) return text
  }
  return undefined
}
