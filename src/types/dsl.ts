export interface Rect {
  x: number
  y: number
  w: number
  h: number
  fixed?: boolean
}

export type SemanticType =
  | 'navbar'
  | 'tabbar'
  | 'button'
  | 'icon'
  | 'input'
  | 'avatar'
  | 'switch'
  | 'card'
  | 'list'
  | 'list-item'
  | 'image'
  | 'text'
  | 'heading'
  | 'divider'
  | 'container'
  | 'modal'
  | 'badge'

export interface DslNode {
  nid: number
  tag: string
  depth: number
  rect: Rect
  semantic: SemanticType | string
  label: string
  confidence: 'high' | 'low'
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
  description?: string
  children?: DslNode[]
}
