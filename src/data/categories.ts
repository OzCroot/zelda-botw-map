import type { Category } from '../types/marker'

export const CATEGORIES: Category[] = [
  { id: 'shrine', label: 'Shrines', group: 'Challenges', glyph: '⛩', color: '#38bdf8', checkable: true },
  { id: 'korok', label: 'Korok Seeds', group: 'Collectibles', glyph: '🍃', color: '#4ade80', checkable: true },
  { id: 'tower', label: 'Towers', group: 'Places', glyph: '🗼', color: '#fbbf24', checkable: true },
  { id: 'memory', label: 'Memories', group: 'Quests', glyph: '✦', color: '#c084fc', checkable: true },
  { id: 'chest', label: 'Treasure Chests', group: 'Collectibles', glyph: '▣', color: '#f59e0b', checkable: true },
  { id: 'beast', label: 'Divine Beasts', group: 'Challenges', glyph: '☗', color: '#f87171', checkable: true },
  { id: 'fairy', label: 'Great Fairies', group: 'Places', glyph: '✿', color: '#f472b6', checkable: true },
  { id: 'stable', label: 'Stables', group: 'Places', glyph: '⌂', color: '#a8a29e', checkable: true },
  { id: 'village', label: 'Towns & Villages', group: 'Places', glyph: '⌖', color: '#e2e8f0', checkable: false },
  { id: 'sidequest', label: 'Side Quests', group: 'Quests', glyph: '!', color: '#fb923c', checkable: true },
  { id: 'boss', label: 'Bosses & Mini-bosses', group: 'Enemies', glyph: '☠', color: '#ef4444', checkable: true },
]

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

export const CATEGORY_GROUPS = [...new Set(CATEGORIES.map((c) => c.group))]
