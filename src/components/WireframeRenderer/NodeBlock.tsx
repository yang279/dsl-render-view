import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import type { DslNode } from '@/types/dsl'
import { SEMANTIC_COLOR, SEMANTIC_BG, DEFAULT_COLOR, DEFAULT_BG } from './colors'

export default defineComponent({
  name: 'NodeBlock',
  props: {
    node:     { type: Object as PropType<DslNode>, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const hovered = ref(false)

    return () => {
      const { rect, layerType } = props.node
      const color = SEMANTIC_COLOR[layerType] ?? DEFAULT_COLOR
      const bg    = SEMANTIC_BG[layerType]    ?? DEFAULT_BG

      return (
        <div
          style={{
            position:        'absolute',
            left:            `${rect.x}px`,
            top:             `${rect.y}px`,
            width:           `${rect.w}px`,
            height:          `${rect.h}px`,
            backgroundColor: bg,
            border:          `${hovered.value ? 2 : 1}px solid ${color}`,
            boxSizing:       'border-box',
            overflow:        'hidden',
            cursor:          'pointer',
            outline:         props.selected ? '2px solid #2563EB' : 'none',
            outlineOffset:   props.selected ? '1px' : '0',
            zIndex:          props.selected ? 10 : 'auto',
          }}
          title={props.node.layerName}
          onMouseenter={() => { hovered.value = true }}
          onMouseleave={() => { hovered.value = false }}
          onClick={(e: MouseEvent) => { e.stopPropagation(); emit('click', props.node, e) }}
        />
      )
    }
  },
})
