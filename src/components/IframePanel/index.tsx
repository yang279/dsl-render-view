import { defineComponent, ref, watch } from 'vue'
import { usePreviewStore } from '@/stores/preview'

export default defineComponent({
  name: 'IframePanel',
  setup() {
    const previewStore = usePreviewStore()

    const inputUrl  = ref('')
    const iframeSrc = ref('')
    const loading   = ref(false)

    // When uploadZip() resolves a blob URL, load it automatically
    watch(() => previewStore.src, (src) => {
      if (src) {
        iframeSrc.value = src
        inputUrl.value  = ''
        loading.value   = true
      }
    })

    function navigate() {
      let url = inputUrl.value.trim()
      if (!url) return
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`
      inputUrl.value  = url
      loading.value   = true
      iframeSrc.value = url
    }

    function refresh() {
      if (!iframeSrc.value) return
      loading.value = true
      const cur = iframeSrc.value
      iframeSrc.value = ''
      setTimeout(() => { iframeSrc.value = cur }, 50)
    }

    const EmptyState = () => (
      <div class="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 select-none">
        <svg class="w-14 h-14 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <div class="text-center">
          <p class="text-sm font-medium">输入地址预览，或调用 uploadZip() 加载本地包</p>
          <p class="text-xs mt-1 opacity-60">window.uploadZip() · window.uploadDsl() · window.downloadDsl()</p>
        </div>
      </div>
    )

    return () => (
      <div class="flex flex-col h-full bg-white">
        <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <button
            class="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            onClick={refresh}
            title="刷新"
          >
            <svg class={['w-4 h-4', loading.value && iframeSrc.value ? 'animate-spin' : '']}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div class="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 h-8 gap-2 focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
            <input
              class="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400 min-w-0 font-mono"
              placeholder="输入 URL..."
              value={inputUrl.value}
              onInput={(e: Event) => { inputUrl.value = (e.target as HTMLInputElement).value }}
              onKeydown={(e: KeyboardEvent) => { if (e.key === 'Enter') navigate() }}
            />
          </div>

          <button
            class="px-3 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-medium transition-colors flex-shrink-0"
            onClick={navigate}
          >
            跳转
          </button>
        </div>

        <div class="flex-1 relative min-h-0 flex flex-col">
          {loading.value && iframeSrc.value && (
            <div class="absolute inset-0 flex items-center justify-center bg-white/70 z-10 pointer-events-none">
              <div class="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!iframeSrc.value
            ? <EmptyState />
            : (
              <iframe
                key={iframeSrc.value}
                src={iframeSrc.value}
                class="flex-1 w-full border-0"
                onLoad={() => { loading.value = false }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )
          }
        </div>
      </div>
    )
  },
})
