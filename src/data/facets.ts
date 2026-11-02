import type { Marker } from '../types/marker'
import { CLOTHING_SET_ORDER, OTHER_SET } from './clothingSets'

/**
 * Each category can be split into sub-groups in the filters, so a category can be narrowed (e.g. just the
 * Lanayru shrines). That is by region for almost everything, but clothing is hunted by set instead.
 */
export const FACET_BY_SET = new Set(['clothing'])

/** Sub-group of a marker within its category: its set for clothing, its region otherwise. */
export const facetKey = (m: Pick<Marker, 'category' | 'region' | 'set'>): string | undefined =>
  FACET_BY_SET.has(m.category) ? (m.set ?? OTHER_SET) : m.region

/** Order to show a set-based category's sub-groups in. */
export const SET_ORDER = CLOTHING_SET_ORDER
