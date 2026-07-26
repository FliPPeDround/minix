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

class AppConfigManager {
  private static instance: AppConfigManager;
  private config: MinixAppConfig = {};

  private constructor() {}

  static getInstance(): AppConfigManager {
    if (!AppConfigManager.instance) {
      AppConfigManager.instance = new AppConfigManager();
    }
    return AppConfigManager.instance;
  }

  get(): MinixAppConfig {
    return this.config;
  }

  set(config: MinixAppConfig): void {
    this.config = config;
  }
}

export function getAppConfig(): MinixAppConfig {
  return AppConfigManager.getInstance().get();
}

export function setAppConfig(config: MinixAppConfig): void {
  AppConfigManager.getInstance().set(config);
}
