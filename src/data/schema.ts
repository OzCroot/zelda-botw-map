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
  blessing: z.string().optional(),
  details: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        marker: z.string().optional(),
        links: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
      }),
    )
    .optional(),
  path: z.array(z.tuple([z.number(), z.number()])).optional(),
  set: z.string().optional(),
  minZoom: z.number().optional(),
})

export const areaLabelSchema = z.object({
  id: z.string(),
  kind: z.enum(['region', 'area']).optional(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  minZoom: z.number(),
  maxZoom: z.number(),
})

export const regionSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
})

export const datasetSchema = z.object({
  regions: z.array(regionSchema),
  version: z.string(),
  source: z.string(),
  labels: z.array(areaLabelSchema).optional(),
  markers: z.array(markerSchema),
})
