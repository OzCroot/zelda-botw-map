/**
 * Clothing is hunted a set at a time (all the Tingle pieces, all the Phantom armor…), so the filters split it by
 * set rather than by region. The data has no set information, so it is derived from the item names; anything that
 * is not part of a set falls under "Other".
 */
export const OTHER_SET = 'Other'

const SETS: { name: string; test: RegExp }[] = [
  // Phantom Ganon before Phantom: "Phantom Ganon Armor" must not match the plain Phantom set.
  { name: 'Phantom Ganon', test: /^Phantom Ganon /i },
  { name: 'Phantom', test: /^Phantom /i },
  { name: 'Tingle', test: /^Tingle's /i },
  { name: 'Royal Guard', test: /^Royal Guard /i },
  { name: 'Salvager', test: /^Salvager /i },
  { name: 'Of the Wild', test: / of the Wild$/i },
  // Sets whose pieces are shrine treasures (see scripts/add-shrine-details.mjs).
  { name: 'Barbarian', test: /^Barbarian /i },
  { name: 'Climbing', test: /^(Climbing |Climber's )/i },
  { name: 'Rubber', test: /^Rubber /i },
]

/** Display order for the set chips; "Other" is always last. */
export const CLOTHING_SET_ORDER = [...SETS.map((s) => s.name), OTHER_SET]

export function clothingSetOf(name: string): string {
  return SETS.find((s) => s.test.test(name))?.name ?? OTHER_SET
}
