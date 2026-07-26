import type { AppInstance, AppOptions, GetAppOption } from "./types.ts";

let appInstance: AppInstance | null = null;

export function App(options: AppOptions) {
  if (appInstance) {
    if (import.meta.env.DEV) console.warn("[minix] App() can only be called once");
    return;
  }

  appInstance = {} as AppInstance;

  if (options.globalData) {
    appInstance.globalData = { ...options.globalData };
  }

  for (const key in options) {
    const value = options[key as keyof AppOptions];
    if (typeof value === "function") {
      appInstance[key] = value.bind(appInstance);
    }
  }

  appInstance.onLaunch?.({
    path: "",
    query: {},
    scene: 1000,
    shareTicket: "",
    forwardMaterials: [],
    apiCategory: "default",
  });
}

export function getApp(opts?: GetAppOption) {
  if (!appInstance && !opts?.allowDefault) {
    if (import.meta.env.DEV) console.warn("[minix] App() has not been called yet");
  }
  return appInstance;
}
