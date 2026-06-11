import { defineComponent, ref } from 'vue'
import { useDslStore } from '@/stores/dsl'
import type { DslNode } from '@/types/dsl'
import type { ClickPayload } from '@/components/WireframeRenderer'
import WireframeRenderer from '@/components/WireframeRenderer'
import NodeInfoPopover from './NodeInfoPopover'

export default defineComponent({
  name: 'EditorPage',
  setup() {
    const store = useDslStore()

    const selectedNode = ref<DslNode | null>(null)
    const popoverPos   = ref<{ x: number; y: number } | null>(null)

    function onNodeClick(payload: ClickPayload | null) {
      if (!payload) {
        selectedNode.value = null
        popoverPos.value   = null
        return
      }
      if (payload.node.nid === selectedNode.value?.nid) {
        selectedNode.value = null
        popoverPos.value   = null
        return
      }
      selectedNode.value = payload.node
      popoverPos.value   = { x: payload.clientX, y: payload.clientY }
    }

    return () => (
      <div class="h-full">
        <WireframeRenderer
          nodes={store.nodes}
          selectedNid={selectedNode.value?.nid}
          onNodeClick={onNodeClick}
        />
        <NodeInfoPopover
          node={selectedNode.value}
          position={popoverPos.value}
          onClose={() => { selectedNode.value = null; popoverPos.value = null }}
        />
      </div>
    )
  },
})
