export interface SemanticStyle {
  bg: string
  border: string
  label: string
  dashed?: boolean
}

const SEMANTIC_STYLES: Record<string, SemanticStyle> = {
  navbar:     { bg: '#EFF6FF', border: '#3B82F6', label: '#1D4ED8' },
  tabbar:     { bg: '#EEF2FF', border: '#6366F1', label: '#4338CA' },
  button:     { bg: '#F0FDF4', border: '#22C55E', label: '#15803D' },
  icon:       { bg: '#FAF5FF', border: '#A855F7', label: '#7E22CE' },
  input:      { bg: '#FFFBEB', border: '#F59E0B', label: '#B45309' },
  avatar:     { bg: '#FDF2F8', border: '#EC4899', label: '#9D174D' },
  switch:     { bg: '#F0FDFA', border: '#14B8A6', label: '#0F766E' },
  card:       { bg: '#F8FAFC', border: '#64748B', label: '#334155' },
  list:       { bg: '#FFF7ED', border: '#F97316', label: '#C2410C' },
  'list-item':{ bg: '#FFF7ED', border: '#FB923C', label: '#C2410C' },
  image:      { bg: '#FEF2F2', border: '#EF4444', label: '#B91C1C' },
  text:       { bg: '#F9FAFB', border: '#9CA3AF', label: '#6B7280' },
  heading:    { bg: '#F9FAFB', border: '#374151', label: '#111827' },
  divider:    { bg: 'transparent', border: '#D1D5DB', label: '#9CA3AF' },
  container:  { bg: 'transparent', border: '#CBD5E1', label: '#94A3B8', dashed: true },
  modal:      { bg: 'rgba(30,41,59,0.12)', border: '#1E293B', label: '#0F172A' },
  badge:      { bg: '#FEFCE8', border: '#EAB308', label: '#A16207' },
}

const FALLBACK: SemanticStyle = { bg: '#F1F5F9', border: '#94A3B8', label: '#64748B', dashed: true }

export function getSemanticStyle(semantic: string): SemanticStyle {
  return SEMANTIC_STYLES[semantic] ?? FALLBACK
}
