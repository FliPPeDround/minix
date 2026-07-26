export { App, getApp } from "./app.ts";
export { getAppConfig, setAppConfig } from "./config.ts";
export { applyStyle } from "./style.ts";
export { Page, createPageInstance } from "./page.ts";

export {
  createPage,
  startApp,
  getCurrentPages,
  navigateTo,
  navigateBack,
  redirectTo,
  reLaunch,
  switchTab,
} from "./router.ts";
export type { PageRegistration, UrlOptions, NavigateBackOptions } from "./router.ts";
