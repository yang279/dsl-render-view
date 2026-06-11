import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DslNode } from '@/types/dsl'

function findNode(nodes: DslNode[], nid: number): DslNode | null {
  for (const n of nodes) {
    if (n.nid === nid) return n
    if (n.children) {
      const found = findNode(n.children, nid)
      if (found) return found
    }
  }
  return null
}

export const useDslStore = defineStore('dsl', () => {
  const nodes      = ref<DslNode[]>([])
  const sourceName = ref('')

  const hasNodes = computed(() => nodes.value.length > 0)

  function setNodes(data: DslNode[], name = '') {
    nodes.value = data
    sourceName.value = name
  }

  function updateNodeMeta(nid: number, semantic: string, label: string, description: string) {
    const node = findNode(nodes.value, nid)
    if (!node) return
    node.semantic = semantic
    node.label = label
    node.description = description
  }

  return { nodes, sourceName, hasNodes, setNodes, updateNodeMeta }
})
