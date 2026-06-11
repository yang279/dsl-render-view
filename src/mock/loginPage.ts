import type { DslNode } from '@/types/dsl'

const loginPage: DslNode = {
  nid: 3, tag: 'div', depth: 2,
  rect: { x: 0, y: 0, w: 375, h: 812 },
  id: 'app', class: 'page page--login',
  semantic: 'container', label: '登录页根容器', confidence: 'high',
  style: { display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(245,245,245)' },
  children: [
    {
      nid: 4, tag: 'header', depth: 3,
      rect: { x: 0, y: 0, w: 375, h: 56, fixed: true },
      semantic: 'navbar', label: '顶部导航栏', confidence: 'high', style: {},
      children: [
        { nid: 5, tag: 'span', depth: 4, rect: { x: 16, y: 16, w: 24, h: 24 },
          semantic: 'icon', label: '返回图标 24×24 细线', confidence: 'high', style: {} },
        { nid: 6, tag: 'h1', depth: 4, rect: { x: 130, y: 12, w: 115, h: 32 },
          text: '登录', semantic: 'heading', label: '页面标题', confidence: 'high', style: {} },
      ],
    },
    {
      nid: 10, tag: 'form', depth: 3,
      rect: { x: 20, y: 80, w: 335, h: 220 },
      semantic: 'card', label: '登录表单容器', confidence: 'high',
      style: { backgroundColor: 'rgb(255,255,255)', borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0,0,0,0.08)' },
      children: [
        { nid: 11, tag: 'div', depth: 4, rect: { x: 32, y: 96, w: 311, h: 52 },
          semantic: 'input', label: '用户名输入框', confidence: 'high', style: {} },
        { nid: 13, tag: 'div', depth: 4, rect: { x: 32, y: 164, w: 311, h: 52 },
          semantic: 'input', label: '密码输入框', confidence: 'high', style: {} },
        { nid: 20, tag: 'button', depth: 4, rect: { x: 32, y: 236, w: 311, h: 48 },
          text: '登录', semantic: 'button', label: '主登录按钮', confidence: 'high', style: {} },
      ],
    },
    {
      nid: 25, tag: 'div', depth: 3, rect: { x: 90, y: 322, w: 195, h: 32 },
      text: '还没有账号？立即注册',
      semantic: 'text', label: '注册引导文字', confidence: 'high', style: {},
    },
    {
      nid: 28, tag: 'hr', depth: 3, rect: { x: 20, y: 376, w: 335, h: 1 },
      semantic: 'divider', label: '第三方登录分割线', confidence: 'high', style: {},
    },
    {
      nid: 29, tag: 'div', depth: 3, rect: { x: 20, y: 396, w: 335, h: 80 },
      semantic: 'list', label: '第三方登录列表', confidence: 'high', style: {},
      children: [
        { nid: 30, tag: 'div', depth: 4, rect: { x: 128, y: 414, w: 44, h: 44 },
          semantic: 'avatar', label: '微信登录头像', confidence: 'high', style: {} },
        { nid: 31, tag: 'div', depth: 4, rect: { x: 204, y: 414, w: 44, h: 44 },
          semantic: 'avatar', label: 'QQ登录头像', confidence: 'high', style: {} },
      ],
    },
    {
      nid: 35, tag: 'nav', depth: 3,
      rect: { x: 0, y: 746, w: 375, h: 66, fixed: true },
      semantic: 'tabbar', label: '底部标签栏', confidence: 'high', style: {},
    },
  ],
}

export default loginPage
