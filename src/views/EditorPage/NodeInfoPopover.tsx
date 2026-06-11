import { defineComponent, ref, watch, computed, Transition, nextTick } from 'vue'
import type { PropType } from 'vue'
import { ElSelect, ElOption, ElInput } from 'element-plus'
import type { DslNode, LayerType } from '@/types/dsl'
import { useDslStore } from '@/stores/dsl'

const LAYER_OPTIONS: LayerType[] = ['frame', 'component', 'text', 'image', 'icon']

interface Position { x: number; y: number }

const W = 260

export default defineComponent({
  name: 'NodeInfoPopover',
  props: {
    node:     { type: Object as PropType<DslNode | null>, default: null },
    position: { type: Object as PropType<Position | null>, default: null },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const store = useDslStore()

    const popoverRef       = ref<HTMLElement | null>(null)
    const layerName        = ref('')
    const layerDescription = ref('')

    watch(() => props.node?.nid, () => {
      layerName.value        = props.node?.layerName        ?? ''
      layerDescription.value = props.node?.layerDescription ?? ''
    }, { immediate: true })

    function saveType(layerType: string) {
      if (!props.node) return
      store.updateNodeMeta(props.node.nid, layerType, layerName.value, layerDescription.value)
    }

    function saveText() {
      if (!props.node) return
      store.updateNodeMeta(props.node.nid, props.node.layerType, layerName.value, layerDescription.value)
    }

    const above = ref(false)

    watch(() => props.position, async (pos) => {
      if (!pos) return
      above.value = false
      await nextTick()
      const h = popoverRef.value?.offsetHeight ?? 220
      above.value = pos.y + 12 + h > window.innerHeight - 8
    })

    const popoverStyle = computed(() => {
      if (!props.position) return {}
      const vw = window.innerWidth
      const h  = popoverRef.value?.offsetHeight ?? 220
      // Horizontal: prefer right of click, flip left if overflow
      let x = props.position.x + 12
      if (x + W > vw - 8) x = props.position.x - W - 12
      x = Math.max(8, x)
      // Vertical: below or above based on available space
      const y = above.value
        ? props.position.y - h - 12
        : props.position.y + 12
      return { left: `${x}px`, top: `${Math.max(8, y)}px`, width: `${W}px` }
    })

    return () => (
      <Transition
        enterFromClass="opacity-0 scale-95"
        enterActiveClass="transition-all duration-150 ease-out origin-top-left"
        leaveActiveClass="transition-all duration-100 ease-in origin-top-left"
        leaveToClass="opacity-0 scale-95"
      >
        {props.node && props.position && (
          <div
            ref={popoverRef}
            class="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            style={popoverStyle.value}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span class="text-xs font-semibold text-gray-500">节点信息</span>
              <button
                class="text-gray-300 hover:text-gray-500 transition-colors"
                onClick={() => emit('close')}
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="px-4 py-4 flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">layerType</label>
                <ElSelect
                  modelValue={props.node.layerType}
                  size="small"
                  style={{ width: '100%' }}
                  onChange={(val: string) => saveType(val)}
                >
                  {LAYER_OPTIONS.map(opt => (
                    <ElOption key={opt} label={opt} value={opt} />
                  ))}
                </ElSelect>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">layerName</label>
                <ElInput
                  modelValue={layerName.value}
                  size="small"
                  onInput={(val: string) => { layerName.value = val; saveText() }}
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-400">layerDescription</label>
                <ElInput
                  modelValue={layerDescription.value}
                  size="small"
                  type="textarea"
                  rows={2}
                  resize="none"
                  onInput={(val: string) => { layerDescription.value = val; saveText() }}
                />
              </div>
            </div>
          </div>
        )}
      </Transition>
    )
  },
})
