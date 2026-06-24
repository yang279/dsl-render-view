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
  NODE_DSL_LOADED: {
    success: boolean
    error?: string
  }
  NODE_DSL_JSON: unknown
  NODE_DSL_CLEAR: undefined
}

export interface PreviewPostMessageEvent {
  NODE_DSL_PIPELINE: unknown
  PIPELINE_LOADED: {
    success: boolean
    error?: string
    zipData?: ArrayBuffer
  }
  PIPELINE_ZIP_DATA: ArrayBuffer
  ZIP_LOADED: {
    success: boolean
    error?: string
    zipData?: ArrayBuffer
  }
}
