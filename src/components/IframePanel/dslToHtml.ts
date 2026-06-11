import type { DslNode } from '@/types/dsl'

const VOID_TAGS = new Set(['img', 'input', 'hr', 'br', 'meta', 'link'])

function camelToKebab(s: string) {
  return s.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`)
}

function styleToString(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join(';')
}

function nodeToHtml(node: DslNode): string {
  if (node.rect.w === 0 && node.rect.h === 0 && !node.passthrough) return ''

  const posStyle = [
    'position:absolute',
    `left:${node.rect.x}px`,
    `top:${node.rect.y}px`,
    `width:${node.rect.w}px`,
    `height:${node.rect.h}px`,
    'box-sizing:border-box',
    'overflow:hidden',
  ].join(';')

  const nodeStyle = styleToString(node.style)
  const combinedStyle = nodeStyle ? `${posStyle};${nodeStyle}` : posStyle

  const attrsArr: string[] = [`style="${combinedStyle}"`]
  if (node.id)    attrsArr.push(`id="${node.id}"`)
  if (node.class) attrsArr.push(`class="${node.class}"`)
  if (node.src)   attrsArr.push(`src="${node.src}"`)
  if (node.alt)   attrsArr.push(`alt="${node.alt}"`)
  if (node.href)  attrsArr.push(`href="${node.href}"`)
  if (node.type)  attrsArr.push(`type="${node.type}"`)
  if (node.attrs) {
    for (const [k, v] of Object.entries(node.attrs)) {
      attrsArr.push(`${k}="${String(v)}"`)
    }
  }

  const attrsStr = attrsArr.join(' ')
  if (VOID_TAGS.has(node.tag)) return `<${node.tag} ${attrsStr}>`

  const inner = [
    node.text ?? '',
    ...(node.children?.map(nodeToHtml) ?? []),
  ].join('')

  return `<${node.tag} ${attrsStr}>${inner}</${node.tag}>`
}

export function dslToHtml(nodes: DslNode[]): string {
  // Compute canvas size from root nodes
  let w = 0, h = 0
  for (const n of nodes) {
    w = Math.max(w, n.rect.x + n.rect.w)
    h = Math.max(h, n.rect.y + n.rect.h)
  }

  const body = nodes.map(nodeToHtml).join('')

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{position:relative;width:${w}px;height:${h}px;overflow:hidden}
</style>
</head>
<body>${body}</body>
</html>`
}
