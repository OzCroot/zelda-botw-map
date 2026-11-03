import { describe, expect, it } from 'vitest'
import { isBoilerplate, pickDescription } from './wikiDescriptions.mjs'

describe('isBoilerplate', () => {
  it('flags stubs that only restate the name and category', () => {
    expect(isBoilerplate('Rospro Pass is a location in Breath of the Wild and Tears of the Kingdom.')).toBe(true)
    expect(isBoilerplate('Playtime with Cottla is a Side Quest from Breath of the Wild.')).toBe(true)
  })
  it('flags redirect and disambiguation notes', () => {
    expect(isBoilerplate('" Maracas " redirects here. For other uses, see Maracas (Disambiguation).')).toBe(true)
    expect(isBoilerplate('This article is about the Tower itself. For the Chapter 4 scenario, see …')).toBe(true)
    expect(isBoilerplate('Inn may refer to: Kakariko Inn, a location from A Link to the Past')).toBe(true)
  })
  it('keeps descriptions that say something', () => {
    expect(isBoilerplate('The Akkala Span is a large bridge in Breath of the Wild, which joins Akkala to Lanayru.')).toBe(false)
  })
})

describe('pickDescription', () => {
  const titles = {
    Amber: { description: 'Amber is a material found in Breath of the Wild.' },
    'Amber (glitched)': { missing: true },
    Stub: { description: 'Stub is a location in Breath of the Wild.' },
  }
  it('takes the first usable title', () => {
    expect(pickDescription(titles, ['Amber (glitched)', 'Amber'])).toBe('Amber is a material found in Breath of the Wild.')
  })
  it('decodes &amp;', () => {
    expect(pickDescription({ K: { description: 'A shop in BotW &amp; TotK, selling dye.' } }, ['K'])).toBe(
      'A shop in BotW & TotK, selling dye.',
    )
  })
  it('returns undefined for stubs, missing pages and unknown names', () => {
    expect(pickDescription(titles, ['Stub'])).toBeUndefined()
    expect(pickDescription(titles, undefined)).toBeUndefined()
  })
})
