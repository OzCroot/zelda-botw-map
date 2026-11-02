import 'leaflet'

// Minimal typings for the parts of leaflet.markercluster we use.
declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    maxClusterRadius?: number
    chunkedLoading?: boolean
    showCoverageOnHover?: boolean
  }
  class MarkerClusterGroup extends FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions)
    addLayers(layers: Layer[]): this
    removeLayers(layers: Layer[]): this
  }
}
