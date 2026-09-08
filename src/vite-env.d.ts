/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

/* @wangeditor/editor-for-vue 的 exports 未暴露类型入口,手动指向 */
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'
  export const Editor: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export const Toolbar: DefineComponent<Record<string, never>, Record<string, never>, unknown>
}
