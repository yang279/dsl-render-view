import { defineStore } from 'pinia'
import { ref } from 'vue'
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

function postToParent(type: string, payload: unknown) {
  window.parent?.postMessage({ type, payload }, '*')
}

export const useDslStore = defineStore('dsl', () => {
  const nodes      = ref<DslNode[]>([])
  const sourceName = ref('')

  function setNodes(data: DslNode[], name = '') {
    nodes.value = data
    sourceName.value = name
  }

  function updateNodeMeta(nid: number, layerType: string, layerName: string, layerDescription: string) {
    const node = findNode(nodes.value, nid)
    if (!node) return
    node.layerType        = layerType
    node.layerName        = layerName
    node.layerDescription = layerDescription
    postToParent('DSL_NODE_UPDATED', { nid, changes: { layerType, layerName, layerDescription } })
  }

  return { nodes, sourceName, setNodes, updateNodeMeta }
})
