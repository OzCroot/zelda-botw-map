import type { Category } from '../types/marker'

type C = Omit<Category, 'icon'> & { icon?: string }
const c = (
  id: string, label: string, group: Category['group'], glyph: string, color: string,
  checkable: boolean, defaultOn = true, icon?: string,
): C => ({ id, label, group, glyph, color, checkable, defaultOn, icon: icon ?? id })

export const CATEGORIES: Category[] = [
  // Travel
  c('shrine', 'Shrines', 'Travel', '⛩', '#38bdf8', true),
  c('sheikah-tower', 'Sheikah Towers', 'Travel', '🗼', '#fbbf24', true, true, 'tower'),
  c('tech-lab', 'Tech Labs', 'Travel', '⚙', '#22d3ee', true, true, 'lab'),
  // Quests
  c('main-quest', 'Main Quests', 'Quests', '★', '#facc15', true, true, 'mainquest'),
  c('shrine-quest', 'Shrine Quests', 'Quests', '◈', '#7dd3fc', true, true, 'shrinequest'),
  c('side-quest', 'Side Quests', 'Quests', '!', '#fb923c', true, true, 'sidequest'),
  c('memory', 'Memories', 'Quests', '✦', '#c084fc', true),
  c('quest-objective', 'Quest Objectives', 'Quests', '•', '#fdba74', true, false, 'objective'),
  // Collectibles
  c('korok-seed', 'Korok Seeds', 'Collectibles', '🍃', '#4ade80', true, true, 'seed'),
  c('great-fairy', 'Great Fairies', 'Collectibles', '✿', '#f472b6', true, true, 'fountain'),
  c('goddess-statue', 'Goddess Statues', 'Collectibles', '♆', '#e2e8f0', false, false, 'statue'),
  c('cooking-pot', 'Cooking Pots', 'Collectibles', '♨', '#fca5a5', false, false, 'pot'),
  c('raft', 'Rafts', 'Collectibles', '≈', '#93c5fd', false, false),
  // Enemies
  c('stone-talus', 'Stone Taluses', 'Enemies', '▲', '#a8a29e', true, false, 'talus'),
  c('hinox', 'Hinoxes', 'Enemies', '☠', '#ef4444', true, false),
  c('lynel', 'Lynels', 'Enemies', '♞', '#dc2626', true, false),
  c('molduga', 'Moldugas', 'Enemies', '≋', '#d97706', true, false),
  c('guardian', 'Guardians', 'Enemies', '◉', '#64748b', false, false),
  // Places
  c('stable', 'Stables', 'Places', '⌂', '#a8a29e', true),
  c('village', 'Towns & Villages', 'Places', '⌖', '#e2e8f0', false),
  c('settlement', 'Settlements', 'Places', '·', '#cbd5e1', false, false),
  c('landmark', 'Landmarks', 'Places', '⚑', '#94a3b8', false, false),
  // Services
  c('inn', 'Inns', 'Services', '☾', '#fcd34d', false, false),
  c('general-store', 'General Stores', 'Services', '$', '#86efac', false, false, 'store'),
  c('armor-shop', 'Armor Shops', 'Services', '🛡', '#fda4af', false, false, 'armor'),
  c('dye-shop', 'Dye Shops', 'Services', '◐', '#f9a8d4', false, false, 'dye'),
  c('jewelry-shop', 'Jewelry Shops', 'Services', '◇', '#a5f3fc', false, false, 'jewelry'),
  // Treasure
  c('rare-gems', 'Rare gems', 'Treasure', '◆', '#f87171', true, false, 'treasure'),
  c('common-gems', 'Common gems', 'Treasure', '◆', '#fb923c', true, false, 'treasure'),
  c('big-rupees', 'Big rupees', 'Treasure', '◆', '#a78bfa', true, false, 'treasure'),
  c('small-rupees', 'Small rupees', 'Treasure', '◆', '#60a5fa', true, false, 'treasure'),
  c('materials', 'Materials', 'Treasure', '▣', '#fbbf24', true, false, 'treasure'),
  c('clothing', 'Clothing', 'Treasure', '▣', '#f472b6', true, false, 'treasure'),
  c('uniques', 'Uniques', 'Treasure', '▣', '#fde047', true, false, 'treasure'),
  c('one-handed-weapons', 'One-handed weapons', 'Treasure', '⚔', '#d1d5db', true, false, 'treasure'),
  c('two-handed-weapons', 'Two-handed weapons', 'Treasure', '⚔', '#9ca3af', true, false, 'treasure'),
  c('spears', 'Spears', 'Treasure', '↟', '#bef264', true, false, 'treasure'),
  c('rods', 'Rods', 'Treasure', '⌇', '#67e8f9', true, false, 'treasure'),
  c('bows', 'Bows', 'Treasure', '☽', '#86efac', true, false, 'treasure'),
  c('arrows', 'Arrows', 'Treasure', '➶', '#fdba74', true, false, 'treasure'),
  c('shields', 'Shields', 'Treasure', '⛉', '#7dd3fc', true, false, 'treasure'),
] as Category[]

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((x) => [x.id, x]),
)

export const CATEGORY_GROUPS = [...new Set(CATEGORIES.map((x) => x.group))]

export const defaultEnabled = () =>
  Object.fromEntries(CATEGORIES.map((x) => [x.id, x.defaultOn !== false]))
