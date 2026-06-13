import { defineComponent, ref, watch, onMounted, onUnmounted } from 'vue'
import { usePreviewStore } from '@/stores/preview'

interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info'
  text: string
  time: number
}

function buildPluginCode(hex: string, svgMap: Record<string, string>): string {
  const svgMapJson = JSON.stringify(svgMap)

  return `
(async () => {
  try {
    const hex = ${JSON.stringify(hex)};
    const svgMap = ${svgMapJson};

    const children = pixso.currentPage.children;
    const lastlayer = children[children.length - 1];
    const page = await pixso.getNodeById(lastlayer.id);

    const getPluginData = (node) => {
      return node.getPluginData;
    };

    const setPlaceholderSvg = async (node) => {
      try {
        const { note, instanceGuid, textNodeGuid, textContent } = getPluginData(node);
        if (note && svgMap[note]) {
          pixso.createSvg(node.id, svgMap[note]);
          const result = await pixso.aiEditor.call("apply", {
            operations: \`frame = U("\${instanceGuid}", { 
            "descendants": {
                "\${textNodeGuid}": {
                    "nodeText": "\${textContent}"
                    }
                } 
            })\`
          });
        }
      } catch (error) {
        console.log(error, 'setPlaceholderSvg error');
      }
    };

    const dascandants = await page.findAllAsync();
    const _loop = async (list) => {
      for (let i = 0; i < list.length; i++) {
        const node = list[i];
        await setPlaceholderSvg(node);
        if (node.children && node.children.length) {
          await _loop(node.children);
        }
      }
    };
    await _loop(dascandants);
  } catch (error) {
    console.log(error);
  }
})();
`
}

export default defineComponent({
  name: 'IframePanel',
  setup() {
    const previewStore = usePreviewStore()

    const inputUrl    = ref('')
    const iframeSrc   = ref('https://pixso.cn/app/editor')
    const loading     = ref(false)
    const iframeRef   = ref<HTMLIFrameElement | null>(null)
    const iframeReady = ref(false)
    const consoleExpanded = ref(true)
    const consoleEntries  = ref<ConsoleEntry[]>([])

    watch(() => previewStore.src, (src) => {
      if (src) {
        iframeSrc.value = src
        inputUrl.value  = ''
        loading.value   = true
      }
    })

    watch(() => previewStore.hexData, (hex) => {
      if (!hex) return
      const iframe = iframeRef.value
      if (!iframe || !iframeReady.value) return
      const ficAppObj = (iframe.contentWindow as any)?._FicAppObj
      if (!ficAppObj) {
        addConsoleEntry('warn', '[Plugin] ZIP loaded but _FicAppObj not found yet')
        return
      }
      addConsoleEntry('info', '[Plugin] ZIP loaded, iframe ready, auto-running plugin')
      runPlugin()
    })

    function navigate() {
      let url = inputUrl.value.trim()
      if (!url) return
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`
      inputUrl.value    = url
      loading.value     = true
      iframeReady.value = false
      consoleEntries.value = []
      iframeSrc.value   = url
    }

    function refresh() {
      if (!iframeSrc.value) return
      loading.value     = true
      iframeReady.value = false
      consoleEntries.value = []
      const cur = iframeSrc.value
      iframeSrc.value = ''
      setTimeout(() => { iframeSrc.value = cur }, 50)
    }

    function addConsoleEntry(level: ConsoleEntry['level'], text: string) {
      consoleEntries.value.push({ level, text, time: Date.now() })
      if (consoleEntries.value.length > 200) {
        consoleEntries.value.splice(0, consoleEntries.value.length - 200)
      }
    }

    function injectConsoleInterceptor() {
      const iframe = iframeRef.value
      if (!iframe) return

      try {
        const win = iframe.contentWindow as any
        if (!win) return

        const script = win.document.createElement('script')
        script.textContent = `
(function() {
  const origLog   = console.log;
  const origWarn  = console.warn;
  const origError = console.error;
  const origInfo  = console.info;

  const relay = (level, args) => {
    try {
      const text = Array.prototype.map.call(args, a => {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') try { return JSON.stringify(a) } catch(e) { return String(a) }
        return String(a);
      }).join(' ');
      parent.postMessage({ source: 'iframe-console', level: level, text: text }, '*');
    } catch(e) {}
  };

  console.log   = function() { relay('log',   arguments); origLog.apply(console,   arguments); };
  console.warn  = function() { relay('warn',  arguments); origWarn.apply(console,  arguments); };
  console.error = function() { relay('error', arguments); origError.apply(console, arguments); };
  console.info  = function() { relay('info',  arguments); origInfo.apply(console,  arguments); };
})();
`
        win.document.head.appendChild(script)
        script.remove()
      } catch (err) {
        console.warn('[Console] Cannot inject interceptor (cross-origin?):', err)
      }
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.source !== 'iframe-console') return
      const { level, text } = event.data
      if (level && text) addConsoleEntry(level, text)
    }

    async function runPlugin() {
      const iframe = iframeRef.value
      if (!iframe) {
        addConsoleEntry('warn', '[Plugin] No iframe found')
        return
      }
      if (!iframeReady.value) {
        addConsoleEntry('warn', '[Plugin] iframe not loaded yet')
        return
      }

      const ficAppObj = (iframe.contentWindow as any)?._FicAppObj
      if (!ficAppObj) {
        addConsoleEntry('warn', '[Plugin] _FicAppObj not found on iframe window')
        return
      }

      const hex  = previewStore.hexData
      const svgs = previewStore.svgMap
      if (!hex && !Object.keys(svgs).length) {
        addConsoleEntry('warn', '[Plugin] No hex/svg data available, upload a ZIP first')
        return
      }

      const code = buildPluginCode(hex, svgs)
      addConsoleEntry('info', `[Plugin] Executing plugin, hex: ${hex.length} chars, svgs: ${Object.keys(svgs).join(',')}`)

      try {
        await ficAppObj.runTestPlugin({ editorType: ['dev', 'pixso'] }, code)
        addConsoleEntry('info', '[Plugin] Execution completed')
      } catch (err) {
        addConsoleEntry('error', `[Plugin] Execution failed: ${(err as Error).message}`)
      }
    }

    function exposeRunPlugin() {
      window.runPlugin = runPlugin
    }

    function cleanupRunPlugin() {
      delete (window as any).runPlugin
    }

    onMounted(() => {
      exposeRunPlugin()
      window.addEventListener('message', handleMessage)
    })

    onUnmounted(() => {
      cleanupRunPlugin()
      window.removeEventListener('message', handleMessage)
    })

    function onIframeLoad() {
      loading.value     = false
      iframeReady.value = true

      injectConsoleInterceptor()

      if (!previewStore.hexData && !Object.keys(previewStore.svgMap).length) return

      const iframe = iframeRef.value
      if (!iframe) return

      const ficAppObj = (iframe.contentWindow as any)?._FicAppObj
      if (!ficAppObj) {
        addConsoleEntry('warn', '[Plugin] iframe loaded but _FicAppObj not yet available')
        return
      }

      addConsoleEntry('info', '[Plugin] _FicAppObj detected, auto-running plugin')
      runPlugin()
    }

    const EmptyState = () => (
      <div class="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 select-none">
        <svg class="w-14 h-14 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <div class="text-center">
          <p class="text-sm font-medium">调用 uploadZip() 加载本地压缩包</p>
          <p class="text-xs mt-1 opacity-60">window.uploadZip() · window.uploadDsl() · window.downloadDsl()</p>
        </div>
      </div>
    )

    const ErrorState = ({ msg }: { msg: string }) => (
      <div class="flex-1 flex flex-col items-center justify-center gap-3 select-none">
        <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm text-red-500 font-medium">{msg}</p>
      </div>
    )

    const LEVEL_STYLE: Record<string, string> = {
      log:   'text-gray-600',
      info:  'text-blue-600',
      warn:  'text-yellow-600',
      error: 'text-red-600',
    }

    const LEVEL_LABEL: Record<string, string> = {
      log:   'LOG',
      info:  'INFO',
      warn:  'WARN',
      error: 'ERR',
    }

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

          <button
            class={['p-1.5 rounded transition-colors flex-shrink-0',
              previewStore.hexData ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100 cursor-not-allowed']}
            onClick={runPlugin}
            title="执行插件脚本"
            disabled={!previewStore.hexData}
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z" />
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
            class="px-3 h-8 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs font-medium transition-colors flex-shrink-0"
            onClick={() => window.uploadZip()}
          >
            上传ZIP
          </button>

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
          {previewStore.error
            ? <ErrorState msg={previewStore.error} />
            : !iframeSrc.value
            ? <EmptyState />
            : (
              <iframe
                ref={iframeRef}
                key={iframeSrc.value}
                src={iframeSrc.value}
                class="flex-1 w-full border-0"
                onLoad={onIframeLoad}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )
          }
        </div>

        {consoleEntries.value.length > 0 && (
          <div class="flex-shrink-0 border-t border-gray-200 bg-gray-50">
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 w-full"
              onClick={() => { consoleExpanded.value = !consoleExpanded.value }}
            >
              <svg class={['w-3 h-3 transition-transform', consoleExpanded.value ? 'rotate-90' : '']}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>Console ({consoleEntries.value.length})</span>
            </button>

            {consoleExpanded.value && (
              <div class="max-h-40 overflow-y-auto px-3 pb-2 font-mono text-xs leading-relaxed">
                {consoleEntries.value.map((entry, i) => (
                  <div key={i} class={['flex gap-2', LEVEL_STYLE[entry.level]]}>
                    <span class="w-8 opacity-60 flex-shrink-0">{LEVEL_LABEL[entry.level]}</span>
                    <span class="break-all">{entry.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
})
