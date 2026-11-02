import { z } from 'zod'

export const markerSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  layer: z.enum(['surface', 'sky', 'depths']).optional(),
  tags: z.array(z.string()).optional(),
  region: z.string().optional(),
  description: z.string().optional(),
  wikiUrl: z.string().optional(),
})

export const regionSchema = z.object({ id: z.string(), label: z.string(), x: z.number(), y: z.number() })

export const datasetSchema = z.object({
  regions: z.array(regionSchema),
  version: z.string(),
  source: z.string(),
  markers: z.array(markerSchema),
})
