// Turns one scraped shrine entry (see scripts/browser/wiki-scrape.template.js) into what the app shows:
//   { blessing?: string, details: [{ label, value }] }
// Rows come out in display order, and "None"/empty fields are dropped.

/** scraped field -> label shown in the dialog, in display order. */
const FIELDS = [
  ['treasure', 'Treasure'],
  ['requirements', 'Requirements'],
  ['recommendations', 'Recommended'],
  ['enemies', 'Enemies'],
  ['shrineQuest', 'Shrine quest'],
  ['questgiver', 'Quest giver'],
  ['specialNotes', 'Notes'],
]

const tidy = (s) => s.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()
const isNothing = (s) => !s || /^none\.?$/i.test(s)

/**
 * A few wiki pages bold the whole line ("<b>Requirements: Gyro</b>"), which the scraper files under a key like
 * "requirements:Gyro" with its spaces squashed out. Recover those from the saved HTML instead.
 */
function fromOddKey(key, html) {
  const label = key.split(':')[0]
  const re = new RegExp(`<b>\\s*${label}\\s*:\\s*([\\s\\S]*?)<\\/b>`, 'i')
  const raw = html?.match(re)?.[1]
  return raw ? [label, tidy(raw.replace(/<[^>]+>/g, ' '))] : null
}

/**
 * Applies hand-written entries (scripts/shrine-details.manual.json) for shrines the wiki summary does not cover.
 * Fields they define win over scraped ones; a manual description is set on the marker as-is.
 */
export function applyManual(marker, manual) {
  if (!manual) return marker
  if (manual.description) marker.description = manual.description
  if (manual.blessing) marker.blessing = manual.blessing
  if (manual.details?.length) {
    const labels = new Set(manual.details.map((d) => d.label))
    marker.details = [...(marker.details ?? []).filter((d) => !labels.has(d.label)), ...manual.details]
  }
  return marker
}

/** "Opal, a Shield of the Mind's Eye and an Eightfold Blade" -> ["Opal", "Shield of the Mind's Eye", "Eightfold Blade"]. */
export function splitItems(value) {
  return value
    .split(/,|\band\b/)
    .map((s) => s.replace(/^\s*(a|an|the)\s+/i, '').trim())
    .filter(Boolean)
}

export function shrineDetails(entry) {
  if (!entry || entry.missing) return null
  const values = {}
  for (const [key, v] of Object.entries(entry)) {
    if (['html', 'fetchedAt', 'blessing', 'missing'].includes(key)) continue
    if (key.includes(':')) {
      const fixed = fromOddKey(key, entry.html)
      if (fixed) values[fixed[0]] = fixed[1]
    } else if (v && typeof v.text === 'string') values[key] = tidy(v.text)
  }
  const details = FIELDS.filter(([key]) => !isNothing(values[key])).map(([key, label]) => ({ label, value: values[key] }))
  const blessing = entry.blessing ? tidy(entry.blessing) : undefined
  return blessing || details.length ? { ...(blessing ? { blessing } : {}), details } : null
}
