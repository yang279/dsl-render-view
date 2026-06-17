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
