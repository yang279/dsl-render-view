const BASE: Record<string, [number, number, number]> = {
  frame:     [59,  130, 246],  // blue
  component: [16,  185, 129],  // green
  icon:      [139,  92, 246],  // purple
  image:     [236,  72, 153],  // pink
  text:      [100, 116, 139],  // slate
}

const DEFAULT_RGB: [number, number, number] = [148, 163, 184]

function toSolid([r, g, b]: [number, number, number]) {
  return `rgb(${r}, ${g}, ${b})`
}

function toBg([r, g, b]: [number, number, number]) {
  return `rgba(${r}, ${g}, ${b}, 0.10)`
}

export const SEMANTIC_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(BASE).map(([k, v]) => [k, toSolid(v)])
)

export const SEMANTIC_BG: Record<string, string> = Object.fromEntries(
  Object.entries(BASE).map(([k, v]) => [k, k === 'frame' ? 'transparent' : toBg(v)])
)

export const DEFAULT_COLOR = toSolid(DEFAULT_RGB)
export const DEFAULT_BG    = toBg(DEFAULT_RGB)
