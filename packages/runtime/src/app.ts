import { applyStyle } from "./style.ts";

type IAnyObject = WechatMiniprogram.IAnyObject;
type AppOptions<T extends IAnyObject = IAnyObject> = WechatMiniprogram.App.Options<T>;
type AppInstance<T extends IAnyObject = IAnyObject> = WechatMiniprogram.App.Instance<T>;
type AppTrivialInstance = WechatMiniprogram.App.TrivialInstance;

export type { AppOptions, AppInstance };

/** app.json 中 window 字段的子集 */
export interface MinixWindowConfig {
  navigationBarTitleText?: string;
  navigationBarBackgroundColor?: string;
  navigationBarTextStyle?: "black" | "white";
  backgroundColor?: string;
}

export interface MinixTabBarItem {
  pagePath: string;
  text: string;
}

/** app.json 中 tabBar 字段的子集 */
export interface MinixTabBarConfig {
  color?: string;
  selectedColor?: string;
  backgroundColor?: string;
  list?: MinixTabBarItem[];
}

/** app.json 的子集（插件解析后随 createApp 传入） */
export interface MinixAppConfig {
  pages?: string[];
  entryPagePath?: string;
  window?: MinixWindowConfig;
  tabBar?: MinixTabBarConfig;
}

let appInstance: AppTrivialInstance | null = null;
let appConfig: MinixAppConfig = {};

/** 获取 app.json 全局配置（createApp 注册时传入） */
export function getAppConfig(): MinixAppConfig {
  return appConfig;
}

export function App<T extends IAnyObject = IAnyObject>(options: AppOptions<T>): void {
  if (appInstance) {
    if (import.meta.env.DEV) console.warn("[minix] App() can only be called once");
    return;
  }

  const opts = options as Record<string, any>;
  const instance: Record<string, any> = {};

  if (opts.globalData) {
    instance.globalData = { ...opts.globalData };
  }

  for (const key in opts) {
    if (key === "globalData") continue;
    if (typeof opts[key] === "function") {
      instance[key] = opts[key].bind(instance);
    }
  }

  appInstance = instance as AppTrivialInstance;

  // lifecycle hooks — called without LaunchShowOption in browser runtime
  const inst = appInstance as Record<string, Function | undefined>;
  inst.onLaunch?.();
  inst.onShow?.();
}

export function getApp<T extends IAnyObject = IAnyObject>(): AppInstance<T> {
  if (!appInstance) {
    if (import.meta.env.DEV) console.warn("[minix] App() has not been called yet");
    return {} as AppInstance<T>;
  }
  return appInstance as AppInstance<T>;
}

/**
 * 由 vite 插件注入到 app.js 的工厂：返回一个 `App` 函数，
 * 调用时携带 app.json 配置与全局 wxss 完成注册。
 *
 *   import { createApp } from "minix";
 *   const App = createApp(appJsonConfig, { wxss: appWxss });
 *   App({ globalData: {...}, onLaunch() {...} });
 */
export function createApp(
  config: MinixAppConfig,
  extra?: { wxss?: string },
): (options: AppOptions<any>) => void {
  return (options) => {
    appConfig = config ?? {};
    if (extra?.wxss) applyStyle("minix:app", extra.wxss);
    App(options);
  };
}

/** 重置 App 单例与全局配置（测试用） */
export function __resetApp(): void {
  appInstance = null;
  appConfig = {};
}
