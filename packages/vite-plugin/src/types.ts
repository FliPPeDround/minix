export interface LauncherOptions {
  /** 初始设备名称（对应 @minix/launcher 的 DEVICES 预设，如 "iPhone 15 Pro"） */
  device?: string;
  /** 启动时是否打开 DevTools */
  devtools?: boolean;
  /** 启动时窗口是否置顶 */
  alwaysOnTop?: boolean;
}

export interface MinixPluginOptions {
  /** 小程序源码目录（app.json 所在目录），相对于 vite root，默认 "." */
  root?: string;
  /**
   * 启用原生 launcher（基于 @webviewjs/webview，跨平台 webview 窗口）。
   * 传 true 使用默认配置，传对象可自定义设备/DevTools/置顶等。
   * 需要 @minix/launcher 与 @webviewjs/webview 已安装（缺失时降级为控制台报错）。
   */
  launcher?: boolean | LauncherOptions;
}

interface SubPackage {
  root: string;
  pages: string[];
}

export interface AppJson {
  pages?: string[];
  subpackages?: SubPackage[];
  subPackages?: SubPackage[];
  entryPagePath?: string;
}
