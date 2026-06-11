import { defineComponent, ref, watch, computed, Transition } from 'vue'
import type { PropType } from 'vue'
import { ElSelect, ElOption, ElInput } from 'element-plus'
import type { DslNode, SemanticType } from '@/types/dsl'
import { useDslStore } from '@/stores/dsl'

const SEMANTIC_OPTIONS: SemanticType[] = [
  'navbar', 'tabbar', 'button', 'icon', 'input', 'avatar', 'switch',
  'card', 'list', 'list-item', 'image', 'text', 'heading', 'divider',
  'container', 'modal', 'badge',
]

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

    const name = ref('')
    const desc = ref('')

    // Sync local text fields only when node switches (avoids cursor-jump on every keystroke)
    watch(() => props.node?.nid, () => {
      name.value = props.node?.label ?? ''
      desc.value = props.node?.description ?? ''
    }, { immediate: true })

    function saveType(semantic: string) {
      if (!props.node) return
      store.updateNodeMeta(props.node.nid, semantic, name.value, desc.value)
    }

    function saveText() {
      if (!props.node) return
      store.updateNodeMeta(props.node.nid, props.node.semantic, name.value, desc.value)
    }

    const popoverStyle = computed(() => {
      if (!props.position) return {}
      const vw = window.innerWidth
      const vh = window.innerHeight
      let x = props.position.x + 12
      let y = props.position.y - 12
      if (x + W > vw - 8) x = props.position.x - W - 12
      if (y < 8) y = 8
      if (y > vh - 240) y = vh - 240
      return { left: `${x}px`, top: `${y}px`, width: `${W}px` }
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
            class="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            style={popoverStyle.value}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
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

            <div class="px-3 py-3 flex flex-col gap-2.5">
              <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-400">type</label>
                <ElSelect
                  modelValue={props.node.semantic}
                  size="small"
                  style={{ width: '100%' }}
                  onChange={(val: string) => saveType(val)}
                >
                  {SEMANTIC_OPTIONS.map(opt => (
                    <ElOption key={opt} label={opt} value={opt} />
                  ))}
                </ElSelect>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-400">name</label>
                <ElInput
                  modelValue={name.value}
                  size="small"
                  onInput={(val: string) => { name.value = val; saveText() }}
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs text-gray-400">description</label>
                <ElInput
                  modelValue={desc.value}
                  size="small"
                  type="textarea"
                  rows={2}
                  resize="none"
                  onInput={(val: string) => { desc.value = val; saveText() }}
                />
              </div>
            </div>
          </div>
        )}
      </Transition>
    )
  },
})
