import type { Category } from '../types/marker'

type C = Omit<Category, 'icon'> & { icon?: string }
const c = (
  id: string, label: string, group: Category['group'], glyph: string, color: string,
  checkable: boolean, defaultOn = true, icon?: string,
): C => ({ id, label, group, glyph, color, checkable, defaultOn, icon: icon ?? id })

export const CATEGORIES: Category[] = [
  // Travel
  c('shrine', 'Shrines', 'Travel', '⛩', '#38bdf8', true, true, 'travel/shrine'),
  c('shrine-dlc', 'Shrines (DLC)', 'Travel', '⛩', '#38bdf8', true, true, 'travel/shrine-dlc'),
  c('sheikah-tower', 'Sheikah Towers', 'Travel', '🗼', '#fbbf24', true, true, 'travel/sheikah-tower'),
  c('tech-lab', 'Tech Labs', 'Travel', '⚙', '#22d3ee', true, true, 'travel/tech-lab'),
  // Quests
  c('main-quest', 'Main Quests', 'Quests', '★', '#facc15', true, true, 'quest/quest-main'),
  c('shrine-quest', 'Shrine Quests', 'Quests', '◈', '#7dd3fc', true, true, 'quest/quest-shrine'),
  c('side-quest', 'Side Quests', 'Quests', '!', '#fb923c', true, true, 'quest/quest-side'),
  c('memory', 'Memories', 'Quests', '✦', '#c084fc', true, true, 'quest/quest-memory'),
  c('quest-objective', 'Quest Objectives', 'Quests', '•', '#fdba74', true, false, 'quest/objective-pulse'),
  // Collectibles
  c('korok-seed', 'Korok Seeds', 'Collectibles', '🍃', '#4ade80', true, true, 'quest/korok'),
  c('great-fairy', 'Great Fairies', 'Collectibles', '✿', '#f472b6', true, true, 'stamps/star'),
  // Tracked (checkable) so it appears in Progress
  c('clothing', 'Clothing', 'Collectibles', '▣', '#f472b6', true, true, 'stamps/treasure'),
  // Points of interest
  c('goddess-statue', 'Goddess Statues', 'Points of interest', '♆', '#e2e8f0', false, false, 'stamps/human'),
  c('cooking-pot', 'Cooking Pots', 'Points of interest', '♨', '#fca5a5', false, false, 'stamps/cuisine'),
  c('raft', 'Rafts', 'Points of interest', '≈', '#93c5fd', false, false, 'stamps/leaf'),
  // Enemies
  c('stone-talus', 'Stone Taluses', 'Enemies', '▲', '#a8a29e', false, false, 'stamps/ore'),
  c('hinox', 'Hinoxes', 'Enemies', '☠', '#ef4444', false, false, 'stamps/enemy'),
  c('lynel', 'Lynels', 'Enemies', '♞', '#dc2626', false, false, 'stamps/bow'),
  c('molduga', 'Moldugas', 'Enemies', '≋', '#d97706', false, false, 'stamps/weapon'),
  c('guardian', 'Guardians', 'Enemies', '◉', '#64748b', false, false, 'stamps/guardian'),
  // Places
  c('stable', 'Stables', 'Places', '⌂', '#a8a29e', true, true, 'locations/stable'),
  c('village', 'Towns & Villages', 'Places', '⌖', '#e2e8f0', false, true, 'locations/village'),
  c('settlement', 'Settlements', 'Places', '·', '#cbd5e1', false, false, 'locations/checkpoint'),
  c('inn', 'Inns', 'Places', '☾', '#fcd34d', false, false, 'locations/inn'),
  c('general-store', 'General Stores', 'Places', '$', '#86efac', false, false, 'locations/store'),
  c('armor-shop', 'Armor Shops', 'Places', '🛡', '#fda4af', false, false, 'locations/armor'),
  c('dye-shop', 'Dye Shops', 'Places', '◐', '#f9a8d4', false, false, 'locations/dye'),
  c('jewelry-shop', 'Jewelry Shops', 'Places', '◇', '#a5f3fc', false, false, 'locations/jewelry'),
  // Map labels (text only, not clickable)
  c('landmark', 'Place names', 'Map labels', '⚑', '#94a3b8', false, true),
  // Treasure
  c('rare-gems', 'Rare gems', 'Treasure', '◆', '#f87171', false, false, 'stamps/treasure'),
  c('common-gems', 'Common gems', 'Treasure', '◆', '#fb923c', false, false, 'stamps/treasure'),
  c('big-rupees', 'Big rupees', 'Treasure', '◆', '#a78bfa', false, false, 'stamps/treasure'),
  c('small-rupees', 'Small rupees', 'Treasure', '◆', '#60a5fa', false, false, 'stamps/treasure'),
  c('materials', 'Materials', 'Treasure', '▣', '#fbbf24', false, false, 'stamps/treasure'),
  c('uniques', 'Uniques', 'Treasure', '▣', '#fde047', false, false, 'stamps/treasure'),
  c('one-handed-weapons', 'One-handed weapons', 'Treasure', '⚔', '#d1d5db', false, false, 'stamps/treasure'),
  c('two-handed-weapons', 'Two-handed weapons', 'Treasure', '⚔', '#9ca3af', false, false, 'stamps/treasure'),
  c('spears', 'Spears', 'Treasure', '↟', '#bef264', false, false, 'stamps/treasure'),
  c('rods', 'Rods', 'Treasure', '⌇', '#67e8f9', false, false, 'stamps/treasure'),
  c('bows', 'Bows', 'Treasure', '☽', '#86efac', false, false, 'stamps/treasure'),
  c('arrows', 'Arrows', 'Treasure', '➶', '#fdba74', false, false, 'stamps/treasure'),
  c('shields', 'Shields', 'Treasure', '⛉', '#7dd3fc', false, false, 'stamps/treasure'),
] as Category[]

/** Per-marker icon overrides (marker id -> icon path in public/icons, no extension). */
export const MARKER_ICON_OVERRIDES: Record<string, string> = {
  'village:Hyrule Castle': 'locations/castle',
  'shrine:Shrine of Resurrection': 'travel/resurrection-shrine',
}

/**
 * Visual scale per icon so artwork reads at a similar size. Travel art is a soft glow (~55% solid),
 * so it is enlarged; quest-shrine, quest-side and quest-memory fill their whole frame, so they are
 * shrunk to match travel/shrine.
 */
const ICON_SCALE: Record<string, number> = {
  'quest/quest-shrine': 0.69,
  'quest/quest-side': 0.72,
  'quest/quest-memory': 0.72,
  'travel/sheikah-tower': 1.375, // travel's 1.25 plus 10%
}
export const iconScale = (name?: string): number =>
  (name && ICON_SCALE[name]) || (name?.startsWith('travel/') ? 1.25 : 1)

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((x) => [x.id, x]),
)

export const CATEGORY_GROUPS = [...new Set(CATEGORIES.map((x) => x.group))]

export const defaultEnabled = () =>
  Object.fromEntries(CATEGORIES.map((x) => [x.id, x.defaultOn !== false]))
