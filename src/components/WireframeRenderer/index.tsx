import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue'
import type { PropType } from 'vue'
import type { DslNode } from '@/types/dsl'
import NodeBlock from './NodeBlock'

function flattenNodes(nodes: DslNode[]): DslNode[] {
  return nodes.flatMap(n => [n, ...(n.children ? flattenNodes(n.children) : [])])
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
    nodes:       { type: Array as PropType<DslNode[]>, required: true },
    selectedNid: { type: Number, default: undefined },
  },
  emits: ['nodeClick', 'scroll'],
  setup(props, { emit }) {
    const containerRef    = ref<HTMLElement | null>(null)
    const containerWidth  = ref(0)
    const containerHeight = ref(0)
    const scrollTop       = ref(0)

    const allNodes = computed(() => {
      const flat = flattenNodes(props.nodes)
      // Track semantic on every node so visibleNodes recomputes when type changes
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

    // Horizontal-only scale: width fills the container, height stays fixed
    const scaleX = computed(() =>
      containerWidth.value > 0 ? containerWidth.value / canvasSize.value.w : 1
    )

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
      containerWidth.value  = el.clientWidth
      containerHeight.value = el.clientHeight

      ro = new ResizeObserver(entries => {
        containerWidth.value  = entries[0].contentRect.width
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
        class="w-full h-full overflow-y-auto bg-slate-100"
        onClick={() => emit('nodeClick', null)}
      >
        {/* Canvas fills container width; height stays at original canvas size */}
        <div
          style={{
            position: 'relative',
            width:    '100%',
            height:   `${canvasSize.value.h}px`,
          }}
        >
          {visibleNodes.value.map(n => (
            <NodeBlock
              key={n.nid}
              node={n}
              scaleX={scaleX.value}
              selected={n.nid === props.selectedNid}
              onClick={(node: DslNode, e: MouseEvent) =>
                emit('nodeClick', { node, clientX: e.clientX, clientY: e.clientY } as ClickPayload)
              }
            />
          ))}
        </div>

        {/* Debug badge — remove in production */}
        <div class="sticky bottom-2 left-2 inline-flex items-center gap-1 text-xs bg-black/40 text-white px-2 py-0.5 rounded-full pointer-events-none">
          <span>{visibleNodes.value.length}</span>
          <span class="opacity-60">/ {allNodes.value.filter(n => n.rect.w > 0 && !n.passthrough).length} 节点</span>
        </div>
      </div>
    )
  },
})
