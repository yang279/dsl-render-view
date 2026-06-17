export {}

declare global {
  interface Window {
    uploadDsl: () => void
    downloadDsl: () => void
    uploadZip: () => void
    uploadDslToPipeline: () => void
    clearDsl: () => void
    runPlugin: () => Promise<void>
  }
}

export interface PostMessageEvent {
  DSL_NODE_UPDATED: {
    nid: number
    changes: {
      layerType: string
      layerName: string
      layerDescription: string
    }
  }
  NODE_DSL_JSON: unknown
  NODE_DSL_CLEAR: undefined
}
