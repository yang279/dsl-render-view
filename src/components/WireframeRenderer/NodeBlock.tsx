import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { DslNode } from '@/types/dsl'

const BORDER = '#94A3B8'
const BG     = 'rgba(241, 245, 249, 0.5)'
const BADGE  = '#64748B'

export default defineComponent({
  name: 'NodeBlock',
  props: {
    node:     { type: Object as PropType<DslNode>, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => {
      const { rect, semantic, label, confidence } = props.node
      const isSmall   = rect.w < 40 || rect.h < 20
      const isDivider = semantic === 'divider'
      const isDashed  = semantic === 'container' || semantic === 'modal' || semantic === 'card'

      return (
        <div
          style={{
            position:        'absolute',
            left:            `${rect.x}px`,
            top:             `${rect.y}px`,
            width:           `${rect.w}px`,
            height:          `${rect.h}px`,
            backgroundColor: BG,
            border:          `1px ${isDashed ? 'dashed' : 'solid'} ${BORDER}`,
            boxSizing:       'border-box',
            overflow:        'hidden',
            cursor:          'pointer',
            outline:         props.selected ? '2px solid #2563EB' : 'none',
            outlineOffset:   props.selected ? '1px' : '0',
            zIndex:          props.selected ? 10 : 'auto',
          }}
          title={label}
          onClick={(e: MouseEvent) => { e.stopPropagation(); emit('click', props.node, e) }}
        >
          {isDivider ? (
            <div style={{ width: '100%', height: '100%', borderTop: `2px solid ${BORDER}` }} />
          ) : (
            <>
              {!isSmall && (
                <span style={{
                  display:         'inline-block',
                  position:        'absolute',
                  top:             '2px',
                  left:            '2px',
                  fontSize:        '9px',
                  lineHeight:      '14px',
                  padding:         '0 3px',
                  borderRadius:    '2px',
                  backgroundColor: BADGE,
                  color:           '#fff',
                  opacity:         confidence === 'low' ? 0.6 : 1,
                  whiteSpace:      'nowrap',
                  zIndex:          1,
                  maxWidth:        `${rect.w - 8}px`,
                  overflow:        'hidden',
                  textOverflow:    'ellipsis',
                }}>
                  {semantic}
                </span>
              )}
              {semantic === 'image' && (
                <svg
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line x1="0" y1="0" x2="100" y2="100" stroke={BORDER} stroke-width="2" />
                  <line x1="100" y1="0" x2="0" y2="100" stroke={BORDER} stroke-width="2" />
                </svg>
              )}
              {semantic === 'avatar' && (
                <div style={{
                  position:     'absolute',
                  inset:        '4px',
                  borderRadius: '50%',
                  border:       `1px solid ${BORDER}`,
                  opacity:      0.5,
                }} />
              )}
            </>
          )}
        </div>
      )
    }
  },
})
