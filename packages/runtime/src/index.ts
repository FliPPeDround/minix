// @minix/runtime: mini-program runtime for browsers, powered by Vue Vapor

// page & app APIs
export { Page, createPageInstance } from "./page.ts";
export type { PageInstance, PageOptions, RenderContext, RenderFn } from "./page.ts";
export { App, getApp, createApp, getAppConfig } from "./app.ts";
export type {
  AppInstance,
  AppOptions,
  MinixAppConfig,
  MinixWindowConfig,
  MinixTabBarConfig,
  MinixTabBarItem,
} from "./app.ts";

// router & page registration (used by @minix/vite-plugin generated code)
export {
  createPage,
  startApp,
  getCurrentPages,
  navigateTo,
  navigateBack,
  redirectTo,
  reLaunch,
  switchTab,
  __resetMinixRuntime,
} from "./router.ts";
export type { PageRegistration, UrlOptions, NavigateBackOptions } from "./router.ts";

// re-export vapor helpers for WXML compiler codegen
export {
  template,
  setText,
  setHtml,
  setClass,
  setClassName,
  setStyle,
  setAttr,
  setValue,
  setProp,
  setDynamicProps,
  setElementText,
  renderEffect,
  on,
  delegate,
  delegateEvents,
  createInvoker,
  createIf,
  createFor,
  createForSlots,
  createKeyedFragment,
  insert,
  prepend,
  remove,
  createTextNode,
  child,
  nthChild,
  next,
  txt,
  createSlot,
  withVaporModifiers,
  withVaporKeys,
} from "@vue/runtime-vapor";

// 内置组件注册（view / text / image / ...）：compiler 产出的 <minix-*>
// 由这些组件渲染对应 HTML 元素并实现小程序语义
export {
  MINIX_COMPONENTS,
  registerMinixComponents,
  MinixView,
  MinixText,
  MinixIcon,
  MinixImage,
  MinixNavigator,
  MinixScrollView,
  MinixSwiper,
  MinixSwiperItem,
  MinixPicker,
  MinixPickerView,
  MinixRich,
  MinixProgress,
  MinixInput,
  MinixTextarea,
  MinixButton,
  MinixLabel,
  MinixForm,
  MinixCheckbox,
  MinixRadio,
  MinixSlider,
  MinixSwitch,
} from "./components/index.ts";

// 兜底导出 vapor 全部运行时 API：compiler 产物 import 什么完全由
// @vue/compiler-vapor 的版本决定（如 setInsertionState、withModifiers 等
// 未列在上面的 helper），用 export * 保证与上游同步，避免链接期缺导出。
export * from "@vue/runtime-vapor";
// resolveComponent：编译产物把 <minix-*> 当组件处理时，会 import 它
// 来按名解析全局注册的内置组件（view/text/image/...）。vapor 不导出，
// 从 runtime-dom 转出口（runtime-dom re-export 了 runtime-core 全部 API）。
export { resolveComponent } from "@vue/runtime-dom";

// re-export shared helpers used by compiler codegen (e.g. {{ expr }})
export { toDisplayString } from "@vue/shared";

// re-export reactivity primitives
export { ref, reactive, computed, watch } from "@vue/reactivity";
