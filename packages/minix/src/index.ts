// minix: 面向使用者的统一入口，同时承担运行时本体职责。
//
// 依赖方向（单向，无循环）：
//   minix ──▶ vue（vapor helpers 直接从 vue 主包取）
//   @minix/components ──▶ vue（独立包，不依赖 minix）
// compiler 产物 `from "vue"` 也直接解析到 vue 主包，与 minix / components
// 共享同一份 vue 运行时实例，避免双 vue 问题。

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

// 内置组件注册（view / text / image / ...）：compiler 产出的 <minix-*>
// 由这些组件渲染对应 HTML 元素并实现小程序语义。
//
// 组件实现位于本包 src/components 下（.ts 工厂函数 + vapor template）。
// installMinixComponents(app) 在每个页面 mount 时把注册表内的全部组件
// 安装到 vapor app 上。
export {
  registerMinixComponent,
  registerMinixComponents,
  getMinixComponents,
  installMinixComponents,
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
  MinixCheckboxGroup,
  MinixRadioGroup,
  MinixPickerViewColumn,
  MinixMovableArea,
  MinixMovableView,
  MinixCanvas,
  MinixVideo,
  MinixAudio,
  MinixMap,
  MinixWebView,
  MinixEditor,
  getCanvasById,
} from "./components/index.ts";
