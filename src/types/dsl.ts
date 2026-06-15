export interface ZipResource {
  filename: string
  blobUrl: string
  mimeType: string
  content?: ArrayBuffer | Uint8Array | string
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
  fixed?: boolean
}

export type LayerType =
  | 'image'
  | 'frame'
  | 'text'
  | 'icon'
  | 'component'

export interface DslNode {
  nid: number
  tag: string
  rect: Rect
  layerType: LayerType | string
  layerName: string
  layerDescription: string
  layerConfidence?: 'low'
  style: Record<string, string>
  id?: string
  class?: string
  attrs?: Record<string, unknown>
  text?: string
  src?: string
  alt?: string
  href?: string
  type?: string
  naturalWidth?: number
  naturalHeight?: number
  loaded?: boolean
  passthrough?: boolean
  children?: DslNode[]
}
