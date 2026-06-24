import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue'
import type { PropType } from 'vue'
import type { DslNode } from '@/types/dsl'
import NodeBlock from './NodeBlock'

function flattenNodes(node: DslNode | null): DslNode[] {
  if (!node) return []
  return [node, ...(node.children ? flattenNodesOf(node.children) : [])]
}

function flattenNodesOf(nodes: DslNode[]): DslNode[] {
  return nodes.flatMap(n => [n, ...(n.children ? flattenNodesOf(n.children) : [])])
}

export interface ClickPayload {
  node: DslNode
  clientX: number
  clientY: number
}

// Extra pixels rendered beyond visible edges to avoid pop-in during scroll
const CULL_PADDING = 100

export default defineComponent({
  name: 'WireframeRenderer',
  props: {
    root:        { type: Object as PropType<DslNode | null>, default: null },
    selectedNid: { type: Number, default: undefined },
  },
  emits: ['nodeClick', 'scroll'],
  setup(props, { emit }) {
    const containerRef    = ref<HTMLElement | null>(null)
    const containerHeight = ref(0)
    const scrollTop       = ref(0)

    const allNodes = computed(() => {
      const flat = flattenNodes(props.root)
      flat.forEach(n => void n.layerType)
      return flat
    })

    const canvasSize = computed(() => {
      let w = 0, h = 0
      for (const n of allNodes.value) {
        w = Math.max(w, n.rect.x + n.rect.w)
        h = Math.max(h, n.rect.y + n.rect.h)
      }
      return { w: w || 375, h: h || 812 }
    })

    // Viewport culling: y-axis only (heights are unscaled)
    const visibleNodes = computed(() => {
      const top = scrollTop.value - CULL_PADDING
      const bot = scrollTop.value + containerHeight.value + CULL_PADDING

      return allNodes.value.filter(n => {
        if (n.rect.w === 0 || n.rect.h === 0 || n.passthrough) return false
        return n.rect.y + n.rect.h > top && n.rect.y < bot
      })
    })

    let ro: ResizeObserver | null = null

    onMounted(() => {
      const el = containerRef.value
      if (!el) return
      containerHeight.value = el.clientHeight

      ro = new ResizeObserver(entries => {
        containerHeight.value = entries[0].contentRect.height
      })
      ro.observe(el)

      el.addEventListener('scroll', () => {
        scrollTop.value = el.scrollTop
        emit('scroll')
      }, { passive: true })
    })

    onUnmounted(() => ro?.disconnect())

    return () => (
      <div
        ref={containerRef}
        class="w-full h-full overflow-auto bg-slate-100"
        onClick={() => emit('nodeClick', null)}
      >
        <div
          style={{
            position: 'relative',
            width:    `${canvasSize.value.w}px`,
            height:   `${canvasSize.value.h}px`,
          }}
        >
          {visibleNodes.value.map(n => (
            <NodeBlock
              key={n.nid}
              node={n}
              selected={n.nid === props.selectedNid}
              onClick={(node: DslNode, e: MouseEvent) =>
                emit('nodeClick', { node, clientX: e.clientX, clientY: e.clientY } as ClickPayload)
              }
            />
          ))}
        </div>
      </div>
    )
  },
})
